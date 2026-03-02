import React from 'react';
import { Box, Button, Typography } from '@mui/material';

function BusinessUnitFilter({ businessUnits, onToggle }) {
  const isGosaveSelected = businessUnits.includes('Gosave');
  const isGotoSelected = businessUnits.includes('Goto');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ 
        fontWeight: 500, 
        fontSize: '0.875rem', 
        whiteSpace: 'nowrap', 
        color: '#757575',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        letterSpacing: '0.01em',
        lineHeight: 1.4
      }}>
        Business Unit
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant={isGosaveSelected ? 'contained' : 'outlined'}
          onClick={() => onToggle('Gosave')}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: isGosaveSelected ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            bgcolor: isGosaveSelected ? '#6BA3D0' : 'transparent',
            color: isGosaveSelected ? 'white' : '#757575',
            border: isGosaveSelected ? 'none' : '1px solid #E5E5E5',
            borderRadius: '12px',
            py: 0.875,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isGosaveSelected ? '#5A9FD0' : '#FAFAFA',
              border: isGosaveSelected ? 'none' : '1px solid #E0E0E0',
              boxShadow: 'none'
            },
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'all 0.1s ease'
            }
          }}
        >
          Gosave
        </Button>
        <Button
          variant={isGotoSelected ? 'contained' : 'outlined'}
          onClick={() => onToggle('Goto')}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: isGotoSelected ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            bgcolor: isGotoSelected ? '#6BA3D0' : 'transparent',
            color: isGotoSelected ? 'white' : '#757575',
            border: isGotoSelected ? 'none' : '1px solid #E5E5E5',
            borderRadius: '12px',
            py: 0.875,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isGotoSelected ? '#5A9FD0' : '#FAFAFA',
              border: isGotoSelected ? 'none' : '1px solid #E0E0E0',
              boxShadow: 'none'
            },
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'all 0.1s ease'
            }
          }}
        >
          Goto
        </Button>
      </Box>
    </Box>
  );
}

export default BusinessUnitFilter;