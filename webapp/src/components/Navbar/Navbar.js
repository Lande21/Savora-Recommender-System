import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  Typography, 
  Container, 
  IconButton, 
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ navItems = [], buttonLabel, buttonPath }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);

  // Check if user is logged in
  const isLoggedIn = (() => {
    try {
      // Try direct check from context first
      if (currentUser) {
        return true;
      }
      // Fallback to localStorage
      return !!localStorage.getItem('user');
    } catch (e) {
      return false;
    }
  })();

  // Open user menu
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  // Close user menu
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Handle user logout
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    // Dispatch event to notify other components about logout
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  // Get username from any available source
  const getUsername = () => {
    try {
      // Try to get user data from localStorage if currentUser is null
      const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      return userData?.username || 'User';
    } catch (e) {
      return 'User';
    }
  };

  // Get email from any available source
  const getEmail = () => {
    try {
      // Try to get user data from localStorage if currentUser is null
      const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      return userData?.email || 'No email';
    } catch (e) {
      return 'No email';
    }
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={0} 
      sx={{ bgcolor: 'white', borderBottom: '1px solid #eaeaea' }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Left Side Container - Logo and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo and Title */}
            <Box
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                mr: 3 // Add right margin between logo and nav items
              }}
              onClick={() => navigate('/')}
            >
              <Box
                component="img"
                src="/logo_only.svg"
                alt="Savora Logo"
                sx={{ height: 40, mr: 1 }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: '#ff6b00',
                  textDecoration: 'none',
                }}
              >
                Savora
              </Typography>
            </Box>

            {/* Navigation Items */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    mx: 1,
                    fontSize: '0.9rem',
                    borderRadius: 0
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Right Side - Profile Icon or Login Button */}
          <Box>
            {isLoggedIn ? (
              <>
                {/* Identity icon that opens user menu */}
                <Tooltip title="Open profile menu">
                  <IconButton 
                    onClick={handleUserMenuOpen} 
                    size="medium"
                    sx={{ 
                      ml: 1,
                      bgcolor: '#F76B06',
                      color: 'white',
                      '&:hover': { bgcolor: '#e86000' },
                      width: 40,
                      height: 40
                    }}
                  >
                    <PermIdentityIcon />
                  </IconButton>
                </Tooltip>
                
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { mt: 1.5, width: 200 }
                  }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {getUsername()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {getEmail()}
                    </Typography>
                  </Box>
                  <MenuItem onClick={() => {
                    handleUserMenuClose();
                    navigate('/profile');
                  }}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                disableElevation
                onClick={() => navigate(buttonPath)}
                sx={{
                  bgcolor: '#ff6b00',
                  '&:hover': { bgcolor: '#e86000' },
                  textTransform: 'none',
                  borderRadius: 9999, // Fully rounded (pill-shaped)
                  px: { xs: 2, md: 3 },
                  py: 1.2,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: 'none',
                }}
              >
                {buttonLabel}
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;