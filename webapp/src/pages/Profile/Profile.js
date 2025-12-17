import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Navbar from '../../components/Navbar/Navbar'; // Changed from Header to Navbar
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Standard navigation items used across the app
const standardNavItems = [
  { name: 'Discover', path: '/' },
];

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_URL}/users/me`);
        
        setUserData({
          username: response.data.username || '',
          email: response.data.email || '',
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || ''
        });
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Create a copy that excludes email to ensure it's not updated
      const { email, ...updatableFields } = userData;
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await axios.put(`${API_URL}/users/me`, updatableFields);
      
      setSuccess('Profile updated successfully');
      
      // Update local storage with new user data but keep the original email
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...user, ...updatableFields, email: user.email }; // Keep original email
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    try {
      // First clear token and user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remove Authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      // Call the context logout
      logout();
      
      // Dispatch event to notify other components about logout
      window.dispatchEvent(new Event('auth-change'));
      
      console.log('Logout successful, navigating to home');
      
      // Navigate to home page with a slight delay to ensure state updates
      setTimeout(() => {
        window.location.href = '/'; // Force a full page refresh to ensure clean state
      }, 100);
    } catch (err) {
      console.error('Error during logout:', err);
      // As a fallback, try direct navigation
      window.location.href = '/';
    }
  };

  // If user data is loading or not found
  if (loading && !userData.email) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        background: '#f7f7f7'
      }}>
        <Navbar 
          buttonLabel="Home" 
          buttonPath="/"
          navItems={standardNavItems}
        />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flex: 1 
        }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: '#f7f7f7'
    }}>
      {/* Navbar with standard navigation items */}
      <Navbar 
        buttonLabel="Home" 
        buttonPath="/"
        navItems={[
          { name: 'Discover', path: '/' } // Only showing "Discover" as requested
        ]}
      />

      <Container maxWidth="md" sx={{ mt: 5, mb: 8, flex: 1 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: '#F76B06',
                fontSize: '2rem',
                fontWeight: 'bold',
                mr: 2
              }}
            >
              {userData.firstName && userData.lastName 
                ? `${userData.firstName[0]}${userData.lastName[0]}`
                : userData.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.username || 'User'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {userData.email || 'No email available'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={userData.username}
                onChange={handleChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Email cannot be changed for security reasons">
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={userData.email}
                  disabled={true} // Disable the email field
                  variant="outlined"
                  margin="normal"
                  type="email"
                  InputProps={{
                    readOnly: true, // Make it read-only
                    endAdornment: (
                      <InputAdornment position="end">
                        <LockIcon sx={{ color: 'grey.500' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#666", // Better color for disabled text
                    } 
                  }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={userData.firstName}
                onChange={handleChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={userData.lastName}
                onChange={handleChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleLogout}  // Changed from onClick={logout}
              sx={{ 
                borderRadius: '50px',
                px: 3
              }}
            >
              Log Out
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSave}
              disabled={loading}
              sx={{ 
                bgcolor: '#F76B06',
                '&:hover': { bgcolor: '#e86000' },
                borderRadius: '50px',
                px: 4
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;