import React from 'react';
import { Box, Typography, Card, Skeleton } from '@mui/material';

function formatCurrency(num) {
  const value = parseFloat(num);
  if (isNaN(value)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function YearCards({ availableYears, selectedYears, yearTotals, onToggleYear, isLoading = false }) {
  return (
    <Box sx={{ 
      width: '100%',
      display: 'grid',
      gridTemplateColumns: { 
        xs: 'repeat(2, 1fr)', 
        sm: 'repeat(3, 1fr)', 
        md: 'repeat(4, 1fr)', 
        lg: 'repeat(5, 1fr)' 
      },
      gap: { xs: 1.5, md: 2 },
      alignItems: 'start'
    }}>
      {isLoading ? (
        // Loading skeleton
        availableYears.map(year => (
          <Card 
            key={year}
            sx={{ 
              p: { xs: 1.75, md: 2 },
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e0e0e0',
              bgcolor: 'white',
              position: 'relative',
              overflow: 'hidden',
              height: 'fit-content'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1.25,
              width: '100%'
            }}>
              {/* Tahun - Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 0.5
              }}>
                <Skeleton variant="text" width={60} height={24} />
                <Box sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: '#f5f5f5',
                  flexShrink: 0
                }} />
              </Box>
              
              {/* Sales Amount */}
              <Box>
                <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.75 }} />
                <Skeleton variant="text" width="100%" height={20} />
              </Box>
              
              {/* Quantity */}
              <Box sx={{ 
                pt: 1.25,
                borderTop: '1px solid #f5f5f5',
                mt: 0.5
              }}>
                <Skeleton variant="text" width={100} height={18} />
              </Box>
            </Box>
          </Card>
        ))
      ) : (
        // Actual cards
        availableYears.map(year => {
          const isSelected = selectedYears.includes(year);
          const yearData = yearTotals[year] || { sales: 0, quantity: 0 };
          return (
            <Card 
              key={year}
              onClick={() => onToggleYear(year)}
              sx={{ 
                p: { xs: 1.75, md: 2 },
                borderRadius: 2,
                boxShadow: isSelected 
                  ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
                  : '0 1px 3px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${isSelected ? '#212121' : '#e0e0e0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: 'white',
                position: 'relative',
                overflow: 'hidden',
                height: 'fit-content',
                '&::before': isSelected ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: '#212121'
                } : {},
                '&:hover': {
                  borderColor: isSelected ? '#212121' : '#bdbdbd',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1.25,
                width: '100%'
              }}>
                {/* Tahun - Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 0.5
                }}>
                  <Typography sx={{ 
                    fontSize: { xs: '0.9375rem', md: '1rem' }, 
                    color: '#212121', 
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3
                  }}>
                    {year}
                  </Typography>
                  {isSelected && (
                    <Box sx={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      bgcolor: '#212121',
                      flexShrink: 0,
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px #212121'
                    }} />
                  )}
                </Box>
                
                {/* Sales Amount */}
                <Box>
                  <Typography sx={{ 
                    fontSize: '0.6875rem', 
                    color: '#757575',
                    fontWeight: 500,
                    mb: 0.75,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: 1.2
                  }}>
                    Total Penjualan
                  </Typography>
                  <Typography sx={{ 
                    fontSize: { xs: '0.8125rem', md: '0.875rem' }, 
                    fontWeight: 600, 
                    color: '#212121',
                    lineHeight: 1.4,
                    wordBreak: 'break-word'
                  }}>
                    {formatCurrency(yearData.sales)}
                  </Typography>
                </Box>
                
                {/* Quantity */}
                <Box sx={{ 
                  pt: 1.25,
                  borderTop: '1px solid #f5f5f5',
                  mt: 0.5
                }}>
                  <Typography sx={{ 
                    fontSize: '0.75rem', 
                    color: '#9e9e9e',
                    lineHeight: 1.5
                  }}>
                    <Box component="span" sx={{ fontWeight: 600, color: '#616161' }}>
                      {yearData.quantity.toLocaleString('id-ID')}
                    </Box>
                    {' '}Qty
                  </Typography>
                </Box>
              </Box>
            </Card>
          );
        })
      )}
    </Box>
  );
}

export default YearCards;

