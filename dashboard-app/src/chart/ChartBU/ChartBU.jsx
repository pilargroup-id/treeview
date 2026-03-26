import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsTooltip, ChartsTooltipContainer, useAxesTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import dayjs from 'dayjs';
import { 
  Box, 
  Typography, 
  Card,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Fade,
  IconButton,
  Snackbar,
  Alert,
  Drawer,
  useMediaQuery
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import {
  useChartData,
  getFilteredData,
  loadBusinessUnits,
  loadYearSummary,
  getAvailableYears,
  monthShortNames
} from './chartHelpers';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import YearsCardBU from './YearsCardBU';
import MobileRingkasanBU from '../../mobile/mobileComponents/revenue/revenueBU/MobileRingkasanBU';
import MobileYearsCardBU from '../../mobile/mobileComponents/revenue/revenueBU/MobileYearsCardBU';
import MobileChartBU from '../../mobile/mobileComponents/revenue/revenueBU/MobileChartBU';
import RangeDateFilter from '../ChartInvoice/components/filters/RangeTanggal/RangeDateFilter';
import SpecificDateFilter from '../ChartInvoice/components/filters/TanggalTertentu/SpecificDateFilter';
import RangeDateMobile from '../../mobile/templateMobile/RangeDateMobile';
import MultiRangeMobile from '../../mobile/templateMobile/MultiRangeMobile';
import BackgroundMobile from '../../mobile/BackgroundMobile';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './ErrorBoundary';
import { API_URL } from '../../config/api';
import { buildRangeChartModel } from './rangeChartModel';

// QueryClient 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      cacheTime: 10 * 60 * 1000, 
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const FINANCIAL_API_BASE_URL = `${String(API_URL ?? '').replace(/\/+$/, '')}/financial`;
const MONTHLY_REVENUE_URL = `${FINANCIAL_API_BASE_URL}/monthly-revenue`;
const INVOICE_SALES_URL = `${FINANCIAL_API_BASE_URL}/invoice-sales`;
const BUSINESS_UNITS_URL = `${FINANCIAL_API_BASE_URL}/business-units`;

const FILTER_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'range', label: 'Range Filter' },
  { value: 'multi_range', label: 'Multi Range Filter (Max 5)' }
];

const SERIES_COLORS = {
  credit: 'rgb(75, 192, 192)',
  debit: 'rgb(255, 99, 132)',
  total: 'rgb(16, 185, 129)'
};

const MAX_MONTHLY_COMPARE_YEARS = 2;
const COMPARISON_SERIES_COLORS = [
  {
    credit: SERIES_COLORS.credit,
    debit: SERIES_COLORS.debit,
    total: SERIES_COLORS.total
  },
  {
    credit: 'rgb(37, 99, 235)',
    debit: 'rgb(219, 39, 119)',
    total: 'rgb(5, 150, 105)'
  }
];

const getFilterTypeLabel = (filterType) => {
  return FILTER_TYPE_OPTIONS.find((option) => option.value === filterType)?.label || 'Monthly';
};

const getChartTitle = (filterType, comparisonCount = 1) => {
  if (filterType === 'multi_range') {
    return 'Revenue Comparison';
  }

  if (filterType === 'range') {
    return 'Revenue by Date Range';
  }

  if (comparisonCount > 1) {
    return 'Monthly Revenue Comparison';
  }

  return 'Monthly Revenue';
};

const isCalendarFilterType = (filterType) => {
  return filterType === 'range' || filterType === 'multi_range';
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseMonthDayForYear = (year, monthDay) => {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear)) {
    return null;
  }

  const parts = String(monthDay || '').split('-');
  if (parts.length !== 2) {
    return null;
  }

  const month = Number(parts[0]);
  const day = Number(parts[1]);
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(numericYear, month - 1, day);
  if (
    parsed.getFullYear() !== numericYear ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const parseIsoDateValue = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  const normalizedValue = rawValue.length >= 10 ? rawValue.slice(0, 10) : rawValue;
  if (!ISO_DATE_PATTERN.test(normalizedValue)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = normalizedValue.split('-');
  const numericYear = Number(yearRaw);
  const numericMonth = Number(monthRaw);
  const numericDay = Number(dayRaw);
  if (!Number.isInteger(numericYear) || !Number.isInteger(numericMonth) || !Number.isInteger(numericDay)) {
    return null;
  }

  const parsedDate = new Date(numericYear, numericMonth - 1, numericDay);
  if (
    parsedDate.getFullYear() !== numericYear ||
    parsedDate.getMonth() !== numericMonth - 1 ||
    parsedDate.getDate() !== numericDay
  ) {
    return null;
  }

  return parsedDate;
};

const normalizeMainBusinessUnit = (value) => {
  const normalizedValue = String(value || '').trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.includes('gosave')) {
    return 'Gosave';
  }

  if (normalizedValue.includes('goto') || normalizedValue === 'store') {
    return 'Goto';
  }

  return null;
};

const isValidRangeFilterValue = (range) => {
  if (!range) {
    return false;
  }

  const startDate = parseMonthDayForYear(range.year, range.start);
  const endDate = parseMonthDayForYear(range.year, range.end);

  return Boolean(startDate && endDate && endDate >= startDate);
};

const convertRangeFilterValueToApiRange = (range) => {
  if (!isValidRangeFilterValue(range)) {
    return null;
  }

  return {
    startDate: `${range.year}-${range.start}`,
    endDate: `${range.year}-${range.end}`
  };
};

const formatRangeFilterValue = (range) => {
  if (!isValidRangeFilterValue(range)) {
    return 'Belum dipilih';
  }

  const startDate = parseMonthDayForYear(range.year, range.start);
  const endDate = parseMonthDayForYear(range.year, range.end);

  return `${dayjs(startDate).format('DD MMM YYYY')} - ${dayjs(endDate).format('DD MMM YYYY')}`;
};

const normalizeMultiRangeValues = (ranges = []) => {
  if (!Array.isArray(ranges)) {
    return [];
  }

  return ranges
    .map((range) => {
      const startDate = range?.startDate || range?.start || '';
      const endDate = range?.endDate || range?.end || '';
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      const diffDays = end.diff(start, 'day') + 1;

      if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day') || diffDays > 31) {
        return null;
      }

      return {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD')
      };
    })
    .filter(Boolean)
    .slice(0, 5);
};

const formatMultiRangeValues = (ranges = []) => {
  const normalized = normalizeMultiRangeValues(ranges);
  if (normalized.length === 0) {
    return 'Belum dipilih';
  }

  return normalized
    .map((range, index) => {
      const label = `${dayjs(range.startDate).format('DD MMM YYYY')} - ${dayjs(range.endDate).format('DD MMM YYYY')}`;
      return `R${index + 1}: ${label}`;
    })
    .join(', ');
};

const createYearRangeValue = (year) => {
  return [dayjs(`${year}-01-01`), dayjs(`${year}-12-31`)];
};

const formatDisplayDateRange = (dateRange) => {
  const [startDate, endDate] = dateRange || [];
  if (!startDate || !endDate) {
    return 'Belum dipilih';
  }

  return `${startDate.format('DD MMM YYYY')} - ${endDate.format('DD MMM YYYY')}`;
};

const formatValueByUnit = (value, divisor, unitLabel) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  const scaledValue = numericValue / divisor;
  const absScaledValue = Math.abs(scaledValue);
  const maximumFractionDigits = absScaledValue >= 100 ? 0 : absScaledValue >= 10 ? 1 : 2;

  return `${scaledValue.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  })} ${unitLabel}`;
};

const formatValueInDynamicUnit = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  const absValue = Math.abs(numericValue);
  if (absValue >= 1_000_000_000) {
    return formatValueByUnit(numericValue, 1_000_000_000, 'M');
  }

  return formatValueByUnit(numericValue, 1_000_000, 'Jt');
};

const formatSeriesValue = (value, formatter) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return formatter(value);
};

const formatDetailedSeriesValue = (value) => {
  return formatValueInDynamicUnit(value);
};

const TOOLTIP_YEAR_REGEX = /\((\d{4})\)\s*$/;
const TOOLTIP_METRIC_LABEL_MAP = {
  Credit: 'Revenue',
  Debit: 'Retur',
  Total: 'Net Revenue',
  'Total (Credit - Debit)': 'Net Revenue'
};

const normalizeTooltipMetricLabel = (label) => {
  const normalizedLabel = String(label || '').trim();
  if (!normalizedLabel) {
    return 'Value';
  }

  return TOOLTIP_METRIC_LABEL_MAP[normalizedLabel] || normalizedLabel;
};

const extractTooltipYearAndLabel = (formattedLabel) => {
  const label = String(formattedLabel || '').trim();
  const match = label.match(TOOLTIP_YEAR_REGEX);
  if (!match) {
    return { year: '-', metricLabel: normalizeTooltipMetricLabel(label) };
  }

  return {
    year: match[1],
    metricLabel: normalizeTooltipMetricLabel(label.replace(TOOLTIP_YEAR_REGEX, '').trim())
  };
};

const MonthlyComparisonTooltip = React.memo(({ enabled = false }) => {
  const tooltipData = useAxesTooltip();
  if (!enabled || !Array.isArray(tooltipData) || tooltipData.length === 0) {
    return null;
  }

  const axisTooltip = tooltipData[0];
  const groupedByYear = new Map();

  (axisTooltip?.seriesItems || []).forEach((seriesItem) => {
    if (seriesItem?.formattedValue == null) {
      return;
    }

    const { year, metricLabel } = extractTooltipYearAndLabel(seriesItem.formattedLabel);
    const yearBucket = groupedByYear.get(year) || [];
    yearBucket.push({
      key: `${seriesItem.seriesId}-${year}`,
      color: seriesItem.color,
      metricLabel,
      value: seriesItem.formattedValue
    });
    groupedByYear.set(year, yearBucket);
  });

  if (groupedByYear.size === 0) {
    return null;
  }

  const orderedYears = Array.from(groupedByYear.keys()).sort((left, right) => Number(left) - Number(right));
  const isMultiYearTooltip = orderedYears.length > 1;

  return (
    <ChartsTooltipContainer trigger="axis">
      <Card
        sx={{
          p: 1.25,
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
          minWidth: orderedYears.length > 1 ? 260 : 180,
          bgcolor: '#FFFFFF'
        }}
      >
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: isMultiYearTooltip ? 400 : 700,
            color: '#111827',
            mb: 0.75,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}
        >
          {axisTooltip?.axisFormattedValue || axisTooltip?.axisValue || '-'}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${orderedYears.length}, minmax(0, 1fr))`,
            gap: 1.25
          }}
        >
          {orderedYears.map((year) => (
            <Box key={year} sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: isMultiYearTooltip ? 400 : 700,
                  color: '#4B5563',
                  mb: 0.5,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                }}
              >
                {year}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {(groupedByYear.get(year) || []).map((item) => (
                  <Box
                    key={item.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 0.75
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: item.color,
                          flexShrink: 0
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.69rem',
                          color: '#6B7280',
                          lineHeight: 1.2,
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                        }}
                      >
                        {item.metricLabel}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: isMultiYearTooltip ? 400 : 700,
                        color: '#111827',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Card>
    </ChartsTooltipContainer>
  );
});

MonthlyComparisonTooltip.displayName = 'MonthlyComparisonTooltip';

const FilterTypeDropdown = React.memo(({ value, onChange }) => {
  const formControlRef = useRef(null);
  const [menuWidth, setMenuWidth] = useState(null);

  const handleOpen = useCallback(() => {
    if (formControlRef.current) {
      const selectInput = formControlRef.current.querySelector('.MuiSelect-select') ||
        formControlRef.current.querySelector('.MuiOutlinedInput-root');
      if (selectInput) {
        const width = selectInput.offsetWidth || formControlRef.current.offsetWidth;
        setMenuWidth(width);
      } else {
        const width = formControlRef.current.offsetWidth;
        setMenuWidth(width);
      }
    }
  }, []);

  const handleChange = useCallback((event) => {
    onChange(event.target.value);
  }, [onChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FormControl ref={formControlRef} size="medium" fullWidth>
        <InputLabel
          id="monthly-filter-type-label"
          sx={{
            fontSize: '0.875rem',
            color: '#757575',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-focused': {
              color: '#6BA3D0'
            }
          }}
        >
          Tipe Filter
        </InputLabel>
        <Select
          labelId="monthly-filter-type-label"
          value={value || 'monthly'}
          onChange={handleChange}
          onOpen={handleOpen}
          label="Tipe Filter"
          displayEmpty={false}
          MenuProps={{
            disablePortal: false,
            keepMounted: true,
            sx: {
              zIndex: (theme) => theme.zIndex.modal + 10
            },
            PaperProps: {
              sx: {
                mt: 1,
                zIndex: (theme) => theme.zIndex.modal + 11,
                width: menuWidth ? `${menuWidth}px !important` : 'auto',
                minWidth: menuWidth ? `${menuWidth}px !important` : '0 !important',
                maxWidth: menuWidth ? `${menuWidth}px !important` : 'none',
                overflow: 'hidden',
                boxSizing: 'border-box',
                '& .MuiMenuItem-root': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.875rem',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  px: 2,
                  py: 1,
                  maxWidth: '100%',
                  width: '100%',
                  boxSizing: 'border-box'
                }
              },
              style: menuWidth ? {
                width: `${menuWidth}px`,
                minWidth: `${menuWidth}px`,
                maxWidth: `${menuWidth}px`,
                boxSizing: 'border-box'
              } : {}
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            disableAutoFocusItem: true
          }}
          sx={{
            fontSize: '0.875rem',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: (value === 'range' || value === 'specific' || value === 'multi_range') ? '#6BA3D0' : '#E5E5E5',
              borderWidth: '1px'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: (value === 'range' || value === 'specific' || value === 'multi_range') ? '#6BA3D0' : '#E0E0E0'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6BA3D0',
              borderWidth: '1px'
            }
          }}
        >
          {FILTER_TYPE_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{
                fontSize: '0.875rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                '&.Mui-selected': {
                  bgcolor: 'rgba(107, 163, 208, 0.08)',
                  color: '#6BA3D0',
                  '&:hover': {
                    bgcolor: 'rgba(107, 163, 208, 0.12)'
                  }
                }
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
});

FilterTypeDropdown.displayName = 'FilterTypeDropdown';

// BU Filter
const BusinessUnitFilter = React.memo(({ availableBusinessUnits, selectedBusinessUnits, onToggle }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625 }}>
      <Typography sx={{ 
        fontWeight: 500, 
        fontSize: { xs: '0.75rem', md: '0.8125rem' }, 
        whiteSpace: 'nowrap', 
        color: '#757575',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        letterSpacing: '0.01em',
        lineHeight: 1.4
      }}>
        Business Unit
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1
        }}
      >
        {availableBusinessUnits.map((unit) => {
          const isSelected = selectedBusinessUnits.includes(unit);
          return (
            <Button
              key={unit}
              variant={isSelected ? 'contained' : 'outlined'}
              onClick={() => onToggle(unit)}
              size="small"
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 600 : 500,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                bgcolor: isSelected ? '#6BA3D0' : 'transparent',
                color: isSelected ? 'white' : '#757575',
                border: isSelected ? 'none' : '1px solid #E5E5E5',
                borderRadius: '10px',
                width: '100%',
                minWidth: 0,
                py: 0.625,
                px: 1.5,
                boxShadow: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: isSelected ? '#5A9FD0' : '#FAFAFA',
                  border: isSelected ? 'none' : '1px solid #E0E0E0',
                  boxShadow: 'none'
                },
                '&:active': {
                  transform: 'scale(0.98)',
                  transition: 'all 0.1s ease'
                },
                '&:focus-visible': {
                  outline: '2px solid #6BA3D0',
                  outlineOffset: '2px'
                }
              }}
              aria-label={`Toggle business unit ${unit}`}
              aria-pressed={isSelected}
            >
              {unit}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
});

BusinessUnitFilter.displayName = 'BusinessUnitFilter';

// FilterSection 
const FilterSection = React.memo(({
  filterType,
  onFilterTypeChange,
  onOpenCalendarModal,
  availableBusinessUnits,
  businessUnits,
  onBusinessUnitToggle,
  onLoadData,
  onRefreshData,
  isLoading,
  isMobile = false,
  showLoadButton = true
}) => {
  const ContainerComponent = isMobile ? Box : Card;

  return (
    <ContainerComponent sx={{
      bgcolor: isMobile ? 'transparent' : '#FFFFFF',
      borderRadius: isMobile ? 0 : '14px',
      boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
      border: isMobile ? 'none' : '1px solid #E5E7EB',
      p: isMobile ? 0 : { xs: 2.25, md: 2.5 },
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? 1.5 : 2,
      height: '100%',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      zIndex: 1,
      '&:hover': isMobile
        ? undefined
        : {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
            borderColor: '#D1D5DB',
            transform: 'translateY(-1px)'
          }
    }}>
      <Box sx={{
        display: isMobile ? 'none' : 'flex',
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 0
      }}>
        <Typography sx={{ 
          fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
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
            },
            '&:focus-visible': {
              outline: '2px solid #6BA3D0',
              outlineOffset: '2px'
            }
          }}
          title="Refresh Data"
          aria-label="Refresh data"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <FilterTypeDropdown
        value={filterType}
        onChange={onFilterTypeChange}
      />
      
      <BusinessUnitFilter 
        availableBusinessUnits={availableBusinessUnits}
        selectedBusinessUnits={businessUnits}
        onToggle={onBusinessUnitToggle}
      />

      {isCalendarFilterType(filterType) ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Button
            variant="outlined"
            onClick={onOpenCalendarModal}
            startIcon={<CalendarMonthIcon fontSize="small" />}
            fullWidth
            sx={{
              borderColor: '#D1D5DB',
              color: '#4B5563',
              textTransform: 'none',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.01em',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              lineHeight: 1.25,
              minHeight: 46,
              px: 1.25,
              py: 1,
              '& .MuiButton-startIcon': {
                display: 'flex',
                alignItems: 'center',
                mr: 0.75,
                ml: 0,
                mt: 0
              },
              '& .MuiButton-startIcon svg': {
                fontSize: '1rem',
                color: '#7C8EA6'
              },
              '&:hover': {
                borderColor: '#6BA3D0',
                bgcolor: 'rgba(107, 163, 208, 0.06)',
                color: '#42556F',
                '& .MuiButton-startIcon svg': {
                  color: '#6B85A6'
                }
              }
            }}
          >
            Buka Calendar
          </Button>
        </Box>
      ) : null}

      {showLoadButton ? (
        <Button 
          variant="contained" 
          onClick={onLoadData} 
          disabled={isLoading} 
          size="medium"
          fullWidth
          aria-label="Load data button"
          sx={{ 
            mt: isMobile ? 0.5 : 'auto',
            bgcolor: '#6BA3D0',
            color: 'white',
            textTransform: 'none',
            fontSize: '0.8125rem',
            fontWeight: 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            py: 1.125,
            borderRadius: '10px',
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
            },
            '&:focus-visible': {
              outline: '2px solid #6BA3D0',
              outlineOffset: '2px'
            }
          }}
        >
          {isLoading ? 'Memuat...' : 'Muat Data'}
        </Button>
      ) : null}
    </ContainerComponent>
  );
});

FilterSection.displayName = 'FilterSection';

// LegendToggles 
const LegendToggles = React.memo(({
  showCredit,
  showDebit,
  showTotal,
  onToggleCredit,
  onToggleDebit,
  onToggleTotal,
  sx
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1.25, 
      mb: 1,
      flexWrap: 'wrap',
      ...sx
    }}>
      <Box
        onClick={onToggleCredit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleCredit();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s ease',
          opacity: showCredit ? 1 : 0.5,
          '&:hover': {
            opacity: showCredit ? 0.85 : 0.65
          },
          '&:focus-visible': {
            outline: '2px solid #6BA3D0',
            outlineOffset: '2px'
          }
        }}
        aria-label="Toggle Revenue visibility"
        aria-pressed={showCredit}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            bgcolor: showCredit ? SERIES_COLORS.credit : '#E0E0E0',
            border: `1px solid ${showCredit ? SERIES_COLORS.credit : '#BDBDBD'}`
          }}
        />
        <Typography sx={{ 
          fontSize: { xs: '0.6875rem', sm: '0.75rem', md: '0.75rem' },
          fontWeight: 600,
          color: showCredit ? '#1F2937' : '#94A3B8',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }}>
          Revenue
        </Typography>
      </Box>
      
      <Box
        onClick={onToggleDebit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleDebit();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s ease',
          opacity: showDebit ? 1 : 0.5,
          '&:hover': {
            opacity: showDebit ? 0.85 : 0.65
          },
          '&:focus-visible': {
            outline: '2px solid #6BA3D0',
            outlineOffset: '2px'
          }
        }}
        aria-label="Toggle Retur visibility"
        aria-pressed={showDebit}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            bgcolor: showDebit ? SERIES_COLORS.debit : '#E0E0E0',
            border: `1px solid ${showDebit ? SERIES_COLORS.debit : '#BDBDBD'}`
          }}  
        />
        <Typography sx={{ 
          fontSize: { xs: '0.6875rem', sm: '0.75rem', md: '0.75rem' },
          fontWeight: 600,
          color: showDebit ? '#1F2937' : '#94A3B8',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }}>
          Retur
        </Typography>
      </Box>
      
      <Box
        onClick={onToggleTotal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleTotal();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s ease',
          opacity: showTotal ? 1 : 0.5,
          '&:hover': {
            opacity: showTotal ? 0.85 : 0.65
          },
          '&:focus-visible': {
            outline: '2px solid #6BA3D0',
            outlineOffset: '2px'
          }
        }}
        aria-label="Toggle Net Revenue visibility"
        aria-pressed={showTotal}
      >
        <Box
          sx={{
            width: 14,
            height: 0,
            borderTop: `2px dashed ${showTotal ? SERIES_COLORS.total : '#BDBDBD'}`,
            borderRadius: '2px'
          }}
        />
        <Typography sx={{ 
          fontSize: { xs: '0.6875rem', sm: '0.75rem', md: '0.75rem' },
          fontWeight: 600,
          color: showTotal ? '#1F2937' : '#94A3B8',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }}>
          Net Revenue
        </Typography>
      </Box>
    </Box>
  );
});

LegendToggles.displayName = 'LegendToggles';

// SummaryCardCompact 
const SummaryCardCompact = React.memo(({ 
  filterType = 'monthly',
  dateRangeLabel = 'Belum dipilih',
  businessUnits, 
  invoiceData,
  onClearRangeData
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

  const canClearRangeData = (
    (filterType === 'range' || filterType === 'multi_range') &&
    dateRangeLabel !== 'Belum dipilih' &&
    typeof onClearRangeData === 'function'
  );

  const multiRangeSummaryPoints = useMemo(() => {
    if (filterType !== 'multi_range') {
      return [];
    }

    const rawLabel = String(dateRangeLabel || '').trim();
    if (!rawLabel || rawLabel === 'Belum dipilih') {
      return [];
    }

    return rawLabel
      .split(',')
      .map((label) => label.trim().replace(/^R\d+\s*:\s*/i, ''))
      .filter(Boolean);
  }, [dateRangeLabel, filterType]);

  const summaryItems = [
    {
      id: 'filter_type',
      label: 'TIPE FILTER',
      value: getFilterTypeLabel(filterType),
      icon: <FilterListIcon sx={{ fontSize: '0.75rem' }} />,
      hasData: true
    },
    {
      id: 'range_data',
      label: 'RANGE DATA',
      value: dateRangeLabel,
      icon: <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} />,
      hasData: Boolean(dateRangeLabel)
    },
    {
      id: 'business_unit',
      label: 'BUSINESS UNIT',
      value: getBusinessUnitText(),
      icon: <BusinessIcon sx={{ fontSize: '0.75rem' }} />,
      hasData: businessUnits && businessUnits.length > 0
    },
    {
      id: 'status_data',
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
      bgcolor: 'rgba(255, 255, 255, 0.58)',
      borderRadius: '14px',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.05)',
      border: '1px solid #E5E7EB',
      p: { xs: 2.25, md: 2.5 },
      width: '100%',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      zIndex: 1,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
        borderColor: '#D1D5DB',
        bgcolor: 'rgba(255, 255, 255, 0.66)'
      }
    }}>
      <Box
        sx={{
          mb: 1.25,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Typography sx={{
          fontSize: { xs: '0.9375rem', md: '1rem' },
          fontWeight: 600,
          color: '#212121',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          Ringkasan Data
        </Typography>
      </Box>

      <Box sx={{
        display: { xs: 'flex', sm: 'grid' },
        flexWrap: 'nowrap',
        gap: { xs: 1, sm: 1.25, xl: 1.5 },
        overflowX: { xs: 'auto', sm: 'visible' },
        overflowY: 'hidden',
        gridTemplateColumns: { sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        alignItems: 'stretch',
        pb: { xs: 0.5, sm: 0 }
      }}>
        {summaryItems.map((item, index) => (
          <Card
            key={index}
            sx={{
              bgcolor: '#FAFAFA',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              flex: { xs: '0 0 230px', sm: '1 1 auto' },
              minWidth: { xs: 230, sm: 0 },
              height: '100%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
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
              mb: 0.5
            }}>
              <Typography sx={{
                fontSize: '0.6875rem',
                color: '#757575',
                fontWeight: 500,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                <Box sx={{
                  color: '#9E9E9E',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem'
                }}>
                  {item.icon}
                </Box>
                {item.label}
              </Typography>
            </Box>
            {item.id === 'range_data' && filterType === 'multi_range' && multiRangeSummaryPoints.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {multiRangeSummaryPoints.map((rangeText, rangeIndex) => (
                  <Box
                    key={`${item.id}-${rangeIndex}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.75
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        mt: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#6BA3D0',
                        flexShrink: 0
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: { xs: '0.8125rem', md: '0.875rem' },
                        fontWeight: 600,
                        color: '#212121',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}
                    >
                      {rangeText}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                fontWeight: 600,
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
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
                      backgroundColor: item.hasData ? '#6BA3D0' : '#BDBDBD',
                      flexShrink: 0
                    }}
                  />
                )}
                {item.value}
              </Typography>
            )}
            {item.id === 'range_data' && canClearRangeData ? (
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={onClearRangeData}
                  sx={{
                    minWidth: 0,
                    p: 0,
                    mt: 0.75,
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6BA3D0',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: '#4F8FC2',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Hapus Range
                </Button>
              </Box>
            ) : null}
          </Card>
        ))}
      </Box>
    </Card>
  );
});

SummaryCardCompact.displayName = 'SummaryCardCompact';

//component that uses useQuery 
function ChartBUContent({ initialBusinessUnits = ['Gosave', 'Goto'] }) {
  const currentYear = new Date().getFullYear();
  const isMobileScreen = useMediaQuery('(max-width:600px)');
  const isCompactScreen = useMediaQuery('(max-width:900px)');
  const isLargeDesktopScreen = useMediaQuery('(min-width:1536px)');
  const isFullHdScreen = useMediaQuery('(min-width:1900px) and (min-height:1000px)');
  const isWuxgaScreen = useMediaQuery('(min-width:1900px) and (min-height:1150px)');
  const chartCanvasHeight = useMemo(() => {
    if (isMobileScreen) {
      return 320;
    }

    if (isCompactScreen) {
      return 360;
    }

    if (isWuxgaScreen) {
      return 540;
    }

    if (isFullHdScreen) {
      return 500;
    }

    if (isLargeDesktopScreen) {
      return 460;
    }

    return 430;
  }, [isCompactScreen, isFullHdScreen, isLargeDesktopScreen, isMobileScreen, isWuxgaScreen]);
  const [filterType, setFilterType] = useState('monthly');
  const [showCredit, setShowCredit] = useState(true);
  const [showDebit, setShowDebit] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [years, setYears] = useState([currentYear]);
  const [yearSummary, setYearSummary] = useState({});
  const [yearSummaryLoading, setYearSummaryLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const defaultStartDate = `${currentYear}-01-01`;
  const defaultEndDate = `${currentYear}-12-31`;

  const {
    selectedBusinessUnits,
    setSelectedBusinessUnits,
    allData,
    loading,
    loadRevenue
  } = useChartData(
    '4000.01.00',
    defaultStartDate,
    defaultEndDate,
    initialBusinessUnits,
    {
      monthlyRevenueUrl: MONTHLY_REVENUE_URL,
      invoiceSalesUrl: INVOICE_SALES_URL
    }
  );

  // Load business units from API
  const { data: businessUnitsData } = useQuery({
    queryKey: ['businessUnits', BUSINESS_UNITS_URL],
    queryFn: () => loadBusinessUnits(BUSINESS_UNITS_URL),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const availableBusinessUnits = businessUnitsData?.data || ['Gosave', 'Goto'];
  const businessUnits = useMemo(() => Array.from(selectedBusinessUnits), [selectedBusinessUnits]);
  const normalizedSelectedYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(
      (years || [])
        .map((year) => Number(year))
        .filter(Number.isInteger)
    ));

    if (uniqueYears.length === 0) {
      return [currentYear];
    }

    return uniqueYears.slice(0, MAX_MONTHLY_COMPARE_YEARS);
  }, [currentYear, years]);
  const selectedYear = normalizedSelectedYears[0] || currentYear;
  const [rangeDates, setRangeDates] = useState([]);
  const [multiRangeDates, setMultiRangeDates] = useState([]);
  const [openCalendarSignal, setOpenCalendarSignal] = useState(0);
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

  const availableYears = useMemo(() => getAvailableYears(), []);
  const summaryDateRangeLabel = useMemo(() => {
    if (filterType === 'range') {
      if (!Array.isArray(rangeDates) || rangeDates.length === 0) {
        return 'Belum dipilih';
      }

      return formatRangeFilterValue(rangeDates[0]);
    }

    if (filterType === 'multi_range') {
      return formatMultiRangeValues(multiRangeDates);
    }

    if (normalizedSelectedYears.length > 1) {
      return normalizedSelectedYears
        .map((year) => `${year}-01-01 s/d ${year}-12-31`)
        .join(' | ');
    }

    return formatDisplayDateRange(createYearRangeValue(selectedYear));
  }, [filterType, multiRangeDates, normalizedSelectedYears, rangeDates, selectedYear]);

  const yearTotals = useMemo(() => {
    return availableYears.reduce((totals, year) => {
      const yearData = yearSummary?.[year] || yearSummary?.[String(year)] || {};
      const monthlySalesSource = Array.isArray(yearData.monthlySales) ? yearData.monthlySales : [];
      totals[year] = {
        sales: Number(yearData.sales ?? 0),
        quantity: Number(yearData.quantity ?? 0),
        order: Number(yearData.order ?? 0),
        monthlySales: Array.from({ length: 12 }, (_, index) => {
          const monthlyValue = Number(monthlySalesSource[index]);
          return Number.isFinite(monthlyValue) ? monthlyValue : 0;
        })
      };
      return totals;
    }, {});
  }, [availableYears, yearSummary]);

  const toggleYear = useCallback((year) => {
    const normalizedYear = Number(year);
    if (!Number.isInteger(normalizedYear)) {
      return;
    }

    if (normalizedSelectedYears.includes(normalizedYear)) {
      if (normalizedSelectedYears.length === 1) {
        return;
      }

      setYears(normalizedSelectedYears.filter((value) => value !== normalizedYear));
      return;
    }

    if (normalizedSelectedYears.length >= MAX_MONTHLY_COMPARE_YEARS) {
      setSnackbar({
        open: true,
        message: 'Maksimal 2 tahun untuk perbandingan',
        severity: 'warning'
      });
      return;
    }

    setYears([...normalizedSelectedYears, normalizedYear]);
  }, [normalizedSelectedYears]);

  // Get filtered data from loaded dataset
  const filteredData = useMemo(() => {
    const selectedMainBusinessUnits = new Set((businessUnits || []).map((unit) => String(unit)));
    let nextData = getFilteredData(allData).data || [];

    if (selectedMainBusinessUnits.size > 0) {
      nextData = nextData.filter((item) => {
        const normalizedBusinessUnit = item?.mainBusinessUnit ||
          normalizeMainBusinessUnit(item?.business_unit || item?.businessUnit);

        if (!normalizedBusinessUnit) {
          return true;
        }

        return selectedMainBusinessUnits.has(normalizedBusinessUnit);
      });
    }

    if (filterType === 'range' && Array.isArray(rangeDates) && rangeDates.length > 0 && isValidRangeFilterValue(rangeDates[0])) {
      const activeRange = rangeDates[0];
      const startDate = parseMonthDayForYear(activeRange.year, activeRange.start);
      const endDate = parseMonthDayForYear(activeRange.year, activeRange.end);
      const activeYear = Number(activeRange.year);

      if (startDate && endDate) {
        nextData = nextData.filter((item) => {
          const periodDate = parseIsoDateValue(item?.period);
          if (!periodDate || periodDate < startDate || periodDate > endDate) {
            return false;
          }

          const itemYear = Number(item?.year);
          if (Number.isInteger(activeYear) && Number.isInteger(itemYear)) {
            return itemYear === activeYear;
          }

          return true;
        });
      }
    }

    return { data: nextData };
  }, [allData, businessUnits, filterType, rangeDates]);

  const monthlyChartData = useMemo(() => {
    const aggregatedByMonth = new Map();

    (filteredData.data || []).forEach((item) => {
      const monthIndex = monthShortNames.indexOf(item.monthShort);
      if (monthIndex < 0) return;

      const monthKey = monthShortNames[monthIndex];
      const previousValue = aggregatedByMonth.get(monthKey) || { credit: 0, debit: 0, total: 0 };

      aggregatedByMonth.set(monthKey, {
        credit: previousValue.credit + Number(item.credit || 0),
        debit: previousValue.debit + Number(item.debit || 0),
        total: previousValue.total + Number(item.total || 0)
      });
    });

    return monthShortNames.map((monthShort) => {
      const monthData = aggregatedByMonth.get(monthShort);

      if (monthData) {
        return { monthShort, credit: monthData.credit, debit: monthData.debit, total: monthData.total };
      }

      return { monthShort, credit: 0, debit: 0, total: 0 };
    });
  }, [filteredData.data]);

  const monthlyComparisonChartData = useMemo(() => {
    const selectedYearSet = new Set(normalizedSelectedYears);
    const groupedByYear = normalizedSelectedYears.reduce((accumulator, year) => {
      accumulator[year] = new Map();
      return accumulator;
    }, {});

    (filteredData.data || []).forEach((item) => {
      const monthIndex = monthShortNames.indexOf(item.monthShort);
      if (monthIndex < 0) {
        return;
      }

      const itemYear = Number(item.year);
      const resolvedYear = Number.isInteger(itemYear) ? itemYear : selectedYear;

      if (!selectedYearSet.has(resolvedYear)) {
        return;
      }

      const monthKey = monthShortNames[monthIndex];
      const previousValue = groupedByYear[resolvedYear]?.get(monthKey) || { credit: 0, debit: 0, total: 0 };

      groupedByYear[resolvedYear].set(monthKey, {
        credit: previousValue.credit + Number(item.credit || 0),
        debit: previousValue.debit + Number(item.debit || 0),
        total: previousValue.total + Number(item.total || 0)
      });
    });

    return normalizedSelectedYears.map((year) => {
      const yearDataMap = groupedByYear[year] || new Map();

      return {
        year,
        data: monthShortNames.map((monthShort) => {
          const monthData = yearDataMap.get(monthShort);
          return {
            monthShort,
            credit: monthData?.credit || 0,
            debit: monthData?.debit || 0,
            total: monthData?.total || 0
          };
        })
      };
    });
  }, [filteredData.data, normalizedSelectedYears, selectedYear]);

  const rangeChartModel = useMemo(() => {
    if (filterType !== 'range' || !Array.isArray(rangeDates) || rangeDates.length === 0) {
      return null;
    }

    return buildRangeChartModel({
      range: rangeDates[0],
      chartRows: filteredData.data || [],
      monthShortNames
    });
  }, [filterType, filteredData.data, rangeDates]);

  const multiRangeChartData = useMemo(() => {
    if (filterType !== 'multi_range') {
      return [];
    }

    const groupedByRange = new Map();
    (filteredData.data || []).forEach((item, index) => {
      const parsedRangeOrder = Number.parseInt(item?.rangeOrder, 10);
      const rangeOrder = Number.isInteger(parsedRangeOrder) ? parsedRangeOrder : index;
      const rangeKey = String(rangeOrder);
      const fallbackRangeLabel = item?.startDate && item?.endDate
        ? `${dayjs(item.startDate).format('DD MMM YYYY')} - ${dayjs(item.endDate).format('DD MMM YYYY')}`
        : item?.label || `Range ${rangeOrder + 1}`;

      const previousValue = groupedByRange.get(rangeKey) || {
        id: item?.rangeId || item?.id || `range-${rangeOrder + 1}`,
        rangeId: item?.rangeId || `range-${rangeOrder + 1}`,
        rangeOrder,
        rangeLabel: item?.rangeLabel || fallbackRangeLabel,
        label: item?.rangeLabel || fallbackRangeLabel,
        startDate: item?.startDate || null,
        endDate: item?.endDate || null,
        credit: 0,
        debit: 0,
        total: 0
      };

      previousValue.credit += Number(item?.credit || 0);
      previousValue.debit += Number(item?.debit || 0);
      previousValue.total += Number(item?.total || 0);
      groupedByRange.set(rangeKey, previousValue);
    });

    return Array.from(groupedByRange.values()).sort((left, right) => {
      const leftOrder = Number.parseInt(left?.rangeOrder, 10);
      const rightOrder = Number.parseInt(right?.rangeOrder, 10);
      const normalizedLeft = Number.isInteger(leftOrder) ? leftOrder : 0;
      const normalizedRight = Number.isInteger(rightOrder) ? rightOrder : 0;
      return normalizedLeft - normalizedRight;
    });
  }, [filterType, filteredData.data]);

  const activeSingleSeriesData = useMemo(() => {
    if (filterType === 'multi_range') {
      return multiRangeChartData;
    }

    if (filterType === 'range' && rangeChartModel?.data?.length) {
      return rangeChartModel.data;
    }

    return monthlyChartData;
  }, [filterType, monthlyChartData, multiRangeChartData, rangeChartModel]);

  const isMonthlyComparisonMode = filterType === 'monthly' && normalizedSelectedYears.length > 1;
  const isMultiRangeMode = filterType === 'multi_range';

  const hasLeftAxisSeries = showCredit || showTotal;
  const hasRightAxisSeries = showDebit;

  const xAxisLabels = useMemo(() => {
    if (filterType === 'multi_range') {
      return (activeSingleSeriesData || []).map((item) => {
        if (item?.rangeLabel) {
          return item.rangeLabel;
        }

        if (item?.startDate && item?.endDate) {
          return `${dayjs(item.startDate).format('DD MMM YYYY')} - ${dayjs(item.endDate).format('DD MMM YYYY')}`;
        }

        return item?.label || '-';
      });
    }

    if (filterType === 'range' && rangeChartModel?.labels?.length) {
      return rangeChartModel.labels;
    }

    return [...monthShortNames];
  }, [activeSingleSeriesData, filterType, rangeChartModel]);

  const xAxisTitle = useMemo(() => {
    if (filterType === 'multi_range') {
      return 'Range Perbandingan';
    }

    if (filterType === 'range') {
      return rangeChartModel?.axisLabel || 'Tanggal';
    }

    return 'Bulan';
  }, [filterType, rangeChartModel]);

  const chartTitle = useMemo(() => {
    return getChartTitle(filterType, normalizedSelectedYears.length);
  }, [filterType, normalizedSelectedYears.length]);

  const chartLayout = useMemo(() => {
    if (isMobileScreen) {
      return {
        xAxisHeight: 52,
        yAxisWidth: 78,
        margin: { top: 18, right: 28, bottom: 50, left: 28 },
        axisFontSize: 10,
        tickFontSize: 10,
        minChartWidth: 620
      };
    }

    if (isCompactScreen) {
      return {
        xAxisHeight: 50,
        yAxisWidth: 74,
        margin: { top: 16, right: 24, bottom: 48, left: 24 },
        axisFontSize: 10,
        tickFontSize: 10,
        minChartWidth: 680
      };
    }

    if (isWuxgaScreen) {
      return {
        xAxisHeight: 56,
        yAxisWidth: 88,
        margin: { top: 22, right: 28, bottom: 50, left: 28 },
        axisFontSize: 12,
        tickFontSize: 12,
        minChartWidth: 0
      };
    }

    if (isFullHdScreen || isLargeDesktopScreen) {
      return {
        xAxisHeight: 52,
        yAxisWidth: 80,
        margin: { top: 18, right: 22, bottom: 44, left: 22 },
        axisFontSize: 11,
        tickFontSize: 11,
        minChartWidth: 0
      };
    }

    return {
      xAxisHeight: 48,
      yAxisWidth: 70,
      margin: { top: 14, right: 16, bottom: 40, left: 16 },
      axisFontSize: 11,
      tickFontSize: 11,
      minChartWidth: 0
    };
  }, [isCompactScreen, isFullHdScreen, isLargeDesktopScreen, isMobileScreen, isWuxgaScreen]);

  const isMonthlyDataEmpty = useMemo(() => {
    return !activeSingleSeriesData || activeSingleSeriesData.length === 0;
  }, [activeSingleSeriesData]);

  const emptyStateAxisMessage = useMemo(() => {
    if (filterType === 'range') {
      return 'Data kosong, sumbu mengikuti range tanggal';
    }

    if (filterType === 'multi_range') {
      return 'Data kosong, sumbu mengikuti daftar range';
    }

    return 'Data kosong, sumbu tetap Jan-Des';
  }, [filterType]);

  const chartMinWidth = useMemo(() => {
    if (filterType !== 'range') {
      if (isMobileScreen) {
        const labelsCount = Array.isArray(xAxisLabels) ? Math.max(xAxisLabels.length, 12) : 12;
        const calculatedWidth = (labelsCount * 48) + 220;
        return `${Math.max(chartLayout.minChartWidth, calculatedWidth)}px`;
      }

      if (!isCompactScreen) {
        return '100%';
      }

      return `${chartLayout.minChartWidth}px`;
    }

    const labelsCount = Array.isArray(xAxisLabels) ? xAxisLabels.length : 0;
    const perLabelWidth = isMobileScreen ? 34 : isCompactScreen ? 28 : isWuxgaScreen ? 23 : isFullHdScreen ? 24 : 26;
    const basePadding = isMobileScreen ? 220 : isCompactScreen ? 190 : isWuxgaScreen ? 230 : isFullHdScreen ? 210 : 180;
    const calculatedWidth = labelsCount > 0
      ? (labelsCount * perLabelWidth) + basePadding
      : chartLayout.minChartWidth;

    if (isCompactScreen) {
      return `${Math.max(chartLayout.minChartWidth, calculatedWidth)}px`;
    }

    return `max(100%, ${Math.max(900, Math.round(calculatedWidth))}px)`;
  }, [
    chartLayout.minChartWidth,
    filterType,
    isCompactScreen,
    isFullHdScreen,
    isMobileScreen,
    isWuxgaScreen,
    xAxisLabels
  ]);

  const chartSeries = useMemo(() => {
    const series = [];
    const baseSeriesConfig = isMultiRangeMode
      ? {
          type: 'bar'
        }
      : {
          type: 'line',
          curve: 'linear',
          showMark: true
        };

    if (isMonthlyComparisonMode) {
      monthlyComparisonChartData.forEach((yearSeries, yearIndex) => {
        const colors = COMPARISON_SERIES_COLORS[yearIndex] || COMPARISON_SERIES_COLORS[0];

        if (showCredit) {
          series.push({
            id: `creditSeriesYear${yearSeries.year}`,
            data: yearSeries.data.map((item) => item.credit),
            label: `Credit (${yearSeries.year})`,
            yAxisId: 'leftAxisId',
            color: colors.credit,
            valueFormatter: (value) => formatSeriesValue(value, formatDetailedSeriesValue),
            ...baseSeriesConfig
          });
        }

        if (showDebit) {
          series.push({
            id: `debitSeriesYear${yearSeries.year}`,
            data: yearSeries.data.map((item) => item.debit),
            label: `Debit (${yearSeries.year})`,
            yAxisId: 'rightAxisId',
            color: colors.debit,
            valueFormatter: (value) => formatSeriesValue(value, formatDetailedSeriesValue),
            ...baseSeriesConfig
          });
        }

        if (showTotal) {
          series.push({
            id: `totalSeriesYear${yearSeries.year}`,
            data: yearSeries.data.map((item) => item.total),
            label: `Total (${yearSeries.year})`,
            yAxisId: 'leftAxisId',
            color: colors.total,
            valueFormatter: (value) => formatSeriesValue(value, formatDetailedSeriesValue),
            ...baseSeriesConfig
          });
        }
      });

      return series;
    }

    if (showCredit) {
      series.push({
        id: 'creditSeries',
        data: activeSingleSeriesData.map((item) => item.credit),
        label: 'Credit',
        yAxisId: 'leftAxisId',
        color: SERIES_COLORS.credit,
        valueFormatter: (value) => formatSeriesValue(value, formatDetailedSeriesValue),
        ...baseSeriesConfig
      });
    }

    if (showDebit) {
      series.push({
        id: 'debitSeries',
        data: activeSingleSeriesData.map((item) => item.debit),
        label: 'Debit',
        yAxisId: 'rightAxisId',
        color: SERIES_COLORS.debit,
        valueFormatter: (value) => formatSeriesValue(value, formatDetailedSeriesValue),
        ...baseSeriesConfig
      });
    }

    if (showTotal) {
      series.push({
        id: 'totalSeries',
        ...(isMultiRangeMode
          ? { type: 'bar' }
          : {
              type: 'line',
              curve: 'linear',
              showMark: true
            }),
        data: activeSingleSeriesData.map((item) => item.total),
        label: 'Total (Credit - Debit)',
        yAxisId: 'leftAxisId',
        color: SERIES_COLORS.total,
        valueFormatter: (value) => formatSeriesValue(value, formatDetailedSeriesValue)
      });
    }

    return series;
  }, [activeSingleSeriesData, isMonthlyComparisonMode, isMultiRangeMode, monthlyComparisonChartData, showCredit, showDebit, showTotal]);

  const chartSeriesSx = useMemo(() => {
    const dynamicStyles = {};

    chartSeries.forEach((seriesItem) => {
      if (!seriesItem?.id || !seriesItem?.color) {
        return;
      }

      dynamicStyles[`& .MuiBarElement-series-${seriesItem.id}`] = {
        fill: seriesItem.color,
        opacity: 0.9
      };

      if (!isMultiRangeMode) {
        dynamicStyles[`& .MuiMarkElement-series-${seriesItem.id}`] = {
          fill: seriesItem.color,
          stroke: seriesItem.color
        };
      }
    });

    if (isMonthlyComparisonMode) {
      normalizedSelectedYears.forEach((year, index) => {
        if (index === 0) {
          return;
        }

        dynamicStyles[`& .MuiLineElement-series-creditSeriesYear${year}`] = {
          strokeDasharray: '6 4'
        };
        dynamicStyles[`& .MuiLineElement-series-debitSeriesYear${year}`] = {
          strokeDasharray: '6 4'
        };
        dynamicStyles[`& .MuiLineElement-series-totalSeriesYear${year}`] = {
          strokeDasharray: '6 4'
        };
      });

      return dynamicStyles;
    }

    if (!isMultiRangeMode) {
      dynamicStyles['& .MuiLineElement-series-totalSeries'] = {
        strokeDasharray: '7 5'
      };
    }

    return dynamicStyles;
  }, [chartSeries, isMonthlyComparisonMode, isMultiRangeMode, normalizedSelectedYears]);

  const leftAxisLabel = useMemo(() => {
    if (showCredit && showTotal) {
      return 'Credit / Total (M/Jt)';
    }
    if (showCredit) {
      return 'Credit (M/Jt)';
    }
    if (showTotal) {
      return 'Total (M/Jt)';
    }
    return 'Credit (M/Jt)';
  }, [showCredit, showTotal]);

  const yAxisConfig = useMemo(() => {
    const axes = [];

    if (hasLeftAxisSeries) {
      axes.push({
        id: 'leftAxisId',
        label: leftAxisLabel,
        width: chartLayout.yAxisWidth,
        valueFormatter: (value) => formatValueInDynamicUnit(value)
      });
    }

    if (hasRightAxisSeries) {
      axes.push({
        id: 'rightAxisId',
        position: 'right',
        label: 'Debit (M/Jt)',
        width: chartLayout.yAxisWidth,
        valueFormatter: (value) => formatValueInDynamicUnit(value)
      });
    }

    return axes.length > 0 ? axes : [{
      id: 'leftAxisId',
      label: leftAxisLabel,
      width: chartLayout.yAxisWidth,
      valueFormatter: (value) => formatValueInDynamicUnit(value)
    }];
  }, [chartLayout.yAxisWidth, hasLeftAxisSeries, hasRightAxisSeries, leftAxisLabel]);

  const toggleBusinessUnit = useCallback((unit) => {
    const newSet = new Set(selectedBusinessUnits);
    if (newSet.has(unit)) {
      newSet.delete(unit);
    } else {
      newSet.add(unit);
    }
    setSelectedBusinessUnits(newSet);
  }, [selectedBusinessUnits, setSelectedBusinessUnits]);

  const handleAddRangeDate = useCallback((range) => {
    if (!isValidRangeFilterValue(range)) {
      setSnackbar({
        open: true,
        message: 'Range tanggal tidak valid. Pastikan tanggal mulai <= tanggal akhir.',
        severity: 'error'
      });
      return;
    }

    setRangeDates([{
      start: range.start,
      end: range.end,
      year: Number(range.year)
    }]);
  }, []);

  const handleRemoveRangeDate = useCallback((rangeToRemove) => {
    setRangeDates((prevRanges) => prevRanges.filter((range) => !(
      range.start === rangeToRemove.start &&
      range.end === rangeToRemove.end &&
      Number(range.year) === Number(rangeToRemove.year)
    )));
  }, []);

  const handleValidatedMultiRangesChange = useCallback((ranges) => {
    setMultiRangeDates(normalizeMultiRangeValues(ranges));
  }, []);

  const handleClearRangeData = useCallback(() => {
    if (filterType === 'range') {
      setRangeDates([]);
    }

    if (filterType === 'multi_range') {
      setMultiRangeDates([]);
    }
  }, [filterType]);

  const handleFilterTypeChange = useCallback((newFilterType) => {
    if (newFilterType !== 'monthly' && normalizedSelectedYears.length > 1) {
      setYears([selectedYear]);
    }

    setFilterType(newFilterType);
  }, [normalizedSelectedYears.length, selectedYear]);

  const getLoadOptions = useCallback(() => {
    if (filterType === 'range' && rangeDates.length > 0) {
      const parsedRange = convertRangeFilterValueToApiRange(rangeDates[0]);
      if (parsedRange) {
        return {
          ...parsedRange,
          dateType: 'range'
        };
      }
    }

    if (filterType === 'multi_range') {
      const normalizedRanges = normalizeMultiRangeValues(multiRangeDates);
      if (normalizedRanges.length > 0) {
        const baseCompareYear = Number.isInteger(selectedYear) ? selectedYear : currentYear;
        const compareYears = normalizedSelectedYears.length > 1
          ? normalizedSelectedYears
          : [baseCompareYear - 1, baseCompareYear];

        return {
          dateType: 'compare_year',
          compareYears,
          dateRanges: normalizedRanges
        };
      }
    }

    if (filterType === 'monthly') {
      if (normalizedSelectedYears.length > 1) {
        return {
          dateRanges: normalizedSelectedYears.map((year) => ({
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            year
          }))
        };
      }

      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`
      };
    }

    return {
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`
    };
  }, [currentYear, filterType, multiRangeDates, normalizedSelectedYears, rangeDates, selectedYear]);

  const handleOpenCalendarModal = useCallback(() => {
    setMobileFilterDrawerOpen(false);
    setOpenCalendarSignal((prev) => prev + 1);
  }, []);

  const validateFilterSelection = useCallback(() => {
    if (filterType === 'range') {
      if (!rangeDates.length || !isValidRangeFilterValue(rangeDates[0])) {
        setSnackbar({
          open: true,
          message: 'Pilih 1 range tanggal yang valid terlebih dahulu',
          severity: 'warning'
        });
        return false;
      }
    }

    if (filterType === 'multi_range') {
      const normalizedRanges = normalizeMultiRangeValues(multiRangeDates);
      if (normalizedRanges.length === 0) {
        setSnackbar({
          open: true,
          message: 'Pilih minimal 1 multi range terlebih dahulu',
          severity: 'warning'
        });
        return false;
      }
    }

    return true;
  }, [filterType, multiRangeDates, rangeDates]);

  useEffect(() => {
    loadYearSummary(
      availableYears,
      setYearSummary,
      setYearSummaryLoading,
      '4000.01.00',
      selectedBusinessUnits,
      INVOICE_SALES_URL
    );
  }, [availableYears, selectedBusinessUnits]);

  const runLoadRevenue = useCallback(async (showSuccessMessage = true) => {
    if (!validateFilterSelection()) {
      return;
    }

    const loadOptions = getLoadOptions();
    await loadRevenue((error) => {
      if (error) {
        setSnackbar({ open: true, message: error, severity: 'error' });
      } else if (showSuccessMessage) {
        setSnackbar({ open: true, message: 'Data berhasil dimuat', severity: 'success' });
      }
    }, loadOptions);
  }, [getLoadOptions, loadRevenue, validateFilterSelection]);

  const handleRefreshData = useCallback(async () => {
    await runLoadRevenue(true);
  }, [runLoadRevenue]);

  const handleLoadData = useCallback(async () => {
    await runLoadRevenue(true);
  }, [runLoadRevenue]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <Box sx={{
        width: '100%',
        maxWidth: 'min(100%, 1880px)',
        mr: 'auto',
        minHeight: '100%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: isMobileScreen ? '#F4F8FC' : 'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)',
        pt: { xs: 1.75, sm: 2.25, md: 3, xl: 3.5 },
        px: { xs: 1, sm: 1.5, md: 2, xl: 2.5 },
        pb: { xs: 1.75, sm: 2.25, md: 3, xl: 3.5 },
        gap: { xs: 2, md: 2.5, xl: 3 },
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'visible',
        '&::before': {
          content: isMobileScreen ? 'none' : '""',
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
        {isMobileScreen ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              overflow: 'hidden'
            }}
          >
            <BackgroundMobile />
          </Box>
        ) : null}
        {/* Baris Atas: Filter Section dan SummaryCard */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 2, md: 2.5, xl: 3 },
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Filter Section di Kiri */}
          <Box sx={{
            width: { xs: '100%', lg: 300, xl: 320 },
            minWidth: { xs: '100%', lg: 300, xl: 320 },
            flexShrink: 0,
            display: isMobileScreen ? 'none' : 'flex',
            flexDirection: 'column'
          }}>
            <FilterSection
              filterType={filterType}
              onFilterTypeChange={handleFilterTypeChange}
              onOpenCalendarModal={handleOpenCalendarModal}
              availableBusinessUnits={availableBusinessUnits}
              businessUnits={businessUnits}
              onBusinessUnitToggle={toggleBusinessUnit}
              onLoadData={handleLoadData}
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
            gap: { xs: 2, md: 2.5, xl: 3 },
            height: '100%'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'start',
              flexShrink: 0
            }}>
              {isMobileScreen ? (
                <MobileYearsCardBU
                  availableYears={availableYears}
                  selectedYears={normalizedSelectedYears}
                  yearTotals={yearTotals}
                  onToggleYear={toggleYear}
                  isLoading={yearSummaryLoading}
                  dateFilterType={filterType}
                />
              ) : (
                <YearsCardBU
                  availableYears={availableYears}
                  selectedYears={normalizedSelectedYears}
                  yearTotals={yearTotals}
                  onToggleYear={toggleYear}
                  isLoading={yearSummaryLoading}
                  dateFilterType={filterType}
                />
              )}
            </Box>

            {filterType === 'range' ? (
              isMobileScreen ? (
                <RangeDateMobile
                  rangeDates={rangeDates}
                  onAddRange={handleAddRangeDate}
                  onRemoveRange={handleRemoveRangeDate}
                  availableYears={availableYears}
                  selectedYears={normalizedSelectedYears}
                  businessUnits={businessUnits}
                  onBusinessUnitToggle={toggleBusinessUnit}
                  invoiceData={allData.data || []}
                  openPickerSignal={openCalendarSignal}
                />
              ) : (
                <Box sx={{ display: 'none' }}>
                  <RangeDateFilter
                    rangeDates={rangeDates}
                    onAddRange={handleAddRangeDate}
                    onRemoveRange={handleRemoveRangeDate}
                    availableYears={availableYears}
                    selectedYears={normalizedSelectedYears}
                    businessUnits={businessUnits}
                    onBusinessUnitToggle={toggleBusinessUnit}
                    dataType="both"
                    onDataTypeChange={() => {}}
                    invoiceData={allData.data || []}
                    openPickerSignal={openCalendarSignal}
                    showTitle={false}
                    showSummary={false}
                    allowReplaceExistingRange
                  />
                </Box>
              )
            ) : null}

            {filterType === 'multi_range' ? (
              isMobileScreen ? (
                <MultiRangeMobile
                  availableYears={availableYears}
                  businessUnits={businessUnits}
                  onBusinessUnitToggle={toggleBusinessUnit}
                  invoiceData={allData.data || []}
                  onValidatedRangesChange={handleValidatedMultiRangesChange}
                  onApplyFilter={handleLoadData}
                  initialValidatedRanges={multiRangeDates}
                  openPickerSignal={openCalendarSignal}
                />
              ) : (
                <Box sx={{ display: 'none' }}>
                  <SpecificDateFilter
                    specificDates={[]}
                    onAddDate={() => {}}
                    onRemoveDate={() => {}}
                    availableYears={availableYears}
                    businessUnits={businessUnits}
                    onBusinessUnitToggle={toggleBusinessUnit}
                    dataType="both"
                    onDataTypeChange={() => {}}
                    invoiceData={allData.data || []}
                    onValidatedRangesChange={handleValidatedMultiRangesChange}
                    initialValidatedRanges={multiRangeDates}
                    openPickerSignal={openCalendarSignal}
                  />
                </Box>
              )
            ) : null}

            <Box sx={{
              display: 'flex',
              alignItems: 'start',
              flexShrink: 0
            }}>
              {isMobileScreen ? (
                <MobileRingkasanBU
                  filterType={filterType}
                  filterTypeLabel={getFilterTypeLabel(filterType)}
                  dateRangeLabel={summaryDateRangeLabel}
                  businessUnits={businessUnits}
                  invoiceData={allData.data || []}
                  onClearRangeData={handleClearRangeData}
                  onOpenFilter={() => setMobileFilterDrawerOpen(true)}
                  onLoadData={handleLoadData}
                  isLoading={loading}
                />
              ) : (
                <SummaryCardCompact
                  filterType={filterType}
                  dateRangeLabel={summaryDateRangeLabel}
                  businessUnits={businessUnits}
                  invoiceData={allData.data || []}
                  onClearRangeData={handleClearRangeData}
                />
              )}
            </Box>
          </Box>
        </Box>
            
        {/* Card Chart di Bawah */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {isMobileScreen ? (
            <MobileChartBU
              loading={loading}
              chartTitle={chartTitle}
              chartSeries={chartSeries}
              xAxisLabels={xAxisLabels}
              xAxisTitle={xAxisTitle}
              chartLayout={chartLayout}
              yAxisConfig={yAxisConfig}
              chartCanvasHeight={chartCanvasHeight}
              chartMinWidth={chartMinWidth}
              chartSeriesSx={chartSeriesSx}
              isMultiRangeMode={isMultiRangeMode}
              hasLeftAxisSeries={hasLeftAxisSeries}
              hasRightAxisSeries={hasRightAxisSeries}
              isMonthlyDataEmpty={isMonthlyDataEmpty}
              emptyStateAxisMessage={emptyStateAxisMessage}
              isMonthlyComparisonMode={isMonthlyComparisonMode}
              showCredit={showCredit}
              showDebit={showDebit}
              showTotal={showTotal}
              onToggleCredit={() => setShowCredit((prev) => !prev)}
              onToggleDebit={() => setShowDebit((prev) => !prev)}
              onToggleTotal={() => setShowTotal((prev) => !prev)}
            />
          ) : (
            <Card sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E5E7EB',
            mt: { xs: 0.5, md: 1 },
            pt: { xs: 2.25, md: 2.75, xl: 3.25 },
            px: { xs: 2.25, md: 2.75, xl: 3.25 },
            pb: { xs: 1.25, md: 1.5, xl: 1.75 },
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 1,
            overflow: 'visible',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
              borderColor: '#D1D5DB',
              transform: 'translateY(-1px)'
            }
          }}>
            <Box sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5
            }}>
            <Typography sx={{
                fontSize: { xs: '0.875rem', md: '1rem' },
                fontWeight: 600,
                color: '#212121',
                letterSpacing: '-0.01em',
                lineHeight: 1.4,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
              }}>
                {chartTitle}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  maxWidth: '100%',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  ml: 'auto',
                  mr: { xs: 0, md: 1 }
                }}
              >
                <FilterListIcon sx={{ fontSize: '0.875rem', color: '#9E9E9E' }} />
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    color: '#757575',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: 1.2,
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                  }}
                >
                  Filter Chart
                </Typography>
                <LegendToggles
                  showCredit={showCredit}
                  showDebit={showDebit}
                  showTotal={showTotal}
                  onToggleCredit={() => setShowCredit(!showCredit)}
                  onToggleDebit={() => setShowDebit(!showDebit)}
                  onToggleTotal={() => setShowTotal(!showTotal)}
                  sx={{
                    mb: 0,
                    gap: 0.5
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                overflowY: 'visible',
                pb: 0.25,
                scrollbarGutter: 'stable both-edges',
                WebkitOverflowScrolling: 'touch',
                touchAction: { xs: 'pan-x', md: 'auto' },
                overscrollBehaviorX: 'contain'
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  minWidth: chartMinWidth,
                  position: 'relative',
                  height: chartCanvasHeight
                }}
              >
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
                      fontSize: '0.875rem',
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
              {!loading ? (
                <ChartContainer
                  series={chartSeries}
                  xAxis={[
                    {
                      id: 'monthAxisId',
                      scaleType: isMultiRangeMode ? 'band' : 'point',
                      data: xAxisLabels,
                      height: chartLayout.xAxisHeight,
                      label: xAxisTitle,
                      tickLabelInterval: () => true,
                      tickLabelMinGap: 0,
                      valueFormatter: (value) => value,
                      tickLabelStyle: {
                        fontSize: chartLayout.tickFontSize,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                      }
                    }
                  ]}
                  yAxis={yAxisConfig}
                  margin={chartLayout.margin}
                  height={chartCanvasHeight}
                  sx={{
                    touchAction: isMobileScreen ? 'pan-x' : 'auto',
                    '& svg': {
                      touchAction: isMobileScreen ? 'pan-x' : 'auto'
                    },
                    '& .MuiBarElement-root': {
                      rx: 4
                    },
                    '& .MuiLineElement-root': {
                      strokeWidth: 2.5
                    },
                    '& .MuiMarkElement-root': {
                      strokeWidth: 1.5
                    },
                    ...chartSeriesSx,
                    '& .MuiChartsAxis-label': {
                      fontSize: chartLayout.axisFontSize,
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                      fill: '#757575'
                    },
                    '& .MuiChartsAxis-tickLabel': {
                      fontSize: chartLayout.tickFontSize,
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                      fill: '#757575'
                    },
                    '& .MuiChartsAxisHighlight-root': {
                      stroke: 'rgba(107, 163, 208, 0.65)',
                      strokeDasharray: '6 4',
                      strokeWidth: 1.2
                    }
                  }}
                >
                  <ChartsGrid horizontal />
                  <ChartsAxisHighlight x="line" y="none" />
                  {isMultiRangeMode ? (
                    <BarPlot />
                  ) : (
                    <>
                      <LinePlot />
                      <MarkPlot />
                    </>
                  )}
                  <ChartsXAxis axisId="monthAxisId" />
                  {hasLeftAxisSeries ? <ChartsYAxis axisId="leftAxisId" /> : null}
                  {hasRightAxisSeries ? <ChartsYAxis axisId="rightAxisId" /> : null}
                  {isMonthlyComparisonMode ? (
                    <MonthlyComparisonTooltip enabled />
                  ) : (
                    <ChartsTooltip trigger="axis" />
                  )}
                </ChartContainer>
              ) : null}

              {!loading && isMonthlyDataEmpty ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 10,
                    px: 1,
                    py: 0.5,
                    borderRadius: '8px',
                    bgcolor: 'rgba(250, 250, 250, 0.92)',
                    border: '1px solid #E5E7EB',
                    pointerEvents: 'none'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      color: '#757575',
                      fontWeight: 500,
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                    }}
                  >
                    {emptyStateAxisMessage}
                  </Typography>
                </Box>
              ) : null}
              </Box>
            </Box>
            </Card>
          )}
        </Box>

        {isMobileScreen ? (
          <Drawer
            anchor="bottom"
            open={mobileFilterDrawerOpen}
            onClose={() => setMobileFilterDrawerOpen(false)}
            ModalProps={{
              keepMounted: true
            }}
            BackdropProps={{
              sx: {
                backgroundColor: 'rgba(15, 23, 42, 0.52)',
                backdropFilter: 'blur(1.5px)'
              }
            }}
            sx={{
              zIndex: (theme) => theme.zIndex.modal + 2
            }}
            PaperProps={{
              sx: {
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                height: 'auto',
                maxHeight: 'calc(100dvh - 84px)',
                pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                overflow: 'hidden',
                zIndex: (theme) => theme.zIndex.modal + 3
              }
            }}
          >
            <Box
              sx={{
                p: 2,
                pb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: '#FFFFFF',
                borderBottom: '1px solid #F1F5F9'
              }}
            >
              <Typography
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#212121',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                }}
              >
                Filter
              </Typography>
              <IconButton onClick={() => setMobileFilterDrawerOpen(false)} size="small" aria-label="Close filter drawer">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                pb: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
                overflow: 'auto',
                maxHeight: 'calc(100dvh - 240px)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <FilterSection
                filterType={filterType}
                onFilterTypeChange={handleFilterTypeChange}
                onOpenCalendarModal={handleOpenCalendarModal}
                availableBusinessUnits={availableBusinessUnits}
                businessUnits={businessUnits}
                onBusinessUnitToggle={toggleBusinessUnit}
                onLoadData={handleLoadData}
                onRefreshData={handleRefreshData}
                isLoading={loading}
                isMobile
                showLoadButton={false}
              />
            </Box>
          </Drawer>
        ) : null}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}

// QueryClientProvider
function ChartBU({ initialBusinessUnits = ['Gosave', 'Goto'] }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChartBUContent initialBusinessUnits={initialBusinessUnits} />
    </QueryClientProvider>
  );
}

// ErrorBoundary
const ChartBUWithErrorBoundary = ({ initialBusinessUnits = ['Gosave', 'Goto'] }) => (
  <ErrorBoundary>
    <ChartBU initialBusinessUnits={initialBusinessUnits} />
  </ErrorBoundary>
);

export default ChartBUWithErrorBoundary;
