import React from 'react';
import { Box, Button, Typography } from '@mui/material';

function DataTypeFilter({ dataType, onChange }) {
  const isPenjualanSelected = dataType === 'penjualan' || dataType === 'both';
  const isQuantitySelected = dataType === 'quantity' || dataType === 'both';

  const handlePenjualanToggle = () => {
    if (dataType === 'penjualan') {
      onChange('both');
    } else if (dataType === 'both') {
      onChange('quantity');
    } else {
      onChange('both');
    }
  };

  const handleQuantityToggle = () => {
    if (dataType === 'quantity') {
      onChange('both');
    } else if (dataType === 'both') {
      onChange('penjualan');
    } else {
      onChange('both');
    }
  };

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
        Tipe Data
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant={isPenjualanSelected ? 'contained' : 'outlined'}
          onClick={handlePenjualanToggle}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: isPenjualanSelected ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            bgcolor: isPenjualanSelected ? '#3B82F6' : 'transparent',
            color: isPenjualanSelected ? 'white' : '#475569',
            border: isPenjualanSelected ? 'none' : '1px solid #E2E8F0',
            borderRadius: 1,
            py: 0.875,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isPenjualanSelected ? '#2563EB' : '#F1F5F9',
              border: isPenjualanSelected ? 'none' : '1px solid #CBD5E1',
              boxShadow: isPenjualanSelected ? '0 1px 2px rgba(59, 130, 246, 0.2)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)',
              transition: 'all 0.1s ease'
            }
          }}
        >
          Penjualan
        </Button>
        <Button
          variant={isQuantitySelected ? 'contained' : 'outlined'}
          onClick={handleQuantityToggle}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: isQuantitySelected ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            bgcolor: isQuantitySelected ? '#3B82F6' : 'transparent',
            color: isQuantitySelected ? 'white' : '#475569',
            border: isQuantitySelected ? 'none' : '1px solid #E2E8F0',
            borderRadius: 1,
            py: 0.875,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isQuantitySelected ? '#2563EB' : '#F1F5F9',
              border: isQuantitySelected ? 'none' : '1px solid #CBD5E1',
              boxShadow: isQuantitySelected ? '0 1px 2px rgba(59, 130, 246, 0.2)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)',
              transition: 'all 0.1s ease'
            }
          }}
        >
          Quantity
        </Button>
      </Box>
    </Box>
  );
}

export default DataTypeFilter;

