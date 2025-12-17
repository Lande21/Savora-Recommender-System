package com.savora.api.service;

import com.savora.api.model.Restaurant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Get restaurants with filtering and sorting options
     */
    public List<Restaurant> getRestaurants(
            String cuisine, String dietary, String location, 
            String sortBy, String sortOrder, Integer limit) {
        try {
            StringBuilder sql = new StringBuilder("SELECT * FROM restaurants WHERE 1=1");
            List<Object> params = new ArrayList<>();
            
            if (cuisine != null && !cuisine.isEmpty()) {
                sql.append(" AND categories ILIKE ?");
                params.add("%" + cuisine + "%");
            }
            
            if (dietary != null && !dietary.isEmpty()) {
                sql.append(" AND dietary_options ILIKE ?");
                params.add("%" + dietary + "%");
            }
            
            if (location != null && !location.isEmpty()) {
                sql.append(" AND city ILIKE ?");
                params.add("%" + location + "%");
            }
            
            // Default sorting
            if (sortBy == null || sortBy.isEmpty()) {
                sortBy = "rating";
            }
            
            // Validate sort column to prevent SQL injection
            if (!isSafeColumnName(sortBy)) {
                sortBy = "rating";
            }
            
            // Add sort order
            sql.append(" ORDER BY ").append(sortBy);
            
            if ("asc".equalsIgnoreCase(sortOrder)) {
                sql.append(" ASC");
            } else {
                sql.append(" DESC");
            }
            
            // Add limit
            if (limit != null && limit > 0) {
                sql.append(" LIMIT ?");
                params.add(limit);
            } else {
                sql.append(" LIMIT 20"); // Default limit
            }
            
            return jdbcTemplate.query(
                sql.toString(), 
                params.toArray(),
                new RestaurantRowMapper()
            );
        } catch (Exception e) {
            System.err.println("Error fetching restaurants: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get a restaurant by ID
     */
    public Restaurant getRestaurantById(Long id) {
        try {
            String sql = "SELECT * FROM restaurants WHERE id = ?";
            return jdbcTemplate.queryForObject(sql, new RestaurantRowMapper(), id);
        } catch (Exception e) {
            System.err.println("Error fetching restaurant by id: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Get all available cuisines from the database
     */
    public List<String> getAllCuisines() {
        try {
            String sql = "SELECT DISTINCT categories FROM restaurants WHERE categories IS NOT NULL";
            List<String> allCategories = jdbcTemplate.query(sql, 
                (rs, rowNum) -> rs.getString("categories"));
            
            // Parse individual cuisines from comma-separated lists
            Set<String> uniqueCuisines = new HashSet<>();
            for (String categories : allCategories) {
                if (categories != null && !categories.isEmpty()) {
                    String[] parts = categories.split(",");
                    for (String part : parts) {
                        String cuisine = part.trim();
                        if (!cuisine.isEmpty()) {
                            uniqueCuisines.add(cuisine);
                        }
                    }
                }
            }
            
            // Convert to sorted list
            List<String> cuisines = new ArrayList<>(uniqueCuisines);
            cuisines.sort(String::compareToIgnoreCase);
            return cuisines;
        } catch (Exception e) {
            System.err.println("Error fetching cuisines: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get restaurants by cuisine with sorting options
     */
    public List<Restaurant> getRestaurantsByCuisineAdvanced(String cuisine, String sortBy, String sortOrder, Integer limit) {
        try {
            StringBuilder sql = new StringBuilder("SELECT * FROM restaurants WHERE categories ILIKE ?");
            List<Object> params = new ArrayList<>();
            params.add("%" + cuisine + "%");
            
            // Default sorting
            if (sortBy == null || sortBy.isEmpty()) {
                sortBy = "rating";
            }
            
            // Validate sort column to prevent SQL injection
            if (!isSafeColumnName(sortBy)) {
                sortBy = "rating";
            }
            
            // Add sort order
            sql.append(" ORDER BY ").append(sortBy);
            
            if ("asc".equalsIgnoreCase(sortOrder)) {
                sql.append(" ASC");
            } else {
                sql.append(" DESC");
            }
            
            // Add limit
            if (limit != null && limit > 0) {
                sql.append(" LIMIT ?");
                params.add(limit);
            } else {
                sql.append(" LIMIT 50"); // Default limit
            }
            
            return jdbcTemplate.query(
                sql.toString(), 
                params.toArray(),
                new RestaurantRowMapper()
            );
        } catch (Exception e) {
            System.err.println("Error fetching restaurants by cuisine: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get top-rated restaurants for each cuisine
     */
    public Map<String, List<Restaurant>> getTopRestaurantsByCuisine(int limit) {
        Map<String, List<Restaurant>> result = new HashMap<>();
        List<String> cuisines = getAllCuisines();
        
        for (String cuisine : cuisines) {
            List<Restaurant> topRestaurants = getRestaurantsByCuisineAdvanced(cuisine, "rating", "desc", limit);
            if (!topRestaurants.isEmpty()) {
                result.put(cuisine, topRestaurants);
            }
        }
        
        return result;
    }
    
    /**
     * Get restaurants by price range
     */
    public List<Restaurant> getRestaurantsByPriceRange(String priceRange) {
        try {
            String sql = "SELECT * FROM restaurants WHERE price_range = ? ORDER BY rating DESC LIMIT 20";
            return jdbcTemplate.query(sql, new RestaurantRowMapper(), priceRange);
        } catch (Exception e) {
            System.err.println("Error fetching restaurants by price range: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Search restaurants by name or keywords
     */
    public List<Restaurant> searchRestaurants(String query) {
        try {
            String sql = "SELECT * FROM restaurants WHERE " +
                         "name ILIKE ? OR " +
                         "categories ILIKE ? " +
                         "ORDER BY rating DESC LIMIT 20";
            
            String searchPattern = "%" + query + "%";
            return jdbcTemplate.query(
                sql, 
                new Object[] { searchPattern, searchPattern },
                new RestaurantRowMapper()
            );
        } catch (Exception e) {
            System.err.println("Error searching restaurants: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Prevent SQL injection by validating column names
     */
    private boolean isSafeColumnName(String columnName) {
        List<String> allowedColumns = List.of(
            "id", "name", "rating", "review_count", 
            "price_range", "categories", "city", "address"
        );
        return allowedColumns.contains(columnName.toLowerCase());
    }
    
    /**
     * Filters restaurants that match specific dietary preferences based on their categories
     */
    public List<Restaurant> getRestaurantsByDietaryPreference(String preference) {
        // Define mapping of dietary preferences to related categories 
        Map<String, List<String>> dietaryToCategories = new HashMap<>();
        dietaryToCategories.put("vegan", Arrays.asList("vegan", "vegetarian", "plant-based"));
        dietaryToCategories.put("vegetarian", Arrays.asList("vegetarian", "vegan", "salad", "health"));
        dietaryToCategories.put("halal", Arrays.asList("halal", "middle eastern", "mediterranean"));
        dietaryToCategories.put("gluten free", Arrays.asList("gluten-free", "health"));
        dietaryToCategories.put("pescatarian", Arrays.asList("seafood", "fish", "sushi"));
        dietaryToCategories.put("kosher", Arrays.asList("kosher", "jewish", "deli"));
        
        // Get the categories related to the preference (case insensitive)
        List<String> categories = dietaryToCategories.get(preference.toLowerCase());
        if (categories == null || categories.isEmpty()) {
            categories = List.of(preference.toLowerCase());
        }
        
        // Create a SQL query with LIKE clauses for each category
        StringBuilder sql = new StringBuilder("SELECT * FROM restaurants WHERE ");
        for (int i = 0; i < categories.size(); i++) {
            if (i > 0) {
                sql.append(" OR ");
            }
            sql.append("LOWER(categories) LIKE ?");
        }
        
        // Create the parameter list for the query
        Object[] params = categories.stream()
            .map(cat -> "%" + cat.toLowerCase() + "%")
            .toArray();
        
        // Execute query and return results
        return jdbcTemplate.query(sql.toString(), params, new RestaurantRowMapper());
    }
    
    /**
     * Filters restaurants by an array of categories
     * @param categories Array of categories to filter by
     * @return List of restaurants matching any of the specified categories
     */
    public List<Restaurant> getRestaurantsByCategories(String[] categories) {
        if (categories == null || categories.length == 0) {
            return getAllRestaurants();
        }
        
        StringBuilder sql = new StringBuilder("SELECT * FROM restaurants WHERE ");
        for (int i = 0; i < categories.length; i++) {
            if (i > 0) {
                sql.append(" OR ");
            }
            sql.append("LOWER(categories) LIKE ?");
        }
        
        // Create parameter array with wildcards for LIKE query
        Object[] params = Arrays.stream(categories)
            .map(cat -> "%" + cat.toLowerCase() + "%")
            .toArray();
        
        return jdbcTemplate.query(sql.toString(), params, new RestaurantRowMapper());
    }
    
    /**
     * Sorts a list of restaurants by the specified criteria
     * @param restaurants List of restaurants to sort
     * @param sortBy Sort criteria (rating, reviewCount, distance)
     * @param ascending True for ascending order, false for descending
     * @return Sorted list of restaurants
     */
    public List<Restaurant> sortRestaurants(List<Restaurant> restaurants, String sortBy, boolean ascending) {
        if (restaurants == null || restaurants.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Restaurant> sortedList = new ArrayList<>(restaurants);
        
        switch (sortBy.toLowerCase()) {
            case "rating":
                sortedList.sort(Comparator.comparing(Restaurant::getRating));
                break;
            case "reviews":
            case "reviewcount":
                sortedList.sort(Comparator.comparing(Restaurant::getReviewCount));
                break;
            case "price":
            case "pricerange":
                sortedList.sort(Comparator.comparing(Restaurant::getPriceRange));
                break;
            case "name":
                sortedList.sort(Comparator.comparing(Restaurant::getName));
                break;
            default:
                // Default to rating if sortBy is unrecognized
                sortedList.sort(Comparator.comparing(Restaurant::getRating));
        }
        
        // Reverse order if descending
        if (!ascending) {
            Collections.reverse(sortedList);
        }
        
        return sortedList;
    }
    
    /**
     * Get all restaurants from the database
     * @return List of all restaurants
     */
    public List<Restaurant> getAllRestaurants() {
        return jdbcTemplate.query("SELECT * FROM restaurants", new RestaurantRowMapper());
    }
    
    /**
     * Get restaurants for a specific cuisine
     * @param cuisine Cuisine type to filter by
     * @param sortBy Field to sort by
     * @param sortOrder Sort direction (asc/desc)
     * @param limit Maximum number of results
     * @return List of restaurants for the specified cuisine
     */
    public List<Restaurant> getRestaurantsByCuisineWithSort(String cuisine, String sortBy, String sortOrder, Integer limit) {
        String sql = "SELECT * FROM restaurants WHERE LOWER(categories) LIKE ? ORDER BY " + 
                     sanitizeSortField(sortBy) + " " + 
                     (sortOrder.equalsIgnoreCase("asc") ? "ASC" : "DESC") + 
                     " LIMIT ?";
        
        return jdbcTemplate.query(
            sql, 
            new Object[]{"%" + cuisine.toLowerCase() + "%", limit}, 
            new RestaurantRowMapper()
        );
    }
    
    /**
     * Get restaurants for a specific cuisine (simplified version)
     */
    public List<Restaurant> getRestaurantsByCuisine(String cuisine) {
        return getRestaurantsByCuisineAdvanced(cuisine, "rating", "desc", 20);
    }
    
    /**
     * Sanitize sort field to prevent SQL injection
     */
    private String sanitizeSortField(String field) {
        switch (field.toLowerCase()) {
            case "rating":
                return "rating";
            case "name":
                return "name";
            case "review_count":
            case "reviewcount":
                return "review_count";
            default:
                return "rating"; // Default sort by rating
        }
    }
    
    /**
     * General-purpose restaurant filtering method
     */
    public List<Restaurant> getRestaurantsWithFilter(String city, String category, String price, String sortBy, String sortOrder, Integer limit) {
        // Build the WHERE clause based on provided filters
        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();
        
        if (category != null && !category.isEmpty()) {
            whereClause.append("LOWER(categories) LIKE ?");
            params.add("%" + category.toLowerCase() + "%");
        }
        
        if (price != null && !price.isEmpty()) {
            if (whereClause.length() > 0) {
                whereClause.append(" AND ");
            }
            whereClause.append("price_range = ?");
            params.add(price);
        }
        
        if (city != null && !city.isEmpty()) {
            if (whereClause.length() > 0) {
                whereClause.append(" AND ");
            }
            whereClause.append("(LOWER(address) LIKE ? OR LOWER(city) LIKE ?)");
            params.add("%" + city.toLowerCase() + "%");
            params.add("%" + city.toLowerCase() + "%");
        }
        
        // Build the full SQL query
        StringBuilder sql = new StringBuilder("SELECT * FROM restaurants");
        if (whereClause.length() > 0) {
            sql.append(" WHERE ").append(whereClause);
        }
        
        // Add sorting
        sql.append(" ORDER BY ").append(sanitizeSortField(sortBy))
           .append(" ").append(sortOrder.equalsIgnoreCase("asc") ? "ASC" : "DESC");
        
        // Add limit
        sql.append(" LIMIT ?");
        params.add(limit);
        
        // Execute query
        return jdbcTemplate.query(sql.toString(), params.toArray(), new RestaurantRowMapper());
    }
    
    /**
     * Get restaurant recommendations based on ratings
     */
    public List<Restaurant> getRecommendations(Integer limit) {
        // For now, simply use top-rated restaurants as recommendations
        String sql = "SELECT * FROM restaurants ORDER BY rating DESC LIMIT ?";
        return jdbcTemplate.query(sql, new Object[]{limit}, new RestaurantRowMapper());
    }
    
    /**
     * Map result set to Restaurant objects
     */
    private static class RestaurantRowMapper implements RowMapper<Restaurant> {
        @Override
        public Restaurant mapRow(ResultSet rs, int rowNum) throws SQLException {
            Restaurant restaurant = new Restaurant();
            restaurant.setId(rs.getLong("id"));
            restaurant.setName(rs.getString("name"));
            restaurant.setCategories(rs.getString("categories"));
            restaurant.setRating(rs.getFloat("rating"));
            restaurant.setReviewCount(rs.getInt("review_count"));
            restaurant.setPriceRange(rs.getString("price_range"));
            
            // Handle optional fields safely
            try {
                restaurant.setCity(rs.getString("city"));
            } catch (SQLException e) {
                // If city column doesn't exist, extract from address
                String address = rs.getString("address");
                if (address != null && !address.isEmpty()) {
                    String[] parts = address.split(",");
                    if (parts.length >= 2) {
                        restaurant.setCity(parts[1].trim());
                    } else {
                        restaurant.setCity("Mankato"); // Default city
                    }
                } else {
                    restaurant.setCity("Mankato"); // Default city
                }
            }
            
            // Set image based on cuisine
            String categories = rs.getString("categories");
            String primaryCuisine = mapCuisineToImageCategory(categories);
            restaurant.setImage("/images/cuisine_images/" + primaryCuisine + "_cuisine.jpg");
            
            return restaurant;
        }
        
        /**
         * Map raw cuisine categories to standardized image category names
         */
        private String mapCuisineToImageCategory(String categories) {
            if (categories == null || categories.isEmpty()) {
                return "American"; // Default
            }
            
            // Extract the first category
            String primaryCategory = categories.split(",")[0].trim();
            
            // Map to standard cuisine categories used for images
            Map<String, String> cuisineMap = new HashMap<>();
            cuisineMap.put("Pizza", "Italian");
            cuisineMap.put("Italian", "Italian");
            cuisineMap.put("Mexican", "Mexican");
            cuisineMap.put("Bars", "American");
            cuisineMap.put("Steakhouses", "American");
            cuisineMap.put("American", "American");
            cuisineMap.put("Pubs", "American");
            cuisineMap.put("Beer Bar", "American");
            cuisineMap.put("Indian", "Indian");
            cuisineMap.put("Vegetarian", "Vegetarian");
            cuisineMap.put("Vegan", "Vegetarian");
            cuisineMap.put("Mediterranean", "Mediterranean");
            cuisineMap.put("Greek", "Mediterranean");
            cuisineMap.put("Thai", "Thai");
            cuisineMap.put("Chinese", "Chinese");
            cuisineMap.put("Japanese", "Japanese");
            cuisineMap.put("Sushi", "Japanese");
            cuisineMap.put("French", "French");
            cuisineMap.put("Seafood", "Seafood");
            cuisineMap.put("Vietnamese", "Vietnamese");
            cuisineMap.put("Korean", "Korean");
            
            // Return the mapped category or the default
            return cuisineMap.getOrDefault(primaryCategory, "American");
        }
    }
}