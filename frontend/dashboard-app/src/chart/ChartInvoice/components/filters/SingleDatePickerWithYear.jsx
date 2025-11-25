import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Typography, Button, Chip, Paper, Portal, Backdrop, Fade, Card, IconButton } from "@mui/material";
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAlert } from '../../hooks/useAlert';
import AlertModal from '../AlertModal';
import { formatDateDisplay, MONTH_OPTIONS } from './constants';
import { TglKembarTahun, useTglKembarTahun } from './TglKembarTahun';
import { TglKembarMultiTahun, useTglKembarMultiTahun } from './TglKembarMultiTahun';
import { DatePickerManual } from './DatePickerManual';

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
  const { alertState, showWarning, showError, closeAlert } = useAlert();
  
  // Generate tahun 
  const years = useMemo(() => {
    return availableYears.length > 0 
      ? [...availableYears].sort((a, b) => b - a) 
      : [2025, 2024, 2023, 2022, 2021].sort((a, b) => b - a);
  }, [availableYears]);
  
  const [selectionDate, setSelectionDate] = useState({
    startDate: null,
    endDate: null,
    key: 'selection',
  });
  
  const [showPicker, setShowPicker] = useState(false);
  const anchorRef = useRef(null);
  const pickerRef = useRef(null);

  // State untuk preset tahun
  const presetYear = useMemo(() => {
    return selectionDate.startDate?.getFullYear() || null;
  }, [selectionDate.startDate]);

  const [presetYearOverride, setPresetYearOverride] = useState(null);
  
  // State untuk multi-select tahun pada preset tanggal kembar
  const [selectedYearsForTwinPreset, setSelectedYearsForTwinPreset] = useState([]);
  const [selectedMonthsForTwinPreset, setSelectedMonthsForTwinPreset] = useState([]);
  const [selectedMonthsForSingleYear, setSelectedMonthsForSingleYear] = useState([]);
  const [showMultiYearPreset, setShowMultiYearPreset] = useState(false);
  const [showManualMode, setShowManualMode] = useState(true);
  
  // State untuk preview dates di mode manual
  const [manualPreviewDates, setManualPreviewDates] = useState([]);

  const activePresetYear = presetYearOverride || presetYear;

  // Toggle tahun untuk multi-select preset
  const toggleYearForTwinPreset = (year) => {
    setSelectedYearsForTwinPreset(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year].sort((a, b) => a - b);
      }
    });
  };

  // Toggle bulan untuk multi-select preset
  const toggleMonthForTwinPreset = (monthValue) => {
    setSelectedMonthsForTwinPreset(prev => {
      if (prev.includes(monthValue)) {
        return prev.filter(m => m !== monthValue);
      } else {
        return [...prev, monthValue].sort((a, b) => a - b);
      }
    });
  };

  // Toggle bulan untuk single year preset
  const toggleMonthForSingleYear = (monthValue) => {
    setSelectedMonthsForSingleYear(prev => {
      if (prev.includes(monthValue)) {
        return prev.filter(m => m !== monthValue);
      } else {
        return [...prev, monthValue].sort((a, b) => a - b);
      }
    });
  };

  // Toggle semua bulan untuk single year preset
  const toggleAllMonthsForSingleYear = () => {
    const allMonthValues = MONTH_OPTIONS.map(m => m.value).sort((a, b) => a - b);
    const allSelected = allMonthValues.length === selectedMonthsForSingleYear.length && 
                       allMonthValues.every(month => selectedMonthsForSingleYear.includes(month));
    
    if (allSelected) {
      setSelectedMonthsForSingleYear([]);
    } else {
      setSelectedMonthsForSingleYear([...allMonthValues]);
    }
  };

  // Add Date to Preview (Manual Mode)
  const handleAddToPreview = () => {
    try {
      if (!selectionDate.startDate) {
        showWarning('Pilih tanggal terlebih dahulu');
        return;
      }
      
      const year = selectionDate.startDate.getFullYear();
      
      if (availableYears.length > 0 && !availableYears.includes(year)) {
        showWarning(`Tahun ${year} tidak tersedia. Silakan pilih tanggal dari tahun yang tersedia.`);
        return;
      }
      
      const month = String(selectionDate.startDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectionDate.startDate.getDate()).padStart(2, '0');
      
      const monthDay = `${month}-${day}`;
      
      const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
      
      if (testDate.getMonth() !== (parseInt(month) - 1) || 
          testDate.getDate() !== parseInt(day)) {
        showWarning('Tanggal tidak valid');
        return;
      }
      
      const dateWithYear = { year, monthDay };
      
      // Cek apakah sudah ada di preview
      const existsInPreview = manualPreviewDates.some(date => 
        date.year === year && date.monthDay === monthDay
      );
      
      if (existsInPreview) {
        showWarning(`Tanggal ${day}/${month}/${year} sudah ada di preview`);
        return;
      }
      
      // Cek apakah sudah ada di specificDates
      const dateExists = specificDates.some(date => {
        if (typeof date === 'string') {
          return date === monthDay;
        }
        return date.year === year && date.monthDay === monthDay;
      });
      
      if (dateExists) {
        showWarning(`Tanggal ${day}/${month}/${year} sudah dipilih`);
        return;
      }
      
      // Tambahkan ke preview
      setManualPreviewDates(prev => {
        const newDates = [...prev, dateWithYear];
        // Sort by year then monthDay
        return newDates.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return a.monthDay.localeCompare(b.monthDay);
        });
      });
      
      // Reset selection
      setSelectionDate({
        startDate: null,
        endDate: null,
        key: 'selection',
      });
    } catch (error) {
      console.error('Unexpected error in handleAddToPreview:', error);
      showError('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  // Add All Preview Dates to Dashboard
  const handleAddAllPreviewDates = () => {
    if (manualPreviewDates.length === 0) {
      showWarning('Tidak ada tanggal di preview untuk ditambahkan');
      return;
    }
    
    try {
      manualPreviewDates.forEach(date => {
        // Cek apakah sudah ada di specificDates
        const dateExists = specificDates.some(existingDate => {
          if (typeof existingDate === 'string') {
            return existingDate === date.monthDay;
          }
          return existingDate.year === date.year && existingDate.monthDay === date.monthDay;
        });
        
        if (!dateExists) {
          onAddDate(date);
        }
      });
      
      // Clear preview
      setManualPreviewDates([]);
      setShowPicker(false);
    } catch (error) {
      console.error('Error adding preview dates:', error);
      showError('Error menambahkan tanggal: ' + (error.message || 'Unknown error'));
    }
  };

  // Remove date from preview
  const handleRemoveFromPreview = (dateToRemove) => {
    setManualPreviewDates(prev => 
      prev.filter(date => 
        !(date.year === dateToRemove.year && date.monthDay === dateToRemove.monthDay)
      )
    );
  };

  // Add Date (direct to dashboard - for non-manual mode)
  const handleAddDate = () => {
    try {
      if (!selectionDate.startDate) {
        showWarning('Pilih tanggal terlebih dahulu');
        return;
      }
      
      const year = selectionDate.startDate.getFullYear();
      
      if (availableYears.length > 0 && !availableYears.includes(year)) {
        showWarning(`Tahun ${year} tidak tersedia. Silakan pilih tanggal dari tahun yang tersedia.`);
        return;
      }
      
      const month = String(selectionDate.startDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectionDate.startDate.getDate()).padStart(2, '0');
      
      const monthDay = `${month}-${day}`;
      
      const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
      
      if (testDate.getMonth() !== (parseInt(month) - 1) || 
          testDate.getDate() !== parseInt(day)) {
        showWarning('Tanggal tidak valid');
        return;
      }
      
      const dateWithYear = { year, monthDay };
      
      const dateExists = specificDates.some(date => {
        if (typeof date === 'string') {
          return date === monthDay;
        }
        return date.year === year && date.monthDay === monthDay;
      });
      
      if (dateExists) {
        showWarning(`Tanggal ${day}/${month}/${year} sudah dipilih`);
        return;
      }
      
      try {
        onAddDate(dateWithYear);
        
        setSelectionDate({
          startDate: null,
          endDate: null,
          key: 'selection',
        });
        
        setShowPicker(false);
      } catch (addError) {
        console.error('Error adding date:', addError);
        showError('Error menambahkan tanggal: ' + (addError.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Unexpected error in handleAddDate:', error);
      showError('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  // Hitung data preview untuk middle section
  const previewData = useMemo(() => {
    const data = {
      hasSelection: false,
      selectedDate: null,
      presetMode: null, // 'single' atau 'multi'
      years: [],
      months: [],
      previewDates: []
    };

    // Cek apakah ada tanggal yang dipilih di kalender
    if (selectionDate.startDate) {
      const year = selectionDate.startDate.getFullYear();
      const month = selectionDate.startDate.getMonth() + 1;
      const day = selectionDate.startDate.getDate();
      
      data.hasSelection = true;
      data.selectedDate = {
        year,
        month,
        day,
        monthName: MONTH_OPTIONS.find(m => m.value === month)?.label || '',
        display: formatDateDisplay({
          year,
          monthDay: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        })
      };
    }

    // Cek mode manual
    if (showManualMode) {
      data.presetMode = 'manual';
      // Hanya tampilkan manual preview dates (yang belum ditambahkan ke dashboard)
      manualPreviewDates.forEach(date => {
        const monthOption = MONTH_OPTIONS.find(m => m.monthDay === date.monthDay);
        if (monthOption) {
          data.previewDates.push({
            year: date.year,
            monthDay: date.monthDay,
            monthName: monthOption.label,
            display: formatDateDisplay(date),
            isPreview: true // Flag untuk membedakan preview dengan yang sudah ditambahkan
          });
        }
      });
      // Sort preview dates
      data.previewDates.sort((a, b) => {
        if (a.year !== b.year) {
          if (a.year === null) return 1;
          if (b.year === null) return -1;
          return b.year - a.year;
        }
        return a.monthDay.localeCompare(b.monthDay);
      });
    }
    // Cek preset mode
    else if (showMultiYearPreset) {
      if (selectedYearsForTwinPreset.length > 0 || selectedMonthsForTwinPreset.length > 0) {
        data.presetMode = 'multi';
        data.years = [...selectedYearsForTwinPreset].sort((a, b) => b - a);
        data.months = [...selectedMonthsForTwinPreset]
          .sort((a, b) => a - b)
          .map(monthValue => MONTH_OPTIONS.find(m => m.value === monthValue))
          .filter(Boolean);
        
        // Generate preview dates
        data.years.forEach(year => {
          data.months.forEach(monthOption => {
            if (monthOption) {
              data.previewDates.push({
                year,
                monthDay: monthOption.monthDay,
                monthName: monthOption.label,
                display: formatDateDisplay({ year, monthDay: monthOption.monthDay })
              });
            }
          });
        });
        data.previewDates.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return a.monthDay.localeCompare(b.monthDay);
        });
      }
    } else {
      if (selectedMonthsForSingleYear.length > 0) {
        data.presetMode = 'single';
        data.years = [activePresetYear];
        data.months = [...selectedMonthsForSingleYear]
          .sort((a, b) => a - b)
          .map(monthValue => MONTH_OPTIONS.find(m => m.value === monthValue))
          .filter(Boolean);
        
        // Generate preview dates
        data.months.forEach(monthOption => {
          if (monthOption) {
            data.previewDates.push({
              year: activePresetYear,
              monthDay: monthOption.monthDay,
              monthName: monthOption.label,
              display: formatDateDisplay({ year: activePresetYear, monthDay: monthOption.monthDay })
            });
          }
        });
      }
    }

    return data;
  }, [
    selectionDate.startDate,
    showMultiYearPreset,
    showManualMode,
    selectedYearsForTwinPreset,
    selectedMonthsForTwinPreset,
    selectedMonthsForSingleYear,
    activePresetYear,
    specificDates,
    manualPreviewDates
  ]);

  // Initialize hooks untuk mendapatkan fungsi dan nilai yang diperlukan
  const tglKembarTahunHook = useTglKembarTahun({
    activePresetYear,
    availableYears,
    specificDates,
    selectedMonthsForSingleYear,
    onAddDate,
    setShowPicker,
    showWarning
  });

  const tglKembarMultiTahunHook = useTglKembarMultiTahun({
    availableYears,
    specificDates,
    selectedYearsForTwinPreset,
    selectedMonthsForTwinPreset,
    onAddDate,
    setShowMultiYearPreset,
    setSelectedYearsForTwinPreset,
    setSelectedMonthsForTwinPreset,
    setShowPicker,
    showWarning
  });

  useEffect(() => {
    if (!showPicker || !pickerRef.current) return;

    const applyStyles = () => {
      const picker = pickerRef.current;
      if (!picker) return;

      const definedRangesWrapper = picker.querySelector('.rdr-DefinedRangesWrapper');
      if (definedRangesWrapper) {
        definedRangesWrapper.style.setProperty('display', 'none', 'important');
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
          Tanggal Tertentu (Bulan & Hari) 
        </Typography>
      </Box>

      {/* Icon tong sampah di pojok kanan bawah */}
      {specificDates.length > 0 && (
        <IconButton
          onClick={() => {
            specificDates.forEach(date => {
              onRemoveDate(date);
            });
            setSelectionDate({
              startDate: null,
              endDate: null,
              key: 'selection',
            });
            setPresetYearOverride(null);
          }}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '28px',
            height: '28px',
            p: 0.5,
            color: '#94A3B8',
            bgcolor: 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#EF4444',
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              transform: 'scale(1.1)'
            },
            '&:active': {
              transform: 'scale(0.95)'
            }
          }}
          size="small"
          aria-label="Hapus semua pilihan tanggal"
        >
          <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      )}

      {/* Tombol untuk menampilkan DatePicker */}
      <Box sx={{ mb: 2, position: 'relative' }} ref={anchorRef}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setShowPicker(!showPicker)}
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
            
            {/* DatePicker Modal */}
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
                  height: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Header */}
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
                        startDate: null,
                        endDate: null,
                        key: 'selection',
                      });
                      // Reset manual preview dates saat tutup
                      if (showManualMode) {
                        setManualPreviewDates([]);
                      }
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
                    minHeight: { md: 'calc(90vh - 180px)' },
                  }}>
                    {/* Left Section - Filter Controls */}
                    <Box sx={{
                      width: { xs: '100%', md: 450 },
                      flexShrink: 0,
                      borderRight: { md: '1px solid #E2E8F0' },
                      borderBottom: { xs: '1px solid #E2E8F0', md: 'none' },
                      bgcolor: '#FAFBFC',
                      p: 2.25,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      overflowY: 'auto',
                      maxHeight: { md: 'calc(90vh - 180px)' },
                      minHeight: { md: 'calc(90vh - 180px)' },
                    }}>
                      {/* Toggle untuk preset multi-tahun dan manual */}
                      <Box sx={{
                        display: 'flex',
                        gap: 0.75,
                        mb: 1
                      }}>
                        <Button
                          variant={showManualMode ? "contained" : "outlined"}
                          size="small"
                          onClick={() => {
                            setShowManualMode(true);
                            setShowMultiYearPreset(false);
                            setSelectedYearsForTwinPreset([]);
                            setSelectedMonthsForTwinPreset([]);
                            setSelectedMonthsForSingleYear([]);
                            // Jangan reset manualPreviewDates saat pindah ke manual mode
                          }}
                          sx={{
                            flex: 1,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: showManualMode ? '#6BA3D0' : 'transparent',
                            color: showManualMode ? '#FFFFFF' : '#475569',
                            borderColor: showManualMode ? '#6BA3D0' : '#E2E8F0',
                            '&:hover': {
                              bgcolor: showManualMode ? '#5A9FD0' : 'rgba(107, 163, 208, 0.08)',
                              borderColor: '#6BA3D0'
                            }
                          }}
                        >
                          Manual
                        </Button>
                        <Button
                          variant={!showMultiYearPreset && !showManualMode ? "contained" : "outlined"}
                          size="small"
                          onClick={() => {
                            setShowMultiYearPreset(false);
                            setShowManualMode(false);
                            setSelectedYearsForTwinPreset([]);
                            setSelectedMonthsForTwinPreset([]);
                            setSelectedMonthsForSingleYear([]);
                          }}
                          sx={{
                            flex: 1,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: !showMultiYearPreset && !showManualMode ? '#6BA3D0' : 'transparent',
                            color: !showMultiYearPreset && !showManualMode ? '#FFFFFF' : '#475569',
                            borderColor: !showMultiYearPreset && !showManualMode ? '#6BA3D0' : '#E2E8F0',
                            '&:hover': {
                              bgcolor: !showMultiYearPreset && !showManualMode ? '#5A9FD0' : 'rgba(107, 163, 208, 0.08)',
                              borderColor: '#6BA3D0'
                            }
                          }}
                        >
                          Satu Tahun
                        </Button>
                        <Button
                          variant={showMultiYearPreset && !showManualMode ? "contained" : "outlined"}
                          size="small"
                          onClick={() => {
                            setShowMultiYearPreset(true);
                            setShowManualMode(false);
                          }}
                          sx={{
                            flex: 1,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: showMultiYearPreset && !showManualMode ? '#6BA3D0' : 'transparent',
                            color: showMultiYearPreset && !showManualMode ? '#FFFFFF' : '#475569',
                            borderColor: showMultiYearPreset && !showManualMode ? '#6BA3D0' : '#E2E8F0',
                            '&:hover': {
                              bgcolor: showMultiYearPreset && !showManualMode ? '#5A9FD0' : 'rgba(107, 163, 208, 0.08)',
                              borderColor: '#6BA3D0'
                            }
                          }}
                        >
                          Multi Tahun
                        </Button>
                      </Box>

                      {/* Render content berdasarkan mode */}
                      {!showMultiYearPreset && !showManualMode && (
                        <TglKembarTahun
                          activePresetYear={activePresetYear}
                          setPresetYearOverride={setPresetYearOverride}
                          years={years}
                          availableYears={availableYears}
                          specificDates={specificDates}
                          selectedMonthsForSingleYear={selectedMonthsForSingleYear}
                          toggleMonthForSingleYear={toggleMonthForSingleYear}
                          toggleAllMonthsForSingleYear={toggleAllMonthsForSingleYear}
                          onAddDate={onAddDate}
                          setShowPicker={setShowPicker}
                          showWarning={showWarning}
                        />
                      )}
                      {showMultiYearPreset && !showManualMode && (
                        <TglKembarMultiTahun
                          years={years}
                          availableYears={availableYears}
                          specificDates={specificDates}
                          selectedYearsForTwinPreset={selectedYearsForTwinPreset}
                          selectedMonthsForTwinPreset={selectedMonthsForTwinPreset}
                          toggleYearForTwinPreset={toggleYearForTwinPreset}
                          toggleMonthForTwinPreset={toggleMonthForTwinPreset}
                          onAddDate={onAddDate}
                          setShowMultiYearPreset={setShowMultiYearPreset}
                          setSelectedYearsForTwinPreset={setSelectedYearsForTwinPreset}
                          setSelectedMonthsForTwinPreset={setSelectedMonthsForTwinPreset}
                          setShowPicker={setShowPicker}
                          showWarning={showWarning}
                        />
                      )}
                      {showManualMode && (
                        <DatePickerManual
                          availableYears={availableYears}
                          years={years}
                          selectionDate={selectionDate}
                          setSelectionDate={setSelectionDate}
                          onAddDate={onAddDate}
                          showWarning={showWarning}
                          onAddToPreview={handleAddToPreview}
                        />
                      )}
                    </Box>
                    
                    {/* Middle Section - Preview Ringkasan */}
                    {!showManualMode && (
                      <Box sx={{
                        flex: 1,
                        borderBottom: { xs: '1px solid #E2E8F0', md: 'none' },
                        bgcolor: '#FFFFFF',
                        p: 2.25,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        overflowY: 'auto',
                        maxHeight: { md: 'calc(90vh - 180px)' },
                        minHeight: { md: 'calc(90vh - 180px)' },
                      }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          mb: 0.5
                        }}>
                          <CheckCircleOutlineIcon sx={{ 
                            fontSize: '1rem', 
                            color: '#6BA3D0' 
                          }} />
                          <Typography sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#0F172A',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                            letterSpacing: '-0.01em'
                          }}>
                            Preview Pilihan
                          </Typography>
                        </Box>

                        {/* Empty State */}
                        {!previewData.hasSelection && 
                         !previewData.presetMode && 
                         previewData.previewDates.length === 0 ? (
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 4,
                            px: 2,
                            textAlign: 'center',
                            minHeight: '200px'
                          }}>
                            <CalendarMonthIcon sx={{
                              fontSize: '3rem',
                              color: '#CBD5E1',
                              mb: 1.5,
                              opacity: 0.6
                            }} />
                            <Typography sx={{
                              fontSize: '0.8125rem',
                              color: '#94A3B8',
                              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                              lineHeight: 1.6,
                              maxWidth: '200px'
                            }}>
                              Pilih tahun dan bulan untuk menampilkan preview di sini.
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5
                          }}>
                            {/* Preview Tanggal yang Dipilih di Kalender */}
                            {previewData.selectedDate && previewData.presetMode !== 'manual' && (
                              <Card sx={{
                                p: 1.5,
                                bgcolor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 1.5,
                                boxShadow: 'none'
                              }}>
                                <Typography sx={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  mb: 0.75
                                }}>
                                  Tanggal Dipilih
                                </Typography>
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.75
                                }}>
                                  <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#6BA3D0',
                                    flexShrink: 0
                                  }} />
                                  <Typography sx={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    color: '#0F172A',
                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                  }}>
                                    {previewData.selectedDate.display}
                                  </Typography>
                                </Box>
                              </Card>
                            )}

                            {/* Preview Preset Tanggal Kembar */}
                            {previewData.presetMode && previewData.presetMode !== 'manual' && previewData.previewDates.length > 0 && (
                              <Card sx={{
                                p: 1.5,
                                bgcolor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 1.5,
                                boxShadow: 'none'
                              }}>
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  mb: 1
                                }}>
                                  <Typography sx={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    color: '#64748B',
                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    Preset Tanggal Kembar
                                  </Typography>
                                  <Chip
                                    label={`${previewData.previewDates.length}`}
                                    size="small"
                                    sx={{
                                      height: '20px',
                                      fontSize: '0.625rem',
                                      fontWeight: 600,
                                      bgcolor: '#6BA3D0',
                                      color: '#FFFFFF',
                                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                    }}
                                  />
                                </Box>
                                
                                <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.75,
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  pr: 0.5,
                                  '&::-webkit-scrollbar': {
                                    width: '4px',
                                  },
                                  '&::-webkit-scrollbar-track': {
                                    background: '#F1F5F9',
                                    borderRadius: '2px',
                                  },
                                  '&::-webkit-scrollbar-thumb': {
                                    background: '#CBD5E1',
                                    borderRadius: '2px',
                                    '&:hover': {
                                      background: '#94A3B8',
                                    },
                                  },
                                }}>
                                  {previewData.previewDates.map((date, idx) => (
                                    <Box
                                      key={`${date.year}-${date.monthDay}-${idx}`}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        py: 0.5,
                                        px: 0.75,
                                        borderRadius: 1,
                                        bgcolor: 'transparent',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          bgcolor: '#F1F5F9'
                                        }
                                      }}
                                    >
                                      <Box sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        bgcolor: '#6BA3D0',
                                        flexShrink: 0,
                                        opacity: 0.6
                                      }} />
                                      <Typography sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 400,
                                        color: '#475569',
                                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                        lineHeight: 1.5
                                      }}>
                                        {date.display}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Card>
                            )}

                            {/* Ringkasan Tahun & Bulan */}
                            {previewData.presetMode && previewData.presetMode !== 'manual' && (previewData.years.length > 0 || previewData.months.length > 0) && (
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                              }}>
                                {previewData.years.length > 0 && (
                                  <Card sx={{
                                    p: 1.5,
                                    bgcolor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 1.5,
                                    boxShadow: 'none'
                                  }}>
                                    <Typography sx={{
                                      fontSize: '0.6875rem',
                                      fontWeight: 600,
                                      color: '#64748B',
                                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      mb: 0.75
                                    }}>
                                      Tahun
                                    </Typography>
                                    <Box sx={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 0.5
                                    }}>
                                      {previewData.years.map(year => (
                                        <Chip
                                          key={year}
                                          label={year}
                                          size="small"
                                          sx={{
                                            height: '24px',
                                            fontSize: '0.6875rem',
                                            fontWeight: 500,
                                            bgcolor: '#FFFFFF',
                                            color: '#475569',
                                            border: '1px solid #E2E8F0',
                                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Card>
                                )}

                                {previewData.months.length > 0 && (
                                  <Card sx={{
                                    p: 1.5,
                                    bgcolor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 1.5,
                                    boxShadow: 'none'
                                  }}>
                                    <Typography sx={{
                                      fontSize: '0.6875rem',
                                      fontWeight: 600,
                                      color: '#64748B',
                                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      mb: 0.75
                                    }}>
                                      Bulan
                                    </Typography>
                                    <Box sx={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 0.5
                                    }}>
                                      {previewData.months.map(month => (
                                        <Chip
                                          key={month.value}
                                          label={month.label}
                                          size="small"
                                          sx={{
                                            height: '24px',
                                            fontSize: '0.6875rem',
                                            fontWeight: 500,
                                            bgcolor: '#FFFFFF',
                                            color: '#475569',
                                            border: '1px solid #E2E8F0',
                                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Card>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                    
                    {/* Right Section - Preview Full untuk Manual */}
                    {showManualMode && (
                      <Box sx={{ 
                        flex: 1,
                        p: 2.25,
                        m: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        minHeight: { md: 'calc(90vh - 180px)' },
                        overflow: 'hidden',
                        bgcolor: '#FFFFFF',
                        borderLeft: { md: '1px solid #E2E8F0' },
                        borderTop: { xs: '1px solid #E2E8F0', md: 'none' },
                      }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5
                        }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75
                          }}>
                            <CheckCircleOutlineIcon sx={{ 
                              fontSize: '1rem', 
                              color: '#6BA3D0' 
                            }} />
                            <Typography sx={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: '#0F172A',
                              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                              letterSpacing: '-0.01em'
                            }}>
                              Preview Pilihan
                            </Typography>
                          </Box>
                          {manualPreviewDates.length > 0 && (
                            <Chip
                              label={`${manualPreviewDates.length} di preview`}
                              size="small"
                              sx={{
                                height: '22px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                bgcolor: '#6BA3D0',
                                color: '#FFFFFF',
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                              }}
                            />
                          )}
                        </Box>
                        
                        {showManualMode && manualPreviewDates.length > 0 ? (
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                            maxHeight: 'calc(90vh - 250px)',
                            overflowY: 'auto',
                            pr: 0.5,
                            '&::-webkit-scrollbar': {
                              width: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: '#F1F5F9',
                              borderRadius: '2px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: '#CBD5E1',
                              borderRadius: '2px',
                              '&:hover': {
                                background: '#94A3B8',
                              },
                            },
                          }}>
                            {manualPreviewDates.map((date, idx) => {
                              const monthOption = MONTH_OPTIONS.find(m => m.monthDay === date.monthDay);
                              const displayText = formatDateDisplay(date);
                              return (
                                <Box
                                  key={`${date.year}-${date.monthDay}-${idx}`}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    py: 0.875,
                                    px: 1.25,
                                    borderRadius: 1.25,
                                    bgcolor: 'rgba(107, 163, 208, 0.08)',
                                    border: '1px solid rgba(107, 163, 208, 0.2)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(107, 163, 208, 0.12)',
                                      borderColor: '#6BA3D0',
                                      transform: 'translateX(2px)'
                                    }
                                  }}
                                >
                                  <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#6BA3D0',
                                    flexShrink: 0,
                                    opacity: 0.8
                                  }} />
                                  <Typography sx={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    color: '#0F172A',
                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                    lineHeight: 1.5,
                                    flex: 1
                                  }}>
                                    {displayText}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveFromPreview({ year: date.year, monthDay: date.monthDay })}
                                    sx={{
                                      width: '24px',
                                      height: '24px',
                                      p: 0.5,
                                      color: '#6BA3D0',
                                      '&:hover': {
                                        bgcolor: 'rgba(107, 163, 208, 0.1)',
                                        color: '#5A9FD0'
                                      }
                                    }}
                                  >
                                    <DeleteOutlineIcon sx={{ fontSize: '0.875rem' }} />
                                  </IconButton>
                                </Box>
                              );
                            })}
                          </Box>
                        ) : (
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 6,
                            px: 2,
                            textAlign: 'center'
                          }}>
                            <CalendarMonthIcon sx={{
                              fontSize: '3.5rem',
                              color: '#CBD5E1',
                              mb: 1.5,
                              opacity: 0.6
                            }} />
                            <Typography sx={{
                              fontSize: '0.875rem',
                              color: '#94A3B8',
                              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                              lineHeight: 1.6,
                              maxWidth: '250px'
                            }}>
                              Belum ada tanggal yang dipilih. Gunakan kalender di panel kiri untuk memilih tanggal.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Tombol Batal dan Tambah Tanggal */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.25,
                    px: 2.5,
                    py: 1.75,
                    borderTop: '1px solid #E2E8F0',
                    bgcolor: '#FAFBFC',
                    justifyContent: 'flex-end',
                    flexShrink: 0
                  }}>
                    <Button 
                      variant="outlined" 
                      size="medium" 
                      onClick={() => {
                        setShowPicker(false);
                        setSelectionDate({
                          startDate: null,
                          endDate: null,
                          key: 'selection',
                        });
                        // Reset manual preview dates saat batal
                        if (showManualMode) {
                          setManualPreviewDates([]);
                        }
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
                    {showManualMode ? (
                      <Button 
                        variant="contained" 
                        size="medium" 
                        onClick={handleAddAllPreviewDates}
                        disabled={manualPreviewDates.length === 0}
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
                          minWidth: '160px',
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
                        Tambah Semua ({manualPreviewDates.length})
                      </Button>
                    ) : !showMultiYearPreset ? (
                      <>
                        {selectedMonthsForSingleYear.length > 0 ? (
                          <Button 
                            variant="contained" 
                            size="medium" 
                            onClick={tglKembarTahunHook.handleAddTwinDatesPreset}
                            disabled={tglKembarTahunHook.remainingTwinDates.length === 0}
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
                            Tambah ({tglKembarTahunHook.remainingTwinDates.length} tanggal)
                          </Button>
                        ) : (
                          <Button 
                            variant="contained" 
                            size="medium" 
                            onClick={handleAddDate}
                            disabled={!selectionDate.startDate}
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
                        )}
                      </>
                    ) : (
                      <Button 
                        variant="contained" 
                        size="medium" 
                        onClick={tglKembarMultiTahunHook.handleAddTwinDatesPresetMultiYear}
                        disabled={selectedYearsForTwinPreset.length === 0 || selectedMonthsForTwinPreset.length === 0}
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
                        Tambah ({tglKembarMultiTahunHook.remainingTwinDatesMultiYear} tanggal)
                      </Button>
                    )}
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
            {specificDates.length} tanggal dipilih
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

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        severity={alertState.severity}
      />
    </Box>
  );
};

export default SingleDatePickerWithYear;
