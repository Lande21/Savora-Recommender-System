import React, { useState } from 'react';
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
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Form validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        firstName,
        lastName,
        password
      });
      
      const { token, user } = response.data;
      
      // Use the login function from AuthContext
      login(user, token);
      
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Registration failed');
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f7f7' }}>
      {/* Navbar */}
      <Box sx={{ width: '100%' }}>
        <Navbar buttonLabel="Back to Login" buttonPath="/login" />
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, padding: { xs: 2, sm: 4, md: 6 } }}>
        <Paper
          elevation={3}
          sx={{
            maxWidth: '600px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '50px',
            padding: { xs: 2, sm: 4, md: 6 }
          }}
        >
          {/* Brand Heading */}
          <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Box component="img" src="/logo_only.svg" alt="Savora Logo" sx={{ height: 50 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#F76B06' }}>
                Savora
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ marginTop: 0.5, color: '#5D5D5B' }}>
              Join Savora to discover delicious new places!
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              placeholder="Choose a username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ marginBottom: 2 }}
            />
            
            {/* First Name and Last Name in a Row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                margin="normal"
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ marginBottom: 2 }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                placeholder="Your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ marginBottom: 2 }}
              />
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              placeholder="Enter your email address"
              autoComplete="email"
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
              autoComplete="new-password"
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

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Repeat your password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
              {loading ? 'Registering...' : 'Register'}
            </Button>

            {/* Already Have an Account */}
            <Box sx={{ marginTop: 1, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#080A0B' }}>
                Already have an account?{' '}
                <Typography
                  component={Link}
                  to="/login"
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: '#F76B06',
                    textDecoration: 'none'
                  }}
                >
                  Log in
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;