import React, { useState } from 'react';
import { Box, Button, Typography, Chip, Grid, Card, CardContent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

function CompareYearFilter({ 
  compareDates, 
  onAddCompareDate, 
  onRemoveCompareDate,
  compareYears,
  availableYears,
  onToggleCompareYear
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const handleAddDate = () => {
    if (!selectedMonth || !selectedDay) {
      alert('Pilih bulan dan hari terlebih dahulu');
      return;
    }
    
    const month = String(selectedMonth.month() + 1).padStart(2, '0');
    const day = String(selectedDay.date()).padStart(2, '0');
    const monthDay = `${month}-${day}`;
    
    if (compareDates.includes(monthDay)) {
      alert('Tanggal & bulan ini sudah dipilih');
      return;
    }
    
    onAddCompareDate(monthDay);
    setSelectedMonth(null);
    setSelectedDay(null);
  };

  const formatDateDisplay = (monthDay) => {
    const [month, day] = monthDay.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
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
        gap: 3,
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
        <Box>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: '0.875rem', 
            mb: 2, 
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4
          }}>
            Pilih Tanggal & Bulan
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <DatePicker
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue)}
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
            disabled={!selectedMonth || !selectedDay}
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
        </Box>
        {compareDates.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {compareDates.map((monthDay) => (
              <Chip
                key={monthDay}
                label={formatDateDisplay(monthDay)}
                onDelete={() => onRemoveCompareDate(monthDay)}
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

      {compareDates.length > 0 && (
        <Box>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: '0.875rem', 
            mb: 2, 
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4
          }}>
            Pilih Tahun untuk Perbandingan
          </Typography>
          <Grid container spacing={2}>
            {availableYears.map(year => {
              const isSelected = compareYears.includes(year);
              return (
                <Grid item xs={12} sm={6} md={2.4} key={year} sx={{ display: 'flex' }}>
                  <Card 
                    onClick={() => onToggleCompareYear(year)}
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 2, 
                      boxShadow: isSelected 
                        ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
                        : '0 1px 3px rgba(0, 0, 0, 0.04)',
                      width: '100%',
                      border: `1px solid ${isSelected ? '#212121' : '#e0e0e0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: 'white',
                      position: 'relative',
                      '&::before': isSelected ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        bgcolor: '#212121'
                      } : {},
                      '&:hover': {
                        borderColor: isSelected ? '#212121' : '#bdbdbd',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-2px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: '0 !important', textAlign: 'center' }}>
                      <Typography sx={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: '#212121',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.3
                      }}>
                        {year}
                      </Typography>
                      {isSelected && (
                        <Typography sx={{ 
                          fontSize: '0.75rem', 
                          color: '#616161', 
                          fontWeight: 500, 
                          mt: 0.5,
                          lineHeight: 1.4
                        }}>
                          Dipilih
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
      </Box>
    </LocalizationProvider>
  );
}

export default CompareYearFilter;

