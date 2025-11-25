import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Chip, Paper, Portal, Backdrop, Fade } from "@mui/material";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatMonthDisplay = (month, year) => {
  const monthIndex = parseInt(month) - 1;
  const monthName = monthNames[monthIndex] || month;
  return year ? `${monthName} ${year}` : monthName;
};

export const MonthRangePicker = ({ 
  rangeMonths = [],
  onAddRange,
  onRemoveRange,
  availableYears = [],
  monthlyData = [],
  onError = null
}) => {
  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });
  
  const [showPicker, setShowPicker] = useState(false);
  
  const anchorRef = useRef(null);
  const pickerRef = useRef(null);
  
  const MAX_RANGE_MONTHS = 1; 

  useEffect(() => {
    if (rangeMonths.length > 0) {
      setSelectionRange({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      });
    }
  }, [rangeMonths]);

  const handleSelect = (ranges) => {
    setSelectionRange(ranges.selection);
  };

  const handleAddRange = () => {
    try {
      // Validasi input
      if (!selectionRange.startDate || !selectionRange.endDate) {
        const errorMsg = 'Pilih bulan mulai dan akhir terlebih dahulu';
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      const startYear = selectionRange.startDate.getFullYear();
      const endYear = selectionRange.endDate.getFullYear();
      
      const startMonth = String(selectionRange.startDate.getMonth() + 1).padStart(2, '0');
      const endMonth = String(selectionRange.endDate.getMonth() + 1).padStart(2, '0');
      
      // Validasi tahun harus sama
      if (startYear !== endYear) {
        const errorMsg = 'Bulan mulai dan akhir harus dalam tahun yang sama';
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      // Validasi bulan akhir harus >= bulan mulai
      if (parseInt(endMonth) < parseInt(startMonth)) {
        const errorMsg = 'Bulan akhir harus >= bulan mulai';
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      // Validasi range maksimal 12 bulan
      const diffInMonths = parseInt(endMonth) - parseInt(startMonth) + 1;
      if (diffInMonths > 12) {
        const errorMsg = 'Range bulan maksimal 12 bulan';
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      // Validasi minimal 1 bulan
      if (diffInMonths < 1) {
        const errorMsg = 'Range bulan minimal 1 bulan';
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      const rangeExists = rangeMonths.some(range => 
        range.start === startMonth && range.end === endMonth && range.year === startYear
      );
      
      if (rangeExists) {
        const errorMsg = 'Range dengan bulan ini sudah ada';
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      // Cek maksimal 
      if (MAX_RANGE_MONTHS === 1 && rangeMonths.length >= 1) {
        const errorMsg = `Maksimal ${MAX_RANGE_MONTHS} range yang bisa dipilih. Hapus range yang ada terlebih dahulu.`;
        if (onError) onError(errorMsg);
        else alert(errorMsg);
        return;
      }
      
      try {
        onAddRange({ start: startMonth, end: endMonth, year: startYear });
        
        setSelectionRange({
          startDate: new Date(),
          endDate: new Date(),
          key: 'selection',
        });
        
        setShowPicker(false);
      } catch (addError) {
        console.error('Error adding range:', addError);
        const errorMsg = 'Error menambahkan range: ' + (addError.message || 'Unknown error');
        if (onError) onError(errorMsg);
        else alert(errorMsg);
      }
    } catch (error) {
      console.error('Unexpected error in handleAddRange:', error);
      const errorMsg = 'Terjadi error: ' + (error.message || 'Unknown error');
      if (onError) onError(errorMsg);
      else alert(errorMsg);
    }
  };

  const getMinDate = () => {
    if (availableYears.length === 0) return new Date();
    const minYear = Math.min(...availableYears);
    return new Date(minYear, 0, 1);
  };

  const getMaxDate = () => {
    if (availableYears.length === 0) return new Date();
    const maxYear = Math.max(...availableYears);
    return new Date(maxYear, 11, 31);
  };

  useEffect(() => {
    if (!showPicker || !pickerRef.current) return;

    const applyStyles = () => {
      const picker = pickerRef.current;
      if (!picker) return;

      const definedRangesWrapper = picker.querySelector('.rdr-DefinedRangesWrapper');
      if (definedRangesWrapper) {
        definedRangesWrapper.style.setProperty('display', 'none', 'important');
      }

      const dateRange = picker.querySelector('.rdr-DateRange');
      const calendarWrapper = picker.querySelector('.rdr-CalendarWrapper');
      const calendars = picker.querySelectorAll('.rdr-Calendar');
      const month = picker.querySelector('.rdr-Month');
      const days = picker.querySelectorAll('.rdr-Day');
      const dayNumbers = picker.querySelectorAll('.rdr-DayNumber');
      const weekDays = picker.querySelectorAll('.rdr-WeekDay');
      const dateDisplay = picker.querySelector('.rdr-DateDisplay');
      const dateDisplayItems = picker.querySelectorAll('.rdr-DateDisplayItem');
      const monthYearWrapper = picker.querySelector('.rdr-MonthAndYearWrapper');
      const monthYearPickers = picker.querySelectorAll('.rdr-MonthAndYearPickers');
      const daysContainer = picker.querySelector('.rdr-Days');
      const weekDaysContainer = picker.querySelector('.rdr-WeekDays');
      const dateDisplayWrapper = picker.querySelector('.rdr-DateDisplayWrapper');

      if (dateRange) {
        dateRange.style.setProperty('display', 'flex', 'important');
        dateRange.style.setProperty('flex-direction', 'row', 'important');
        dateRange.style.setProperty('width', '100%', 'important');
      }
      if (calendarWrapper) {
        calendarWrapper.style.setProperty('display', 'flex', 'important');
        calendarWrapper.style.setProperty('flex-direction', 'row', 'important');
        calendarWrapper.style.setProperty('width', '100%', 'important');
      }
      if (calendars.length > 0) {
        calendars.forEach(calendar => {
          calendar.style.setProperty('font-size', '0.875rem', 'important');
          calendar.style.setProperty('width', '50%', 'important');
          calendar.style.setProperty('max-width', '50%', 'important');
          calendar.style.setProperty('flex', '1 1 50%', 'important');
        });
      }
      if (month) {
        month.style.setProperty('padding', '0.75rem', 'important');
        month.style.setProperty('width', '100%', 'important');
      }
      if (days.length > 0) {
        days.forEach(day => {
          day.style.setProperty('height', '36px', 'important');
          day.style.setProperty('width', '36px', 'important');
          day.style.setProperty('max-width', '36px', 'important');
          day.style.setProperty('max-height', '36px', 'important');
          day.style.setProperty('line-height', '36px', 'important');
          day.style.setProperty('margin', '2px', 'important');
          day.style.setProperty('font-size', '0.875rem', 'important');
        });
      }
      if (dayNumbers.length > 0) {
        dayNumbers.forEach(dayNum => {
          dayNum.style.setProperty('font-size', '0.875rem', 'important');
          dayNum.style.setProperty('padding', '0', 'important');
          dayNum.style.setProperty('line-height', '36px', 'important');
        });
      }
      if (weekDays.length > 0) {
        weekDays.forEach(weekDay => {
          weekDay.style.setProperty('font-size', '0.75rem', 'important');
          weekDay.style.setProperty('padding', '0.5rem', 'important');
          weekDay.style.setProperty('font-weight', '600', 'important');
        });
      }
      if (dateDisplay) {
        dateDisplay.style.setProperty('padding', '0.75rem', 'important');
        dateDisplay.style.setProperty('font-size', '0.875rem', 'important');
        dateDisplay.style.setProperty('min-height', 'auto', 'important');
        dateDisplay.style.setProperty('max-height', 'none', 'important');
      }
      if (dateDisplayItems.length > 0) {
        dateDisplayItems.forEach(item => {
          item.style.setProperty('padding', '0.5rem 0.75rem', 'important');
          item.style.setProperty('font-size', '0.875rem', 'important');
          item.style.setProperty('line-height', '1.5', 'important');
        });
      }
      if (monthYearWrapper) {
        monthYearWrapper.style.setProperty('padding', '0.75rem', 'important');
        monthYearWrapper.style.setProperty('min-height', 'auto', 'important');
        monthYearWrapper.style.setProperty('max-height', 'none', 'important');
      }
      if (monthYearPickers.length > 0) {
        monthYearPickers.forEach(pickerEl => {
          pickerEl.style.setProperty('font-size', '1rem', 'important');
          pickerEl.style.setProperty('font-weight', '600', 'important');
        });
      }
      if (daysContainer) {
        daysContainer.style.setProperty('padding', '0.5rem', 'important');
      }
      if (weekDaysContainer) {
        weekDaysContainer.style.setProperty('padding', '0.5rem 0', 'important');
      }
      if (dateDisplayWrapper) {
        dateDisplayWrapper.style.setProperty('padding', '0.75rem', 'important');
      }
    };

    const timeouts = [
      setTimeout(applyStyles, 0),
      setTimeout(applyStyles, 50),
      setTimeout(applyStyles, 100),
      setTimeout(applyStyles, 200),
    ];

    const observer = new MutationObserver(() => {
      applyStyles();
    });

    if (pickerRef.current) {
      observer.observe(pickerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
    };
  }, [showPicker]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 1.5,
      position: 'relative'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 1
      }}>
        <Typography sx={{ 
          fontWeight: 600, 
          fontSize: '0.875rem', 
          color: '#0F172A',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          letterSpacing: '-0.01em',
          lineHeight: 1.3
        }}>
          Range Bulan - Max 1 Range, 12 Bulan
        </Typography>
      </Box>

      {/* Tombol untuk menampilkan DateRangePicker */}
      <Box sx={{ mb: 2, position: 'relative' }} ref={anchorRef}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setShowPicker(!showPicker)}
          disabled={rangeMonths.length >= MAX_RANGE_MONTHS}
          startIcon={
            <CalendarMonthRoundedIcon 
              sx={{ 
                fontSize: '1.1rem',
                color: showPicker ? '#6BA3D0' : '#64748B',
                transition: 'color 0.2s ease'
              }} 
            />
          }
          sx={{
            borderColor: showPicker ? '#6BA3D0' : '#E2E8F0',
            color: showPicker ? '#6BA3D0' : '#475569',
            bgcolor: showPicker ? 'rgba(107, 163, 208, 0.08)' : 'transparent',
            textTransform: 'none',
            fontSize: '0.8125rem',
            fontWeight: showPicker ? 600 : 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            borderRadius: 1.5,
            px: 2,
            py: 0.875,
            minWidth: '180px',
            height: '38px',
            boxShadow: showPicker ? '0 2px 4px rgba(107, 163, 208, 0.15)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: '#6BA3D0',
              bgcolor: showPicker ? 'rgba(107, 163, 208, 0.12)' : 'rgba(107, 163, 208, 0.06)',
              boxShadow: showPicker ? '0 2px 6px rgba(107, 163, 208, 0.2)' : 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)'
            },
            '&:disabled': {
              borderColor: '#E2E8F0',
              color: '#94A3B8',
              bgcolor: '#F8FAFC',
              transform: 'none',
              cursor: 'not-allowed'
            }
          }}
        >
          {showPicker ? 'Tutup Kalender' : 'Pilih Range Bulan'}
        </Button>

        {/* Backdrop Overlay dengan Portal */}
        {showPicker && (
          <Portal>
            <Backdrop
              open={showPicker}
              onClick={() => setShowPicker(false)}
              sx={{
                zIndex: 1299,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            
            {/* DateRangePicker Modal - Terpusat dan Besar */}
            <Fade in={showPicker} timeout={300}>
              <Paper
                ref={pickerRef}
                elevation={8}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1300,
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'white',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                  width: { xs: '95%', sm: '90%', md: '800px', lg: '950px' },
                  maxWidth: '950px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& *': {
                    boxSizing: 'border-box',
                  },
                  '& .rdr-DefinedRangesWrapper': {
                    display: 'none !important',
                  },
                  '& .rdr-DateRangePicker': {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: '100%',
                  },
                  '& .rdr-DateRange': {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: '100%',
                    display: 'flex !important',
                    flexDirection: 'row !important',
                  },
                  '& .rdr-CalendarWrapper': {
                    display: 'flex !important',
                    flexDirection: 'row !important',
                    width: '100% !important',
                  },
                  '& .rdr-Calendar': {
                    borderRadius: 3,
                    width: '50% !important',
                    maxWidth: '50% !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                    flex: '1 1 50% !important',
                  },
                  '& .rdr-Month': {
                    width: '100% !important',
                    maxWidth: '100% !important',
                    padding: '0.75rem !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Day': {
                    fontSize: '0.875rem !important',
                    height: '36px !important',
                    width: '36px !important',
                    maxWidth: '36px !important',
                    maxHeight: '36px !important',
                    lineHeight: '36px !important',
                    margin: '2px !important',
                    padding: '0 !important',
                  },
                  '& .rdr-DayNumber': {
                    fontSize: '0.875rem !important',
                    padding: '0 !important',
                    lineHeight: '36px !important',
                  },
                  '& .rdr-MonthAndYearWrapper': {
                    paddingTop: '0.75rem !important',
                    paddingBottom: '0.75rem !important',
                    paddingLeft: '0.75rem !important',
                    paddingRight: '0.75rem !important',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                  },
                  '& .rdr-MonthAndYearPickers': {
                    fontSize: '1rem !important',
                    fontWeight: '600 !important',
                    padding: '0 !important',
                  },
                  '& .rdr-WeekDay': {
                    fontSize: '0.75rem !important',
                    fontWeight: '600 !important',
                    padding: '0.5rem !important',
                    height: 'auto !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Days': {
                    padding: '0.5rem !important',
                    margin: '0 !important',
                  },
                  '& .rdr-DateDisplay': {
                    padding: '0.75rem !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                  },
                  '& .rdr-DateDisplayItem': {
                    padding: '0.5rem 0.75rem !important',
                    fontSize: '0.875rem !important',
                    lineHeight: '1.5 !important',
                  },
                  '& .rdr-WeekDays': {
                    padding: '0.5rem 0 !important',
                    margin: '0 !important',
                  },
                  '& .rdr-DateDisplayWrapper': {
                    padding: '0.75rem !important',
                    margin: '0 !important',
                  }
                }}
              >
                {/* Header dengan judul dan tombol tutup */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderBottom: '1px solid #F1F5F9',
                  bgcolor: '#FAFBFC'
                }}>
                  <Typography sx={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Pilih Range Bulan
                  </Typography>
                  <Button
                    onClick={() => {
                      setShowPicker(false);
                      setSelectionRange({
                        startDate: new Date(),
                        endDate: new Date(),
                        key: 'selection',
                      });
                    }}
                    sx={{
                      minWidth: 'auto',
                      width: '32px',
                      height: '32px',
                      p: 0,
                      borderRadius: '50%',
                      color: '#64748B',
                      '&:hover': {
                        bgcolor: '#F1F5F9',
                        color: '#0F172A'
                      }
                    }}
                  >
                    ✕
                  </Button>
                </Box>

                <Box sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 3,
                  overflow: 'hidden',
                  width: '100%',
                  '& > div': {
                    width: '100% !important',
                  }
                }}>
                  <DateRangePicker
                    ranges={[selectionRange]}
                    onChange={handleSelect}
                    minDate={getMinDate()}
                    maxDate={getMaxDate()}
                    months={2}
                    direction="horizontal"
                    showDateDisplay={true}
                    showMonthAndYearPickers={true}
                  />
                  
                  {/* Tombol Batal dan Tambah Range */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid #F1F5F9',
                    justifyContent: 'flex-end'
                  }}>
                    <Button 
                      variant="outlined" 
                      size="medium" 
                      onClick={() => {
                        setShowPicker(false);
                        setSelectionRange({
                          startDate: new Date(),
                          endDate: new Date(),
                          key: 'selection',
                        });
                      }}
                      sx={{
                        borderColor: '#CBD5E1',
                        color: '#475569',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 2.5,
                        py: 0.75,
                        minWidth: '100px',
                        height: '40px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: '#6BA3D0',
                          color: '#6BA3D0',
                          bgcolor: 'rgba(107, 163, 208, 0.08)',
                          boxShadow: '0 2px 4px rgba(107, 163, 208, 0.15)',
                        }
                      }}
                    >
                      Batal
                    </Button>
                    <Button 
                      variant="contained" 
                      size="medium" 
                      onClick={handleAddRange}
                      disabled={rangeMonths.length >= MAX_RANGE_MONTHS}
                      sx={{
                        bgcolor: '#6BA3D0',
                        color: 'white',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 3,
                        py: 0.75,
                        minWidth: '140px',
                        height: '40px',
                        boxShadow: '0 2px 4px rgba(107, 163, 208, 0.2)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: '#5A9FD0',
                          boxShadow: '0 4px 8px rgba(107, 163, 208, 0.3)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 4px rgba(107, 163, 208, 0.25)'
                        },
                        '&:disabled': {
                          bgcolor: '#E2E8F0',
                          color: '#94A3B8',
                          boxShadow: 'none',
                          transform: 'none',
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      Tambah Range
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Portal>
        )}
      </Box>

      <Typography sx={{ 
        fontSize: '0.75rem', 
        color: '#64748B',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        lineHeight: 1.5,
        mt: 0.5,
        fontStyle: 'italic'
      }}>
        {showPicker 
          ? '* Pilih range bulan menggunakan kalender (pilih tanggal di bulan yang diinginkan). Bulan dan tahun akan diambil dari tanggal yang dipilih. Lalu klik "Tambah Range".'
          : '* Klik tombol "Pilih Range Bulan" untuk memilih range bulan. Pilih tanggal di bulan yang diinginkan untuk menentukan bulan.'}
      </Typography>

      {/* Daftar Range yang Sudah Ditambahkan */}
      {rangeMonths.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.75, 
          mt: 1.5,
          pt: 1.5,
          borderTop: '1px solid #F1F5F9'
        }}>
          {rangeMonths.map((range, index) => (
            <Chip
              key={`${range.start}_${range.end}_${range.year}_${index}`}
              label={`${formatMonthDisplay(range.start, range.year)} - ${formatMonthDisplay(range.end, range.year)}`}
              onDelete={() => onRemoveRange(range)}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#E2E8F0',
                color: '#475569',
                fontSize: '0.75rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                height: 28,
                borderRadius: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  bgcolor: '#F8FAFC'
                },
                '& .MuiChip-deleteIcon': {
                  color: '#94A3B8',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: '#64748B'
                  }
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MonthRangePicker;

