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
          color: '#64748B',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          '&.Mui-focused': {
            color: '#3B82F6'
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
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          borderRadius: 1,
          bgcolor: 'white',
          transition: 'all 0.2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0',
            borderWidth: '1px'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3B82F6',
            borderWidth: '1px'
          }
        }}
      >
        <MenuItem value="year" sx={{ fontSize: '0.875rem', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>Per Tahun (Bulanan)</MenuItem>
        <MenuItem value="range" sx={{ fontSize: '0.875rem', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>Range Tanggal</MenuItem>
        <MenuItem value="specific" sx={{ fontSize: '0.875rem', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>Tanggal Tertentu (Max 30)</MenuItem>
      </Select>
    </FormControl>
  );
}

export default DateFilterType;

