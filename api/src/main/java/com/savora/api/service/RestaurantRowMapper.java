package com.savora.api.service;

import com.savora.api.model.Restaurant;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

public class RestaurantRowMapper implements RowMapper<Restaurant> {
    
    @Override
    public Restaurant mapRow(ResultSet rs, int rowNum) throws SQLException {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(rs.getLong("id"));
        restaurant.setName(rs.getString("name"));
        restaurant.setRating(rs.getDouble("rating"));
        restaurant.setReviewCount(rs.getInt("review_count"));
        restaurant.setPriceRange(rs.getString("price_range"));
        restaurant.setCategories(rs.getString("categories"));
        restaurant.setAddress(rs.getString("address"));
        
        // Handle optional fields that might not exist in all schemas
        try {
            restaurant.setLatitude(rs.getDouble("latitude"));
            restaurant.setLongitude(rs.getDouble("longitude"));
        } catch (SQLException e) {
            // Ignore if these columns don't exist
        }
        
        try {
            restaurant.setPhone(rs.getString("phone"));
        } catch (SQLException e) {
            // Ignore if this column doesn't exist
        }
        
        try {
            restaurant.setUrl(rs.getString("url"));
        } catch (SQLException e) {
            // Ignore if this column doesn't exist
        }
        
        // Extract city from address if available
        String address = restaurant.getAddress();
        if (address != null && !address.isEmpty()) {
            String[] parts = address.split(",");
            if (parts.length > 1) {
                restaurant.setCity(parts[1].trim());
            }
        }
        
        return restaurant;
    }
}