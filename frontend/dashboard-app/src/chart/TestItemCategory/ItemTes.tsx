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
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [itemSearchQuery, setItemSearchQuery] = React.useState('');
  const { fetchRows, isReady } = useMockStockServer();

  const categories = React.useMemo(() => {
    return loadCategories(allRows);
  }, [allRows]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
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

  React.useEffect(() => {
    let filtered = allRows;

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((row) => {
        // Check if row's category matches any of the selected categories
        return selectedCategories.some(selectedCat => 
          row.category === selectedCat || 
          row.category.toLowerCase() === selectedCat.toLowerCase()
        );
      });
    }

    // Filter by item search query (name, symbol, or category)
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
  }, [selectedCategories, allRows, itemSearchQuery]);

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
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={handleRefresh}
            isLoading={loading}
          />
        ) : (
          <ItemTablePage
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            allRows={allRows}
            filteredRows={filteredRows}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            itemSearchQuery={itemSearchQuery}
            onItemSearchChange={setItemSearchQuery}
            onRefresh={handleRefresh}
            isLoading={loading}
            categories={categories}
          />
        )}
      </Box>
    </DemoContainer>
  );
}

export default ItemTes;