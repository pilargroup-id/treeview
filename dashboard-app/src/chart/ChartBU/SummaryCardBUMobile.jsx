import React, { useMemo } from 'react';
import { Box, Typography, Card, Button } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import RevenueLastUpdate from '../../components/RevenueLastUpdate';

function SummaryCardBUMobile({
  filterType = 'monthly',
  filterTypeLabel = 'Monthly',
  dateRangeLabel = 'Belum dipilih',
  businessUnits = [],
  invoiceData = [],
  onClearRangeData,
  onOpenFilter,
  onLoadData,
  isLoading = false
}) {
  const hasLoadedData = invoiceData.length > 0;
  const canClearRangeData = (
    (filterType === 'range' || filterType === 'multi_range') &&
    dateRangeLabel !== 'Belum dipilih' &&
    typeof onClearRangeData === 'function'
  );

  const rangeChipValues = useMemo(() => {
    const normalizedLabel = String(dateRangeLabel || '').trim();
    if (!normalizedLabel || normalizedLabel === 'Belum dipilih') {
      return ['Belum dipilih'];
    }

    if (filterType === 'monthly') {
      const yearMatches = normalizedLabel.match(/\b\d{4}\b/g) || [];
      const uniqueYears = Array.from(new Set(yearMatches));
      return uniqueYears.length > 0 ? uniqueYears : [normalizedLabel];
    }

    if (filterType !== 'multi_range') {
      return [normalizedLabel];
    }

    const parsedRanges = normalizedLabel
      .split(',')
      .map((label) => label.trim().replace(/^R\d+\s*:\s*/i, ''))
      .filter(Boolean);

    return parsedRanges.length > 0 ? parsedRanges : ['Belum dipilih'];
  }, [dateRangeLabel, filterType]);

  const businessUnitValues = businessUnits.length > 0 ? businessUnits : ['Belum dipilih'];
  const canOpenFilter = typeof onOpenFilter === 'function';
  const canLoadData = typeof onLoadData === 'function';

  const summaryItems = [
    {
      id: 'filter_type',
      label: 'TIPE FILTER',
      values: [filterTypeLabel || 'Belum dipilih'],
      icon: <FilterListIcon sx={{ fontSize: '0.75rem' }} />
    },
    {
      id: 'range_data',
      label: filterType === 'monthly' ? 'TAHUN' : 'RANGE DATA',
      values: rangeChipValues,
      icon: <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} />
    },
    {
      id: 'business_unit',
      label: 'BUSINESS UNIT',
      values: businessUnitValues,
      icon: <BusinessIcon sx={{ fontSize: '0.75rem' }} />
    },
    {
      id: 'status_data',
      label: 'STATUS DATA',
      values: [hasLoadedData ? 'Dimuat' : 'Belum dimuat'],
      icon: <CheckCircleIcon sx={{ fontSize: '0.75rem' }} />,
      hasData: hasLoadedData
    }
  ];

  const getDisplayValues = (itemId, values = []) => {
    const normalizedValues = values
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    if (normalizedValues.length === 0) {
      return ['Belum dipilih'];
    }

    if (itemId === 'range_data' && filterType !== 'monthly') {
      return normalizedValues;
    }

    return [normalizedValues.join(', ')];
  };

  return (
    <Card
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.58)',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E5E7EB',
        p: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          width: '100%',
          flexWrap: 'wrap'
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            mb: 0,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}
        >
          Ringkasan Data
        </Typography>
        <RevenueLastUpdate
          sx={{
            maxWidth: '100%',
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {canOpenFilter ? (
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenFilter}
              startIcon={<FilterListIcon sx={{ fontSize: '0.875rem' }} />}
              sx={{
                minHeight: 30,
                minWidth: 0,
                px: 1.1,
                borderRadius: '9px',
                borderColor: '#CBD5E1',
                color: '#334155',
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                lineHeight: 1,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                '&:hover': {
                  borderColor: '#94A3B8',
                  bgcolor: 'rgba(148, 163, 184, 0.08)'
                },
                '& .MuiButton-startIcon': {
                  mr: 0.5
                }
              }}
            >
              Filter
            </Button>
          ) : null}
          {canLoadData ? (
            <Button
              size="small"
              variant="contained"
              onClick={onLoadData}
              disabled={isLoading}
              sx={{
                minHeight: 30,
                minWidth: 0,
                px: 1.15,
                borderRadius: '9px',
                bgcolor: '#2F6FB2',
                color: '#FFFFFF',
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                lineHeight: 1,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#1F4E8C',
                  boxShadow: '0 2px 4px rgba(47, 111, 178, 0.2)'
                },
                '&:disabled': {
                  bgcolor: '#F5F5F5',
                  color: '#BDBDBD',
                  boxShadow: 'none'
                }
              }}
            >
              {isLoading ? 'Memuat...' : 'Muat Data'}
            </Button>
          ) : null}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1
        }}
      >
        {summaryItems.map((item) => (
          <Box
            key={item.id}
            sx={{
              bgcolor: '#FBFDFF',
              borderRadius: '12px',
              border: '1px solid #E3ECF5',
              p: 1.25,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.9,
              minHeight: 122
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                width: '100%'
              }}
            >
              <Box sx={{ color: '#607489', display: 'flex', alignItems: 'center' }}>{item.icon}</Box>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  color: '#4C6179',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                }}
              >
                {item.label}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45 }}>
              {getDisplayValues(item.id, item.values).map((value, valueIndex, valuesArray) => {
                const isStatus = item.id === 'status_data';
                const showIndex = !isStatus && valuesArray.length > 1;
                const textColor = value === 'Belum dipilih'
                  ? '#64748B'
                  : isStatus
                    ? (item.hasData ? '#166534' : '#475569')
                    : '#1E293B';

                return (
                  <Typography
                    key={`${item.id}-${valueIndex}`}
                    sx={{
                      minHeight: 22,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.55,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      lineHeight: 1.35,
                      color: textColor,
                      wordBreak: 'break-word',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                    }}
                  >
                    {isStatus ? (
                      <Box
                        component="span"
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: item.hasData ? '#16A34A' : '#94A3B8',
                          flexShrink: 0
                        }}
                      />
                    ) : null}
                    {showIndex ? `${valueIndex + 1}. ` : ''}
                    {value}
                  </Typography>
                );
              })}
            </Box>

            {item.id === 'range_data' && canClearRangeData ? (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 0.2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={onClearRangeData}
                  sx={{
                    minHeight: 24,
                    minWidth: 0,
                    px: 0,
                    py: 0,
                    textTransform: 'none',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    color: '#4F8FC2',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: '#2F74AB'
                    }
                  }}
                >
                  Hapus Range
                </Button>
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    </Card>
  );
}

export default React.memo(SummaryCardBUMobile);
