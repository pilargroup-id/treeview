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
  selectedYear = null,
  availableYears = [],
  onToggleYear
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const handleAddDate = () => {
    if (!selectedYear) {
      alert('Pilih tahun terlebih dahulu dari card tahun di atas');
      return;
    }
    
    if (!selectedMonth || !selectedDay) {
      alert('Pilih bulan dan hari terlebih dahulu');
      return;
    }
    
    if (specificDates.length >= 30) {
      alert('Maksimal 30 tanggal');
      return;
    }
    
    // Ambil bulan dari month picker (0-11, jadi +1 untuk 1-12)
    const month = String(selectedMonth.month() + 1).padStart(2, '0');
    // Ambil hari dari date picker
    const day = String(selectedDay.date()).padStart(2, '0');
    const monthDay = `${month}-${day}`;
    
    if (specificDates.includes(monthDay)) {
      alert('Tanggal sudah dipilih');
      return;
    }
    
    onAddDate(monthDay);
    setSelectedMonth(null);
    setSelectedDay(null);
  };

  const formatDateDisplay = (monthDay) => {
    const [month, day] = monthDay.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const year = selectedYear || new Date().getFullYear();
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
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
        gap: 2.5,
        '& .MuiPickersPopper-root': {
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
      }}>
        <Typography sx={{ 
          fontWeight: 600, 
          fontSize: '0.875rem', 
          color: '#212121', 
          mb: 0.5,
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          Tanggal Tertentu (Bulan & Hari) - Max 30
        </Typography>
        
        {!selectedYear && (
          <Box sx={{ 
            p: 1.5, 
            bgcolor: '#fff3cd', 
            borderRadius: 1.5, 
            border: '1px solid #ffc107',
            mb: 1.5
          }}>
            <Typography sx={{ 
              fontSize: '0.8125rem', 
              color: '#856404',
              lineHeight: 1.5,
              fontWeight: 500
            }}>
              ⚠️ Pilih 1 tahun terlebih dahulu dari card tahun di atas sebelum menambah tanggal
            </Typography>
          </Box>
        )}
        
        {selectedYear && (
          <Box sx={{ 
            p: 1.5, 
            bgcolor: '#e8f5e9', 
            borderRadius: 1.5, 
            border: '1px solid #4caf50',
            mb: 1.5
          }}>
            <Typography sx={{ 
              fontSize: '0.8125rem', 
              color: '#2e7d32',
              lineHeight: 1.5,
              fontWeight: 500
            }}>
              ✓ Tahun yang dipilih: <strong>{selectedYear}</strong>
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <DatePicker
            value={selectedMonth}
            onChange={(newValue) => setSelectedMonth(newValue)}
            views={['month']}
            openTo="month"
            disabled={!selectedYear}
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
          <DatePicker
            value={selectedDay}
            onChange={(newValue) => setSelectedDay(newValue)}
            views={['day']}
            openTo="day"
            disabled={!selectedYear || !selectedMonth}
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
          <Button 
            variant="outlined" 
            size="medium" 
            onClick={handleAddDate}
            disabled={!selectedYear || specificDates.length >= 30 || !selectedMonth || !selectedDay}
          sx={{
            borderColor: '#e0e0e0',
            color: '#616161',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 1.5,
            px: 2.5,
            py: 1.25,
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
          <Typography sx={{ 
            fontSize: '0.75rem', 
            color: '#9e9e9e',
            alignSelf: 'center',
            lineHeight: 1.5
          }}>
            {specificDates.length}/30 tanggal
          </Typography>
        </Box>
      <Typography sx={{ 
        fontSize: '0.75rem', 
        color: '#9e9e9e',
        lineHeight: 1.5,
        mt: 0.5
      }}>
        * Pilih 1 tahun dari card tahun di atas terlebih dahulu, lalu isi bulan dan tanggal, klik tambah. Setelah menambah tanggal, tahun bisa diganti untuk menambah tanggal tahun lain.
      </Typography>
      {specificDates.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {specificDates.map((date) => (
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
                height: 30,
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

