import React from 'react';
import { Button, Card, Typography, IconButton, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DateFilterType from './DateFilterType';
import BusinessUnitFilter from './BusinessUnitFilter';
import DataTypeFilter from './DataTypeFilter';

function FilterSection({
  dateFilterType,
  onDateFilterTypeChange,
  businessUnits,
  onBusinessUnitToggle,
  dataType,
  onDataTypeChange,
  onLoadData,
  onRefreshData,
  isLoading
}) {
  return (
    <Card sx={{ 
      bgcolor: '#FFFFFF', 
      borderRadius: '16px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
      border: '1px solid #E5E7EB',
      p: { xs: 3, md: 3.5 },
      display: 'flex',
      flexDirection: 'column',
      gap: 2.5,
      height: '100%',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      zIndex: 1,
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
        borderColor: '#D1D5DB',
        transform: 'translateY(-1px)'
      }
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 0
      }}>
        <Typography sx={{ 
          fontSize: { xs: '0.9375rem', md: '1rem' }, 
          fontWeight: 600, 
          color: '#212121',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          Filter
        </Typography>
        <IconButton
          onClick={onRefreshData || onLoadData}
          disabled={isLoading}
          size="small"
          sx={{
            color: '#9E9E9E',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#2F6FB2',
              bgcolor: '#FAFAFA'
            },
            '&:disabled': {
              color: '#E0E0E0'
            }
          }}
          title="Refresh Data"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <DateFilterType 
        value={dateFilterType}
        onChange={onDateFilterTypeChange}
      />

      <BusinessUnitFilter 
        businessUnits={businessUnits}
        onToggle={onBusinessUnitToggle}
      />

      <Button 
        variant="contained" 
        onClick={onLoadData} 
        disabled={isLoading} 
        size="medium"
        fullWidth
        sx={{ 
          bgcolor: '#2F6FB2',
          color: 'white',
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          py: 1.5,
          borderRadius: '12px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: '#1F4E8C',
            boxShadow: '0 2px 4px rgba(47, 111, 178, 0.2)'
          },
          '&:active': {
            transform: 'scale(0.98)',
            transition: 'all 0.1s ease'
          },
          '&:disabled': {
            bgcolor: '#F5F5F5',
            color: '#BDBDBD',
            transform: 'none',
            boxShadow: 'none'
          }
        }}
      >
        {isLoading ? 'Memuat...' : 'Muat Data'}
      </Button>

      <DataTypeFilter 
        dataType={dataType}
        onChange={onDataTypeChange}
      />
    </Card>
  );
}

export default FilterSection;

