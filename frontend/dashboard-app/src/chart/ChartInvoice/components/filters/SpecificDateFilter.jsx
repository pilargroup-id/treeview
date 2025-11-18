import React, { useState } from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

function SpecificDateFilter({ 
  specificDates,
  onAddDate,
  onRemoveDate,
  availableYears = []
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Generate Tahun 
  const years = availableYears.length > 0 
    ? availableYears.sort((a, b) => a - b)
    : [2021, 2022, 2023, 2024, 2025].sort((a, b) => a - b);

  const handleAddDate = () => {
    try {
      // Validasi input
      if (!selectedMonth || !selectedDay) {
        alert('Pilih bulan dan hari terlebih dahulu');
        return;
      }
      
      // Validasi bahwa selectedMonth dan selectedDay adalah objek dayjs yang valid
      if (!selectedMonth.isValid || !selectedMonth.isValid()) {
        console.error('Invalid selectedMonth:', selectedMonth);
        alert('Bulan yang dipilih tidak valid');
        return;
      }
      
      if (!selectedDay.isValid || !selectedDay.isValid()) {
        console.error('Invalid selectedDay:', selectedDay);
        alert('Hari yang dipilih tidak valid');
        return;
      }
      
      // Validasi jumlah tanggal berdasarkan tahun yang dipilih
      // API membatasi maksimal 30 tanggal YYYY-MM-DD
      // Kita perlu tahu berapa tahun yang dipilih, tapi karena ini di filter component,
      // kita akan menggunakan availableYears sebagai referensi
      // Validasi sebenarnya dilakukan di apiService.js
      const MAX_SPECIFIC_DATES = 30; // Batasi maksimal 30 tanggal (untuk 1 tahun)
      if (specificDates.length >= MAX_SPECIFIC_DATES) {
        alert(`Maksimal ${MAX_SPECIFIC_DATES} tanggal yang bisa dipilih untuk menghindari error`);
        return;
      }
      
      // Format: MM-DD (bulan-hari)
      let month, day;
      try {
        month = String(selectedMonth.month() + 1).padStart(2, '0');
        day = String(selectedDay.date()).padStart(2, '0');
      } catch (formatError) {
        console.error('Error formatting date:', formatError);
        alert('Error memformat tanggal. Silakan coba lagi.');
        return;
      }
      
      // Validasi format yang dihasilkan
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        console.error('Invalid month:', month);
        alert('Bulan tidak valid');
        return;
      }
      
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        console.error('Invalid day:', day);
        alert('Hari tidak valid');
        return;
      }
      
      // Validasi bahwa tanggal valid (misalnya 31 Februari tidak valid)
      const testDate = dayjs(`2024-${month}-${day}`);
      if (!testDate.isValid() || testDate.month() !== (monthNum - 1) || testDate.date() !== dayNum) {
        alert(`Tanggal ${day}/${month} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      const monthDay = `${month}-${day}`;
      
      if (specificDates.includes(monthDay)) {
        alert('Tanggal ini sudah dipilih');
        return;
      }
      
      // Panggil onAddDate dengan error handling
      try {
        onAddDate(monthDay);
        setSelectedMonth(null);
        setSelectedDay(null);
      } catch (addError) {
        console.error('Error adding date:', addError);
        alert('Error menambahkan tanggal: ' + (addError.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Unexpected error in handleAddDate:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const formatDateDisplay = (monthDay) => {
    const [month, day] = monthDay.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
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
          Tanggal Tertentu (Bulan & Hari)
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 1.5, 
          flexWrap: 'wrap',
          mb: 1
        }}>
          <DatePicker
            value={selectedMonth}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  setSelectedMonth(newValue);
                  // Reset selectedDay jika bulan berubah
                  if (selectedDay) {
                    setSelectedDay(null);
                  }
                } else if (newValue === null) {
                  setSelectedMonth(null);
                  setSelectedDay(null);
                }
              } catch (error) {
                console.error('Error in month onChange:', error);
              }
            }}
            views={['month']}
            openTo="month"
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Bulan',
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
                      bgcolor: 'rgba(25, 118, 210, 0.04)'
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
              }
            }}
          />
          <DatePicker
            value={selectedDay}
            onChange={(newValue) => {
              try {
                if (newValue && newValue.isValid && newValue.isValid()) {
                  // Validasi bahwa hari sesuai dengan bulan yang dipilih
                  if (selectedMonth && newValue.month() !== selectedMonth.month()) {
                    console.warn('Selected day month does not match selected month');
                    return;
                  }
                  setSelectedDay(newValue);
                } else if (newValue === null) {
                  setSelectedDay(null);
                }
              } catch (error) {
                console.error('Error in day onChange:', error);
              }
            }}
            views={['day']}
            openTo="day"
            disabled={!selectedMonth}
            minDate={selectedMonth ? dayjs(`2021-${String(selectedMonth.month() + 1).padStart(2, '0')}-01`) : null}
            maxDate={selectedMonth ? dayjs(`2025-${String(selectedMonth.month() + 1).padStart(2, '0')}-${dayjs(`2025-${String(selectedMonth.month() + 1).padStart(2, '0')}-01`).daysInMonth()}`) : null}
            defaultCalendarMonth={selectedMonth ? dayjs(`2021-${String(selectedMonth.month() + 1).padStart(2, '0')}-01`) : null}
            shouldDisableDate={(date) => {
              if (!selectedMonth) return true;
              const month = date.month();
              const selectedMonthValue = selectedMonth.month();
              return month !== selectedMonthValue;
            }}
            sx={pickerSx}
            slotProps={{
              textField: {
                size: 'small',
                label: 'Hari',
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
                      bgcolor: 'rgba(25, 118, 210, 0.04)'
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
              }
            }}
          />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleAddDate}
            disabled={!selectedMonth || !selectedDay || specificDates.length >= 30}
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
              {specificDates.length}/30
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
          * Pilih bulan dan hari untuk setiap tanggal yang ingin ditambahkan.
        </Typography>
        {specificDates.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mt: 1.5,
            pt: 1.5,
            borderTop: '1px solid #e0e0e0'
          }}>
            {specificDates.sort().map((date) => (
              <Chip
                key={date}
                label={formatDateDisplay(date)}
                onDelete={() => onRemoveDate(date)}
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
}

export default SpecificDateFilter;

