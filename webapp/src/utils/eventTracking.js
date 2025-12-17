import axios from 'axios';

/**
 * Utility functions for tracking user events and sending them to Kafka
 */

// Base endpoint for our event API - make sure to use the API_URL variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Track a user event
 * @param {string} eventType - Type of event from EventTypes
 * @param {object} eventData - Data associated with the event
 */
export const trackEvent = async (eventType, eventData = {}) => {
  try {
    // Get user from local storage if available
    let userId = null;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userId = user.id || null;
    } catch (e) {
      console.error('Error getting user from localStorage:', e);
    }
    
    // Create event with timestamp, type, data, and userId
    const event = {
      eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
      userId // Include userId in the event
    };
    
    console.log(`Tracking event: ${eventType}`, event);
    
    // Send event to API
    await axios.post(`${API_URL}/events`, event);
    
    return true;
  } catch (error) {
    console.error('Failed to track event:', error);
    return false;
  }
};

// Event type constants
export const EventTypes = {
  CUISINE_SELECTED: 'CUISINE_SELECTED',
  DIETARY_PREFERENCE_SELECTED: 'DIETARY_PREFERENCE_SELECTED',
  RESTAURANT_VIEWED: 'RESTAURANT_VIEWED',
  RESTAURANT_BOOKMARKED: 'RESTAURANT_BOOKMARKED',
  SEARCH_PERFORMED: 'SEARCH_PERFORMED'
};