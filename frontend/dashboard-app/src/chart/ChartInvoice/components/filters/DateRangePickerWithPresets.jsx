import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from 'dayjs';
import 'dayjs/locale/id';

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
  availableYears = [],
  selectedYear = null
}) => {
  // State untuk Mulai
  const [startMonth, setStartMonth] = useState(null);
  const [startDay, setStartDay] = useState(null);
  
  // State untuk Sampai
  const [endMonth, setEndMonth] = useState(null);
  const [endDay, setEndDay] = useState(null);
  
  const MAX_RANGE_DATES = 1; // Maksimal 1 
  const currentYear = selectedYear; 

  // Reset state jika range sudah ada atau tahun berubah
  useEffect(() => {
    if (rangeDates.length > 0 || !currentYear) {
      setStartMonth(null);
      setStartDay(null);
      setEndMonth(null);
      setEndDay(null);
    }
  }, [rangeDates, currentYear]);

  const handleAddStartDate = () => {
    try {
      // Validasi tahun dipilih dari card tahun
      if (!currentYear) {
        alert('Pilih tahun terlebih dahulu dari card tahun di atas');
        return;
      }
      
      // Validasi input
      if (!startMonth || !startDay) {
        alert('Pilih bulan dan hari untuk tanggal mulai terlebih dahulu');
        return;
      }
      
      // Validasi bahwa semua adalah objek dayjs yang valid
      if (!startMonth.isValid || !startMonth.isValid()) {
        console.error('Invalid startMonth:', startMonth);
        alert('Bulan mulai yang dipilih tidak valid');
        return;
      }
      
      if (!startDay.isValid || !startDay.isValid()) {
        console.error('Invalid startDay:', startDay);
        alert('Hari mulai yang dipilih tidak valid');
        return;
      }
      
      // Format: MM-DD (bulan-hari)
      let month, day;
      try {
        month = String(startMonth.month() + 1).padStart(2, '0');
        day = String(startDay.date()).padStart(2, '0');
      } catch (formatError) {
        console.error('Error formatting date:', formatError);
        alert('Error memformat tanggal. Silakan coba lagi.');
        return;
      }
      
      // Validasi format yang dihasilkan
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        console.error('Invalid start month:', month);
        alert('Bulan mulai tidak valid');
        return;
      }
      
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        console.error('Invalid start day:', day);
        alert('Hari mulai tidak valid');
        return;
      }
      
      // Validasi bahwa tanggal valid menggunakan tahun yang dipilih
      const testDate = dayjs(`${currentYear}-${month}-${day}`);
      if (!testDate.isValid() || testDate.month() !== (monthNum - 1) || testDate.date() !== dayNum) {
        alert(`Tanggal mulai ${day}/${month} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      // Tanggal mulai sudah valid dan tersimpan di state
      // User sekarang bisa memilih tanggal akhir
      alert('Tanggal mulai berhasil dipilih. Sekarang pilih bulan dan hari untuk tanggal akhir, lalu klik "Tambah".');
    } catch (error) {
      console.error('Unexpected error in handleAddStartDate:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddEndDate = () => {
    try {
      // Validasi tahun dipilih dari card tahun
      if (!currentYear) {
        alert('Pilih tahun terlebih dahulu dari card tahun di atas');
        return;
      }
      
      // Validasi input
      if (!endMonth || !endDay) {
        alert('Pilih bulan dan hari untuk tanggal akhir terlebih dahulu');
        return;
      }
      
      // Validasi bahwa semua adalah objek dayjs yang valid
      if (!endMonth.isValid || !endMonth.isValid()) {
        console.error('Invalid endMonth:', endMonth);
        alert('Bulan akhir yang dipilih tidak valid');
        return;
      }
      
      if (!endDay.isValid || !endDay.isValid()) {
        console.error('Invalid endDay:', endDay);
        alert('Hari akhir yang dipilih tidak valid');
        return;
      }
      
      // Format: MM-DD (bulan-hari)
      let endMonthStr, endDayStr;
      try {
        endMonthStr = String(endMonth.month() + 1).padStart(2, '0');
        endDayStr = String(endDay.date()).padStart(2, '0');
      } catch (formatError) {
        console.error('Error formatting date:', formatError);
        alert('Error memformat tanggal. Silakan coba lagi.');
        return;
      }
      
      // Validasi format yang dihasilkan
      const endMonthNum = parseInt(endMonthStr, 10);
      const endDayNum = parseInt(endDayStr, 10);
      
      if (isNaN(endMonthNum) || endMonthNum < 1 || endMonthNum > 12) {
        console.error('Invalid end month:', endMonthStr);
        alert('Bulan akhir tidak valid');
        return;
      }
      
      if (isNaN(endDayNum) || endDayNum < 1 || endDayNum > 31) {
        console.error('Invalid end day:', endDayStr);
        alert('Hari akhir tidak valid');
        return;
      }
      
      // Validasi bahwa tanggal valid menggunakan tahun yang dipilih
      const testEndDate = dayjs(`${currentYear}-${endMonthStr}-${endDayStr}`);
      if (!testEndDate.isValid() || testEndDate.month() !== (endMonthNum - 1) || testEndDate.date() !== endDayNum) {
        alert(`Tanggal akhir ${endDayStr}/${endMonthStr} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      // Cek apakah tanggal mulai sudah dipilih dan valid
      if (!startMonth || !startDay) {
        alert('Pilih tanggal mulai terlebih dahulu (bulan, hari, lalu klik "Tambah")');
        return;
      }
      
      // Validasi tanggal mulai juga
      if (!startMonth.isValid || !startMonth.isValid() || !startDay.isValid || !startDay.isValid()) {
        alert('Tanggal mulai tidak valid. Silakan pilih ulang tanggal mulai.');
        return;
      }
      
      // Format tanggal mulai
      let startMonthStr, startDayStr;
      try {
        startMonthStr = String(startMonth.month() + 1).padStart(2, '0');
        startDayStr = String(startDay.date()).padStart(2, '0');
      } catch (formatError) {
        console.error('Error formatting start date:', formatError);
        alert('Error memformat tanggal mulai. Silakan coba lagi.');
        return;
      }
      
      // Validasi bahwa tanggal akhir >= tanggal mulai
      const startDate = dayjs(`${currentYear}-${startMonthStr}-${startDayStr}`);
      const endDate = dayjs(`${currentYear}-${endMonthStr}-${endDayStr}`);
      
      if (endDate.isBefore(startDate)) {
        alert('Tanggal akhir harus lebih besar atau sama dengan tanggal mulai');
        return;
      }
      
      // Batasi jumlah range
      if (rangeDates.length >= MAX_RANGE_DATES) {
        alert(`Maksimal ${MAX_RANGE_DATES} range yang bisa dipilih. Hapus range yang ada terlebih dahulu.`);
        return;
      }
      
      const startMonthDay = `${startMonthStr}-${startDayStr}`;
      const endMonthDay = `${endMonthStr}-${endDayStr}`;
      
      // Gunakan tahun dari card tahun di atas
      const rangeYear = currentYear;
      
      // Cek apakah range dengan tahun yang sama sudah ada
      const rangeExists = rangeDates.some(range => 
        range.start === startMonthDay && range.end === endMonthDay && range.year === rangeYear
      );
      
      if (rangeExists) {
        alert(`Range tanggal ini untuk tahun ${rangeYear} sudah dipilih`);
        return;
      }
      
      // Panggil onAddRange dengan error handling - termasuk tahun
      try {
        onAddRange({ start: startMonthDay, end: endMonthDay, year: rangeYear });
        // Reset semua state setelah berhasil menambahkan
        setStartMonth(null);
        setStartDay(null);
        setEndMonth(null);
        setEndDay(null);
      } catch (addError) {
        console.error('Error adding range:', addError);
        alert('Error menambahkan range: ' + (addError.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Unexpected error in handleAddEndDate:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const pickerSx = {
    width: '130px',
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      borderRadius: 1,
      bgcolor: 'white',
      transition: 'all 0.2s ease',
      height: '36px',
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
      fontSize: '0.8125rem',
      color: '#616161',
      '&.Mui-focused': {
        color: '#1976d2'
      }
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': {
      color: '#616161',
      padding: '4px',
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
        gap: 1.5,
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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 0.5
        }}>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: '0.875rem', 
            color: '#212121', 
            letterSpacing: '-0.01em',
            lineHeight: 1.3
          }}>
            Range Tanggal (Bulan & Hari) - Max 1
          </Typography>
        </Box>

        {/* Container Horizontal untuk Mulai dan Sampai */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          flexWrap: 'wrap'
        }}>
          {/* Bagian Mulai */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            flexWrap: 'wrap',
            flex: 1,
            minWidth: '280px'
          }}>
            {/* Label Mulai */}
            <Typography sx={{ 
              fontSize: '0.8125rem', 
              color: '#616161', 
              fontWeight: 500,
              minWidth: '45px',
              flexShrink: 0
            }}>
              Mulai:
            </Typography>

            {/* Pilih Bulan Mulai */}
            <DatePicker
              value={startMonth}
              onChange={(newValue) => {
                try {
                  if (newValue && newValue.isValid && newValue.isValid()) {
                    setStartMonth(newValue);
                    // Reset selectedDay jika bulan berubah
                    if (startDay) {
                      setStartDay(null);
                    }
                  } else if (newValue === null) {
                    setStartMonth(null);
                    setStartDay(null);
                  }
                } catch (error) {
                  console.error('Error in start month onChange:', error);
                }
              }}
            views={['month']}
            openTo="month"
            disabled={!currentYear}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Bulan Mulai',
                sx: pickerSx
              },
              actionBar: {
                actions: ['cancel', 'accept']
              }
            }}
          />

          {/* Pilih Hari Mulai */}
          <DatePicker
            value={startDay}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  // Validasi bahwa hari sesuai dengan bulan yang dipilih
                  if (startMonth && newValue.month() !== startMonth.month()) {
                    console.warn('Selected day month does not match selected month');
                    return;
                  }
                  setStartDay(newValue);
                } else if (newValue === null) {
                  setStartDay(null);
                }
              } catch (error) {
                console.error('Error in start day onChange:', error);
              }
            }}
            views={['day']}
            openTo="day"
            disabled={!currentYear || !startMonth}
            minDate={startMonth && currentYear ? dayjs(`${currentYear}-${String(startMonth.month() + 1).padStart(2, '0')}-01`) : null}
            maxDate={startMonth && currentYear ? dayjs(`${currentYear}-${String(startMonth.month() + 1).padStart(2, '0')}-${dayjs(`${currentYear}-${String(startMonth.month() + 1).padStart(2, '0')}-01`).daysInMonth()}`) : null}
            defaultCalendarMonth={startMonth && currentYear ? dayjs(`${currentYear}-${String(startMonth.month() + 1).padStart(2, '0')}-01`) : null}
            shouldDisableDate={(date) => {
              if (!startMonth) return true;
              const month = date.month();
              const selectedMonthValue = startMonth.month();
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
              }
            }}
          />

          {/* Tombol Tambah Mulai */}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleAddStartDate}
            disabled={!currentYear || !startMonth || !startDay}
            sx={{
              borderColor: '#e0e0e0',
              color: '#616161',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
              minWidth: '80px',
              height: '36px',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#bdbdbd',
                bgcolor: '#fafafa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
          </Box>

          {/* Bagian Sampai */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            flexWrap: 'wrap',
            flex: 1,
            minWidth: '280px'
          }}>
            {/* Label Sampai */}
            <Typography sx={{ 
              fontSize: '0.8125rem', 
              color: '#616161', 
              fontWeight: 500,
              minWidth: '45px',
              flexShrink: 0
            }}>
              Sampai:
            </Typography>

            {/* Pilih Bulan Akhir */}
            <DatePicker
              value={endMonth}
              onChange={(newValue) => {
                try {
                  if (newValue && newValue.isValid && newValue.isValid()) {
                    setEndMonth(newValue);
                    // Reset selectedDay jika bulan berubah
                    if (endDay) {
                      setEndDay(null);
                    }
                  } else if (newValue === null) {
                    setEndMonth(null);
                    setEndDay(null);
                  }
                } catch (error) {
                  console.error('Error in end month onChange:', error);
                }
              }}
            views={['month']}
            openTo="month"
            disabled={!currentYear}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Bulan Akhir',
                sx: pickerSx
              },
              actionBar: {
                actions: ['cancel', 'accept']
              }
            }}
          />

          {/* Pilih Hari Akhir */}
          <DatePicker
            value={endDay}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  // Validasi bahwa hari sesuai dengan bulan yang dipilih
                  if (endMonth && newValue.month() !== endMonth.month()) {
                    console.warn('Selected day month does not match selected month');
                    return;
                  }
                  setEndDay(newValue);
                } else if (newValue === null) {
                  setEndDay(null);
                }
              } catch (error) {
                console.error('Error in end day onChange:', error);
              }
            }}
            views={['day']}
            openTo="day"
            disabled={!currentYear || !endMonth}
            minDate={endMonth && currentYear ? dayjs(`${currentYear}-${String(endMonth.month() + 1).padStart(2, '0')}-01`) : null}
            maxDate={endMonth && currentYear ? dayjs(`${currentYear}-${String(endMonth.month() + 1).padStart(2, '0')}-${dayjs(`${currentYear}-${String(endMonth.month() + 1).padStart(2, '0')}-01`).daysInMonth()}`) : null}
            defaultCalendarMonth={endMonth && currentYear ? dayjs(`${currentYear}-${String(endMonth.month() + 1).padStart(2, '0')}-01`) : null}
            shouldDisableDate={(date) => {
              if (!endMonth) return true;
              const month = date.month();
              const selectedMonthValue = endMonth.month();
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
              }
            }}
          />

          {/* Tombol Tambah Akhir */}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleAddEndDate}
            disabled={!currentYear || !endMonth || !endDay || rangeDates.length >= MAX_RANGE_DATES}
            sx={{
              borderColor: '#e0e0e0',
              color: '#616161',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
              minWidth: '80px',
              height: '36px',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#bdbdbd',
                bgcolor: '#fafafa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
          </Box>
        </Box>

        <Typography sx={{ 
          fontSize: '0.7rem', 
          color: '#9e9e9e',
          lineHeight: 1.4,
          mt: 0.5
        }}>
          {currentYear 
            ? '* Pilih bulan dan hari untuk tanggal mulai, lalu klik "Tambah". Setelah itu pilih bulan dan hari untuk tanggal akhir, lalu klik "Tambah". Tahun dipilih dari card tahun di atas.'
            : '* Pilih tahun terlebih dahulu dari card tahun di atas sebelum memilih bulan dan hari.'}
        </Typography>

        {/* Daftar Range yang Sudah Ditambahkan */}
        {rangeDates.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.75, 
            mt: 1,
            pt: 1,
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
                  fontSize: '0.75rem',
                  height: 28,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#bdbdbd',
                    bgcolor: '#fafafa'
                  },
                  '& .MuiChip-deleteIcon': {
                    color: '#9e9e9e',
                    fontSize: '0.875rem',
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
