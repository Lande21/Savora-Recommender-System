import requests
import os
import re
import time

# Yelp API Key (Replace with your actual API key)
YELP_API_KEY = "Y2oLHUaIB0lIT5zUR0g2cEJj2Jir-Tmh2am9qoQoTvgfDG8XAe42Hb773lAZS9NgIHS27Xl46hOdGdmqEFjkL8M-2bl0YJZN8e_6gT-i8-HGDXGdDrr-zJ5hYzurIZ3Yx"
YELP_API_URL = "https://api.yelp.com/v3/businesses/search"

# Create a directory to store images
os.makedirs("restaurant_images", exist_ok=True)

# Function to sanitize filenames
def sanitize_filename(name):
    # Remove characters that are invalid in filenames
    return re.sub(r'[\\/*?:"<>|]', "", name)

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
        print(f"Error fetching data: {response.status_code} - {response.text}")
        return []

# Function to download image from URL
def download_image(url, filename):
    try:
        img_response = requests.get(url, timeout=10)
        if img_response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(img_response.content)
            print(f"Downloaded: {filename}")
        else:
            print(f"Failed to download image from {url} - Status code: {img_response.status_code}")
    except Exception as e:
        print(f"Exception occurred while downloading image from {url}: {e}")

# Main script to fetch and save restaurant images
def main():
    offset = 0
    limit = 50
    total_fetched = 0
    max_results = 1000  # Yelp API returns up to 1000 results

    while offset < max_results:
        restaurants = fetch_restaurants("Mankato, MN", offset=offset, limit=limit)
        if not restaurants:
            break
        for restaurant in restaurants:
            name = restaurant.get("name")
            image_url = restaurant.get("image_url")
            if name and image_url:
                filename = os.path.join("restaurant_images", sanitize_filename(name) + ".jpg")
                download_image(image_url, filename)
        fetched_count = len(restaurants)
        total_fetched += fetched_count
        offset += fetched_count
        if fetched_count < limit:
            break  # No more results to fetch
        time.sleep(1)  # To respect API rate limits

    print(f"Total restaurants processed: {total_fetched}")

if __name__ == "__main__":
    main()
