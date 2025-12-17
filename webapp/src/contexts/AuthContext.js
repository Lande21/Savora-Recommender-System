import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  
  // Check if user is logged in on app load
  useEffect(() => {
    const checkLoggedInStatus = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log("Checking login status, token:", storedToken ? "exists" : "not found");
      
      if (storedToken && storedUser) {
        try {
          // Parse the stored user for initial state
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          
          // Set auth header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify token is still valid by fetching user info
          console.log("Attempting to validate token with /api/users/me");
          const response = await axios.get(`${API_URL}/users/me`);
          console.log("Token validation successful, user data:", response.data);
          
          // Update user data in case it's been changed server-side
          setCurrentUser(response.data);
        } catch (error) {
          // Token is invalid or expired
          console.error("Token validation failed:", error);
          logout();
        }
      } else {
        console.log("No stored credentials found");
      }
      
      setLoading(false);
    };
    
    checkLoggedInStatus();
  }, []);
  
  const login = (userData, authToken) => {
    console.log("Login called with user data:", userData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    setCurrentUser(userData);
    setToken(authToken);
  };
  
  const logout = () => {
    console.log("Logout called");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setToken(null);
  };
  
  const isAuthenticated = () => {
    const auth = !!currentUser;
    console.log("isAuthenticated called, result:", auth);
    return auth;
  };
  
  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated,
    loading,
    token
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};