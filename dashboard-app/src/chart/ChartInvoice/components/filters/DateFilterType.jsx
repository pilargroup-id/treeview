import React, { useRef, useState, useCallback } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

function DateFilterType({ value, onChange }) {
  const formControlRef = useRef(null);
  const [menuWidth, setMenuWidth] = useState(null);

  const handleOpen = useCallback(() => {
    if (formControlRef.current) {
      const selectInput = formControlRef.current.querySelector('.MuiSelect-select') || 
                         formControlRef.current.querySelector('.MuiOutlinedInput-root');
      if (selectInput) {
        const width = selectInput.offsetWidth || formControlRef.current.offsetWidth;
        setMenuWidth(width);
      } else {
        const width = formControlRef.current.offsetWidth;
        setMenuWidth(width);
      }
    }
  }, []);

  const handleChange = (event) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FormControl ref={formControlRef} size="medium" fullWidth>
        <InputLabel 
          id="date-filter-type-label"
          sx={{ 
            fontSize: '0.875rem',
            color: '#757575',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-focused': {
              color: '#6BA3D0'
            }
          }}
        >
          Tipe Filter
        </InputLabel>
        <Select
          labelId="date-filter-type-label"
          value={value || 'year'}
          onChange={handleChange}
          onOpen={handleOpen}
          label="Tipe Filter"
          displayEmpty={false}
          MenuProps={{
            PaperProps: {
              sx: {
                mt: 1,
                width: menuWidth ? `${menuWidth}px !important` : 'auto',
                minWidth: menuWidth ? `${menuWidth}px !important` : '0 !important',
                maxWidth: menuWidth ? `${menuWidth}px !important` : 'none',
                overflow: 'hidden',
                boxSizing: 'border-box',
                '& .MuiMenuItem-root': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.875rem',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  px: 2,
                  py: 1,
                  maxWidth: '100%',
                  width: '100%',
                  boxSizing: 'border-box'
                }
              },
              style: menuWidth ? {
                width: `${menuWidth}px`,
                minWidth: `${menuWidth}px`,
                maxWidth: `${menuWidth}px`,
                boxSizing: 'border-box'
              } : {}
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            disableAutoFocusItem: true
          }}
          sx={{
            fontSize: '0.875rem',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: (value === 'range' || value === 'specific') ? '#6BA3D0' : '#E5E5E5',
              borderWidth: '1px'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: (value === 'range' || value === 'specific') ? '#6BA3D0' : '#E0E0E0'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6BA3D0',
              borderWidth: '1px'
            }
          }}
        >
        <MenuItem 
          value="year" 
          sx={{ 
            fontSize: '0.875rem', 
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-selected': {
              bgcolor: 'rgba(107, 163, 208, 0.08)',
              color: '#6BA3D0',
              '&:hover': {
                bgcolor: 'rgba(107, 163, 208, 0.12)'
              }
            }
          }}
        >
          Per Tahun (Bulanan)
        </MenuItem>
        <MenuItem 
          value="range" 
          sx={{ 
            fontSize: '0.875rem', 
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-selected': {
              bgcolor: 'rgba(107, 163, 208, 0.08)',
              color: '#6BA3D0',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(107, 163, 208, 0.12)'
              }
            }
          }}
        >
          Range Tanggal (Max 31)
        </MenuItem>
        <MenuItem 
          value="specific" 
          sx={{ 
            fontSize: '0.875rem', 
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-selected': {
              bgcolor: 'rgba(107, 163, 208, 0.08)',
              color: '#6BA3D0',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(107, 163, 208, 0.12)'
              }
            }
          }}
        > 
          Multi Range Comparison (Max 5)
        </MenuItem>
      </Select>
    </FormControl>
    </Box>
  );
}

export default DateFilterType;

