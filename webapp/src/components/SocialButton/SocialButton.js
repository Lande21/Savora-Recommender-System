import React from 'react';
import { Button } from '@mui/material';

const SocialButton = ({ icon, label, color, bgColor }) => {
  return (
    <Button
      fullWidth
      variant="contained"
      startIcon={icon}
      sx={{
        my: 1,
        py: 1.2,
        color: color,
        backgroundColor: bgColor,
        '&:hover': {
          backgroundColor: bgColor === '#fff' ? '#f5f5f5' : bgColor,
        },
        textTransform: 'none',
        fontWeight: 500,
      }}
    >
      {label}
    </Button>
  );
};

export default SocialButton;