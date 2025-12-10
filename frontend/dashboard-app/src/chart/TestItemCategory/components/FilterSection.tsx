import React from 'react';
import { Button, Card, Typography, IconButton, Box, Badge } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CategoryModal from './CategoryModal';
import PageSwitcher, { PageType } from './PageSwitcher';
import { RangeDateFilter, RangeDate } from './filters/RangeTanggal';

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
  // Range Date Filter Props
  rangeDates?: RangeDate[];
  onAddRange?: (range: RangeDate) => void;
  onRemoveRange?: (range: RangeDate) => void;
  availableYears?: number[];
  selectedYears?: number[];
  businessUnits?: string[];
  onBusinessUnitToggle?: (unit: string) => void;
  dataType?: 'both' | 'invoice' | 'payment';
  onDataTypeChange?: (type: 'both' | 'invoice' | 'payment') => void;
  invoiceData?: any[];
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
  categories,
  rangeDates = [],
  onAddRange,
  onRemoveRange,
  availableYears = [],
  selectedYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = []
}: FilterSectionProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [rangeDateModalOpen, setRangeDateModalOpen] = React.useState(false);

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

      {/* Tombol Range Date Filter */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={<CalendarMonthRoundedIcon />}
        onClick={() => setRangeDateModalOpen(true)}
        sx={{
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#212121',
          borderColor: '#E5E5E5',
          borderRadius: '12px',
          py: 1.25,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: 'transparent',
          '&:hover': {
            borderColor: '#6BA3D0',
            bgcolor: 'rgba(107, 163, 208, 0.04)',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(107, 163, 208, 0.15)',
          },
        }}
      >
        Pilih Range Tanggal
      </Button>

      {/* Range Date Filter Component - Modal dikontrol oleh prop open */}
      <RangeDateFilter
        rangeDates={rangeDates}
        onAddRange={onAddRange || (() => {})}
        onRemoveRange={onRemoveRange || (() => {})}
        availableYears={availableYears}
        selectedYears={selectedYears}
        businessUnits={businessUnits}
        onBusinessUnitToggle={onBusinessUnitToggle}
        dataType={dataType}
        onDataTypeChange={onDataTypeChange}
        invoiceData={invoiceData}
        open={rangeDateModalOpen}
        onClose={() => setRangeDateModalOpen(false)}
      />

      {/* Hanya tampilkan tombol filter kategori untuk halaman table */}
      {currentPage === 'table' && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={
            <Badge badgeContent={selectedCategories.length} color="primary" max={99}>
              <FilterListIcon />
            </Badge>
          }
          onClick={() => setModalOpen(true)}
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#212121',
            borderColor: '#E5E5E5',
            borderRadius: '12px',
            py: 1.25,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: '#6BA3D0',
              bgcolor: 'rgba(107, 163, 208, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(107, 163, 208, 0.15)',
            },
            '& .MuiBadge-badge': {
              fontSize: '0.625rem',
              height: '18px',
              minWidth: '18px',
              padding: '0 4px',
            },
          }}
        >
          {selectedCategories.length > 0
            ? `${selectedCategories.length} Kategori Dipilih`
            : 'Pilih Kategori'}
        </Button>
      )}

      {/* Modal untuk mengatur kategori (hanya untuk halaman table) */}
      {currentPage === 'table' && (
        <CategoryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggle={onCategoryToggle}
          onChange={onCategoryChange}
        />
      )}
    </Card>
  );
}

export default FilterSection;

