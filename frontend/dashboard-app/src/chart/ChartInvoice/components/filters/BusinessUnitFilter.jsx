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
        color: '#616161',
        letterSpacing: '0.01em',
        lineHeight: 1.4
      }}>
        Business Unit
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant={isGosaveSelected ? 'contained' : 'outlined'}
          onClick={() => onToggle('Gosave')}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: isGosaveSelected ? 600 : 500,
            bgcolor: isGosaveSelected ? '#212121' : 'transparent',
            color: isGosaveSelected ? 'white' : '#616161',
            border: isGosaveSelected ? 'none' : '1px solid #e0e0e0',
            borderRadius: 1.5,
            py: 1,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isGosaveSelected ? '#424242' : '#fafafa',
              border: isGosaveSelected ? 'none' : '1px solid #bdbdbd',
              boxShadow: isGosaveSelected ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)'
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
            bgcolor: isGotoSelected ? '#212121' : 'transparent',
            color: isGotoSelected ? 'white' : '#616161',
            border: isGotoSelected ? 'none' : '1px solid #e0e0e0',
            borderRadius: 1.5,
            py: 1,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isGotoSelected ? '#424242' : '#fafafa',
              border: isGotoSelected ? 'none' : '1px solid #bdbdbd',
              boxShadow: isGotoSelected ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)'
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

