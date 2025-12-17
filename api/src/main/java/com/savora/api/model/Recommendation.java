package com.savora.api.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
public class Recommendation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "restaurant_name")
    private String restaurantName;
    
    @Column(name = "restaurant_categories")
    private String restaurantCategories;
    
    @Column(name = "rating")
    private float rating;
    
    @Column(name = "review_count")
    private int reviewCount;
    
    @Column(name = "price_range")
    private String priceRange;
    
    @Column(name = "score")
    private float score;
    
    @Column(name = "recommendation_rank")
    private int recommendationRank;
    
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;
    
    // Default constructor
    public Recommendation() {
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(long userId) {
        this.userId = userId;
    }
    
    public String getRestaurantName() {
        return restaurantName;
    }
    
    public void setRestaurantName(String restaurantName) {
        this.restaurantName = restaurantName;
    }
    
    public String getRestaurantCategories() {
        return restaurantCategories;
    }
    
    public void setRestaurantCategories(String restaurantCategories) {
        this.restaurantCategories = restaurantCategories;
    }
    
    public float getRating() {
        return rating;
    }
    
    public void setRating(float rating) {
        this.rating = rating;
    }
    
    public int getReviewCount() {
        return reviewCount;
    }
    
    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }
    
    public String getPriceRange() {
        return priceRange;
    }
    
    public void setPriceRange(String priceRange) {
        this.priceRange = priceRange;
    }
    
    public float getScore() {
        return score;
    }
    
    public void setScore(float score) {
        this.score = score;
    }
    
    public int getRecommendationRank() {
        return recommendationRank;
    }
    
    public void setRecommendationRank(int recommendationRank) {
        this.recommendationRank = recommendationRank;
    }
    
    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}