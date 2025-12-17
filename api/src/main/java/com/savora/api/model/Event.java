package com.savora.api.model;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;

import java.util.HashMap;
import java.util.Map;

// Remove the @Data annotation since it's not working
public class Event {
    private String eventType;
    private String timestamp;
    private Long userId;
    private Map<String, Object> data = new HashMap<>();
    
    // Default constructor
    public Event() {
    }
    
    // Add explicit getters and setters
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    @JsonAnyGetter
    public Map<String, Object> getData() {
        return data;
    }
    
    @JsonAnySetter
    public void setData(String key, Object value) {
        this.data.put(key, value);
    }
    
    public void setData(Map<String, Object> data) {
        this.data = data;
    }
    
    @Override
    public String toString() {
        return "Event{" +
                "eventType='" + eventType + '\'' +
                ", timestamp='" + timestamp + '\'' +
                ", userId=" + userId +
                ", data=" + data +
                '}';
    }
}