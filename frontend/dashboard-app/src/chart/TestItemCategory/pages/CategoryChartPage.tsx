import * as React from 'react';
import { Box } from '@mui/material';
import CategoryBarChart from '../charts/CategoryBarChart';
import FilterSection from '../components/FilterSection';

import { PageType } from '../components/PageSwitcher';

interface CategoryChartPageProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  categories: Array<{ name: string; count: number; dpp: number }>;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onCategoryChange?: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

function CategoryChartPage({
  currentPage,
  onPageChange,
  categories,
  selectedCategories,
  onCategoryToggle,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
}: CategoryChartPageProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 2, md: 2.5 },
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 1,
        flex: '1 1 auto',
        minHeight: 0,
        overflow: 'visible',
      }}
    >
      {/* Filter Section di Kiri */}
      <Box
        sx={{
          width: { xs: '100%', lg: 320 },
          minWidth: { xs: '100%', lg: 320 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <FilterSection
          currentPage={currentPage}
          onPageChange={onPageChange}
          selectedCategories={selectedCategories}
          onCategoryToggle={onCategoryToggle}
          onCategoryChange={onCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          isLoading={isLoading}
          categories={categories}
        />
      </Box>

      {/* Chart Section */}
      <Box
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          minHeight: 0,
          overflow: 'visible',
          padding: '2px',
        }}
      >
        <CategoryBarChart categories={categories} />
      </Box>
    </Box>
  );
}

export default CategoryChartPage;

