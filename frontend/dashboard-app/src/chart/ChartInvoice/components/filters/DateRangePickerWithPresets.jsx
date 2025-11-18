import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from 'dayjs';
import 'dayjs/locale/id';

// Preset options
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
      getValue: () => {
        return [now.startOf('month'), now.endOf('month')];
      }
    },
    { 
      label: "Q1 (Jan-Mar)", 
      getValue: () => {
        return [now.month(0).startOf('month'), now.month(2).endOf('month')];
      }
    },
    { 
      label: "Q2 (Apr-Jun)", 
      getValue: () => {
        return [now.month(3).startOf('month'), now.month(5).endOf('month')];
      }
    },
    { 
      label: "Q3 (Jul-Sep)", 
      getValue: () => {
        return [now.month(6).startOf('month'), now.month(8).endOf('month')];
      }
    },
    { 
      label: "Q4 (Okt-Des)", 
      getValue: () => {
        return [now.month(9).startOf('month'), now.month(11).endOf('month')];
      }
    },
    { 
      label: "H1 (Jan-Jun)", 
      getValue: () => {
        return [now.month(0).startOf('month'), now.month(5).endOf('month')];
      }
    },
    { 
      label: "H2 (Jul-Des)", 
      getValue: () => {
        return [now.month(6).startOf('month'), now.month(11).endOf('month')];
      }
    }
  ];
};

// Format tanggal untuk display
const formatDateDisplay = (monthDay, year) => {
  const [month, day] = monthDay.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dateStr = `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
  return year ? `${dateStr} ${year}` : dateStr;
};

export const DateRangePickerWithPresets = ({ 
  rangeDates = [],
  onAddRange,
  onRemoveRange,
  selectedYear = null 
}) => {
  const [selectedStartMonth, setSelectedStartMonth] = useState(null);
  const [selectedStartDay, setSelectedStartDay] = useState(null);
  const [selectedEndMonth, setSelectedEndMonth] = useState(null);
  const [selectedEndDay, setSelectedEndDay] = useState(null);
  
  const currentYear = selectedYear; // Tidak ada fallback, harus dipilih dari card
  const presets = currentYear ? getPresets(currentYear) : [];
  const hasYearSelected = !!currentYear;
  
  const MAX_RANGE_DATES = 20; // Batasi maksimal 20 range

  // Reset semua pilihan jika tahun berubah atau belum dipilih
  useEffect(() => {
    if (!hasYearSelected) {
      setSelectedStartMonth(null);
      setSelectedStartDay(null);
      setSelectedEndMonth(null);
      setSelectedEndDay(null);
    }
  }, [hasYearSelected]);

  const handleAddRange = () => {
    try {
      // Validasi tahun dipilih
      if (!currentYear) {
        alert('Pilih tahun terlebih dahulu dari card tahun di atas');
        return;
      }
      
      // Validasi input
      if (!selectedStartMonth || !selectedStartDay || !selectedEndMonth || !selectedEndDay) {
        alert('Pilih bulan dan hari untuk tanggal mulai dan akhir terlebih dahulu');
        return;
      }
      
      // Validasi bahwa semua adalah objek dayjs yang valid
      if (!selectedStartMonth.isValid || !selectedStartMonth.isValid()) {
        console.error('Invalid selectedStartMonth:', selectedStartMonth);
        alert('Bulan mulai yang dipilih tidak valid');
        return;
      }
      
      if (!selectedStartDay.isValid || !selectedStartDay.isValid()) {
        console.error('Invalid selectedStartDay:', selectedStartDay);
        alert('Hari mulai yang dipilih tidak valid');
        return;
      }
      
      if (!selectedEndMonth.isValid || !selectedEndMonth.isValid()) {
        console.error('Invalid selectedEndMonth:', selectedEndMonth);
        alert('Bulan akhir yang dipilih tidak valid');
        return;
      }
      
      if (!selectedEndDay.isValid || !selectedEndDay.isValid()) {
        console.error('Invalid selectedEndDay:', selectedEndDay);
        alert('Hari akhir yang dipilih tidak valid');
        return;
      }
      
      // Batasi jumlah range
      if (rangeDates.length >= MAX_RANGE_DATES) {
        alert(`Maksimal ${MAX_RANGE_DATES} range yang bisa dipilih untuk menghindari error`);
        return;
      }
      
      // Format: MM-DD (bulan-hari)
      let startMonth, startDay, endMonth, endDay;
      try {
        startMonth = String(selectedStartMonth.month() + 1).padStart(2, '0');
        startDay = String(selectedStartDay.date()).padStart(2, '0');
        endMonth = String(selectedEndMonth.month() + 1).padStart(2, '0');
        endDay = String(selectedEndDay.date()).padStart(2, '0');
      } catch (formatError) {
        console.error('Error formatting date:', formatError);
        alert('Error memformat tanggal. Silakan coba lagi.');
        return;
      }
      
      // Validasi format yang dihasilkan
      const startMonthNum = parseInt(startMonth, 10);
      const startDayNum = parseInt(startDay, 10);
      const endMonthNum = parseInt(endMonth, 10);
      const endDayNum = parseInt(endDay, 10);
      
      if (isNaN(startMonthNum) || startMonthNum < 1 || startMonthNum > 12) {
        console.error('Invalid start month:', startMonth);
        alert('Bulan mulai tidak valid');
        return;
      }
      
      if (isNaN(startDayNum) || startDayNum < 1 || startDayNum > 31) {
        console.error('Invalid start day:', startDay);
        alert('Hari mulai tidak valid');
        return;
      }
      
      if (isNaN(endMonthNum) || endMonthNum < 1 || endMonthNum > 12) {
        console.error('Invalid end month:', endMonth);
        alert('Bulan akhir tidak valid');
        return;
      }
      
      if (isNaN(endDayNum) || endDayNum < 1 || endDayNum > 31) {
        console.error('Invalid end day:', endDay);
        alert('Hari akhir tidak valid');
        return;
      }
      
      // Validasi bahwa tanggal valid menggunakan tahun yang dipilih
      const testStartDate = dayjs(`${currentYear}-${startMonth}-${startDay}`);
      if (!testStartDate.isValid() || testStartDate.month() !== (startMonthNum - 1) || testStartDate.date() !== startDayNum) {
        alert(`Tanggal mulai ${startDay}/${startMonth} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      const testEndDate = dayjs(`${currentYear}-${endMonth}-${endDay}`);
      if (!testEndDate.isValid() || testEndDate.month() !== (endMonthNum - 1) || testEndDate.date() !== endDayNum) {
        alert(`Tanggal akhir ${endDay}/${endMonth} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      // Validasi bahwa tanggal akhir >= tanggal mulai
      const startDate = dayjs(`${currentYear}-${startMonth}-${startDay}`);
      const endDate = dayjs(`${currentYear}-${endMonth}-${endDay}`);
      if (endDate.isBefore(startDate)) {
        alert('Tanggal akhir harus lebih besar atau sama dengan tanggal mulai');
        return;
      }
      
      const startMonthDay = `${startMonth}-${startDay}`;
      const endMonthDay = `${endMonth}-${endDay}`;
      
      // Cek apakah range dengan tahun yang sama sudah ada
      const rangeExists = rangeDates.some(range => 
        range.start === startMonthDay && range.end === endMonthDay && range.year === currentYear
      );
      
      if (rangeExists) {
        alert(`Range tanggal ini untuk tahun ${currentYear} sudah dipilih`);
        return;
      }
      
      // Panggil onAddRange dengan error handling - termasuk tahun
      try {
        onAddRange({ start: startMonthDay, end: endMonthDay, year: currentYear });
        setSelectedStartMonth(null);
        setSelectedStartDay(null);
        setSelectedEndMonth(null);
        setSelectedEndDay(null);
      } catch (addError) {
        console.error('Error adding range:', addError);
        alert('Error menambahkan range: ' + (addError.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Unexpected error in handleAddRange:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const handlePresetClick = (preset) => {
    try {
      if (!hasYearSelected) {
        alert('Pilih tahun terlebih dahulu dari card tahun di atas');
        return;
      }
      const [startDate, endDate] = preset.getValue();
      if (startDate && endDate && startDate.isValid() && endDate.isValid()) {
        setSelectedStartMonth(startDate.startOf('month'));
        setSelectedStartDay(startDate);
        setSelectedEndMonth(endDate.startOf('month'));
        setSelectedEndDay(endDate);
      } else {
        console.warn('Invalid preset dates');
      }
    } catch (error) {
      console.error('Error in handlePresetClick:', error);
    }
  };

  const pickerSx = {
    width: '140px',
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
        borderColor: '#1976d2',
        borderWidth: '1px'
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
      color: '#616161',
      '&.Mui-focused': {
        color: '#1976d2'
      }
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': {
      color: '#616161',
      '&:hover': {
        color: '#1976d2'
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2.5,
        '& .MuiPickersPopper-root': {
          '& .MuiPickersCalendarHeader-root': {
            '& .MuiIconButton-root': {
              color: '#616161',
              '&:hover': {
                color: '#1976d2',
                bgcolor: 'rgba(25, 118, 210, 0.04)'
              }
            }
          },
          '& .MuiPickersMonth-monthButton': {
            '&.Mui-selected': {
              bgcolor: '#1976d2 !important',
              color: 'white !important',
              '&:hover': {
                bgcolor: '#1565c0 !important'
              }
            },
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.04)'
            }
          },
          '& .MuiPickersDay-day': {
            '&.Mui-selected': {
              bgcolor: '#1976d2 !important',
              color: 'white !important',
              '&:hover': {
                bgcolor: '#1565c0 !important'
              }
            },
            '&:hover': {
              bgcolor: '#f5f5f5'
            }
          },
          '& .MuiPickersActionBar-actionButton': {
            '&.MuiButton-textPrimary': {
              color: '#1976d2',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.04)'
              }
            }
          }
        }
      }}>
        <Typography sx={{ 
          fontWeight: 600, 
          fontSize: '0.875rem', 
          color: '#212121', 
          mb: 0.5,
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          Range Tanggal (Bulan & Hari) - Max 20
        </Typography>

        {/* Preset Buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {hasYearSelected ? (
            presets.map((preset) => (
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
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    bgcolor: '#f5f5f5'
                  }
                }}
              >
                {preset.label}
              </Button>
            ))
          ) : (
            <Typography sx={{ 
              fontSize: '0.75rem', 
              color: '#9e9e9e',
              fontStyle: 'italic',
              py: 0.5
            }}>
              Pilih tahun terlebih dahulu untuk menggunakan preset
            </Typography>
          )}
        </Box>

        {/* Form Input Range - Layout Horizontal */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 1.5, 
          flexWrap: 'wrap',
          mb: 1
        }}>
          {/* Tanggal Mulai */}
          <DatePicker
            value={selectedStartMonth}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  setSelectedStartMonth(newValue);
                  // Reset selectedDay jika bulan berubah
                  if (selectedStartDay) {
                    setSelectedStartDay(null);
                  }
                } else if (newValue === null) {
                  setSelectedStartMonth(null);
                  setSelectedStartDay(null);
                }
              } catch (error) {
                console.error('Error in start month onChange:', error);
              }
            }}
            views={['month']}
            openTo="month"
            disabled={!hasYearSelected}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Bulan Mulai',
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
                        color: '#1976d2',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }
                  },
                  '& .MuiPickersMonth-monthButton': {
                    '&.Mui-selected': {
                      bgcolor: '#1976d2 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#1565c0 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }
                }
              }
            }}
          />
          <DatePicker
            value={selectedStartDay}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  // Validasi bahwa hari sesuai dengan bulan yang dipilih
                  if (selectedStartMonth && newValue.month() !== selectedStartMonth.month()) {
                    console.warn('Selected day month does not match selected month');
                    return;
                  }
                  setSelectedStartDay(newValue);
                } else if (newValue === null) {
                  setSelectedStartDay(null);
                }
              } catch (error) {
                console.error('Error in start day onChange:', error);
              }
            }}
            views={['day']}
            openTo="day"
            disabled={!hasYearSelected || !selectedStartMonth}
            minDate={selectedStartMonth && currentYear ? dayjs(`${currentYear}-${String(selectedStartMonth.month() + 1).padStart(2, '0')}-01`) : null}
            maxDate={selectedStartMonth && currentYear ? dayjs(`${currentYear}-${String(selectedStartMonth.month() + 1).padStart(2, '0')}-${dayjs(`${currentYear}-${String(selectedStartMonth.month() + 1).padStart(2, '0')}-01`).daysInMonth()}`) : null}
            defaultCalendarMonth={selectedStartMonth && currentYear ? dayjs(`${currentYear}-${String(selectedStartMonth.month() + 1).padStart(2, '0')}-01`) : null}
            shouldDisableDate={(date) => {
              if (!selectedStartMonth) return true;
              const month = date.month();
              const selectedMonthValue = selectedStartMonth.month();
              return month !== selectedMonthValue;
            }}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Hari Mulai',
                sx: pickerSx
              },
              actionBar: {
                actions: ['cancel', 'accept']
              },
              calendarHeader: {
                format: 'MMMM YYYY'
              },
              paper: {
                sx: {
                  '& .MuiPickersCalendarHeader-root': {
                    '& .MuiIconButton-root': {
                      color: '#616161',
                      '&:hover': {
                        color: '#1976d2',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }
                  },
                  '& .MuiPickersDay-day': {
                    '&.Mui-selected': {
                      bgcolor: '#1976d2 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#1565c0 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  }
                }
              }
            }}
          />

          {/* Separator */}
          <Typography sx={{ 
            fontSize: '0.875rem', 
            color: '#757575', 
            fontWeight: 500,
            alignSelf: 'center'
          }}>
            sampai
          </Typography>

          {/* Tanggal Akhir */}
          <DatePicker
            value={selectedEndMonth}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  setSelectedEndMonth(newValue);
                  // Reset selectedDay jika bulan berubah
                  if (selectedEndDay) {
                    setSelectedEndDay(null);
                  }
                } else if (newValue === null) {
                  setSelectedEndMonth(null);
                  setSelectedEndDay(null);
                }
              } catch (error) {
                console.error('Error in end month onChange:', error);
              }
            }}
            views={['month']}
            openTo="month"
            disabled={!hasYearSelected}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Bulan Akhir',
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
                        color: '#1976d2',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }
                  },
                  '& .MuiPickersMonth-monthButton': {
                    '&.Mui-selected': {
                      bgcolor: '#1976d2 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#1565c0 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }
                }
              }
            }}
          />
          <DatePicker
            value={selectedEndDay}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  // Validasi bahwa hari sesuai dengan bulan yang dipilih
                  if (selectedEndMonth && newValue.month() !== selectedEndMonth.month()) {
                    console.warn('Selected day month does not match selected month');
                    return;
                  }
                  setSelectedEndDay(newValue);
                } else if (newValue === null) {
                  setSelectedEndDay(null);
                }
              } catch (error) {
                console.error('Error in end day onChange:', error);
              }
            }}
            views={['day']}
            openTo="day"
            disabled={!hasYearSelected || !selectedEndMonth}
            minDate={selectedEndMonth && currentYear ? dayjs(`${currentYear}-${String(selectedEndMonth.month() + 1).padStart(2, '0')}-01`) : null}
            maxDate={selectedEndMonth && currentYear ? dayjs(`${currentYear}-${String(selectedEndMonth.month() + 1).padStart(2, '0')}-${dayjs(`${currentYear}-${String(selectedEndMonth.month() + 1).padStart(2, '0')}-01`).daysInMonth()}`) : null}
            defaultCalendarMonth={selectedEndMonth && currentYear ? dayjs(`${currentYear}-${String(selectedEndMonth.month() + 1).padStart(2, '0')}-01`) : null}
            shouldDisableDate={(date) => {
              if (!selectedEndMonth) return true;
              const month = date.month();
              const selectedMonthValue = selectedEndMonth.month();
              return month !== selectedMonthValue;
            }}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Hari Akhir',
                sx: pickerSx
              },
              actionBar: {
                actions: ['cancel', 'accept']
              },
              calendarHeader: {
                format: 'MMMM YYYY'
              },
              paper: {
                sx: {
                  '& .MuiPickersCalendarHeader-root': {
                    '& .MuiIconButton-root': {
                      color: '#616161',
                      '&:hover': {
                        color: '#1976d2',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }
                  },
                  '& .MuiPickersDay-day': {
                    '&.Mui-selected': {
                      bgcolor: '#1976d2 !important',
                      color: 'white !important',
                      '&:hover': {
                        bgcolor: '#1565c0 !important'
                      }
                    },
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  }
                }
              }
            }}
          />

          {/* Tombol Tambah */}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleAddRange}
            disabled={!currentYear || !selectedStartMonth || !selectedStartDay || !selectedEndMonth || !selectedEndDay || rangeDates.length >= MAX_RANGE_DATES}
            sx={{
              borderColor: '#e0e0e0',
              color: '#616161',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 1.5,
              px: 2,
              py: 1,
              minWidth: '100px',
              height: '40px',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#bdbdbd',
                bgcolor: '#fafafa',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                transform: 'translateY(-1px)'
              },
              '&:active': {
                transform: 'translateY(0)'
              },
              '&:disabled': {
                borderColor: '#e0e0e0',
                color: '#9e9e9e',
                transform: 'none'
              }
            }}
          >
            Tambah
          </Button>

          {/* Counter */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            height: '40px',
            px: 1.5,
            borderRadius: 1.5,
            bgcolor: '#f5f5f5'
          }}>
            <Typography sx={{ 
              fontSize: '0.75rem', 
              color: '#757575',
              fontWeight: 500,
              lineHeight: 1.5,
              whiteSpace: 'nowrap'
            }}>
              {rangeDates.length}/{MAX_RANGE_DATES}
            </Typography>
          </Box>
        </Box>

        <Typography sx={{ 
          fontSize: '0.75rem', 
          color: '#9e9e9e',
          lineHeight: 1.5,
          mt: 0.5,
          mb: 1.5
        }}>
          {hasYearSelected 
            ? '* Pilih bulan dan hari untuk tanggal mulai dan akhir. Tahun dipilih dari card tahun di atas.'
            : '* Pilih tahun terlebih dahulu dari card tahun di atas sebelum memilih bulan dan hari.'}
        </Typography>

        {/* Daftar Range yang Sudah Ditambahkan */}
        {rangeDates.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mt: 1.5,
            pt: 1.5,
            borderTop: '1px solid #e0e0e0'
          }}>
            {rangeDates.map((range, index) => (
              <Chip
                key={`${range.start}_${range.end}_${range.year}_${index}`}
                label={`${formatDateDisplay(range.start, range.year)} - ${formatDateDisplay(range.end, range.year)}`}
                onDelete={() => onRemoveRange(range)}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#e0e0e0',
                  color: '#616161',
                  fontSize: '0.8125rem',
                  height: 32,
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#bdbdbd',
                    bgcolor: '#fafafa'
                  },
                  '& .MuiChip-deleteIcon': {
                    color: '#9e9e9e',
                    fontSize: '1rem',
                    '&:hover': {
                      color: '#616161'
                    }
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePickerWithPresets;
