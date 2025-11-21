import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function DateFilterType({ value, onChange }) {
  const handleChange = (event) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  return (
    <FormControl size="medium" fullWidth>
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
        label="Tipe Filter"
        displayEmpty={false}
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
          Range Tanggal
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
          Tanggal Tertentu (Max 30)
        </MenuItem>
      </Select>
    </FormControl>
  );
}

export default DateFilterType;

