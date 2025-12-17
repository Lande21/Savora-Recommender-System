package com.savora.api.dto;

public class AuthResponse {
    private boolean success;
    private String message;
    private String token;
    private UserDto user;
    
    // Default constructor
    public AuthResponse() {
    }
    
    // Constructor for successful auth with all fields
    public AuthResponse(boolean success, String message, String token, UserDto user) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
    }
    
    // Constructor used in the service
    public AuthResponse(String token, UserDto user) {
        this.success = true;
        this.message = "Authentication successful";
        this.token = token;
        this.user = user;
    }
    
    // Constructor for failed auth
    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.token = null;
        this.user = null;
    }
    
    // Getters and setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public UserDto getUser() {
        return user;
    }
    
    public void setUser(UserDto user) {
        this.user = user;
    }
}