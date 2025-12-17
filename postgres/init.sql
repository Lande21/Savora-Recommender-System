-- NOTE: The PostgreSQL Docker container automatically creates the database (savora) using the POSTGRES_DB environment variable.
-- This script creates tables and imports CSV data into the savora database.

-- NO DATABASE CREATION: The PostgreSQL container automatically creates the database based on POSTGRES_DB env var

-- Create users table with simplified schema for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name TEXT,
    rating FLOAT,
    review_count INT,
    price_range VARCHAR(10),
    categories TEXT,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    phone VARCHAR(20),
    url TEXT
);

-- Import restaurants data from CSV if file exists
COPY restaurants(name, rating, review_count, price_range, categories, address, latitude, longitude, phone, url)
FROM '/docker-entrypoint-initdb.d/mankato_restaurants.csv'
DELIMITER ','
CSV HEADER;

-- Create a temporary table for raw review data
CREATE TABLE temp_reviews (
    restaurant_name TEXT,
    reviewer_name TEXT,
    review_rating TEXT,
    review_text TEXT,
    review_date TEXT
);

-- Import raw data into temporary table
COPY temp_reviews FROM '/docker-entrypoint-initdb.d/mankato_restaurant_reviews.csv' 
DELIMITER ',' 
CSV HEADER;

-- Create the final reviews table with proper types
CREATE TABLE IF NOT EXISTS restaurant_reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NULL,
    restaurant_id INT REFERENCES restaurants(id) NULL,
    restaurant_name TEXT,
    reviewer_name TEXT,
    review_rating INT CHECK (review_rating >= 1 AND review_rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transform and insert data from temp table to final table
INSERT INTO restaurant_reviews (restaurant_name, reviewer_name, review_rating, review_text)
SELECT 
    restaurant_name,
    reviewer_name,
    CASE 
        WHEN review_rating LIKE '5%' THEN 5
        WHEN review_rating LIKE '4%' THEN 4
        WHEN review_rating LIKE '3%' THEN 3
        WHEN review_rating LIKE '2%' THEN 2
        WHEN review_rating LIKE '1%' THEN 1
        ELSE 3
    END,
    review_text
FROM temp_reviews;

-- Drop temporary table
DROP TABLE temp_reviews;

-- Create cuisine_info table
CREATE TABLE IF NOT EXISTS cuisine_info (
    cuisine_id SERIAL PRIMARY KEY,
    cuisine_type TEXT NOT NULL
);

-- Initial cuisine types
INSERT INTO cuisine_info (cuisine_type) VALUES 
    ('Italian'), 
    ('Mexican'), 
    ('Mediterranean'),
    ('Thai'), 
    ('Indian'), 
    ('French'), 
    ('Japanese'), 
    ('Chinese'),
    ('American')
ON CONFLICT DO NOTHING;

-- Create restaurant_cuisine table
CREATE TABLE IF NOT EXISTS restaurant_cuisine (
    restaurant_id INT REFERENCES restaurants(id),
    cuisine_id INT REFERENCES cuisine_info(cuisine_id),
    PRIMARY KEY (restaurant_id, cuisine_id)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INT REFERENCES users(id),
    cuisine_id INT REFERENCES cuisine_info(cuisine_id),
    PRIMARY KEY (user_id, cuisine_id)
);

-- Create menu_item table
CREATE TABLE IF NOT EXISTS menu_item (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(id),
    item_name TEXT,
    price FLOAT,
    category TEXT --update this once categories have been established
);