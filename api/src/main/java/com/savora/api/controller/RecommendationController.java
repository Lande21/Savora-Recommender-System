package com.savora.api.controller;

import com.savora.api.model.Recommendation;
import com.savora.api.model.Restaurant;
import com.savora.api.service.RecommendationService;
import com.savora.api.service.RestaurantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private RestaurantService restaurantService;

    @GetMapping
    public ResponseEntity<List<Restaurant>> getRecommendations(
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        
        // Get recommendations from service
        List<Restaurant> recommendations = restaurantService.getRecommendations(limit);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Recommendation>> getRecommendationsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(userId));
    }
}