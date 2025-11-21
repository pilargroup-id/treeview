import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Chip, Paper, Portal, Backdrop, Fade, Select, MenuItem, Card } from "@mui/material";
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const TWIN_DATE_PRESETS = [
  { monthDay: '01-01', label: '1 Januari' },
  { monthDay: '02-02', label: '2 Februari' },
  { monthDay: '03-03', label: '3 Maret' },
  { monthDay: '04-04', label: '4 April' },
  { monthDay: '05-05', label: '5 Mei' },
  { monthDay: '06-06', label: '6 Juni' },
  { monthDay: '07-07', label: '7 Juli' },
  { monthDay: '08-08', label: '8 Agustus' },
  { monthDay: '09-09', label: '9 September' },
  { monthDay: '10-10', label: '10 Oktober' },
  { monthDay: '11-11', label: '11 November' },
  { monthDay: '12-12', label: '12 Desember' },
];

const formatDateDisplay = (dateObj) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  if (typeof dateObj === 'string') {
    const [month, day] = dateObj.split('-');
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
  }
  // Jika object, ambil monthDay dan year
  const { monthDay, year } = dateObj;
  if (!monthDay || !year) return '';
  const [month, day] = monthDay.split('-');
  return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
};

export const SingleDatePickerWithYear = ({ 
  specificDates = [],
  onAddDate,
  onRemoveDate,
  availableYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = []
}) => {
  // Generate tahun 
  const years = React.useMemo(() => {
    return availableYears.length > 0 
      ? [...availableYears].sort((a, b) => b - a) 
      : [2025, 2024, 2023, 2022, 2021].sort((a, b) => b - a);
  }, [availableYears]);
  
  const [selectionDate, setSelectionDate] = useState(() => {
    const defaultYear = years.length > 0 ? years[0] : new Date().getFullYear();
    return {
      startDate: new Date(defaultYear, 0, 1),
      endDate: new Date(defaultYear, 0, 1),
      key: 'selection',
    };
  });
  
    const [showPicker, setShowPicker] = useState(false);
  
  const anchorRef = useRef(null);
  const pickerRef = useRef(null);
  
  const MAX_SPECIFIC_DATES = 30; 

  useEffect(() => {
    if (years.length > 0) {
      const defaultYear = years[0];
      // Hanya update
      const currentYear = selectionDate.startDate?.getFullYear();
      if (!currentYear || !availableYears.includes(currentYear)) {
        setSelectionDate({
          startDate: new Date(defaultYear, 0, 1),
          endDate: new Date(defaultYear, 0, 1),
          key: 'selection',
        });
      }
    }
  }, [availableYears, years]);

  const handleSelect = (ranges) => {
    console.log('handleSelect called with ranges:', ranges);
    const selection = ranges.selection;
    if (selection.startDate) {
      console.log('Setting selectionDate to:', selection.startDate);
      setSelectionDate({
        startDate: selection.startDate,
        endDate: selection.startDate, 
        key: 'selection',
      });
    } else {
      console.log('No startDate in selection');
    }
  };

  // Add Date
  const handleAddDate = () => {
    console.log('handleAddDate called');
    console.log('selectionDate:', selectionDate);
    console.log('availableYears:', availableYears);
    console.log('specificDates:', specificDates);
    
    try {
      if (!selectionDate.startDate) {
        console.log('No startDate selected');
        alert('Pilih tanggal terlebih dahulu');
        return;
      }
      
      const year = selectionDate.startDate.getFullYear();
      console.log('Selected year:', year);
      
      if (availableYears.length > 0 && !availableYears.includes(year)) {
        console.log('Year not in availableYears');
        alert(`Tahun ${year} tidak tersedia. Silakan pilih tanggal dari tahun yang tersedia.`);
        return;
      }
      
      const month = String(selectionDate.startDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectionDate.startDate.getDate()).padStart(2, '0');
      
      const monthDay = `${month}-${day}`;
      console.log('Formatted monthDay:', monthDay);
      
      const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
      
      if (testDate.getMonth() !== (parseInt(month) - 1) || 
          testDate.getDate() !== parseInt(day)) {
        console.log('Invalid date');
        alert('Tanggal tidak valid');
        return;
      }
      
      const dateWithYear = { year, monthDay };
      console.log('dateWithYear to add:', dateWithYear);
      
      const dateExists = specificDates.some(date => {
        if (typeof date === 'string') {
          return date === monthDay;
        }
        return date.year === year && date.monthDay === monthDay;
      });
      
      if (dateExists) {
        console.log('Date already exists');
        alert(`Tanggal ${day}/${month}/${year} sudah dipilih`);
        return;
      }
      
      // Cek maksimal tanggal
      if (specificDates.length >= MAX_SPECIFIC_DATES) {
        console.log('Max dates reached');
        alert(`Maksimal ${MAX_SPECIFIC_DATES} tanggal yang bisa dipilih untuk menghindari error`);
        return;
      }
      
      console.log('Calling onAddDate with:', dateWithYear);
      try {
        onAddDate(dateWithYear);
        console.log('onAddDate called successfully');
        
        setSelectionDate({
          startDate: new Date(),
          endDate: new Date(),
          key: 'selection',
        });
        
        setShowPicker(false);
      } catch (addError) {
        console.error('Error adding date:', addError);
        alert('Error menambahkan tanggal: ' + (addError.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Unexpected error in handleAddDate:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const presetYear = React.useMemo(() => {
    const fallbackYear = years.length > 0 ? years[0] : new Date().getFullYear();
    return selectionDate.startDate?.getFullYear() || fallbackYear;
  }, [selectionDate.startDate, years]);

  const [presetYearOverride, setPresetYearOverride] = useState(presetYear);

  useEffect(() => {
    const validYear = availableYears.length > 0
      ? availableYears.includes(presetYearOverride) ? presetYearOverride : presetYear
      : presetYear;
    if (validYear !== presetYearOverride) {
      setPresetYearOverride(validYear);
    }
  }, [presetYear, availableYears]);

  const activePresetYear = presetYearOverride || presetYear;

  const getIsSameDate = (date, year, monthDay) => {
    if (typeof date === 'string') {
      return date === monthDay;
    }
    return date.year === year && date.monthDay === monthDay;
  };

  const remainingTwinDates = React.useMemo(() => {
    return TWIN_DATE_PRESETS.filter(preset => 
      !specificDates.some(date => getIsSameDate(date, activePresetYear, preset.monthDay))
    );
  }, [specificDates, activePresetYear]);

  const handleAddTwinDatesPreset = () => {
    try {
      const year = activePresetYear;

      if (availableYears.length > 0 && !availableYears.includes(year)) {
        alert(`Tahun ${year} tidak tersedia. Pilih tahun yang ada di daftar terlebih dahulu.`);
        return;
      }

      const datesToAdd = TWIN_DATE_PRESETS
        .filter(preset => !specificDates.some(date => getIsSameDate(date, year, preset.monthDay)))
        .map(preset => ({ year, monthDay: preset.monthDay }));

      if (datesToAdd.length === 0) {
        alert(`Semua tanggal kembar untuk tahun ${year} sudah ditambahkan.`);
        return;
      }

      if (specificDates.length + datesToAdd.length > MAX_SPECIFIC_DATES) {
        alert(`Preset membutuhkan ${datesToAdd.length} slot, sedangkan sisa slot hanya ${MAX_SPECIFIC_DATES - specificDates.length}. Hapus beberapa tanggal terlebih dahulu.`);
        return;
      }

      datesToAdd.forEach(date => onAddDate(date));
      setShowPicker(false);
    } catch (error) {
      console.error('Unexpected error in handleAddTwinDatesPreset:', error);
      alert('Terjadi error saat menambahkan preset tanggal kembar.');
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
          calendar.style.setProperty('width', '100%', 'important');
          calendar.style.setProperty('max-width', '100%', 'important');
          calendar.style.setProperty('flex', '1 1 100%', 'important');
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
          Tanggal Tertentu (Bulan & Hari) - Max 30
        </Typography>
      </Box>

      {/* Tombol untuk menampilkan DatePicker */}
      <Box sx={{ mb: 2, position: 'relative' }} ref={anchorRef}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setShowPicker(!showPicker)}
          disabled={specificDates.length >= MAX_SPECIFIC_DATES}
          startIcon={
            <EventAvailableRoundedIcon 
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
          {showPicker ? 'Tutup Kalender' : 'Pilih Tanggal'}
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
            
            {/* DatePicker Modal - Terpusat dan Besar */}
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
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& *': {
                    boxSizing: 'border-box',
                  },
                  // Sembunyikan preset ranges
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
                    width: '100% !important',
                    maxWidth: '100% !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                    flex: '1 1 100% !important',
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
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid #E2E8F0',
                  bgcolor: '#FAFBFC'
                }}>
                  <Typography sx={{
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Pilih Tanggal
                  </Typography>
                  <Button
                    onClick={() => {
                      setShowPicker(false);
                      setSelectionDate({
                        startDate: new Date(),
                        endDate: new Date(),
                        key: 'selection',
                      });
                    }}
                    sx={{
                      minWidth: 'auto',
                      width: '28px',
                      height: '28px',
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
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  bgcolor: 'white',
                  width: '100%',
                }}>
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 0,
                    overflow: 'hidden',
                    minHeight: 0,
                  }}>
                    <Box sx={{
                      width: { xs: '100%', md: 280 },
                      flexShrink: 0,
                      borderRight: { md: '1px solid #E2E8F0' },
                      borderBottom: { xs: '1px solid #E2E8F0', md: 'none' },
                      bgcolor: '#FAFBFC',
                      p: 2.25,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      overflowY: 'auto',
                      maxHeight: { md: '100%' },
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <CalendarTodayIcon sx={{ 
                          fontSize: '1.125rem', 
                          color: '#6BA3D0' 
                        }} />
                        <Typography sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#0F172A',
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                          letterSpacing: '-0.01em'
                        }}>
                          Preset Tanggal Kembar
                        </Typography>
                      </Box>
                      
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Select
                          size="small"
                          value={activePresetYear}
                          onChange={(e) => setPresetYearOverride(Number(e.target.value))}
                          sx={{
                            flex: 1,
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            bgcolor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 1.5,
                            '& .MuiSelect-select': {
                              py: 0.875,
                              px: 1.5,
                            },
                            '&:hover': {
                              borderColor: '#6BA3D0',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#E2E8F0',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6BA3D0',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6BA3D0',
                            }
                          }}
                        >
                          {(availableYears.length > 0 ? years : years).map(yearOption => (
                            <MenuItem key={yearOption} value={yearOption}>
                              Tahun {yearOption}
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>

                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 0.75,
                        mb: 1,
                      }}>
                        {TWIN_DATE_PRESETS.map((preset) => {
                          const isSelected = specificDates.some(date => 
                            getIsSameDate(date, activePresetYear, preset.monthDay)
                          );
                          return (
                            <Chip
                              key={preset.monthDay}
                              label={preset.label}
                              size="small"
                              onClick={() => {
                                if (!isSelected && specificDates.length < MAX_SPECIFIC_DATES) {
                                  onAddDate({ year: activePresetYear, monthDay: preset.monthDay });
                                }
                              }}
                              disabled={isSelected || specificDates.length >= MAX_SPECIFIC_DATES}
                              sx={{
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                height: '32px',
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                bgcolor: isSelected ? '#6BA3D0' : '#FFFFFF',
                                color: isSelected ? '#FFFFFF' : '#475569',
                                border: isSelected ? 'none' : '1px solid #E2E8F0',
                                borderRadius: 1.25,
                                cursor: isSelected ? 'default' : 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: isSelected ? '#6BA3D0' : '#F8FAFC',
                                  borderColor: isSelected ? 'none' : '#6BA3D0',
                                  transform: isSelected ? 'none' : 'translateY(-1px)',
                                },
                                '&:disabled': {
                                  bgcolor: isSelected ? '#6BA3D0' : '#F8FAFC',
                                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                                  borderColor: isSelected ? 'none' : '#E2E8F0',
                                  opacity: isSelected ? 1 : 0.6,
                                }
                              }}
                            />
                          );
                        })}
                      </Box>

                      <Button
                        variant="contained"
                        size="medium"
                        onClick={handleAddTwinDatesPreset}
                        disabled={specificDates.length >= MAX_SPECIFIC_DATES || remainingTwinDates.length === 0}
                        startIcon={<CalendarTodayIcon sx={{ fontSize: '1rem' }} />}
                        sx={{
                          alignSelf: 'stretch',
                          bgcolor: '#6BA3D0',
                          textTransform: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          py: 1,
                          borderRadius: 1.5,
                          boxShadow: 'none',
                          mt: 0.5,
                          '&:hover': {
                            bgcolor: '#5A9FD0',
                            boxShadow: '0 2px 8px rgba(107, 163, 208, 0.3)',
                          },
                          '&:disabled': {
                            bgcolor: '#E2E8F0',
                            color: '#94A3B8',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        Tambah Semua ({remainingTwinDates.length}/12)
                      </Button>
                    </Box>
                    <Box sx={{ 
                      flex: 1,
                      p: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 0,
                      overflow: 'hidden',
                    }}>
                      <Box sx={{ 
                        width: '100%', 
                        maxWidth: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <DateRangePicker
                          ranges={[selectionDate]}
                          onChange={handleSelect}
                          minDate={getMinDate()}
                          maxDate={getMaxDate()}
                          months={1}
                          direction="horizontal"
                          showDateDisplay={true}
                          showMonthAndYearPickers={true}
                          moveRangeOnFirstSelection={false}
                          retainEndDateOnFirstSelection={false}
                          editableDateInputs={false}
                          staticRanges={[]}
                          inputRanges={[]}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Tombol Batal dan Tambah Tanggal */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.25,
                    px: 2.5,
                    py: 1.75,
                    borderTop: '1px solid #E2E8F0',
                    bgcolor: '#FAFBFC',
                    justifyContent: 'flex-end'
                  }}>
                    <Button 
                      variant="outlined" 
                      size="medium" 
                      onClick={() => {
                        setShowPicker(false);
                        setSelectionDate({
                          startDate: new Date(),
                          endDate: new Date(),
                          key: 'selection',
                        });
                      }}
                      sx={{
                        borderColor: '#CBD5E1',
                        color: '#475569',
                        textTransform: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 2.25,
                        py: 0.75,
                        minWidth: '90px',
                        height: '38px',
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
                      onClick={handleAddDate}
                      disabled={!selectionDate.startDate || specificDates.length >= MAX_SPECIFIC_DATES}
                      sx={{
                        bgcolor: '#6BA3D0',
                        color: 'white',
                        textTransform: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 2.5,
                        py: 0.75,
                        minWidth: '130px',
                        height: '38px',
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
                      Tambah Tanggal
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
          ? '* Pilih tanggal menggunakan kalender (bisa pilih tahun dan bulan di kalender), lalu klik "Tambah Tanggal".'
          : '* Klik tombol "Pilih Tanggal" untuk memilih tanggal. Pilih tahun dan bulan langsung di kalender.'}
      </Typography>

      {/* Preview Card - Ringkasan Data */}
      <Box sx={{ 
        mt: 1.5,
        pt: 1.5,
        borderTop: '1px solid #F1F5F9'
      }}>
        <Typography sx={{ 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          color: '#0F172A',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          mb: 1
        }}>
          Ringkasan Data
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: 'repeat(2, 1fr)', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(4, 1fr)' 
          },
          gap: { xs: 1, md: 1.25 }
        }}>
          {/* Business Unit */}
          <Card sx={{ 
            bgcolor: '#FAFAFA', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            p: { xs: 1.5, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&:hover': {
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              borderColor: '#D1D5DB',
              bgcolor: '#FFFFFF',
              transform: 'translateY(-1px)'
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
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
                  <BusinessIcon />
                </Box>
                BUSINESS UNIT
              </Typography>
            </Box>
            <Typography sx={{ 
              fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
              fontWeight: 600, 
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}>
              {businessUnits && businessUnits.length > 0 ? businessUnits.join(', ') : 'Belum dipilih'}
            </Typography>
          </Card>

          {/* Tanggal Tertentu */}
          <Card sx={{ 
            bgcolor: '#FAFAFA', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            p: { xs: 1.5, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&:hover': {
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              borderColor: '#D1D5DB',
              bgcolor: '#FFFFFF',
              transform: 'translateY(-1px)'
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
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
                  <CalendarMonthIcon />
                </Box>
                TANGGAL TERTENTU
              </Typography>
            </Box>
            <Typography sx={{ 
              fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
              fontWeight: 600, 
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}>
              {specificDates && specificDates.length > 0 
                ? `${specificDates.length} tanggal dipilih`
                : 'Belum dipilih'}
            </Typography>
          </Card>

          {/* Status Data */}
          <Card sx={{ 
            bgcolor: '#FAFAFA', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            p: { xs: 1.5, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&:hover': {
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              borderColor: '#D1D5DB',
              bgcolor: '#FFFFFF',
              transform: 'translateY(-1px)'
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
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
                  <CheckCircleIcon />
                </Box>
                STATUS DATA
              </Typography>
            </Box>
            <Typography sx={{ 
              fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
              fontWeight: 600, 
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75
            }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: invoiceData && invoiceData.length > 0 ? '#6BA3D0' : '#BDBDBD',
                  flexShrink: 0
                }}
              />
              {invoiceData && invoiceData.length > 0 ? 'Dimuat' : 'Belum dimuat'}
            </Typography>
          </Card>

          {/* Tipe Filter */}
          <Card sx={{ 
            bgcolor: '#FAFAFA', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB',
            p: { xs: 1.5, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&:hover': {
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              borderColor: '#D1D5DB',
              bgcolor: '#FFFFFF',
              transform: 'translateY(-1px)'
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
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
                  <FilterListIcon />
                </Box>
                TIPE FILTER
              </Typography>
            </Box>
            <Typography sx={{ 
              fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
              fontWeight: 600, 
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}>
              Tanggal Tertentu (Bulan & Hari)
            </Typography>
          </Card>
        </Box>
      </Box>

      {/* Counter */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        mt: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '38px',
          px: 1.5,
          borderRadius: 1.5,
          bgcolor: '#F8FAFC',
          border: '1px solid #F1F5F9'
        }}>
          <Typography sx={{ 
            fontSize: '0.75rem', 
            color: '#64748B',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: 500,
            lineHeight: 1.5,
            whiteSpace: 'nowrap'
          }}>
            {specificDates.length}/30
          </Typography>
        </Box>
      </Box>

      {/* Daftar Tanggal yang Sudah Ditambahkan */}
      {specificDates.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.75, 
          mt: 1.5,
          pt: 1.5,
          borderTop: '1px solid #F1F5F9'
        }}>
          {specificDates.sort((a, b) => {
            // Sort by year first, then by monthDay
            const aYear = typeof a === 'string' ? 0 : a.year;
            const bYear = typeof b === 'string' ? 0 : b.year;
            if (aYear !== bYear) return aYear - bYear;
            
            const aMonthDay = typeof a === 'string' ? a : a.monthDay;
            const bMonthDay = typeof b === 'string' ? b : b.monthDay;
            return aMonthDay.localeCompare(bMonthDay);
          }).map((date, index) => {
            const key = typeof date === 'string' ? date : `${date.year}-${date.monthDay}-${index}`;
            return (
              <Chip
                key={key}
                label={formatDateDisplay(date)}
                onDelete={() => onRemoveDate(date)}
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
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default SingleDatePickerWithYear;

