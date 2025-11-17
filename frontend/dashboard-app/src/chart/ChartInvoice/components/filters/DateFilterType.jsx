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
          color: '#616161'
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
            borderColor: '#757575',
            borderWidth: '1px'
          }
        }}
      >
        <MenuItem value="year" sx={{ fontSize: '0.875rem' }}>Per Tahun (Bulanan)</MenuItem>
        <MenuItem value="range" sx={{ fontSize: '0.875rem' }}>Range Tanggal</MenuItem>
        <MenuItem value="specific" sx={{ fontSize: '0.875rem' }}>Tanggal Tertentu (Max 30)</MenuItem>
        <MenuItem value="compare_year" sx={{ fontSize: '0.875rem' }}>Compare by Year</MenuItem>
      </Select>
    </FormControl>
  );
}

export default DateFilterType;

