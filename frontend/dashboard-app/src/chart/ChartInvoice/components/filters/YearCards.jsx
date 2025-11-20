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
  const isDisabled = dateFilterType === 'range';
  
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
      gap: { xs: 1.25, md: 1.5 },
      alignItems: 'start'
    }}>
      {isLoading ? (
        // Loading 
        availableYears.map(year => (
          <Card 
            key={year}
            sx={{ 
              p: { xs: 1.5, md: 1.75 },
              borderRadius: 1.5,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              height: 'fit-content'
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
                <Box sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#F1F5F9',
                  flexShrink: 0
                }} />
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
          const yearData = yearTotals[year] || { sales: 0, quantity: 0 };
          return (
            <Card 
              key={year}
              onClick={() => !isDisabled && onToggleYear && onToggleYear(year)}
              sx={{ 
                p: { xs: 1.5, md: 1.75 },
                borderRadius: 1.5,
                boxShadow: '0 5px 3px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
                height: 'fit-content',
                opacity: isDisabled ? 0.8 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                '&:hover': !isDisabled ? {
                  borderColor: isSelected ? '#3B82F6' : '#CBD5E1',
                  boxShadow: isSelected 
                    ? '0 2px 6px rgba(59, 130, 246, 0.15)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-1px)',
                  bgcolor: isSelected ? '#EFF6FF' : '#F8FAFC'
                } : {},
                '&:active': !isDisabled ? {
                  transform: 'translateY(0)',
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
                    fontSize: { xs: '0.9375rem', md: '1rem' }, 
                    color: isSelected ? '#3B82F6' : '#0F172A', 
                    fontWeight: 600,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                    transition: 'color 0.2s ease'
                  }}>
                    {year}
                  </Typography>
                  <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '70%',
                      bgcolor: isSelected ? '#3B82F6' : '#E2E8F0',
                      flexShrink: 0,
                      transition: 'background-color 0.2s ease'
                    }} />
                </Box>
                
                {/* Sales Amount */}
                <Box>
                  <Typography sx={{ 
                    fontSize: '0.6875rem', 
                    color: '#64748B',
                    fontWeight: 500,
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    transition: 'color 0.2s ease'
                  }}>
                    Total Penjualan
                  </Typography>
                  <Typography sx={{ 
                    fontSize: { xs: '0.8125rem', md: '0.875rem' }, 
                    fontWeight: 600, 
                    color: '#0F172A',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    transition: 'color 0.2s ease'
                  }}>
                    {formatCurrency(yearData.sales)}
                  </Typography>
                </Box>
                
                {/* Quantity */}
                <Box sx={{ 
                  pt: 1,
                  borderTop: '1px solid #F1F5F9',
                  mt: 0.5,
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
                      fontSize: '0.75rem', 
                      color: '#94A3B8',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      lineHeight: 1.5,
                      transition: 'color 0.2s ease',
                      flex: 1
                    }}>
                      <Box component="span" sx={{ 
                        fontWeight: 600, 
                        color: '#475569',
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
                              fontSize: '0.875rem', 
                              color: '#10B981',
                              lineHeight: 1
                            }} />
                          ) : isNegative ? (
                            <ArrowDownwardIcon sx={{ 
                              fontSize: '0.875rem', 
                              color: '#EF4444',
                              lineHeight: 1
                            }} />
                          ) : null}
                          <Typography sx={{
                            fontSize: '0.6875rem',
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

