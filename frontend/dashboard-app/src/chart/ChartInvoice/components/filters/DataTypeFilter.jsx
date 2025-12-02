import React from 'react';
import { Box, Button, Typography } from '@mui/material';

function DataTypeFilter({ dataType, onChange }) {
  const isPenjualanSelected = dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all';
  const isQuantitySelected = dataType === 'quantity' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all';
  const isOrderSelected = dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all';

  const handlePenjualanToggle = () => {
    if (dataType === 'penjualan') {
      onChange('both');
    } else if (dataType === 'both') {
      onChange('quantity');
    } else if (dataType === 'order') {
      onChange('penjualan_order');
    } else if (dataType === 'penjualan_order') {
      onChange('order');
    } else if (dataType === 'quantity_order') {
      onChange('all');
    } else if (dataType === 'all') {
      onChange('quantity_order');
    } else {
      onChange('both');
    }
  };

  const handleQuantityToggle = () => {
    if (dataType === 'quantity') {
      onChange('both');
    } else if (dataType === 'both') {
      onChange('penjualan');
    } else if (dataType === 'order') {
      onChange('quantity_order');
    } else if (dataType === 'quantity_order') {
      onChange('order');
    } else if (dataType === 'penjualan_order') {
      onChange('all');
    } else if (dataType === 'all') {
      onChange('penjualan_order');
    } else {
      onChange('both');
    }
  };

  const handleOrderToggle = () => {
    if (dataType === 'order') {
      onChange('penjualan_order');
    } else if (dataType === 'penjualan_order') {
      onChange('penjualan');
    } else if (dataType === 'quantity_order') {
      onChange('quantity');
    } else if (dataType === 'all') {
      onChange('both');
    } else if (dataType === 'penjualan') {
      onChange('penjualan_order');
    } else if (dataType === 'quantity') {
      onChange('quantity_order');
    } else if (dataType === 'both') {
      onChange('all');
    } else {
      onChange('order');
    }
  };

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
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              bgcolor: isPenjualanSelected ? '#6BA3D0' : 'transparent',
              color: isPenjualanSelected ? 'white' : '#757575',
              border: isPenjualanSelected ? 'none' : '1px solid #E5E5E5',
              borderRadius: '12px',
              py: 0.875,
              boxShadow: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isPenjualanSelected ? '#5A9FD0' : '#FAFAFA',
                border: isPenjualanSelected ? 'none' : '1px solid #E0E0E0',
                boxShadow: 'none'
              },
              '&:active': {
                transform: 'scale(0.98)',
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
              bgcolor: isQuantitySelected ? '#6BA3D0' : 'transparent',
              color: isQuantitySelected ? 'white' : '#757575',
              border: isQuantitySelected ? 'none' : '1px solid #E5E5E5',
              borderRadius: '12px',
              py: 0.875,
              boxShadow: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isQuantitySelected ? '#5A9FD0' : '#FAFAFA',
                border: isQuantitySelected ? 'none' : '1px solid #E0E0E0',
                boxShadow: 'none'
              },
              '&:active': {
                transform: 'scale(0.98)',
                transition: 'all 0.1s ease'
              }
            }}
          >
            Quantity
          </Button>
          <Button
            variant={isOrderSelected ? 'contained' : 'outlined'}
            onClick={handleOrderToggle}
            size="medium"
            fullWidth
            sx={{ 
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: isOrderSelected ? 600 : 500,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              bgcolor: isOrderSelected ? '#6BA3D0' : 'transparent',
              color: isOrderSelected ? 'white' : '#757575',
              border: isOrderSelected ? 'none' : '1px solid #E5E5E5',
              borderRadius: '12px',
              py: 0.875,
              boxShadow: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isOrderSelected ? '#5A9FD0' : '#FAFAFA',
                border: isOrderSelected ? 'none' : '1px solid #E0E0E0',
                boxShadow: 'none'
              },
              '&:active': {
                transform: 'scale(0.98)',
                transition: 'all 0.1s ease'
              }
            }}
          >
            Order
          </Button>
      </Box>
    </Box>
  );
}

export default DataTypeFilter;  