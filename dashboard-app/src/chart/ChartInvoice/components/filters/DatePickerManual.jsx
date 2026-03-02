import React from "react";
import { Box, Button } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { DateRange } from 'react-date-range';
import { enGB } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export const DatePickerManual = ({
  availableYears,
  years,
  selectionDate,
  setSelectionDate,
  showWarning,
  onAddToPreview
}) => {
  const getMinDate = () => {
    if (availableYears.length === 0) return null;
    const minYear = Math.min(...availableYears);
    return new Date(minYear, 0, 1);
  };

  const getMaxDate = () => {
    if (availableYears.length === 0) return null;
    const maxYear = Math.max(...availableYears);
    return new Date(maxYear, 11, 31);
  };

  // Range Date 
  const handleSelect = (ranges) => {
    const range = ranges.selection;
    
    if (!range.startDate || !range.endDate) return;
    
    if (availableYears.length > 0 && !availableYears.includes(range.startDate.getFullYear())) {
      showWarning(`Tahun ${range.startDate.getFullYear()} tidak tersedia. Pilih tahun yang ada di daftar terlebih dahulu.`);
      return;
    }
    
    if (availableYears.length > 0 && !availableYears.includes(range.endDate.getFullYear())) {
      showWarning(`Tahun ${range.endDate.getFullYear()} tidak tersedia. Pilih tahun yang ada di daftar terlebih dahulu.`);
      return;
    }

    setSelectionDate({
      startDate: range.startDate,
      endDate: range.endDate,
      key: 'selection',
    });
  };

  return (
    <Box sx={{
      width: '100%',
      mt: 1,
      bgcolor: '#FFFFFF',
      borderRadius: 2,
      border: '1px solid #E2E8F0',
      p: 2,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: '380px',
      height: 'fit-content'
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: '100%',
        flexShrink: 0,
        '& .rdrCalendarWrapper': {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          width: '100%',
          maxWidth: '100%',
          color: '#0F172A',
        },
        '& .rdrMonthAndYearWrapper': {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
        },
        '& .rdrMonth': {
          padding: '12px 8px',
          width: '100%',
        },
        '& .rdrMonthAndYearPickers': {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          justifyContent: 'center',
        },
        '& .rdrMonthPicker, & .rdrYearPicker': {
          minWidth: 'auto',
        },
        '& .rdrMonthName': {
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0F172A',
          padding: '0',
          margin: '0',
        },
        '& .rdrWeekDays': {
          padding: '8px 4px 4px 4px',
        },
        '& .rdrWeekDay': {
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: '#64748B',
          padding: '4px 0',
        },
        '& .rdrDays': {
          padding: '0 4px 8px 4px',
        },
        '& .rdrDay': {
          fontSize: '0.75rem',
          fontWeight: 400,
          color: '#475569',
          '&:hover': {
            backgroundColor: '#F1F5F9',
          }
        },
        '& .rdrDayNumber': {
          span: {
            fontSize: '0.75rem',
          }
        },
        '& .rdrDayPassive .rdrDayNumber span': {
          color: '#CBD5E1',
        },
        '& .rdrDayToday .rdrDayNumber span': {
          fontWeight: 600,
          color: '#6BA3D0',
        },
        // Single date selection - tidak ada range
        // Range selection styles
        '& .rdrDaySelected, & .rdrDayStartEdge, & .rdrDayEndEdge': {
          backgroundColor: '#6BA3D0 !important',
          color: '#FFFFFF !important',
          borderRadius: '4px !important',
          '& .rdrDayNumber span': {
            color: '#FFFFFF !important',
            fontWeight: 600,
          },
          '&:hover': {
            backgroundColor: '#5A9FD0 !important',
          }
        },
        // Days in range
        '& .rdrDayInRange': {
          backgroundColor: 'rgba(107, 163, 208, 0.15) !important',
          color: '#475569 !important',
          '& .rdrDayNumber span': {
            color: '#475569 !important',
            fontWeight: 500,
          },
          '&:hover': {
            backgroundColor: 'rgba(107, 163, 208, 0.25) !important',
          }
        },
        '& .rdrDayDisabled': {
          color: '#CBD5E1',
          cursor: 'not-allowed',
          '&:hover': {
            backgroundColor: 'transparent',
          }
        },
        '& .rdrNextPrevButton': {
          backgroundColor: 'transparent !important',
          border: 'none !important',
          width: '32px !important',
          height: '32px !important',
          minWidth: '32px !important',
          display: 'flex !important',
          alignItems: 'center !important',
          justifyContent: 'center !important',
          borderRadius: '4px',
          cursor: 'pointer',
          position: 'relative !important',
          zIndex: 10,
          visibility: 'visible !important',
          opacity: '1 !important',
          '&:hover': {
            backgroundColor: '#F1F5F9 !important',
          },
          '&:active': {
            backgroundColor: '#E2E8F0 !important',
          },
          '& i': {
            borderColor: '#64748B !important',
            borderWidth: '2px 2px 0 0 !important',
            width: '8px !important',
            height: '8px !important',
            display: 'block !important',
            visibility: 'visible !important',
            opacity: '1 !important',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }
        },
        '& .rdrPprevButton': {
          left: '0 !important',
          visibility: 'visible !important',
          opacity: '1 !important',
          '& i': {
            borderColor: '#64748B !important',
            transform: 'translate(-30%, -50%) rotate(-135deg) !important',
            visibility: 'visible !important',
            opacity: '1 !important',
          },
          '&:hover i': {
            borderColor: '#0F172A !important',
          }
        },
        '& .rdrNextButton': {
          right: '0 !important',
          visibility: 'visible !important',
          opacity: '1 !important',
          '& i': {
            borderColor: '#64748B !important',
            transform: 'translate(-70%, -50%) rotate(45deg) !important',
            visibility: 'visible !important',
            opacity: '1 !important',
          },
          '&:hover i': {
            borderColor: '#0F172A !important',
          }
        },
        // Hide defined ranges wrapper (Early, Continuous buttons)
        '& .rdr-DefinedRangesWrapper': {
          display: 'none !important',
        },
        '& .rdrDefinedRangesWrapper': {
          display: 'none !important',
        },
        '& .rdrStaticRange': {
          display: 'none !important',
        },
        '& .rdrStaticRangeLabel': {
          display: 'none !important',
        },
        // Hide any buttons with Early or Continuous text
        '& button:contains("Early"), & button:contains("Continuous")': {
          display: 'none !important',
        },
      }}>
        <DateRange
          ranges={[selectionDate]}
          onChange={handleSelect}
          minDate={getMinDate()}
          maxDate={getMaxDate()}
          color="#6BA3D0"
          months={1}
          direction="horizontal"
          locale={enGB}
          staticRanges={[]}
          inputRanges={[]}
          showDateDisplay={false}
        />
      </Box>
      
      {/* Tombol Tambah ke Preview */}
      {onAddToPreview && (
        <Box sx={{
          width: '100%',
          mt: 2,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button
            variant="outlined"
            size="medium"
            onClick={onAddToPreview}
            disabled={!selectionDate?.startDate || !selectionDate?.endDate}
            startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
            sx={{
              borderColor: '#6BA3D0',
              color: '#6BA3D0',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              minWidth: '160px',
              height: '38px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: '#5A9FD0',
                bgcolor: 'rgba(107, 163, 208, 0.08)',
                boxShadow: '0 2px 4px rgba(107, 163, 208, 0.15)',
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
            Tambah ke Preview
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DatePickerManual;

