import requests
import json
import pandas as pd

# Yelp API Key (Replace with actual API key)
YELP_API_KEY = "Your Api Key"
YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search"
YELP_REVIEW_URL = "https://api.yelp.com/v3/businesses/{}/reviews"

# Load restaurant data from the provided CSV file
csv_filename_restaurants = "mankato_restaurants.csv"
df_restaurants = pd.read_csv(csv_filename_restaurants)

# Function to search for business ID by name and location
def fetch_business_id(name, location):
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}
    params = {"term": name, "location": location, "limit": 1}
    response = requests.get(YELP_SEARCH_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        businesses = response.json().get("businesses", [])
        if businesses:
            return businesses[0].get("id")
    print(f"Warning: Could not find Yelp ID for {name}, {location}")
    return None

# Function to fetch reviews for a restaurant
def fetch_reviews(business_id):
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}
    response = requests.get(YELP_REVIEW_URL.format(business_id), headers=headers)
    
    if response.status_code == 200:
        return response.json().get("reviews", [])
    elif response.status_code == 401:
        print(f"Unauthorized API Key: Your API plan does not support fetching reviews for {business_id}")
        return []
    elif response.status_code == 404:
        print(f"Warning: Restaurant ID {business_id} not found on Yelp.")
        return []
    else:
        print(f"Error fetching reviews for {business_id}: {response.json()}")
        return []

# Process and fetch reviews for each restaurant
reviews_data = []
for index, restaurant in df_restaurants.iterrows():
    restaurant_name = restaurant.get("Restaurant Name")
    restaurant_location = restaurant.get("Street Address")
    review_count = restaurant.get("Review Count", 0)
    
    if review_count == 0:
        continue  # Skip restaurants with no reviews
    
    # Fetch the correct Yelp ID dynamically
    restaurant_id = fetch_business_id(restaurant_name, restaurant_location)
    if not restaurant_id:
        continue  # Skip if still no ID found
    
    reviews = fetch_reviews(restaurant_id)
    for review in reviews:
        reviews_data.append({
            "Restaurant ID": restaurant_id,
            "Restaurant Name": restaurant_name,
            "Reviewer Name": review.get("user", {}).get("name", "Anonymous"),
            "Review Rating": review.get("rating"),
            "Review Text": review.get("text"),
            "Review Time": review.get("time_created"),
            "Review URL": review.get("url")
        })

# Convert reviews to DataFrame
df_reviews = pd.DataFrame(reviews_data)

# Save reviews to CSV file
csv_filename_reviews = "mankato_restaurant_reviews.csv"
df_reviews.to_csv(csv_filename_reviews, index=False)

print(f"Reviews data saved to {csv_filename_reviews}")
