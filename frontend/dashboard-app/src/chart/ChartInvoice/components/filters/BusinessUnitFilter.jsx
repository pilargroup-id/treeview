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
        color: '#475569',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            bgcolor: isGosaveSelected ? '#3B82F6' : 'transparent',
            color: isGosaveSelected ? 'white' : '#475569',
            border: isGosaveSelected ? 'none' : '1px solid #E2E8F0',
            borderRadius: 1,
            py: 0.875,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isGosaveSelected ? '#2563EB' : '#F1F5F9',
              border: isGosaveSelected ? 'none' : '1px solid #CBD5E1',
              boxShadow: isGosaveSelected ? '0 1px 2px rgba(59, 130, 246, 0.2)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)',
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
            bgcolor: isGotoSelected ? '#3B82F6' : 'transparent',
            color: isGotoSelected ? 'white' : '#475569',
            border: isGotoSelected ? 'none' : '1px solid #E2E8F0',
            borderRadius: 1,
            py: 0.875,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isGotoSelected ? '#2563EB' : '#F1F5F9',
              border: isGotoSelected ? 'none' : '1px solid #CBD5E1',
              boxShadow: isGotoSelected ? '0 1px 2px rgba(59, 130, 246, 0.2)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)',
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

