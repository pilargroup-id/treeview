import React from 'react';
import { Button, Card, Typography, IconButton, Box, TextField, InputAdornment } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import CategoryFilter from './CategoryFilter';
import PageSwitcher, { PageType } from './PageSwitcher';

interface FilterSectionProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onCategoryChange?: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  categories: Array<{ name: string; count: number; dpp: number }>;
}

function FilterSection({
  currentPage,
  onPageChange,
  selectedCategories,
  onCategoryToggle,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  categories
}: FilterSectionProps) {
  return (
    <Card sx={{ 
      bgcolor: '#FFFFFF', 
      borderRadius: '16px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
      border: '1px solid #E5E7EB',
      p: { xs: 2, md: 2.5 },
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      height: '100%',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      zIndex: 1,
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
        borderColor: '#D1D5DB',
        transform: 'translateY(-1px)'
      }
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 0
      }}>
        <Typography sx={{ 
          fontSize: { xs: '0.9375rem', md: '1rem' }, 
          fontWeight: 600, 
          color: '#212121',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          letterSpacing: '-0.01em',
          lineHeight: 1.4
        }}>
          Filter
        </Typography>
        <IconButton
          onClick={onRefresh}
          disabled={isLoading}
          size="small"
          sx={{
            color: '#9E9E9E',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#6BA3D0',
              bgcolor: '#FAFAFA'
            },
            '&:disabled': {
              color: '#E0E0E0'
            }
          }}
          title="Refresh Data"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      <PageSwitcher 
        currentPage={currentPage}
        onPageChange={onPageChange}
      />

      <TextField
        fullWidth
        size="medium"
        placeholder="Cari kategori..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#9E9E9E', fontSize: '1.25rem' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            bgcolor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#E5E5E5',
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: '#E0E0E0'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6BA3D0',
              borderWidth: '1px'
            }
          },
          '& .MuiInputBase-input': {
            py: 1.125
          }
        }}
      />

      <CategoryFilter 
        categories={categories}
        selectedCategories={selectedCategories}
        onToggle={onCategoryToggle}
        onChange={onCategoryChange}
        searchQuery={searchQuery}
      />
    </Card>
  );
}

export default FilterSection;

