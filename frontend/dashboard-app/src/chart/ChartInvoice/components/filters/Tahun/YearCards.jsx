import React from 'react';
import { Box, Typography, Card, Skeleton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

function calculatePercentageChange(currentYear, yearTotals, availableYears) {
  const currentData = yearTotals[currentYear] || { sales: 0 };
  const currentIndex = availableYears.indexOf(currentYear);
  
  if (currentIndex === -1 || currentIndex === availableYears.length - 1) {
    return null; 
  }
  
  const previousYearValue = availableYears[currentIndex + 1];
  const previousData = yearTotals[previousYearValue] || { sales: 0 };
  
  if (!previousData.sales || previousData.sales === 0) {
    return null; // Tidak ada data tahun sebelumnya
  }
  
  const change = ((currentData.sales - previousData.sales) / previousData.sales) * 100;
  return change;
}

function YearCards({ availableYears, selectedYears, yearTotals, onToggleYear, isLoading = false, dateFilterType = 'year' }) {
  const isDisabled = dateFilterType === 'range' || dateFilterType === 'specific';
  
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
      gap: { xs: 2, md: 2.5 },
      alignItems: 'start',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
    }}>
      {isLoading ? (
        // Loading 
        availableYears.map(year => (
          <Card 
            key={year}
            sx={{ 
              p: { xs: 2, md: 2.5 },
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #E5E5E5',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              height: 'fit-content',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1,
              width: '100%'
            }}>
              {/* Tahun - Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 0.5
              }}>
                <Skeleton variant="text" width={60} height={22} />
                <Skeleton variant="text" width={50} height={16} />
              </Box>
              
              {/* Sales Amount */}
              <Box>
                <Skeleton variant="text" width={80} height={14} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="100%" height={18} />
              </Box>
              
              {/* Quantity */}
              <Box sx={{ 
                pt: 1,
                borderTop: '1px solid #F1F5F9',
                mt: 0.5
              }}>
                <Skeleton variant="text" width={100} height={16} />
              </Box>
            </Box>
          </Card>
        ))
      ) : (
        availableYears.map(year => {
          const isSelected = selectedYears.includes(year);
          const yearData = yearTotals[year] || { sales: 0, quantity: 0, order: 0 };
          return (
            <Card 
              key={year}
              onClick={() => !isDisabled && onToggleYear && onToggleYear(year)}
              sx={{ 
                p: { xs: 2.5, md: 3 },
                borderRadius: '16px',
                boxShadow: isSelected 
                  ? '0 4px 12px rgba(107, 163, 208, 0.15), 0 2px 4px rgba(107, 163, 208, 0.1)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${isSelected ? '#6BA3D0' : '#E5E7EB'}`,
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: isSelected ? '#F5F8FB' : '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                height: 'fit-content',
                opacity: isDisabled ? 0.6 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                zIndex: 1,
                '&:hover': !isDisabled ? {
                  borderColor: isSelected ? '#6BA3D0' : '#D1D5DB',
                  boxShadow: isSelected 
                    ? '0 6px 16px rgba(107, 163, 208, 0.2), 0 2px 6px rgba(107, 163, 208, 0.15)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
                  bgcolor: isSelected ? '#F5F8FB' : '#FAFAFA',
                  transform: 'translateY(-2px)'
                } : {},
                '&:active': !isDisabled ? {
                  transform: 'scale(0.98)',
                  transition: 'all 0.1s ease'
                } : {}
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1,
                width: '100%',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Tahun - Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 0.5
                }}>
                  <Typography sx={{ 
                    fontSize: { xs: '1.25rem', md: '1.5rem' }, 
                    color: isSelected ? '#6BA3D0' : '#212121', 
                    fontWeight: 600,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    transition: 'color 0.2s ease'
                  }}>
                    {year}
                  </Typography>
                  {/* Order - Pojok Kanan Atas */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 0.25,
                    flexShrink: 0
                  }}>
                    <Typography sx={{
                      fontSize: { xs: '0.6875rem', md: '0.75rem' },
                      fontWeight: 600,
                      color: isSelected ? '#6BA3D0' : '#9CA3AF',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                      lineHeight: 1.2,
                      transition: 'color 0.2s ease',
                      letterSpacing: '-0.01em'
                    }}>
                      {yearData.order.toLocaleString('id-ID')}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.625rem',
                      fontWeight: 500,
                      color: '#9E9E9E',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                      lineHeight: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'color 0.2s ease'
                    }}>
                      Order
                    </Typography>
                  </Box>
                </Box>
                
                {/* Sales Amount */}
                <Box>
                  <Typography sx={{ 
                    fontSize: '0.6875rem', 
                    color: '#757575',
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                    transition: 'color 0.2s ease'
                  }}>
                    Total Penjualan
                  </Typography>
                  <Typography sx={{ 
                    fontSize: { xs: '1.125rem', md: '1.25rem' }, 
                    fontWeight: 600, 
                    color: '#212121',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    transition: 'color 0.2s ease',
                    letterSpacing: '-0.01em'
                  }}>
                    {formatCurrency(yearData.sales)}
                  </Typography>
                </Box>
                
                {/* Quantity */}
                <Box sx={{ 
                  pt: 1.5,
                  borderTop: '1px solid #F5F5F5',
                  mt: 1,
                  transition: 'border-color 0.2s ease',
                  position: 'relative'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                  }}>
                    <Typography sx={{ 
                      fontSize: '0.6875rem', 
                      color: '#9E9E9E',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                      lineHeight: 1.5,
                      transition: 'color 0.2s ease',
                      flex: 1
                    }}>
                      <Box component="span" sx={{ 
                        fontWeight: 500, 
                        color: '#757575',
                        transition: 'color 0.2s ease'
                      }}>
                        {yearData.quantity.toLocaleString('id-ID')}
                      </Box>
                      {' '}Qty
                    </Typography>
                    {(() => {
                      const percentageChange = calculatePercentageChange(year, yearTotals, availableYears);
                      if (percentageChange === null || percentageChange === undefined) {
                        return null;
                      }
                      const isPositive = percentageChange > 0;
                      const isNegative = percentageChange < 0;
                      const absPercentage = Math.abs(percentageChange);
                      
                      return (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.25,
                          flexShrink: 0
                        }}>
                          {isPositive ? (
                            <ArrowUpwardIcon sx={{ 
                              fontSize: '1,5rem', 
                              color: '#10B981',
                              lineHeight: 1
                            }} />
                          ) : isNegative ? (
                            <ArrowDownwardIcon sx={{ 
                              fontSize: '1,5rem', 
                              color: '#EF4444',
                              lineHeight: 1
                            }} />
                          ) : null}
                          <Typography sx={{
                            fontSize: '1drem',
                            fontWeight: 600,
                            color: isPositive ? '#10B981' : isNegative ? '#EF4444' : '#64748B',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                            lineHeight: 1,
                            whiteSpace: 'nowrap'
                          }}>
                            {absPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      );
                    })()}
                  </Box>
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

