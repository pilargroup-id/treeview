import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Badge, GlobalStyles } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function SummaryCard({ businessUnits, selectedYears, dateFilterType, invoiceData }) {
  // label tipe filter
  const getFilterTypeLabel = (type) => {
    const labels = {
      'year': 'Per Tahun (Bulanan)',
      'range': 'Range Tanggal',
      'specific': 'Tanggal Tertentu'
    };
    return labels[type] || 'Belum dipilih';
  };

  // Status data
  const getDataStatus = () => {
    if (invoiceData && invoiceData.length > 0) {
      return 'Dimuat';
    }
    return 'Belum dimuat';
  };

  // Filter business unit 
  const getBusinessUnitText = () => {
    if (businessUnits && businessUnits.length > 0) {
      return businessUnits.join(', ');
    }
    return 'Belum dipilih';
  };

  // Tahun yang pilih
  const getSelectedYearText = () => {
    if (selectedYears && selectedYears.length > 0) {
      return selectedYears.sort((a, b) => b - a).join(', ');
    }
    return 'Belum dipilih';
  };

  // Hook 
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const summaryItems = [
    {
      label: 'BUSINESS UNIT',
      value: getBusinessUnitText(),
      icon: <BusinessIcon />,
      color: '#1976d2',
      hasData: businessUnits && businessUnits.length > 0
    },
    {
      label: 'TAHUN TERPILIH',
      value: getSelectedYearText(),
      icon: <CalendarMonthIcon />,
      color: '#42a5f5',
      hasData: selectedYears && selectedYears.length > 0
    },
    {
      label: 'STATUS DATA',
      value: getDataStatus(),
      icon: <CheckCircleIcon />,
      color: invoiceData && invoiceData.length > 0 ? '#4caf50' : '#ff9800',
      hasData: invoiceData && invoiceData.length > 0,
      isStatus: true
    },
    {
      label: 'TIPE FILTER',
      value: getFilterTypeLabel(dateFilterType),
      icon: <FilterListIcon />,
      color: '#64b5f6',
      hasData: true
    }
  ];

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(10px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      />
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: '#F8FAFC',
        borderRadius: 1.5,
        p: { xs: 2, md: 2.5 },
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}>
        <Typography sx={{ 
          fontSize: { xs: '0.9375rem', md: '1rem' }, 
          fontWeight: 600, 
          color: '#0F172A',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
          mb: 0.5
        }}>
          Ringkasan Data
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: 'repeat(2, 1fr)', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(4, 1fr)' 
          },
          gap: { xs: 1.25, md: 1.5 }
        }}>
          {summaryItems.map((item, index) => (
            <Card 
              key={index}
              sx={{ 
                bgcolor: '#FFFFFF', 
                borderRadius: 1, 
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E2E8F0',
                p: { xs: 1.5, md: 1.75 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                animation: isVisible ? `fadeInUp 0.3s ease-out ${index * 0.05}s both` : 'none',
                '&:hover': {
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                  borderColor: '#CBD5E1',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 0.5
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#64748B',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    transition: 'transform 0.2s ease'
                  }}>
                    {item.icon}
                  </Box>
                  {item.label}
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#0F172A',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}>
                {item.isStatus && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: item.hasData ? '#10B981' : '#F59E0B',
                      flexShrink: 0
                    }}
                  />
                )}
                {item.value}
              </Typography>
            </Card>
          ))}
        </Box>

      {/* Pesan instruksi */}
      {/* <Typography sx={{ 
        fontSize: '0.75rem', 
        color: '#9e9e9e',
        lineHeight: 1.5,
        mt: 0.5
      }}>
        Pilih <Box component="span" sx={{ fontWeight: 500, color: '#757575' }}>Tipe Filter</Box> di panel kiri untuk menampilkan opsi filter tambahan seperti Range Tanggal atau Tanggal Tertentu. Klik <Box component="span" sx={{ fontWeight: 500, color: '#757575' }}>Muat Data</Box> setelah memilih filter untuk melihat grafik.
      </Typography> */}
      </Box>
    </>
  );
}

export default SummaryCard;


