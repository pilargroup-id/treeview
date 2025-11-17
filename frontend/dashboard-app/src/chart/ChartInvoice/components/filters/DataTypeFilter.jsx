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
        color: '#616161',
        letterSpacing: '0.01em',
        lineHeight: 1.4
      }}>
        Tipe Data
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant={isPenjualanSelected ? 'contained' : 'outlined'}
          onClick={handlePenjualanToggle}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: isPenjualanSelected ? 600 : 500,
            bgcolor: isPenjualanSelected ? '#212121' : 'transparent',
            color: isPenjualanSelected ? 'white' : '#616161',
            border: isPenjualanSelected ? 'none' : '1px solid #e0e0e0',
            borderRadius: 1.5,
            py: 1,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isPenjualanSelected ? '#424242' : '#fafafa',
              border: isPenjualanSelected ? 'none' : '1px solid #bdbdbd',
              boxShadow: isPenjualanSelected ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)'
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
            bgcolor: isQuantitySelected ? '#212121' : 'transparent',
            color: isQuantitySelected ? 'white' : '#616161',
            border: isQuantitySelected ? 'none' : '1px solid #e0e0e0',
            borderRadius: 1.5,
            py: 1,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: isQuantitySelected ? '#424242' : '#fafafa',
              border: isQuantitySelected ? 'none' : '1px solid #bdbdbd',
              boxShadow: isQuantitySelected ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)'
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

