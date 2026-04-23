import * as React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export type PageType = 'chart' | 'table';

interface PageSwitcherProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

function PageSwitcher({ currentPage, onPageChange }: PageSwitcherProps) {
  const handleChange = (event: any) => {
    const newValue = event.target.value as PageType;
    onPageChange(newValue);
  };

  return (
    <FormControl size="medium" fullWidth>
      <InputLabel 
        id="page-type-label"
        sx={{ 
          fontSize: '0.875rem',
          color: '#757575',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          '&.Mui-focused': {
            color: '#2F6FB2'
          }
        }}
      >
        Tipe Filter
      </InputLabel>
      <Select
        labelId="page-type-label"
        value={currentPage || 'chart'}
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
            borderColor: '#E5E5E5',
            borderWidth: '1px'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E0E0E0'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2F6FB2',
            borderWidth: '1px'
          }
        }}
      >
        <MenuItem 
          value="chart" 
          sx={{ 
            fontSize: '0.875rem', 
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-selected': {
              bgcolor: 'rgba(47, 111, 178, 0.08)',
              color: '#2F6FB2',
              '&:hover': {
                bgcolor: 'rgba(47, 111, 178, 0.12)'
              }
            }
          }}
        >
          Chart Kategori
        </MenuItem>
        <MenuItem 
          value="table" 
          sx={{ 
            fontSize: '0.875rem', 
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&.Mui-selected': {
              bgcolor: 'rgba(47, 111, 178, 0.08)',
              color: '#2F6FB2',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(47, 111, 178, 0.12)'
              }
            }
          }}
        >
          Tabel Item
        </MenuItem>
      </Select>
    </FormControl>
  );
}

export default PageSwitcher;

