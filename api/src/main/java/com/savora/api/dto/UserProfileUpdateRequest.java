package com.savora.api.dto;

import javax.validation.constraints.Size;

public class UserProfileUpdateRequest {
    @Size(max = 100)
    private String firstName;
    
    @Size(max = 100)
    private String lastName;
    
    @Size(min = 3, max = 50)
    private String username;
    
    // Default constructor
    public UserProfileUpdateRequest() {
    }
    
    // All args constructor
    public UserProfileUpdateRequest(String firstName, String lastName, String username) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
    }
    
    // Getters and setters
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
}