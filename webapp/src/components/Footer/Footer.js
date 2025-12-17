import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#D3D3D3',
        borderTop: '1px solid #eaeaea'
      }}
    >
      {/* Container for two columns */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2
        }}
      >
        {/* Left Column */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#030303' }}>
            Savora
          </Typography>
          <Typography variant="body2" sx={{ color: '#030303', mb: 2 }}>
            Your go-to restaurant guide
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            © {new Date().getFullYear()} Savora. All rights reserved.
          </Typography>
        </Box>

        {/* Right Column (Vertical Menu) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end', // Aligns text to the right
            gap: 1
          }}
        >
          <Typography
            variant="body2"
            fontWeight="bold"
            color="text.primary"
            sx={{ cursor: 'pointer' }}
          >
            Help
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
            FAQs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
            Support
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
            Get in touch
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
            How it works
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;