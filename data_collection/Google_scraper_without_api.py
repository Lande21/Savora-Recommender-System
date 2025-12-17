from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import pandas as pd

# Function to set up Selenium WebDriver
def setup_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Run in headless mode (uncomment to enable)
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver

# Function to search Google Maps and extract restaurant details and reviews
def scrape_google_maps(restaurant_name, location="Mankato, MN"):
    driver = setup_driver()
    google_maps_url = "https://www.google.com/maps"
    driver.get(google_maps_url)
    time.sleep(3)  # Allow Google Maps to load

    # Search for restaurant
    try:
        search_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input.searchboxinput"))
        )
        search_box.clear()
        search_box.send_keys(f"{restaurant_name}, {location}")
        search_box.send_keys(Keys.RETURN)
        time.sleep(5)  # Wait for search results
    except:
        print(f"Failed to find search box for {restaurant_name}")
        driver.quit()
        return {}, []

    # Wait for results to load
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h1"))
        )
    except:
        print(f"No search results found for {restaurant_name}")
        driver.quit()
        return {}, []

    # Extract details
    details = {"Restaurant Name": restaurant_name}
    soup = BeautifulSoup(driver.page_source, "html.parser")

    try:
        details["Address"] = driver.find_element(By.CSS_SELECTOR, "button[data-item-id='address']").text.strip()
    except:
        details["Address"] = "N/A"

    try:
        details["Phone Number"] = driver.find_element(By.CSS_SELECTOR, "button[data-tooltip='Copy phone number']").text.strip()
    except:
        details["Phone Number"] = "N/A"

    try:
        details["Website"] = driver.find_element(By.CSS_SELECTOR, "a[data-item-id='authority']").get_attribute("href")
    except:
        details["Website"] = "N/A"

    try:
        details["Rating"] = driver.find_element(By.CSS_SELECTOR, ".F7nice").text.strip()
    except:
        details["Rating"] = "N/A"

    try:
        details["Review Count"] = driver.find_element(By.CSS_SELECTOR, "button[data-tooltip='Read reviews']").text.strip()
    except:
        details["Review Count"] = "N/A"

    try:
        details["Categories"] = ", ".join([span.text for span in soup.select(".DkEaL")[0:3]])
    except:
        details["Categories"] = "N/A"

    try:
        details["Latitude"] = driver.execute_script("return window.APP_INITIALIZATION_STATE[3][0][2][0]")
        details["Longitude"] = driver.execute_script("return window.APP_INITIALIZATION_STATE[3][0][2][1]")
    except:
        details["Latitude"], details["Longitude"] = "N/A", "N/A"

    # Click the Reviews tab
    try:
        reviews_button = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(@aria-label, 'Reviews for')]"))
        )
        driver.execute_script("arguments[0].click();", reviews_button)
        time.sleep(5)  # Wait for reviews to load
    except:
        print(f"No reviews button found for {restaurant_name}")
        driver.quit()
        return details, []

    # Scroll and collect reviews
    reviews = []
    review_set = set()
    try:
        scrollable_div = driver.find_element(By.CSS_SELECTOR, "div.m6QErb.DxyBCb.kA9KIf.dS8AEf")
        last_height = driver.execute_script("return arguments[0].scrollHeight", scrollable_div)

        while len(reviews) < 50:
            driver.execute_script("arguments[0].scrollTo(0, arguments[0].scrollHeight);", scrollable_div)
            time.sleep(3)  # Allow new reviews to load
            new_height = driver.execute_script("return arguments[0].scrollHeight", scrollable_div)
            if new_height == last_height:
                break  # Stop if no more new reviews
            last_height = new_height

            review_elements = driver.find_elements(By.CSS_SELECTOR, ".jftiEf")
            for review in review_elements:
                if len(reviews) >= 50:
                    break
                try:
                    reviewer_name = review.find_element(By.CSS_SELECTOR, ".d4r55").text.strip()
                    review_text = review.find_element(By.CSS_SELECTOR, ".wiI7pd").text.strip()
                    review_rating = review.find_element(By.CSS_SELECTOR, "span[role='img']").get_attribute("aria-label").strip()
                    try:
                        review_date = review.find_element(By.CSS_SELECTOR, ".rsqaWe").text.strip()
                    except:
                        review_date = "N/A"

                    review_id = (reviewer_name, review_text, review_rating, review_date)
                    if review_id not in review_set:
                        review_set.add(review_id)
                        reviews.append({
                            "Restaurant Name": details["Restaurant Name"],
                            "Reviewer Name": reviewer_name,
                            "Review Rating": review_rating,
                            "Review Text": review_text,
                            "Review Date": review_date
                        })

                except:
                    continue
    except:
        print(f"No reviews found for {restaurant_name}")

    driver.quit()
    return details, reviews

# Load restaurant names from CSV
csv_filename = "mankato_restaurants.csv"
df_restaurants = pd.read_csv(csv_filename)

# Collect reviews for the first 5 restaurants
all_reviews = []
for restaurant_name in df_restaurants["Restaurant Name"].tolist():
    details, reviews = scrape_google_maps(restaurant_name)
    if reviews:
        all_reviews.extend(reviews)

# Save reviews to CSV file
reviews_df = pd.DataFrame(all_reviews)
reviews_filename = "mankato_restaurant_reviews.csv"
reviews_df.to_csv(reviews_filename, index=False)
print(f"Reviews data saved to {reviews_filename}")
