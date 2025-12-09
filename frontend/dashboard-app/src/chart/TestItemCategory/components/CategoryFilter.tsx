import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';

interface CategoryFilterProps {
  categories: Array<{ name: string; count: number; dpp: number }>;
  selectedCategories: string[];
  onToggle: (category: string) => void;
  onChange?: (categories: string[]) => void;
  searchQuery?: string;
}

function CategoryFilter({ categories, selectedCategories, onToggle, searchQuery = '' }: CategoryFilterProps) {
  const handleToggle = (category: string) => {
    onToggle(category);
  };

  const handleClearAll = () => {
    selectedCategories.forEach(cat => {
      if (selectedCategories.includes(cat)) {
        onToggle(cat);
      }
    });
  };

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ 
          fontWeight: 500, 
          fontSize: '0.875rem', 
          whiteSpace: 'nowrap', 
          color: '#757575',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          letterSpacing: '0.01em',
          lineHeight: 1.4
        }}>
          Kategori
        </Typography>
        {selectedCategories.length > 0 && (
          <Button
            onClick={handleClearAll}
            size="small"
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#6BA3D0',
              minWidth: 'auto',
              px: 1,
              py: 0.25,
              '&:hover': {
                bgcolor: 'rgba(107, 163, 208, 0.06)'
              }
            }}
          >
            Clear All
          </Button>
        )}
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        maxHeight: 200,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: '#F5F5F5',
          borderRadius: '3px'
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: '#E0E0E0',
          borderRadius: '3px',
          '&:hover': {
            bgcolor: '#BDBDBD'
          }
        }
      }}>
        {filteredCategories.length === 0 ? (
          <Typography sx={{ 
            fontSize: '0.8125rem', 
            color: '#9E9E9E',
            fontStyle: 'italic',
            py: 1
          }}>
            Tidak ada kategori yang cocok
          </Typography>
        ) : (
          filteredCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.name);
          return (
            <Chip
              key={category.name}
              label={`${category.name} (${category.count})`}
              onClick={() => handleToggle(category.name)}
              sx={{
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 500,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                bgcolor: isSelected ? '#6BA3D0' : '#FAFAFA',
                color: isSelected ? 'white' : '#757575',
                border: isSelected ? 'none' : '1px solid #E5E5E5',
                borderRadius: '8px',
                height: '32px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: isSelected ? '#5A9FD0' : '#F5F5F5',
                  border: isSelected ? 'none' : '1px solid #E0E0E0',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'scale(0.98)',
                  transition: 'all 0.1s ease'
                }
              }}
            />
          );
        }))}
      </Box>
    </Box>
  );
}

export default CategoryFilter;