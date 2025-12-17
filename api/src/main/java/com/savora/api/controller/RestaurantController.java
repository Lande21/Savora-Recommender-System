package com.savora.api.controller;

import com.savora.api.model.Restaurant;
import com.savora.api.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String price,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(restaurantService.getRestaurantsWithFilter(city, category, price, sortBy, sortOrder, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getRestaurantById(id));
    }

    @GetMapping("/cuisines")
    public ResponseEntity<List<String>> getAllCuisines() {
        List<String> cuisines = restaurantService.getAllCuisines();
        return ResponseEntity.ok(cuisines);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Restaurant>> searchRestaurants(
            @RequestParam String query,
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(restaurantService.searchRestaurants(query));
    }

    @GetMapping("/by-price")
    public ResponseEntity<List<Restaurant>> getRestaurantsByPriceRange(
            @RequestParam String priceRange) {
        List<Restaurant> restaurants = restaurantService.getRestaurantsByPriceRange(priceRange);
        return ResponseEntity.ok(restaurants);
    }

    @GetMapping("/top-by-cuisine")
    public ResponseEntity<Map<String, List<Restaurant>>> getTopRestaurantsByCuisine(
            @RequestParam(defaultValue = "3") int limit) {
        Map<String, List<Restaurant>> topRestaurants = restaurantService.getTopRestaurantsByCuisine(limit);
        return ResponseEntity.ok(topRestaurants);
    }

    @GetMapping("/cuisine/{cuisine}")
    public ResponseEntity<List<Restaurant>> getRestaurantsByCuisine(
            @PathVariable String cuisine,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByCuisineWithSort(cuisine, sortBy, sortOrder, limit));
    }
}