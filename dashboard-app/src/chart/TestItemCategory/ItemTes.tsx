import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTheme } from '@mui/material/styles';
import type { StockData } from './types/stocks';
import { useMockStockServer } from './hooks/useMockStockServer';
import { DemoContainer } from './DemoContainer.tsx';
import { stockDashboardTheme } from './theme';
import { PageType } from './components/PageSwitcher';
import CategoryChartPage from './pages/CategoryChartPage';
import ItemTablePage from './pages/ItemTablePage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import dataCategories from './data/dataCategory.json';
import type { CategoryJsonData } from './types/stocks';

const loadCategories = (allRows: StockData[]): Array<{ name: string; count: number; dpp: number }> => {
  const categoryData = dataCategories as CategoryJsonData;
  
  const categoryCounts = new Map<string, number>();
  allRows.forEach((row) => {
    const currentCount = categoryCounts.get(row.category) || 0;
    categoryCounts.set(row.category, currentCount + 1);
  });
  
  // Create a map of category DPP from JSON data
  const categoryDppMap = new Map<string, number>();
  categoryData.categories.forEach((cat) => {
    categoryDppMap.set(cat.main_category, cat.DPP);
  });
  
  return categoryData.categories.map((cat) => ({
    name: cat.main_category,
    count: categoryCounts.get(cat.main_category) || 0,
    dpp: cat.DPP || 0,
  })).sort((a, b) => b.dpp - a.dpp); 
};

function ItemTes() {
  const [currentPage, setCurrentPage] = React.useState<PageType>('chart');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [allRows, setAllRows] = React.useState<StockData[]>([]);
  const [filteredRows, setFilteredRows] = React.useState<StockData[]>([]);
  
  // Filter terpisah untuk Chart Category
  const [selectedCategoriesChart, setSelectedCategoriesChart] = React.useState<string[]>([]);
  const [searchQueryChart, setSearchQueryChart] = React.useState('');
  
  // Filter terpisah untuk Table Item
  const [selectedCategoriesTable, setSelectedCategoriesTable] = React.useState<string[]>([]);
  const [searchQueryTable, setSearchQueryTable] = React.useState('');
  const [itemSearchQuery, setItemSearchQuery] = React.useState('');
  
  // Range Date Filter State
  const [rangeDates, setRangeDates] = React.useState<Array<{ start: string; end: string; year: number }>>([]);
  const [availableYears] = React.useState<number[]>([2020, 2021, 2022, 2023, 2024, 2025]);
  const [selectedYears] = React.useState<number[]>([]);
  const [businessUnits] = React.useState<string[]>([]);
  const [dataType, setDataType] = React.useState<'both' | 'invoice' | 'payment'>('both');
  const [invoiceData] = React.useState<any[]>([]);
  
  const handleAddRange = React.useCallback((range: { start: string; end: string; year: number }) => {
    setRangeDates(prev => [...prev, range]);
  }, []);
  
  const handleRemoveRange = React.useCallback((range: { start: string; end: string; year: number }) => {
    setRangeDates(prev => prev.filter(r => 
      !(r.start === range.start && r.end === range.end && r.year === range.year)
    ));
  }, []);
  
  const { fetchRows, isReady } = useMockStockServer();

  // Categories untuk Chart (di-filter berdasarkan filter chart)
  const categoriesChart = React.useMemo(() => {
    // Filter rows berdasarkan kategori yang dipilih untuk chart (hanya mempengaruhi perhitungan count)
    let filteredRows = allRows;
    if (selectedCategoriesChart.length > 0) {
      filteredRows = filteredRows.filter((row) => {
        return selectedCategoriesChart.some(selectedCat => 
          row.category === selectedCat || 
          row.category.toLowerCase() === selectedCat.toLowerCase()
        );
      });
    }
    
    // Load categories dari filtered rows
    const categories = loadCategories(filteredRows);
    
    // Filter categories berdasarkan searchQueryChart (untuk mencari nama kategori di list filter)
    if (searchQueryChart.trim() !== '') {
      const searchLower = searchQueryChart.toLowerCase().trim();
      return categories.filter(cat => 
        cat.name.toLowerCase().includes(searchLower)
      );
    }
    
    return categories;
  }, [allRows, selectedCategoriesChart, searchQueryChart]);

  // Categories untuk Table (di-filter berdasarkan filter table)
  const categoriesTable = React.useMemo(() => {
    // Filter rows berdasarkan kategori yang dipilih untuk table (hanya mempengaruhi perhitungan count)
    let filteredRows = allRows;
    if (selectedCategoriesTable.length > 0) {
      filteredRows = filteredRows.filter((row) => {
        return selectedCategoriesTable.some(selectedCat => 
          row.category === selectedCat || 
          row.category.toLowerCase() === selectedCat.toLowerCase()
        );
      });
    }
    
    // Load categories dari filtered rows
    const categories = loadCategories(filteredRows);
    
    // Filter categories berdasarkan searchQueryTable (untuk mencari nama kategori di list filter)
    if (searchQueryTable.trim() !== '') {
      const searchLower = searchQueryTable.toLowerCase().trim();
      return categories.filter(cat => 
        cat.name.toLowerCase().includes(searchLower)
      );
    }
    
    return categories;
  }, [allRows, selectedCategoriesTable, searchQueryTable]);

  // Handler untuk Chart Category
  const handleCategoryToggleChart = (category: string) => {
    setSelectedCategoriesChart(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleCategoryChangeChart = (categories: string[]) => {
    setSelectedCategoriesChart(categories);
  };

  // Handler untuk Table Item
  const handleCategoryToggleTable = (category: string) => {
    setSelectedCategoriesTable(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleCategoryChangeTable = (categories: string[]) => {
    setSelectedCategoriesTable(categories);
  };

  const handleRefresh = React.useCallback(() => {
    if (!isReady) return;
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await fetchRows('?page=0&pageSize=10000');
        if (response.rows && response.rows.length > 0) {
          const stockData = response.rows as StockData[];
          setAllRows(stockData);
          setLoading(false);
        } else {
          setAllRows([]);
          setLoading(false);
          setError('No stock data returned from server');
        }
      } catch (err) {
        console.error('Error loading stock data:', err);
        setAllRows([]);
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load stock data';
        setError(`Failed to load stock data: ${errorMessage}`);
      }
    };
    loadData();
  }, [isReady, fetchRows]);

  // Filter untuk Table Item (hanya berlaku saat di halaman table)
  React.useEffect(() => {
    if (currentPage !== 'table') {
      return;
    }

    let filtered = allRows;

    // Filter berdasarkan kategori yang dipilih untuk table
    if (selectedCategoriesTable.length > 0) {
      filtered = filtered.filter((row) => {
        return selectedCategoriesTable.some(selectedCat => 
          row.category === selectedCat || 
          row.category.toLowerCase() === selectedCat.toLowerCase()
        );
      });
    }

    // Filter by item search query (name, symbol, or category)
    // Note: searchQueryTable hanya untuk mencari kategori di list filter, bukan untuk memfilter data rows
    if (itemSearchQuery.trim() !== '') {
      const searchLower = itemSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((row) => {
        const nameMatch = row.name?.toLowerCase().includes(searchLower) || false;
        const symbolMatch = row.symbol?.toLowerCase().includes(searchLower) || false;
        const categoryMatch = row.category?.toLowerCase().includes(searchLower) || false;
        return nameMatch || symbolMatch || categoryMatch;
      });
    }

    setFilteredRows(filtered);
  }, [selectedCategoriesTable, itemSearchQuery, allRows, currentPage]);

  React.useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        console.log('Loading stock data...', { isReady });
        const response = await fetchRows('?page=0&pageSize=10000');
        console.log('Received response:', { 
          hasRows: !!response.rows, 
          rowCount: response.rows?.length || 0,
          totalRowCount: response.rowCount 
        });
        
        if (response.rows && response.rows.length > 0) {
          const stockData = response.rows as StockData[];
          // Verify history is included
          const firstRow = stockData[0];
          console.log('First row sample:', {
            id: firstRow?.id,
            symbol: firstRow?.symbol,
            hasHistory: !!firstRow?.history,
            historyLength: firstRow?.history?.length || 0
          });
          setAllRows(stockData);
          setFilteredRows(stockData);
          setLoading(false);
          console.log('Stock data loaded successfully');
        } else {
          setAllRows([]);
          setFilteredRows([]);
          setLoading(false);
          const errorMsg = response.rowCount === 0 
            ? 'No stock data available. Data may still be loading...' 
            : 'No stock data returned from server';
          setError(errorMsg);
          console.warn('No rows in response:', response);
        }
      } catch (err) {
        console.error('Error loading stock data:', err);
        setAllRows([]);
        setFilteredRows([]);
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load stock data';
        setError(`Failed to load stock data: ${errorMessage}`);
      }
    };

    loadData();
  }, [isReady, fetchRows]);

  return (
    <DemoContainer theme={stockDashboardTheme}>
      <Box sx={{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)',
        pt: { xs: 2, sm: 2.5, md: 3 },
        px: { xs: 2, sm: 2.5, md: 3 },
        pb: { xs: 2, sm: 2.5, md: 3 },
        gap: { xs: 2, md: 2.5 },
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(107, 163, 208, 0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}>
        {error && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 0,
              borderRadius: 2,
              position: 'relative',
              zIndex: 1,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Page Content */}
        {currentPage === 'chart' ? (
          <CategoryChartPage
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            categories={categoriesChart}
            selectedCategories={selectedCategoriesChart}
            onCategoryToggle={handleCategoryToggleChart}
            onCategoryChange={handleCategoryChangeChart}
            searchQuery={searchQueryChart}
            onSearchChange={setSearchQueryChart}
            onRefresh={handleRefresh}
            isLoading={loading}
            rangeDates={rangeDates}
            onAddRange={handleAddRange}
            onRemoveRange={handleRemoveRange}
            availableYears={availableYears}
            selectedYears={selectedYears}
            businessUnits={businessUnits}
            dataType={dataType}
            onDataTypeChange={setDataType}
            invoiceData={invoiceData}
          />
        ) : (
          <ItemTablePage
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            allRows={allRows}
            filteredRows={filteredRows}
            selectedCategories={selectedCategoriesTable}
            onCategoryToggle={handleCategoryToggleTable}
            onCategoryChange={handleCategoryChangeTable}
            searchQuery={searchQueryTable}
            onSearchChange={setSearchQueryTable}
            itemSearchQuery={itemSearchQuery}
            onItemSearchChange={setItemSearchQuery}
            onRefresh={handleRefresh}
            isLoading={loading}
            categories={categoriesTable}
            rangeDates={rangeDates}
            onAddRange={handleAddRange}
            onRemoveRange={handleRemoveRange}
            availableYears={availableYears}
            selectedYears={selectedYears}
            businessUnits={businessUnits}
            dataType={dataType}
            onDataTypeChange={setDataType}
            invoiceData={invoiceData}
          />
        )}
      </Box>
    </DemoContainer>
  );
}

export default ItemTes;