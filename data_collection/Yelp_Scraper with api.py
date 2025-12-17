import requests
import json
import pandas as pd

# Yelp API Key (Replace with actual API key)
YELP_API_KEY = "Your Yelp API Key"
YELP_API_URL = "https://api.yelp.com/v3/businesses/search"

# Function to fetch restaurants from Yelp API
def fetch_restaurants(location, radius=10000, category="restaurants", limit=50, offset=0):
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}
    params = {
        "location": location,
        "radius": radius,
        "categories": category,
        "limit": limit,
        "offset": offset,
    }
    response = requests.get(YELP_API_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json().get("businesses", [])
    else:
        print("Error fetching data:", response.json())
        return []

# Fetch all restaurant data for Mankato, MN
all_restaurants = []
for offset in range(0, 1000, 50):  # Yelp allows max 1000 results, fetching in pages of 50
    restaurants = fetch_restaurants("Mankato, MN", offset=offset)
    if not restaurants:
        break
    all_restaurants.extend(restaurants)

# Process and store data in a DataFrame
data = []
for restaurant in all_restaurants:
    data.append({
        "Restaurant Name": restaurant.get("name"),
        "Rating": restaurant.get("rating"),
        "Review Count": restaurant.get("review_count"),
        "Price Range": restaurant.get("price", "N/A"),
        "Categories": ", ".join([cat["title"] for cat in restaurant.get("categories", [])]),
        "Street Address": ", ".join(restaurant.get("location", {}).get("display_address", [])),
        "Latitude": restaurant.get("coordinates", {}).get("latitude"),
        "Longitude": restaurant.get("coordinates", {}).get("longitude"),
        "Phone Number": restaurant.get("phone", "N/A"),
        "Website URL": restaurant.get("url", "N/A"),
    })

# Convert to DataFrame
df = pd.DataFrame(data)

# Save to CSV file
csv_filename = "mankato_restaurants.csv"
df.to_csv(csv_filename, index=False)

print(f"Data saved to {csv_filename}")
