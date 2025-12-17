import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Navbar from '../../components/Navbar/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Array of cuisine images
  const cuisineImages = [
    '/images/cuisine_images/Mexican_cuisine.jpg',
    '/images/cuisine_images/Mediterranean_cuisine.jpg',
    '/images/cuisine_images/Thai_cuisine.jpg',
    '/images/cuisine_images/Indian_cuisine.jpg',
    '/images/cuisine_images/French_cuisine.jpg',
    '/images/cuisine_images/Italian_cuisine.jpg'
  ];
  const [randomImage, setRandomImage] = useState(cuisineImages[0]);

  // Set a random image on component mount
  useEffect(() => {
    const selectedImage = cuisineImages[Math.floor(Math.random() * cuisineImages.length)];
    setRandomImage(selectedImage);
  }, []);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting login with:', { email });
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      console.log('Login response:', response);
      
      // Extract data from response
      const { data } = response;
      
      if (!data) {
        setError('Empty response from server');
        setLoading(false);
        return;
      }
      
      console.log('Response data:', data);
      
      // For Savora API structure
      const userData = data.user || data;
      const authToken = data.token;
      
      if (!authToken) {
        setError('No authentication token received');
        setLoading(false);
        return;
      }
      
      // Use the login function from AuthContext
      login(userData, authToken);
      
      // Force an immediate UI update by setting to localStorage directly
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Dispatch event to notify other components about login
      window.dispatchEvent(new Event('auth-change'));
      
      // Wait a little to ensure state updates
      setTimeout(() => {
        // Navigate to home page
        console.log('Login successful, navigating to home');
        navigate('/');
      }, 200);
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.message || 'Invalid email or password');
      } else if (err.request) {
        setError('Could not connect to server. Please try again.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f7f7' }}>
      {/* Navbar */}
      <Box sx={{ width: '100%' }}>
        <Navbar buttonLabel="Discover" buttonPath="/" />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          padding: { xs: 2, sm: 4, md: 6 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            maxWidth: '1200px',
            width: '100%'
          }}
        >
          {/* Left Side - Randomized Image */}
          <Paper
            elevation={3}
            sx={{
              flex: 2,
              backgroundImage: `url("${randomImage}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '50px',
              minHeight: { xs: 200, md: 400 }
            }}
          />

          {/* Right Side - Login Form */}
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: { xs: 2, sm: 4, md: 6 },
              borderRadius: '50px'
            }}
          >
            {/* Brand Heading */}
            <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
              {/* Logo and Title Side by Side */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}
              >
                {/* Logo */}
                <Box
                  component="img"
                  src="/logo_only.svg"
                  alt="Savora Logo"
                  sx={{ height: 50 }}
                />

                {/* Title */}
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 'bold', color: '#F76B06' }}
                >
                  Savora
                </Typography>
              </Box>

              {/* Subtitle */}
              <Typography variant="body2" sx={{ marginTop: 0.5, color: '#5D5D5B' }}>
                Your go-to restaurant guide!
              </Typography>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" noValidate onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                placeholder="Enter your email address"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ marginBottom: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ marginBottom: 2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disableElevation
                disabled={loading}
                sx={{
                  bgcolor: '#ff6b00',
                  '&:hover': { bgcolor: '#e86000' },
                  textTransform: 'none',
                  borderRadius: '50px',
                  px: { xs: 2, md: 3 },
                  py: 0.8,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: 2
                }}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </Button>

              {/* Forgot Password & Create Account */}
              <Box sx={{ marginTop: 1, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#080A0B' }}>
                  Don't have an account?{' '}
                  <Typography
                    component={Link}
                    to="/register"
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: '#F76B06',
                      textDecoration: 'none'
                    }}
                  >
                    Create one
                  </Typography>
                </Typography>
                <Typography
                  variant="body2"
                  component={Link}
                  to="/forgot-password"
                  sx={{ cursor: 'pointer', marginBottom: 1, color: '#858585', textDecoration: 'none' }}
                >
                  Forgot your password?
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
