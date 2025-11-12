import React from 'react';
import { Box } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { monthNames } from '../constants';

// Styles untuk MonthPicker (bisa di-override dari parent)
const monthPickerStyles = {
  monthPickerContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  monthPickerCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    zIndex: 100,
    width: '280px',
    maxHeight: '360px',
    display: 'flex',
    flexDirection: 'column',
    opacity: 0,
    visibility: 'hidden',
    transform: 'translateY(-6px)',
    transition: '0.2s',
  },
  monthPickerCardActive: {
    opacity: 1,
    visibility: 'visible',
    transform: 'translateY(0)',
  },
  monthPickerHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthPickerBody: {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  },
  monthPickerFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    background: 'white',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  monthBtn: {
    padding: '8px',
    border: '1px solid #e9ecef',
    borderRadius: '16px',
    fontSize: '13px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'white',
    fontFamily: 'Segoe UI, sans-serif',
    outline: 'none',
    textDecoration: 'none',
    '&:hover': {
      background: '#f8f9fa',
    },
  },
  monthBtnSelected: {
    background: '#6D94C5',
    color: 'white',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
    fontFamily: 'Segoe UI, sans-serif',
    outline: 'none',
    textDecoration: 'none',
    '&:hover:not(:disabled)': {
      background: '#f8f9fa',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  btnPrimary: {
    background: '#6D94C5',
    color: 'white',
    border: 'none',
    '&:hover:not(:disabled)': {
      background: '#5a7da8',
    },
  },
};

const MonthPicker = ({
  selectedMonths,
  tempSelectedMonths,
  monthPickerOpen,
  monthPickerRef,
  onMonthToggle,
  onApply,
  onCancel,
  onOpen
}) => {
  const getMonthPickerLabel = () => {
    if (selectedMonths.size === 0) {
      return 'Pilih Bulan';
    } else if (selectedMonths.size === 1) {
      return Array.from(selectedMonths)[0];
    } else {
      return `${selectedMonths.size} Bulan`;
    }
  };

  return (
    <Box sx={monthPickerStyles.monthPickerContainer} ref={monthPickerRef}>
      <Box
        component="button"
        onClick={onOpen}
        sx={{ ...monthPickerStyles.btn }}
      >
        <CalendarTodayIcon sx={{ fontSize: 16 }} />
        <Box component="span">{getMonthPickerLabel()}</Box>
        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
      </Box>

      <Box
        sx={{
          ...monthPickerStyles.monthPickerCard,
          ...(monthPickerOpen && monthPickerStyles.monthPickerCardActive)
        }}
      >
        <Box sx={monthPickerStyles.monthPickerHeader}>
          <Box component="span">Pilih Periode</Box>
          <Box
            component="button"
            onClick={onCancel}
            sx={{ ...monthPickerStyles.btn, border: 'none', background: 'transparent', padding: '4px', minWidth: 'auto' }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>

        <Box sx={monthPickerStyles.monthPickerBody}>
          <Box sx={monthPickerStyles.monthGrid}>
            {monthNames.map((month) => (
              <Box
                key={month}
                component="button"
                onClick={() => onMonthToggle(month)}
                sx={{
                  ...monthPickerStyles.monthBtn,
                  ...(tempSelectedMonths.has(month) && monthPickerStyles.monthBtnSelected)
                }}
              >
                {month.substring(0, 3)}
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={monthPickerStyles.monthPickerFooter}>
          <Box
            component="button"
            onClick={onCancel}
            sx={monthPickerStyles.btn}
          >
            Batal
          </Box>
          <Box
            component="button"
            onClick={() => onApply(tempSelectedMonths)}
            sx={{ ...monthPickerStyles.btn, ...monthPickerStyles.btnPrimary }}
          >
            Terapkan
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MonthPicker;

