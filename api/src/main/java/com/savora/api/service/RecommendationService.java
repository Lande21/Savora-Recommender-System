package com.savora.api.service;

import com.savora.api.model.Recommendation;
import com.savora.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private UserRepository userRepository;

    public List<Recommendation> getRecommendations(Long userId) {
        String sql = "SELECT * FROM user_recommendations WHERE user_id = ? ORDER BY recommendation_rank";
        
        try {
            return jdbcTemplate.query(sql, new RecommendationRowMapper(), userId);
        } catch (Exception e) {
            System.err.println("Error fetching recommendations: " + e.getMessage());
            return getDefaultRecommendations();
        }
    }
    
    public Long getUserIdFromUsername(String username) {
        return userRepository.findByEmail(username)
                .map(user -> user.getId())
                .orElse(null);
    }

    public List<Recommendation> getDefaultRecommendations() {
        // Provide a default set of popular restaurants if no personalized recommendations exist
        String sql = "SELECT * FROM user_recommendations WHERE recommendation_rank <= 6 ORDER BY score DESC LIMIT 6";
        
        try {
            return jdbcTemplate.query(sql, new RecommendationRowMapper());
        } catch (Exception e) {
            System.err.println("Error fetching default recommendations: " + e.getMessage());
            return createHardcodedRecommendations();
        }
    }
    
    private List<Recommendation> createHardcodedRecommendations() {
        // As a last resort, create hardcoded recommendations
        List<Recommendation> recommendations = new ArrayList<>();
        String[] restaurants = {"Bella Italia", "Mumbai Spice", "La Parisienne", "Cancun Grill", "Bangkok Kitchen", "Athens Taverna"};
        String[] categories = {"Italian", "Indian", "French", "Mexican", "Thai", "Mediterranean"};
        float[] ratings = {4.8f, 4.6f, 4.7f, 4.5f, 4.4f, 4.3f};
        
        for (int i = 0; i < restaurants.length; i++) {
            Recommendation rec = new Recommendation();
            rec.setRestaurantName(restaurants[i]);
            rec.setRestaurantCategories(categories[i]);
            rec.setRating(ratings[i]);
            rec.setRecommendationRank(i+1);
            rec.setScore(ratings[i]);
            recommendations.add(rec);
        }
        
        return recommendations;
    }

    private static class RecommendationRowMapper implements RowMapper<Recommendation> {
        @Override
        public Recommendation mapRow(ResultSet rs, int rowNum) throws SQLException {
            Recommendation recommendation = new Recommendation();
            recommendation.setId(rs.getLong("id"));
            recommendation.setUserId(rs.getLong("user_id"));
            recommendation.setRestaurantName(rs.getString("restaurant_name"));
            recommendation.setRestaurantCategories(rs.getString("restaurant_categories"));
            recommendation.setRating(rs.getFloat("rating"));
            recommendation.setReviewCount(rs.getInt("review_count"));
            recommendation.setPriceRange(rs.getString("price_range"));
            recommendation.setScore(rs.getFloat("score"));
            recommendation.setRecommendationRank(rs.getInt("recommendation_rank"));
            recommendation.setGeneratedAt(rs.getTimestamp("generated_at").toLocalDateTime());
            return recommendation;
        }
    }
}