import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const FILTER_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'range', label: 'Range Filter' },
  { value: 'multi_range', label: 'Multi Range Filter (Max 5)' }
];

const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';

function isCalendarFilterType(filterType) {
  return filterType === 'range' || filterType === 'multi_range';
}

function MobileFilterBU({
  filterType = 'monthly',
  dateRangeLabel = 'Belum dipilih',
  onFilterTypeChange,
  onOpenCalendarModal,
  availableBusinessUnits = [],
  businessUnits = [],
  onBusinessUnitToggle,
  onClearRangeData,
  onLoadData,
  isLoading = false
}) {
  const formControlRef = useRef(null);
  const [menuWidth, setMenuWidth] = useState(null);
  const canClearRangeData = (
    (filterType === 'range' || filterType === 'multi_range') &&
    dateRangeLabel !== 'Belum dipilih' &&
    typeof onClearRangeData === 'function'
  );

  const handleSelectOpen = useCallback(() => {
    if (!formControlRef.current) {
      return;
    }

    const selectInput = formControlRef.current.querySelector('.MuiSelect-select')
      || formControlRef.current.querySelector('.MuiOutlinedInput-root');

    const width = selectInput?.offsetWidth || formControlRef.current.offsetWidth || null;
    setMenuWidth(width);
  }, []);

  const handleFilterTypeChange = useCallback((event) => {
    if (typeof onFilterTypeChange === 'function') {
      onFilterTypeChange(event.target.value);
    }
  }, [onFilterTypeChange]);

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

  const rangeSummaryLabel = filterType === 'monthly' ? 'TAHUN' : 'RANGE DATA';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      <FormControl ref={formControlRef} size="medium" fullWidth>
        <InputLabel
          id="mobile-bu-filter-type-label"
          sx={{
            fontSize: '0.875rem',
            color: '#757575',
            fontFamily: FONT_FAMILY,
            '&.Mui-focused': {
              color: '#6BA3D0'
            }
          }}
        >
          Tipe Filter
        </InputLabel>
        <Select
          labelId="mobile-bu-filter-type-label"
          value={filterType || 'monthly'}
          onChange={handleFilterTypeChange}
          onOpen={handleSelectOpen}
          label="Tipe Filter"
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
                  fontFamily: FONT_FAMILY,
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
              horizontal: 'left'
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left'
            },
            disableAutoFocusItem: true
          }}
          sx={{
            fontSize: '0.875rem',
            fontFamily: FONT_FAMILY,
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isCalendarFilterType(filterType) ? '#6BA3D0' : '#E5E5E5',
              borderWidth: '1px'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isCalendarFilterType(filterType) ? '#6BA3D0' : '#E0E0E0'
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
                fontFamily: FONT_FAMILY,
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625 }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            color: '#757575',
            fontFamily: FONT_FAMILY,
            letterSpacing: '0.01em',
            lineHeight: 1.4
          }}
        >
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
            const isSelected = businessUnits.includes(unit);

            return (
              <Button
                key={unit}
                variant={isSelected ? 'contained' : 'outlined'}
                onClick={() => onBusinessUnitToggle(unit)}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 600 : 500,
                  fontFamily: FONT_FAMILY,
                  bgcolor: isSelected ? '#6BA3D0' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#757575',
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

      {isCalendarFilterType(filterType) ? (
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
      ) : null}

      <Box
        sx={{
          bgcolor: '#FBFDFF',
          borderRadius: '12px',
          border: '1px solid #E3ECF5',
          p: 1.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.9,
          minHeight: 96
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
          <Box sx={{ color: '#607489', display: 'flex', alignItems: 'center' }}>
            <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} />
          </Box>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: '#4C6179',
              fontWeight: 600,
              letterSpacing: '0.05em',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              fontFamily: FONT_FAMILY
            }}
          >
            {rangeSummaryLabel}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45 }}>
          {rangeChipValues.map((value, valueIndex, valuesArray) => {
            const showIndex = valuesArray.length > 1;
            const textColor = value === 'Belum dipilih' ? '#64748B' : '#1E293B';

            return (
              <Typography
                key={`range-summary-${valueIndex}`}
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
                  fontFamily: FONT_FAMILY
                }}
              >
                {showIndex ? `${valueIndex + 1}. ` : ''}
                {value}
              </Typography>
            );
          })}
        </Box>

        {canClearRangeData ? (
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
                fontFamily: FONT_FAMILY,
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

      <Button
        variant="contained"
        onClick={onLoadData}
        disabled={isLoading}
        size="medium"
        fullWidth
        aria-label="Load data button"
        sx={{
          mt: 0.5,
          bgcolor: '#6BA3D0',
          color: '#FFFFFF',
          textTransform: 'none',
          fontSize: '0.8125rem',
          fontWeight: 500,
          fontFamily: FONT_FAMILY,
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
    </Box>
  );
}

export default React.memo(MobileFilterBU);
