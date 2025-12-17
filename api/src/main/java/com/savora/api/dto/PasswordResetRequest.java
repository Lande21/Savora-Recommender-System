package com.savora.api.dto;

import javax.validation.constraints.NotBlank;

public class PasswordResetRequest {
    
    @NotBlank(message = "Token is required")
    private String token;
    
    @NotBlank(message = "New password is required")
    private String newPassword;
    
    // Default constructor
    public PasswordResetRequest() {
    }
    
    // All-args constructor
    public PasswordResetRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getNewPassword() {
        return newPassword;
    }
    
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}