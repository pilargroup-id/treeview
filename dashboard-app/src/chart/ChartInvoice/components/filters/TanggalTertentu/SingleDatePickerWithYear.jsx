import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Typography, Button, Chip, Paper, Portal, Backdrop, Fade, Card, IconButton } from "@mui/material";
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAlert } from '../../../hooks/useAlert';
import AlertModal from '../../AlertModal';
import { formatDateDisplay, MONTH_OPTIONS } from '../constants';
import { DatePickerManual } from '../DatePickerManual';

export const SingleDatePickerWithYear = ({  
  specificDates = [],
  onAddDate,
  onRemoveDate,
  availableYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = [],
  onValidatedRangesChange = null,
  initialValidatedRanges = null,
  openPickerSignal = 0
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
  const lastOpenPickerSignalRef = useRef(openPickerSignal);

  // State Preview
  const [showManualMode, setShowManualMode] = useState(true);
  const [validatedRanges, setValidatedRanges] = useState(
    Array.isArray(initialValidatedRanges) ? initialValidatedRanges : []
  ); 

  useEffect(() => {
    if (!Array.isArray(initialValidatedRanges)) {
      return;
    }

    setValidatedRanges(initialValidatedRanges);
  }, [initialValidatedRanges]);

  useEffect(() => {
    // Abaikan nilai awal saat mount agar modal tidak auto-open saat ganti filter.
    if (openPickerSignal === lastOpenPickerSignalRef.current) {
      return;
    }

    lastOpenPickerSignalRef.current = openPickerSignal;

    if (openPickerSignal > 0) {
      setShowPicker(true);
    }
  }, [openPickerSignal]);

  // Add Date Range 
  const handleAddToPreview = () => {
    try {
      if (!selectionDate.startDate || !selectionDate.endDate) {
        showWarning('Pilih range tanggal terlebih dahulu');
        return;
      }
      
      const startDate = new Date(selectionDate.startDate);
      const endDate = new Date(selectionDate.endDate);
      
      if (startDate > endDate) {
        showWarning('Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir');
        return;
      }

      const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 31) {
        showWarning('Range maksimal 31 hari');
        return;
      }

      if (validatedRanges.length >= 5) {
        showWarning('Maksimum 5 range untuk perbandingan');
        return;
      }

      // Format display label
      const displayLabel = formatDateDisplay({
        year: startDate.getFullYear(),
        monthDay: `${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
      }) + (startDate.getTime() !== endDate.getTime() ? ` - ${formatDateDisplay({
        year: endDate.getFullYear(),
        monthDay: `${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      })}` : '');

      // Format tanggal 
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Validasi range 
      const newRange = {
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        startDate: formatLocalDate(startDate), // YYYY-MM-DD format 
        endDate: formatLocalDate(endDate), // YYYY-MM-DD format 
        display: displayLabel,
        days: diffDays,
        validated: true
      };

      const isDuplicate = validatedRanges.some(range => 
        range.startDate === newRange.startDate && range.endDate === newRange.endDate
      );

      if (isDuplicate) {
        showWarning('Range tanggal ini sudah ditambahkan');
        return;
      }

      setValidatedRanges(prev => [...prev, newRange]);
      
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

  const handleRemoveValidatedRange = (rangeToRemove) => {
    setValidatedRanges(prev => prev.filter(r => 
      !(r.startDate === rangeToRemove.startDate && r.endDate === rangeToRemove.endDate)
    ));
  };

  const handleClearAllRanges = () => {
    setValidatedRanges([]);
    setSelectionDate({
      startDate: null,
      endDate: null,
      key: 'selection',
    });
  };

  // Count Data
  const previewData = useMemo(() => {
    const data = {
      hasSelection: false,
      selectedDate: null,
      presetMode: null, 
      years: [],
      months: [],
      previewDates: []
    };

    // Cek Kalender
    if (selectionDate.startDate && selectionDate.endDate) {
      const startYear = selectionDate.startDate.getFullYear();
      const startMonth = selectionDate.startDate.getMonth() + 1;
      const startDay = selectionDate.startDate.getDate();
      const endYear = selectionDate.endDate.getFullYear();
      const endMonth = selectionDate.endDate.getMonth() + 1;
      const endDay = selectionDate.endDate.getDate();
      
      data.hasSelection = true;
      const startDateObj = selectionDate.startDate;
      const endDateObj = selectionDate.endDate;
      data.selectedDate = {
        year: startYear,
        month: startMonth,
        day: startDay,
        monthName: MONTH_OPTIONS.find(m => m.value === startMonth)?.label || '',
        display: formatDateDisplay({
          year: startYear,
          monthDay: `${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`
        }) + (startDateObj.getTime() !== endDateObj.getTime() ? ` - ${formatDateDisplay({
          year: endYear,
          monthDay: `${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
        })}` : '')
      };
    }

    if (showManualMode) {
      data.presetMode = 'manual';
      validatedRanges.forEach(range => {
        data.previewDates.push({
          display: range.display,
          startISO: range.startISO,
          endISO: range.endISO,
          count: range.count,
          isPreview: true
        });
      });
    }

    return data;
  }, [selectionDate.startDate, showManualMode, validatedRanges]);

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
          Tanggal Tertentu (Perbandingan Range) 
        </Typography>
      </Box>

      {/* Icon Delete All */}
      {validatedRanges.length > 0 && (
        <IconButton
          onClick={() => {
            handleClearAllRanges();
            if (onValidatedRangesChange) {
              onValidatedRangesChange([]);
            }
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
          aria-label="Hapus semua range"
        >
          <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      )}

      {/* Show Date Picker*/}
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
                  maxHeight: '75vh',
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
                      // Reset validated ranges saat tutup
                      if (showManualMode) {
                        setValidatedRanges([]);
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
                    minHeight: { md: 'calc(75vh - 180px)' },
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
                      maxHeight: { md: 'calc(75vh - 180px)' },
                      minHeight: { md: 'calc(75vh - 180px)' },
                    }}>
                      {/* Render content - hanya mode manual */}
                      {showManualMode && (
                        <DatePickerManual
                          availableYears={availableYears}
                          years={years}
                          selectionDate={selectionDate}
                          setSelectionDate={setSelectionDate}
                          showWarning={showWarning}
                          onAddToPreview={handleAddToPreview}
                        />
                      )}
                    </Box>
                    
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
                        minHeight: { md: 'calc(75vh - 180px)' },
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
                          {validatedRanges.length > 0 && (
                            <Chip
                              label={`${validatedRanges.length} range divalidasi`}
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
                        
                        {showManualMode && validatedRanges.length > 0 ? (
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                            maxHeight: 'calc(75vh - 250px)',
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
                            {validatedRanges.map((range, idx) => {
                              return (
                                <Box
                                  key={`${range.startDate}-${range.endDate}-${idx}`}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    py: 0.875,
                                    px: 1.25,
                                    borderRadius: 1.25,
                                    bgcolor: 'rgba(107, 163, 208, 0.08)',
                                    border: '1px solid rgba(107, 163, 208, 0.3)',
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
                              Range {idx + 1}: {range.display} ({range.days} hari)
                            </Typography>
                            <Chip
                              label="Valid"
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                bgcolor: '#6BA3D0',
                                color: '#FFFFFF',
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                              }}
                            />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveValidatedRange({ startDate: range.startDate, endDate: range.endDate })}
                                    sx={{
                                      width: '24px',
                                      height: '24px',
                                      p: 0.5,
                                      color: '#6BA3D0',
                                      '&:hover': {
                                        bgcolor: 'rgba(107, 163, 208, 0.1)',
                                        color: '#5A8FB8'
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
                        // Reset validated ranges saat batal
                        if (showManualMode) {
                          setValidatedRanges([]);
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
                    <Button 
                      variant="contained" 
                      size="medium" 
                      onClick={() => {
                        // Pass validated ranges to parent component
                        if (validatedRanges.length > 0 && onValidatedRangesChange) {
                          onValidatedRangesChange(validatedRanges);
                          setShowPicker(false);
                        }
                      }}
                      disabled={validatedRanges.length === 0}
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
                        minWidth: '180px',
                        height: '38px',
                        boxShadow: '0 2px 4px rgba(107, 163, 208, 0.2)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: '#5A8FB8',
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
                      Gunakan Range untuk Perbandingan ({validatedRanges.length})
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
          ? '* Pilih range tanggal menggunakan kalender (maksimal 5 range, 31 hari per range), lalu klik "Tambah ke Preview" untuk memvalidasi. Setelah semua range divalidasi, klik "Gunakan Range untuk Perbandingan" untuk membandingkan total per range.'
          : '* Klik tombol "Pilih Tanggal" untuk memilih dan membandingkan range tanggal. Maksimal 5 range, 31 hari per range. Chart akan menampilkan total per range untuk perbandingan.'}
      </Typography>

      {/* Counter untuk Ranges */}
      {validatedRanges.length > 0 && (
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
            bgcolor: 'rgba(107, 163, 208, 0.08)',
            border: '1px solid #6BA3D0'
          }}>
            <Typography sx={{ 
              fontSize: '0.75rem', 
              color: '#6BA3D0',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: 600,
              lineHeight: 1.5,
              whiteSpace: 'nowrap'
            }}>
              {validatedRanges.length} range dipilih untuk perbandingan
            </Typography>
          </Box>
        </Box>
      )}

      {/* Display Validated Ranges */}
      {validatedRanges.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 0.75, 
          mt: 1.5,
          pt: 1.5,
          borderTop: '1px solid #F1F5F9'
        }}>
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            mb: 0.5,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>
            Range yang akan dibandingkan:
          </Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 0.75,
            alignItems: 'center'
          }}>
            {validatedRanges.map((range, idx) => (
              <Box
                key={`${range.startDate}-${range.endDate}-${idx}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  py: 0.5,
                  px: 1,
                  borderRadius: 1.25,
                  bgcolor: 'rgba(107, 163, 208, 0.08)',
                  border: '1px solid rgba(107, 163, 208, 0.2)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(107, 163, 208, 0.12)',
                    borderColor: '#6BA3D0'
                  }
                }}
              >
                <Box sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#6BA3D0',
                  flexShrink: 0
                }} />
                <Typography sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#0F172A',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  whiteSpace: 'nowrap'
                }}>
                  Range {idx + 1}: {range.display}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveValidatedRange({ startDate: range.startDate, endDate: range.endDate })}
                  sx={{
                    width: '20px',
                    height: '20px',
                    p: 0.25,
                    color: '#6BA3D0',
                    '&:hover': {
                      bgcolor: 'rgba(107, 163, 208, 0.1)',
                      color: '#5A8FB8'
                    }
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: '0.75rem' }} />
                </IconButton>
              </Box>
            ))}
          </Box>
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
