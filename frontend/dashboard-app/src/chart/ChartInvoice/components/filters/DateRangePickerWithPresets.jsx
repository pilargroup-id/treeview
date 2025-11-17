import React, { useMemo } from "react";
import { Box, Typography, Button } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from 'dayjs';
import 'dayjs/locale/id';

// Preset options - hanya menggunakan bulan dan hari, tahun dari card
const getPresets = (selectedYear) => {
  const year = selectedYear || dayjs().year();
  const now = dayjs().year(year);
  
  return [
    { 
      label: "Awal Bulan", 
      getValue: () => {
        const startOfMonth = now.startOf('month');
        return [startOfMonth, startOfMonth];
      }
    },
    { 
      label: "Akhir Bulan", 
      getValue: () => {
        const endOfMonth = now.endOf('month');
        return [endOfMonth, endOfMonth];
      }
    },
    { 
      label: "Seluruh Bulan", 
      getValue: () => [now.startOf('month'), now.endOf('month')] 
    },
    { 
      label: "Bulan Lalu", 
      getValue: () => {
        const lastMonth = now.subtract(1, 'month');
        return [lastMonth.startOf('month'), lastMonth.endOf('month')];
      }
    },
    { 
      label: "Awal Tahun", 
      getValue: () => {
        const startOfYear = dayjs().year(year).month(0).date(1);
        return [startOfYear, startOfYear];
      }
    },
    { 
      label: "Akhir Tahun", 
      getValue: () => {
        const endOfYear = dayjs().year(year).month(11).endOf('month');
        return [endOfYear, endOfYear];
      }
    },
    { 
      label: "Q1 (Jan-Mar)", 
      getValue: () => {
        const q1Start = dayjs().year(year).month(0).date(1);
        const q1End = dayjs().year(year).month(2).endOf('month');
        return [q1Start, q1End];
      }
    },
    { 
      label: "Q2 (Apr-Jun)", 
      getValue: () => {
        const q2Start = dayjs().year(year).month(3).date(1);
        const q2End = dayjs().year(year).month(5).endOf('month');
        return [q2Start, q2End];
      }
    },
    { 
      label: "Q3 (Jul-Sep)", 
      getValue: () => {
        const q3Start = dayjs().year(year).month(6).date(1);
        const q3End = dayjs().year(year).month(8).endOf('month');
        return [q3Start, q3End];
      }
    },
    { 
      label: "Q4 (Okt-Des)", 
      getValue: () => {
        const q4Start = dayjs().year(year).month(9).date(1);
        const q4End = dayjs().year(year).month(11).endOf('month');
        return [q4Start, q4End];
      }
    },
  ];
};

// Helper function to convert MM-DD format to dayjs
const parseMonthDay = (value, year = null) => {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0]) - 1; // dayjs month is 0-indexed
  const day = parseInt(parts[1]);
  const targetYear = year || dayjs().year();
  return dayjs().year(targetYear).month(month).date(day);
};

// Helper function to convert dayjs to MM-DD format
const formatMonthDay = (date) => {
  if (!date || !date.isValid()) return '';
  const month = String(date.month() + 1).padStart(2, '0');
  const day = String(date.date()).padStart(2, '0');
  return `${month}-${day}`;
};

export const DateRangePickerWithPresets = ({ 
  rangeStart, 
  rangeEnd, 
  onRangeStartChange, 
  onRangeEndChange,
  selectedYear = null 
}) => {
  const currentYear = selectedYear || dayjs().year();
  const presets = getPresets(currentYear);
  
  // Convert MM-DD format to dayjs for DateRangePicker
  const value = useMemo(() => {
    const start = parseMonthDay(rangeStart, currentYear);
    const end = parseMonthDay(rangeEnd, currentYear);
    
    if (start && end && start.isValid() && end.isValid()) {
      return [start, end];
    }
    return [null, null];
  }, [rangeStart, rangeEnd, currentYear]);

  const handleChange = (newValue) => {
    if (newValue && newValue[0] && newValue[1]) {
      const startMonthDay = formatMonthDay(newValue[0]);
      const endMonthDay = formatMonthDay(newValue[1]);
      onRangeStartChange(startMonthDay);
      onRangeEndChange(endMonthDay);
    } else {
      onRangeStartChange('');
      onRangeEndChange('');
    }
  };

  const handlePresetClick = (preset) => {
    const [startDate, endDate] = preset.getValue();
    handleChange([startDate, endDate]);
  };

  const pickerSx = {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.875rem',
      borderRadius: 1.5,
      bgcolor: 'white',
      transition: 'all 0.2s ease',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#bdbdbd'
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#212121',
        borderWidth: '1px'
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
      color: '#616161',
      '&.Mui-focused': {
        color: '#212121'
      }
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': {
      color: '#616161',
      '&:hover': {
        color: '#212121'
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2.5
      }}>
        <Typography sx={{ 
          fontWeight: 600, 
          fontSize: '0.875rem', 
          color: '#212121', 
          mb: 0.5,
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          Range Tanggal (Bulan & Hari)
        </Typography>

        {/* Preset Buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outlined"
              size="small"
              onClick={() => handlePresetClick(preset)}
              sx={{
                fontSize: '0.75rem',
                textTransform: 'none',
                borderColor: '#e0e0e0',
                color: '#616161',
                '&:hover': {
                  borderColor: '#212121',
                  color: '#212121',
                  bgcolor: '#f5f5f5'
                }
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Box>

        {/* Date Range Picker */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <DatePicker
            value={value[0]}
            onChange={(newValue) => {
              if (newValue) {
                handleChange([newValue, value[1] || newValue]);
              }
            }}
            label="Tanggal Mulai"
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                sx: pickerSx
              },
              actionBar: {
                actions: ['cancel', 'accept']
              },
              paper: {
                sx: {
                  '& .MuiPickersCalendarHeader-root': {
                    '& .MuiIconButton-root': {
                      color: '#616161',
                      '&:hover': {
                        color: '#212121',
                        bgcolor: '#f5f5f5'
                      }
                    }
                  },
                  '& .MuiPickersMonth-monthButton': {
                    '&.Mui-selected': {
                      bgcolor: '#212121 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#424242 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  },
                  '& .MuiPickersDay-day': {
                    '&.Mui-selected': {
                      bgcolor: '#212121 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#424242 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  },
                  '& .MuiPickersActionBar-actionButton': {
                    '&.MuiButton-textPrimary': {
                      color: '#212121',
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      }
                    }
                  }
                }
              }
            }}
          />
          <Typography sx={{ 
            fontSize: '0.875rem', 
            color: '#757575', 
            fontWeight: 500,
            mx: 0.5
          }}>
            sampai
          </Typography>
          <DatePicker
            value={value[1]}
            onChange={(newValue) => {
              if (newValue) {
                handleChange([value[0] || newValue, newValue]);
              }
            }}
            label="Tanggal Akhir"
            minDate={value[0]}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                sx: pickerSx
              },
              actionBar: {
                actions: ['cancel', 'accept']
              },
              paper: {
                sx: {
                  '& .MuiPickersCalendarHeader-root': {
                    '& .MuiIconButton-root': {
                      color: '#616161',
                      '&:hover': {
                        color: '#212121',
                        bgcolor: '#f5f5f5'
                      }
                    }
                  },
                  '& .MuiPickersMonth-monthButton': {
                    '&.Mui-selected': {
                      bgcolor: '#212121 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#424242 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  },
                  '& .MuiPickersDay-day': {
                    '&.Mui-selected': {
                      bgcolor: '#212121 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#424242 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  },
                  '& .MuiPickersActionBar-actionButton': {
                    '&.MuiButton-textPrimary': {
                      color: '#212121',
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      }
                    }
                  }
                }
              }
            }}
          />
        </Box>

        <Typography sx={{ 
          fontSize: '0.75rem', 
          color: '#9e9e9e',
          lineHeight: 1.5,
          mt: 0.5
        }}>
          * Tahun dipilih dari card tahun di atas
        </Typography>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePickerWithPresets;

