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
      bgcolor: 'white', 
      borderRadius: 2, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #e0e0e0',
      p: { xs: 2, md: 2.5 },
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      height: '100%',
      transition: 'box-shadow 0.2s ease'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 0
      }}>
        <Typography sx={{ 
          fontSize: { xs: '0.9375rem', md: '1.0625rem' }, 
          fontWeight: 600, 
          color: '#212121', 
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
            color: '#616161',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#212121',
              bgcolor: '#f5f5f5',
              transform: 'rotate(180deg)'
            },
            '&:disabled': {
              color: '#bdbdbd'
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

      <DataTypeFilter 
        dataType={dataType}
        onChange={onDataTypeChange}
      />

      <Button 
        variant="contained" 
        onClick={onLoadData} 
        disabled={isLoading} 
        size="medium"
        fullWidth
        sx={{ 
          mt: 'auto',
          bgcolor: '#212121',
          color: 'white',
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          py: 1.25,
          borderRadius: 1.5,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: '#424242',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          },
          '&:disabled': {
            bgcolor: '#e0e0e0',
            color: '#9e9e9e',
            transform: 'none'
          }
        }}
      >
        {isLoading ? 'Memuat...' : 'Muat Data'}
      </Button>
    </Card>
  );
}

export default FilterSection;

