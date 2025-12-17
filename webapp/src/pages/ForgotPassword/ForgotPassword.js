import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  Alert
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSendResetEmail = async (event) => {
    event.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_URL}/users/password-reset/request?email=${email}`);
      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f7f7f7'
      }}
    >
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
          padding: { xs: 2, sm: 4, md: 6 }
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: '500px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '50px',
            padding: { xs: 2, sm: 4, md: 6 }
          }}
        >
          {/* Heading */}
          <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 'bold', color: '#F76B06' }}
            >
              Forgot Password
            </Typography>
            <Typography variant="body2" sx={{ marginTop: 0.5, color: '#5D5D5B' }}>
              Enter your email address to receive a password reset link.
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              If the email exists in our system, you will receive password reset instructions shortly.
            </Alert>
          )}

          {/* Form */}
          {!success ? (
            <Box component="form" noValidate onSubmit={handleSendResetEmail}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          ) : (
            <Button
              fullWidth
              variant="outlined"
              href="/login"
              sx={{
                borderColor: '#ff6b00',
                color: '#ff6b00',
                '&:hover': { borderColor: '#e86000', color: '#e86000' },
                textTransform: 'none',
                borderRadius: '50px',
                px: { xs: 2, md: 3 },
                py: 0.8,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: 2
              }}
            >
              Return to Login
            </Button>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ForgotPassword;