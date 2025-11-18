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
      borderRadius: 1.5, 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E2E8F0',
      p: { xs: 2, md: 2.5 },
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      height: '100%',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
        borderColor: '#CBD5E1'
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
          color: '#0F172A',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
            color: '#64748B',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#3B82F6',
              bgcolor: '#F1F5F9',
              transform: 'rotate(180deg)'
            },
            '&:disabled': {
              color: '#CBD5E1'
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
          bgcolor: '#3B82F6',
          color: 'white',
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          py: 1.25,
          borderRadius: 1,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: '#2563EB',
            boxShadow: '0 1px 3px rgba(59, 130, 246, 0.2)',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)',
            transition: 'all 0.1s ease'
          },
          '&:disabled': {
            bgcolor: '#E2E8F0',
            color: '#94A3B8',
            transform: 'none',
            boxShadow: 'none'
          }
        }}
      >
        {isLoading ? 'Memuat...' : 'Muat Data'}
      </Button>
    </Card>
  );
}

export default FilterSection;

