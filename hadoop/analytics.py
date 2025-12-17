#!/usr/bin/env python3
import os
import json
import argparse
import subprocess
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
import numpy as np
from collections import defaultdict, Counter
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values

# Configuration
HDFS_URL = os.getenv('HDFS_URL', 'http://namenode:9870')
HDFS_USER = os.getenv('HDFS_USER', 'hdfs')
HDFS_EVENTS_PATH = '/user/savora/events'
RESTAURANT_DATA_PATH = '/data/minneapolis_restaurants_cleandata.csv'
OUTPUT_DIR = '/output'

# PostgreSQL configuration
PG_HOST = os.getenv('PG_HOST', 'postgres')
PG_PORT = os.getenv('PG_PORT', '5432')
PG_DB = os.getenv('PG_DB', 'savora')
PG_USER = os.getenv('PG_USER', 'user')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')

def get_db_connection():
    """Create a connection to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            database=PG_DB,
            user=PG_USER,
            password=PG_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

def create_recommendations_table():
    """Create recommendations table if it doesn't exist"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS user_recommendations (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                restaurant_name VARCHAR(255) NOT NULL,
                restaurant_categories VARCHAR(255),
                rating FLOAT,
                review_count INT,
                price_range VARCHAR(20),
                score FLOAT,
                recommendation_rank INT NOT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Index for faster user lookups
            CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id 
            ON user_recommendations(user_id);
            """)
            conn.commit()
            print("Recommendations table created or already exists")
            return True
    except Exception as e:
        print(f"Error creating recommendations table: {e}")
        return False
    finally:
        conn.close()

def save_recommendations_to_db(user_id, recommendations):
    """Save the top 6 recommendations to the database"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        # Get the top 6 recommendations
        top_recommendations = recommendations.head(6)
        
        # Prepare data for insertion
        data = []
        for rank, (_, restaurant) in enumerate(top_recommendations.iterrows(), 1):
            record = (
                int(user_id),
                restaurant.get('Restaurant Name', ''),
                restaurant.get('Categories', ''),
                float(restaurant.get('Rating', 0)),
                int(restaurant.get('Review Count', 0)),
                restaurant.get('Price Range', ''),
                float(restaurant.get('Score', 0)) if 'Score' in restaurant else float(restaurant.get('Rating', 0)),
                rank
            )
            data.append(record)
        
        # Delete existing recommendations for this user
        with conn.cursor() as cur:
            cur.execute("DELETE FROM user_recommendations WHERE user_id = %s", (int(user_id),))
            
            # Insert new recommendations
            insert_query = """
            INSERT INTO user_recommendations (
                user_id, restaurant_name, restaurant_categories, 
                rating, review_count, price_range, score, recommendation_rank
            ) VALUES %s
            """
            execute_values(cur, insert_query, data)
            
            conn.commit()
            print(f"Saved {len(data)} recommendations for user {user_id} to PostgreSQL")
            return True
    except Exception as e:
        print(f"Error saving recommendations to database: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def run_hdfs_command(cmd):
    """Run an HDFS command and return the output"""
    print(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error executing HDFS command: {e}")
        print(f"stderr: {e.stderr}")
        return None

def list_users():
    """List all users who have events stored in HDFS"""
    cmd = f"hdfs dfs -ls {HDFS_EVENTS_PATH}/by_user"
    output = run_hdfs_command(cmd)
    
    users = []
    if output:
        for line in output.splitlines():
            parts = line.strip().split()
            if len(parts) >= 8:  # HDFS ls output has 8 columns
                dir_name = parts[-1]
                if dir_name.startswith(f"{HDFS_EVENTS_PATH}/by_user/"):
                    user_id = dir_name.split('/')[-1]
                    if user_id.isdigit():  # Ensure it's a user ID
                        users.append(user_id)
    
    return users

def get_user_preferences(user_id):
    """Extract a user's cuisine and dietary preferences from their event data"""
    cuisine_events_cmd = f"hdfs dfs -cat {HDFS_EVENTS_PATH}/by_user/{user_id}/CUISINE_SELECTED_*.json 2>/dev/null || echo ''"
    dietary_events_cmd = f"hdfs dfs -cat {HDFS_EVENTS_PATH}/by_user/{user_id}/DIETARY_PREFERENCE_SELECTED_*.json 2>/dev/null || echo ''"
    
    cuisine_data = run_hdfs_command(cuisine_events_cmd)
    dietary_data = run_hdfs_command(dietary_events_cmd)
    
    cuisines = []
    dietary_preferences = []
    
    # Process cuisine events
    if cuisine_data and cuisine_data.strip():
        for line in cuisine_data.splitlines():
            if not line.strip():
                continue
            try:
                event = json.loads(line)
                cuisine_type = event.get('data', {}).get('cuisineType')
                if cuisine_type:
                    cuisines.append(cuisine_type)
            except json.JSONDecodeError:
                continue
    
    # Process dietary preference events
    if dietary_data and dietary_data.strip():
        for line in dietary_data.splitlines():
            if not line.strip():
                continue
            try:
                event = json.loads(line)
                preference = event.get('data', {}).get('preference')
                if preference:
                    dietary_preferences.append(preference)
            except json.JSONDecodeError:
                continue
    
    # Get the most frequent preferences
    cuisine_preferences = Counter(cuisines).most_common()
    dietary_preference_counts = Counter(dietary_preferences).most_common()
    
    return {
        'cuisine_preferences': cuisine_preferences, 
        'dietary_preferences': dietary_preference_counts
    }

def get_user_viewed_restaurants(user_id):
    """Get the restaurants a user has viewed"""
    views_cmd = f"hdfs dfs -cat {HDFS_EVENTS_PATH}/by_user/{user_id}/RESTAURANT_VIEWED_*.json 2>/dev/null || echo ''"
    data = run_hdfs_command(views_cmd)
    
    viewed_restaurants = []
    if data and data.strip():
        for line in data.splitlines():
            if not line.strip():
                continue
            try:
                event = json.loads(line)
                restaurant_id = event.get('data', {}).get('restaurantId')
                restaurant_name = event.get('data', {}).get('restaurantName')
                if restaurant_id and restaurant_name:
                    viewed_restaurants.append({
                        'id': restaurant_id,
                        'name': restaurant_name
                    })
            except json.JSONDecodeError:
                continue
    
    return viewed_restaurants

def get_user_bookmarked_restaurants(user_id):
    """Get the restaurants a user has bookmarked"""
    bookmarks_cmd = f"hdfs dfs -cat {HDFS_EVENTS_PATH}/by_user/{user_id}/RESTAURANT_BOOKMARKED_*.json 2>/dev/null || echo ''"
    data = run_hdfs_command(bookmarks_cmd)
    
    bookmarked_restaurants = []
    if data and data.strip():
        for line in data.splitlines():
            if not line.strip():
                continue
            try:
                event = json.loads(line)
                restaurant_id = event.get('data', {}).get('restaurantId')
                restaurant_name = event.get('data', {}).get('restaurantName')
                bookmarked = event.get('data', {}).get('bookmarked', False)
                if restaurant_id and restaurant_name and bookmarked:
                    bookmarked_restaurants.append({
                        'id': restaurant_id,
                        'name': restaurant_name
                    })
            except json.JSONDecodeError:
                continue
    
    return bookmarked_restaurants

def get_user_search_preferences(user_id):
    """Get the user's search patterns"""
    search_cmd = f"hdfs dfs -cat {HDFS_EVENTS_PATH}/by_user/{user_id}/SEARCH_PERFORMED_*.json 2>/dev/null || echo ''"
    data = run_hdfs_command(search_cmd)
    
    searches = []
    locations = []
    if data and data.strip():
        for line in data.splitlines():
            if not line.strip():
                continue
            try:
                event = json.loads(line)
                search_data = event.get('data', {})
                location = search_data.get('location')
                if location:
                    locations.append(location)
                searches.append(search_data)
            except json.JSONDecodeError:
                continue
    
    # Get most frequent location
    location_preferences = Counter(locations).most_common()
    
    return {
        'searches': searches,
        'location_preferences': location_preferences
    }

def analyze_user_events(user_id):
    """Analyze all events for a specific user"""
    preferences = get_user_preferences(user_id)
    viewed_restaurants = get_user_viewed_restaurants(user_id)
    bookmarked_restaurants = get_user_bookmarked_restaurants(user_id)
    search_preferences = get_user_search_preferences(user_id)
    
    return {
        'user_id': user_id,
        'preferences': preferences,
        'viewed_restaurants': viewed_restaurants,
        'bookmarked_restaurants': bookmarked_restaurants,
        'search_preferences': search_preferences
    }

def load_restaurant_data():
    """Load restaurant data from the dataset"""
    try:
        # Try loading directly from the expected path
        df = pd.read_csv(RESTAURANT_DATA_PATH)
    except FileNotFoundError:
        # Fallback to looking for similar files
        try:
            # Look in the /data directory for restaurant CSV files
            cmd = "find /data -name '*restaurant*.csv' | head -1"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            file_path = result.stdout.strip()
            
            if file_path:
                print(f"Using restaurant data from: {file_path}")
                df = pd.read_csv(file_path)
            else:
                # Final fallback - try to get data from HDFS
                cmd = "hdfs dfs -ls /data/*restaurant*.csv | awk '{print $8}' | head -1"
                result = run_hdfs_command(cmd)
                if result and result.strip():
                    hdfs_path = result.strip()
                    local_path = "/tmp/restaurant_data.csv"
                    # Copy from HDFS to local
                    cmd = f"hdfs dfs -get {hdfs_path} {local_path}"
                    run_hdfs_command(cmd)
                    df = pd.read_csv(local_path)
                else:
                    raise FileNotFoundError("Could not find restaurant data")
        except Exception as e:
            print(f"Error loading restaurant data: {e}")
            # Create a minimal sample dataset for testing
            df = pd.DataFrame({
                'Restaurant Name': ['Bella Italia', 'Mumbai Spice', 'La Parisienne', 'Cancun Grill', 'Bangkok Kitchen'],
                'Rating': [4.8, 4.6, 4.7, 4.5, 4.4],
                'Review Count': [120, 95, 110, 85, 75],
                'Categories': ['Italian', 'Indian', 'French', 'Mexican', 'Thai'],
                'Price Range': ['$$', '$$$', '$$$', '$$', '$$']
            })
    
    # Handle column name variations
    columns = df.columns
    name_col = next((col for col in columns if 'name' in col.lower()), 'Restaurant Name')
    rating_col = next((col for col in columns if 'rating' in col.lower()), 'Rating')
    review_col = next((col for col in columns if 'review' in col.lower() and 'count' in col.lower()), 'Review Count')
    category_col = next((col for col in columns if 'categor' in col.lower() or 'cuisine' in col.lower()), 'Categories')
    price_col = next((col for col in columns if 'price' in col.lower()), 'Price Range')
    
    # Standardize column names
    column_mapping = {
        name_col: 'Restaurant Name',
        rating_col: 'Rating',
        review_col: 'Review Count',
        category_col: 'Categories',
        price_col: 'Price Range'
    }
    
    # Only map columns that exist
    columns_to_map = {k: v for k, v in column_mapping.items() if k in df.columns}
    df = df.rename(columns=columns_to_map)
    
    # Ensure numeric types for rating and review count
    if 'Rating' in df.columns:
        df['Rating'] = pd.to_numeric(df['Rating'], errors='coerce')
    if 'Review Count' in df.columns:
        df['Review Count'] = pd.to_numeric(df['Review Count'], errors='coerce')
    
    # Drop rows with missing ratings
    if 'Rating' in df.columns:
        df = df.dropna(subset=['Rating'])
    
    return df

def find_matching_restaurants(df, cuisine_preferences, dietary_preferences):
    """Find restaurants that match user preferences"""
    matching_restaurants = []
    
    # Convert preferences to lists if they're Counters
    if isinstance(cuisine_preferences, Counter):
        cuisine_preferences = [item[0] for item in cuisine_preferences.most_common()]
    elif isinstance(cuisine_preferences, list) and cuisine_preferences and isinstance(cuisine_preferences[0], tuple):
        cuisine_preferences = [item[0] for item in cuisine_preferences]
    
    if isinstance(dietary_preferences, Counter):
        dietary_preferences = [item[0] for item in dietary_preferences.most_common()]
    elif isinstance(dietary_preferences, list) and dietary_preferences and isinstance(dietary_preferences[0], tuple):
        dietary_preferences = [item[0] for item in dietary_preferences]
    
    # If we have cuisine categories in the dataset
    if 'Categories' in df.columns:
        for _, restaurant in df.iterrows():
            # Check if restaurant categories match any user cuisine preferences
            categories = str(restaurant.get('Categories', '')).lower()
            
            # Flag for match
            cuisine_match = False
            
            # Check each cuisine preference
            for cuisine in cuisine_preferences:
                if cuisine.lower() in categories:
                    cuisine_match = True
                    break
            
            # Only add restaurants that match cuisine preferences
            if cuisine_match or not cuisine_preferences:
                matching_restaurants.append(restaurant)
    else:
        # If we don't have categories, just use all restaurants
        matching_restaurants = df.to_dict('records')
    
    return matching_restaurants

def generate_recommendations(user_analysis, restaurant_df):
    """Generate personalized restaurant recommendations"""
    cuisine_preferences = user_analysis['preferences']['cuisine_preferences']
    dietary_preferences = user_analysis['preferences']['dietary_preferences']
    
    # Find restaurants matching user preferences
    matching_restaurants = find_matching_restaurants(
        restaurant_df, 
        cuisine_preferences,
        dietary_preferences
    )
    
    # If no matching restaurants found, use all restaurants
    if not matching_restaurants and not cuisine_preferences:
        matching_restaurants = restaurant_df.to_dict('records')
    
    # Convert to DataFrame for easier manipulation
    if matching_restaurants:
        recommendations_df = pd.DataFrame(matching_restaurants)
    else:
        recommendations_df = restaurant_df.copy()
    
    # Sort by rating and review count
    if 'Rating' in recommendations_df.columns and 'Review Count' in recommendations_df.columns:
        # Calculate a score that combines rating and popularity (review count)
        recommendations_df['Score'] = recommendations_df['Rating'] * 0.6 + \
                                     (recommendations_df['Review Count'] / recommendations_df['Review Count'].max()) * 0.4
        
        # Sort by score in descending order
        recommendations_df = recommendations_df.sort_values('Score', ascending=False)
    elif 'Rating' in recommendations_df.columns:
        # Sort by rating if review count is not available
        recommendations_df = recommendations_df.sort_values('Rating', ascending=False)
    elif 'Review Count' in recommendations_df.columns:
        # Sort by review count if rating is not available
        recommendations_df = recommendations_df.sort_values('Review Count', ascending=False)
    
    # Get top recommendations
    top_recommendations = recommendations_df.head(10)
    
    return top_recommendations

def generate_visualizations(user_id, analysis, recommendations):
    """Generate visualization charts for the recommendations"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 1. Bar chart for top 5 restaurants by score
    plt.figure(figsize=(12, 6))
    top5 = recommendations.head(5)
    
    # Determine which columns to use
    if 'Score' in top5.columns:
        plot_col = 'Score'
        title_suffix = 'Score (Rating + Popularity)'
    elif 'Rating' in top5.columns:
        plot_col = 'Rating'
        title_suffix = 'Rating'
    else:
        plot_col = 'Review Count'
        title_suffix = 'Popularity'
    
    bars = plt.bar(top5['Restaurant Name'], top5[plot_col], color='skyblue')
    
    # Add rating labels to bars if available
    if 'Rating' in top5.columns and plot_col != 'Rating':
        for i, bar in enumerate(bars):
            plt.text(bar.get_x() + bar.get_width()/2., 
                    bar.get_height() + 0.1,
                    f"Rating: {top5['Rating'].iloc[i]:.1f}",
                    ha='center', va='bottom', rotation=0)
    
    plt.xlabel('Restaurant')
    plt.ylabel(title_suffix)
    plt.title(f'Top 5 Recommended Restaurants for User {user_id} by {title_suffix}')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    # Save the figure
    chart_path = f"{OUTPUT_DIR}/user_{user_id}_top_restaurants_{timestamp}.png"
    plt.savefig(chart_path)
    plt.close()
    
    # 2. Pie chart for cuisine preferences
    if analysis['preferences']['cuisine_preferences']:
        plt.figure(figsize=(10, 7))
        cuisines = [pref[0] for pref in analysis['preferences']['cuisine_preferences']]
        counts = [pref[1] for pref in analysis['preferences']['cuisine_preferences']]
        
        plt.pie(counts, labels=cuisines, autopct='%1.1f%%', startangle=90, shadow=True)
        plt.axis('equal')
        plt.title(f'Cuisine Preferences for User {user_id}')
        
        # Save the figure
        pie_path = f"{OUTPUT_DIR}/user_{user_id}_cuisine_preferences_{timestamp}.png"
        plt.savefig(pie_path)
        plt.close()
    
    # 3. Radar chart for preference categories
    if analysis['preferences']['cuisine_preferences'] or analysis['preferences']['dietary_preferences']:
        # Combine all preferences for a radar chart
        all_prefs = {}
        
        # Add cuisine preferences
        for cuisine, count in analysis['preferences']['cuisine_preferences']:
            all_prefs[f"Cuisine: {cuisine}"] = count
            
        # Add dietary preferences
        for diet, count in analysis['preferences']['dietary_preferences']:
            all_prefs[f"Diet: {diet}"] = count
        
        if all_prefs:
            # Get categories and values
            categories = list(all_prefs.keys())
            values = list(all_prefs.values())
            
            # Number of variables
            N = len(categories)
            
            # Create angles for each preference
            angles = [n / float(N) * 2 * np.pi for n in range(N)]
            angles += angles[:1]  # Close the plot
            
            # Values for radar chart
            values += values[:1]  # Close the values
            
            # Plot
            fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))
            
            # Draw one axis per variable and add labels
            plt.xticks(angles[:-1], categories, color='grey', size=8)
            
            # Plot data
            ax.plot(angles, values, linewidth=1, linestyle='solid')
            
            # Fill area
            ax.fill(angles, values, alpha=0.1)
            
            # Title
            plt.title(f"User {user_id} Preference Profile", size=15, pad=20)
            
            # Save radar chart
            radar_path = f"{OUTPUT_DIR}/user_{user_id}_preference_radar_{timestamp}.png"
            plt.savefig(radar_path)
            plt.close()
    
    # Return paths to generated visualizations
    return {
        'bar_chart': chart_path,
        'pie_chart': pie_path if analysis['preferences']['cuisine_preferences'] else None,
        'radar_chart': radar_path if (analysis['preferences']['cuisine_preferences'] or 
                                    analysis['preferences']['dietary_preferences']) else None
    }

def save_recommendations(user_id, recommendations, visualization_paths):
    """Save recommendations to output file"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f"{OUTPUT_DIR}/user_{user_id}_recommendations_{timestamp}.txt"
    
    with open(output_file, 'w') as f:
        f.write(f"RESTAURANT RECOMMENDATIONS FOR USER {user_id}\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("TOP 10 RECOMMENDED RESTAURANTS:\n")
        f.write("=" * 50 + "\n")
        
        for i, (_, restaurant) in enumerate(recommendations.iterrows(), 1):
            f.write(f"{i}. {restaurant['Restaurant Name']}\n")
            if 'Rating' in restaurant:
                f.write(f"   Rating: {restaurant['Rating']:.1f}/5.0\n")
            if 'Review Count' in restaurant:
                f.write(f"   Reviews: {restaurant['Review Count']}\n")
            if 'Categories' in restaurant:
                f.write(f"   Categories: {restaurant['Categories']}\n")
            if 'Price Range' in restaurant:
                f.write(f"   Price: {restaurant['Price Range']}\n")
            if 'Score' in restaurant:
                f.write(f"   Overall Score: {restaurant['Score']:.2f}\n")
            f.write("\n")
        
        f.write("\nVisualization files:\n")
        for chart_type, path in visualization_paths.items():
            if path:
                f.write(f"- {chart_type}: {path}\n")
    
    print(f"Recommendations saved to {output_file}")
    return output_file

def generate_all_user_recommendations():
    """Generate recommendations for all users"""
    # First, create the recommendations table if it doesn't exist
    create_recommendations_table()
    
    # Load restaurant data
    restaurant_df = load_restaurant_data()
    
    # Get all users
    users = list_users()
    
    if not users:
        print("No users found with event data")
        return
    
    results = []
    for user_id in users:
        print(f"Generating recommendations for user {user_id}")
        
        # Analyze user events
        user_analysis = analyze_user_events(user_id)
        
        # Generate recommendations
        recommendations = generate_recommendations(user_analysis, restaurant_df)
        
        # Save to PostgreSQL database
        save_recommendations_to_db(user_id, recommendations)
        
        # Generate visualizations
        visualization_paths = generate_visualizations(user_id, user_analysis, recommendations)
        
        # Save recommendations
        output_file = save_recommendations(user_id, recommendations, visualization_paths)
        
        results.append({
            'user_id': user_id,
            'output_file': output_file
        })
    
    # Generate a summary file
    summary_file = f"{OUTPUT_DIR}/recommendation_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(summary_file, 'w') as f:
        f.write("RESTAURANT RECOMMENDATIONS SUMMARY\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write(f"Total users processed: {len(results)}\n\n")
        
        for result in results:
            f.write(f"User {result['user_id']}: {result['output_file']}\n")
    
    print(f"Summary saved to {summary_file}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Generate restaurant recommendations based on user event data")
    parser.add_argument('--user', help='Generate recommendations for a specific user ID')
    parser.add_argument('--all', action='store_true', help='Generate recommendations for all users')
    
    args = parser.parse_args()
    
    # Create recommendations table
    create_recommendations_table()
    
    if args.user:
        # Load restaurant data
        restaurant_df = load_restaurant_data()
        
        # Analyze user events
        user_analysis = analyze_user_events(args.user)
        
        # Generate recommendations
        recommendations = generate_recommendations(user_analysis, restaurant_df)
        
        # Save to PostgreSQL database
        save_recommendations_to_db(args.user, recommendations)
        
        # Generate visualizations
        visualization_paths = generate_visualizations(args.user, user_analysis, recommendations)
        
        # Save recommendations
        save_recommendations(args.user, recommendations, visualization_paths)
    
    elif args.all:
        generate_all_user_recommendations()
    
    else:
        # Default to processing all users
        generate_all_user_recommendations()

if __name__ == "__main__":
    main()