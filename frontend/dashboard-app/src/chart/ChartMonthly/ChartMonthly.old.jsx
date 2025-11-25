import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  Box, 
  Typography, 
  Card,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  TextField
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  useChartData,
  getFilteredData,
  useChartConfig
} from './chartHelpers';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { MonthRangePicker } from './MonthRangePicker';
import { getAvailableYears } from './chartHelpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BusinessUnitFilter = ({ businessUnits, onToggle }) => {
  const isGosaveSelected = businessUnits.includes('Gosave');
  const isGotoSelected = businessUnits.includes('Goto');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
      <Typography sx={{ 
        fontWeight: 500, 
        fontSize: { xs: '0.6875rem', sm: '0.6875rem', md: '0.75rem' }, 
        whiteSpace: 'nowrap', 
        color: '#757575',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        letterSpacing: '0.01em',
        lineHeight: 1.4
      }}>
        Business Unit
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant={isGosaveSelected ? 'contained' : 'outlined'}
          onClick={() => onToggle('Gosave')}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: isGosaveSelected ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            bgcolor: isGosaveSelected ? '#6BA3D0' : 'transparent',
            color: isGosaveSelected ? 'white' : '#757575',
            border: isGosaveSelected ? 'none' : '1px solid #E5E5E5',
            borderRadius: '10px',
            py: 0.625,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isGosaveSelected ? '#5A9FD0' : '#FAFAFA',
              border: isGosaveSelected ? 'none' : '1px solid #E0E0E0',
              boxShadow: 'none'
            },
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'all 0.1s ease'
            }
          }}
        >
          Gosave
        </Button>
        <Button
          variant={isGotoSelected ? 'contained' : 'outlined'}
          onClick={() => onToggle('Goto')}
          size="medium"
          fullWidth
          sx={{ 
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: isGotoSelected ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            bgcolor: isGotoSelected ? '#6BA3D0' : 'transparent',
            color: isGotoSelected ? 'white' : '#757575',
            border: isGotoSelected ? 'none' : '1px solid #E5E5E5',
            borderRadius: '10px',
            py: 0.625,
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isGotoSelected ? '#5A9FD0' : '#FAFAFA',
              border: isGotoSelected ? 'none' : '1px solid #E0E0E0',
              boxShadow: 'none'
            },
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'all 0.1s ease'
            }
          }}
        >
          Goto
        </Button>
      </Box>
    </Box>
  );
};

const FilterSection = ({
  businessUnits,
  onBusinessUnitToggle,
  accountHeader,
  onAccountHeaderChange,
  onLoadData,
  onRefreshData,
  isLoading
}) => {
  return (
    <Card sx={{ 
      bgcolor: '#FFFFFF', 
      borderRadius: '10px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
      border: '1px solid #E5E7EB',
      p: { xs: 1.25, sm: 1.5, md: 1.75, lg: 1.75 },
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 1, sm: 1.25, md: 1.25 },
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
          fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.8125rem' }, 
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
              color: '#6BA3D0',
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
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Typography sx={{ 
          fontWeight: 500, 
          fontSize: { xs: '0.6875rem', sm: '0.6875rem', md: '0.75rem' }, 
          whiteSpace: 'nowrap', 
          color: '#757575',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          letterSpacing: '0.01em',
          lineHeight: 1.4
        }}>
          Account
        </Typography>
        <TextField
          value={accountHeader}
          onChange={(e) => onAccountHeaderChange(e.target.value)}
          placeholder="4000.01.00"
          size="small"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '& fieldset': {
                borderColor: '#E5E5E5',
              },
              '&:hover fieldset': {
                borderColor: '#D1D5DB',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6BA3D0',
                borderWidth: '1px',
              },
            },
            '& .MuiInputBase-input': {
              py: 1,
            }
          }}
        />
      </Box>

      <BusinessUnitFilter 
        businessUnits={businessUnits}
        onToggle={onBusinessUnitToggle}
      />

      <Button 
        variant="contained" 
        onClick={onLoadData} 
        disabled={isLoading} 
        size="small"
        fullWidth
        sx={{ 
          mt: 'auto',
          bgcolor: '#6BA3D0',
          color: 'white',
          textTransform: 'none',
          fontSize: { xs: '0.6875rem', sm: '0.6875rem', md: '0.75rem' },
          fontWeight: 500,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          py: { xs: 0.875, sm: 0.875, md: 1 },
          borderRadius: '8px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: '#5A9FD0',
            boxShadow: '0 2px 4px rgba(107, 163, 208, 0.2)'
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
    </Card>
  );
};

const LegendToggles = ({ showCredit, showDebit, showTotal, onToggleCredit, onToggleDebit, onToggleTotal }) => {
  return (
        <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1.25, sm: 1.5 }, 
      mb: { xs: 1.25, sm: 1.5 },
      flexWrap: 'wrap'
    }}>
      <Box
        onClick={onToggleCredit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          opacity: showCredit ? 1 : 0.5,
          '&:hover': {
            bgcolor: '#FAFAFA'
          }
        }}
      >
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '4px',
            bgcolor: showCredit ? 'rgba(75, 192, 192, 0.75)' : '#E0E0E0',
            border: `1px solid ${showCredit ? 'rgb(75, 192, 192)' : '#BDBDBD'}`
          }}
        />
        <Typography sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.8125rem' },
          color: showCredit ? '#212121' : '#9E9E9E',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }}>
          Credit
        </Typography>
      </Box>
      
      <Box
        onClick={onToggleDebit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          opacity: showDebit ? 1 : 0.5,
          '&:hover': {
            bgcolor: '#FAFAFA'
          }
        }}
      >
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '4px',
            bgcolor: showDebit ? 'rgba(255, 99, 132, 0.75)' : '#E0E0E0',
            border: `1px solid ${showDebit ? 'rgb(255, 99, 132)' : '#BDBDBD'}`
          }}
        />
        <Typography sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.8125rem' },
          color: showDebit ? '#212121' : '#9E9E9E',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }}>
          Debit
        </Typography>
      </Box>
      
      <Box
        onClick={onToggleTotal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          opacity: showTotal ? 1 : 0.5,
          '&:hover': {
            bgcolor: '#FAFAFA'
          }
        }}
      >
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            bgcolor: showTotal ? 'transparent' : '#E0E0E0',
            border: `2.5px solid ${showTotal ? 'rgb(16, 185, 129)' : '#BDBDBD'}`
          }}
        />
        <Typography sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.8125rem' },
          color: showTotal ? '#212121' : '#9E9E9E',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }}>
          Total (Credit - Debit)
        </Typography>
      </Box>
    </Box>
  );
};

const SummaryCardCompact = ({ 
  businessUnits, 
  invoiceData, 
  rangeMonths = [],
  onAddRange,
  onRemoveRange,
  availableYears = []
}) => {
  const getBusinessUnitText = () => {
    if (businessUnits && businessUnits.length > 0) {
      return businessUnits.join(', ');
    }
    return 'Belum dipilih';
  };

  const getDataStatus = () => {
    if (invoiceData && invoiceData.length > 0) {
      return 'Dimuat';
    }
    return 'Belum dimuat';
  };

  const getRangeMonthText = () => {
    if (rangeMonths && rangeMonths.length > 0) {
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return rangeMonths.map(range => {
        const startMonth = monthNames[parseInt(range.start) - 1] || range.start;
        const endMonth = monthNames[parseInt(range.end) - 1] || range.end;
        return `${startMonth} - ${endMonth} ${range.year}`;
      }).join(', ');
    }
    return 'Belum dipilih';
  };

  const summaryItems = [
    {
      label: 'BUSINESS UNIT',
      value: getBusinessUnitText(),
      icon: <BusinessIcon sx={{ fontSize: '0.75rem' }} />,
      hasData: businessUnits && businessUnits.length > 0
    },
    {
      label: 'RANGE BULAN',
      value: getRangeMonthText(),
      icon: <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} />,
      hasData: rangeMonths && rangeMonths.length > 0
    },
    {
      label: 'STATUS DATA',
      value: getDataStatus(),
      icon: <CheckCircleIcon sx={{ fontSize: '0.75rem' }} />,
      color: invoiceData && invoiceData.length > 0 ? '#4caf50' : '#ff9800',
      hasData: invoiceData && invoiceData.length > 0,
      isStatus: true
    }
  ];

  return (
      <Card sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E5E7EB',
        p: { xs: 1, sm: 1.25, md: 1.5, lg: 1.5 },
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
          borderColor: '#D1D5DB'
        }
      }}>
      <Typography sx={{
        fontSize: { xs: '0.6875rem', sm: '0.6875rem', md: '0.75rem' },
        fontWeight: 600,
        color: '#212121',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
        mb: { xs: 0.875, sm: 1 }
      }}>
        Ringkasan Data
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 0.625, md: 0.875 }
      }}>
        {summaryItems.map((item, index) => (
          <Card
            key={index}
            sx={{
              bgcolor: '#FAFAFA',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              border: '1px solid #E5E7EB',
              p: { xs: 0.875, md: 1 },
              display: 'flex',
              flexDirection: 'column',
              gap: 0.4,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.25
            }}>
              <Typography sx={{
                fontSize: '0.5625rem',
                color: '#757575',
                fontWeight: 500,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.4
              }}>
                <Box sx={{
                  color: '#9E9E9E',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.625rem'
                }}>
                  {item.icon}
                </Box>
                {item.label}
              </Typography>
            </Box>
            <Typography sx={{
              fontSize: { xs: '0.6875rem', md: '0.75rem' },
              fontWeight: 600,
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              lineHeight: 1.3,
              wordBreak: 'break-word',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              {item.isStatus && (
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: item.hasData ? '#6BA3D0' : '#BDBDBD',
                    flexShrink: 0
                  }}
                />
              )}
              {item.value}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* Month Range Picker */}
      <Box sx={{ 
        mt: 1,
        pt: 1,
        borderTop: '1px solid #F1F5F9'
      }}>
        <MonthRangePicker
          rangeMonths={rangeMonths}
          onAddRange={onAddRange}
          onRemoveRange={onRemoveRange}
          availableYears={availableYears}
          monthlyData={invoiceData}
        />
      </Box>
    </Card>
  );
};

function ChartMonthly() {
  const [showCredit, setShowCredit] = useState(true);
  const [showDebit, setShowDebit] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [rangeMonths, setRangeMonths] = useState([]);

  const {
    accountHeader,
    setAccountHeader,
    startDate,
    endDate,
    selectedBusinessUnits,
    setSelectedBusinessUnits,
    allData,
    loading,
    loadRevenue
  } = useChartData('4000.01.00', '2024-01-01', '2025-12-31');

  const businessUnits = Array.from(selectedBusinessUnits);
  const availableYears = getAvailableYears();

  const handleAddRange = (range) => {
    setRangeMonths([...rangeMonths, range]);
  };

  const handleRemoveRange = (rangeToRemove) => {
    setRangeMonths(rangeMonths.filter(range => 
      !(range.start === rangeToRemove.start && 
        range.end === rangeToRemove.end && 
        range.year === rangeToRemove.year)
    ));
  };

  const filteredData = getFilteredData(allData, new Set());

  const { chartData, chartOptions } = useChartConfig(
    filteredData,
    showCredit,
    showDebit,
    showTotal
  );

  const toggleBusinessUnit = (unit) => {
    const newSet = new Set(selectedBusinessUnits);
    if (newSet.has(unit)) {
      newSet.delete(unit);
    } else {
      newSet.add(unit);
    }
    setSelectedBusinessUnits(newSet);
  };

  const handleRefreshData = async () => {
    await loadRevenue();
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: { xs: '100%', sm: '100%', md: '1200px', lg: '1400px', xl: '1600px' },
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)',
      pt: { xs: 1.5, sm: 2, md: 2.25, lg: 2.25 },
      px: { xs: 1.5, sm: 2, md: 2.25, lg: 2.25 },
      pb: { xs: 1.5, sm: 2, md: 2.25, lg: 2.25 },
      gap: { xs: 1.5, sm: 2, md: 2.25, lg: 2.25 },
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto',
      boxSizing: 'border-box',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(107, 163, 208, 0.03) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }
    }}>
      {/* Baris Atas: Filter Section dan SummaryCard */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 1.25, sm: 1.75, md: 1.75, lg: 1.75 },
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Filter Section di Kiri */}
        <Box sx={{
          width: { xs: '100%', lg: 220 },
          minWidth: { xs: '100%', lg: 220 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <FilterSection
            businessUnits={businessUnits}
            onBusinessUnitToggle={toggleBusinessUnit}
            accountHeader={accountHeader}
            onAccountHeaderChange={setAccountHeader}
            onLoadData={loadRevenue}
            onRefreshData={handleRefreshData}
            isLoading={loading}
          />
        </Box>

        {/* SummaryCard Compact */}
        <Box sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <SummaryCardCompact
            businessUnits={businessUnits}
            invoiceData={allData.data || []}
            rangeMonths={rangeMonths}
            onAddRange={handleAddRange}
            onRemoveRange={handleRemoveRange}
            availableYears={availableYears}
          />
        </Box>
      </Box>

      {/* Card Chart di Bawah */}
      <Card sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          border: '1px solid #E5E7EB',
          p: { xs: 1.5, sm: 2, md: 2.25, lg: 2.25 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 280, sm: 320, md: 360 },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 1,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
            borderColor: '#D1D5DB',
            transform: 'translateY(-1px)'
          }
        }}>
        <Box sx={{
          mb: { xs: 1.5, sm: 2, md: 2 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: { xs: 1.25, sm: 1.75 }
        }}>
          <Typography sx={{
            fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem' },
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}>
            Monthly Revenue
          </Typography>
        </Box>

        <LegendToggles
          showCredit={showCredit}
          showDebit={showDebit}
          showTotal={showTotal}
          onToggleCredit={() => setShowCredit(!showCredit)}
          onToggleDebit={() => setShowDebit(!showDebit)}
          onToggleTotal={() => setShowTotal(!showTotal)}
        />

        <Box sx={{
          width: '100%',
          flex: 1,
          position: 'relative',
          minHeight: { xs: 230, sm: 280, md: 320 }
        }}>
          {allData.data && allData.data.length > 0 ? (
            <Bar 
              data={chartData} 
              options={chartOptions}
              style={{
                opacity: loading ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: loading ? 'none' : 'auto'
              }}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: '#9E9E9E',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
            }}>
              Klik "Muat Data" untuk memuat chart
            </Box>
          )}
          {loading && (
            <Fade in={loading}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                zIndex: 10,
                borderRadius: 2,
                backdropFilter: 'blur(4px)'
              }}>
                <CircularProgress 
                  size={40} 
                  thickness={3.5}
                  sx={{
                    color: '#6BA3D0',
                    mb: 1.5,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }}
                />
                <Typography sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#757575',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  letterSpacing: '-0.01em'
                }}>
                  Memuat data...
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      </Card>
    </Box>
  );
}

export default ChartMonthly;

