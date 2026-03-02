import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Card from '@mui/material/Card';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {
  GridApi,
  gridRowSelectionIdsSelector,
  useGridSelector,
} from '@mui/x-data-grid';
import { Line } from 'react-chartjs-2';
import { getDay, getDate, getMonth } from 'date-fns';
import type { StockData } from '../types/stocks';

type PeriodType = 'week' | 'month' | 'year';

function StockDetailsPanel({
  apiRef,
  filteredRows,
  allRows,
}: {
  apiRef: React.RefObject<GridApi>;
  filteredRows: StockData[];
  allRows: StockData[];
}) {
  const [period, setPeriod] = React.useState<PeriodType>('week');
  const selectedRowIds = useGridSelector(apiRef, gridRowSelectionIdsSelector);
  const selectedStock = React.useMemo(() => {
    if (selectedRowIds.size > 0) {
      const selectedId = Array.from(selectedRowIds.values())[0];
      console.log('Selected ID from grid:', selectedId, 'Type:', typeof selectedId);
      console.log('FilteredRows count:', filteredRows.length);
      console.log('AllRows count:', allRows.length);

      let stock: StockData | null = null;

      const idToFind = typeof selectedId === 'number' ? selectedId : Number(selectedId);
      stock = filteredRows.find((row) => row.id === idToFind) || null;

      if (!stock) {
        stock = allRows.find((row) => row.id === idToFind) || null;
      }

      if (!stock) {
        stock = filteredRows.find((row) => String(row.id) === String(selectedId)) || null;
      }

      if (!stock) {
        stock = allRows.find((row) => String(row.id) === String(selectedId)) || null;
      }

      if (!stock) {
        const index = typeof selectedId === 'number' ? selectedId : parseInt(String(selectedId), 10);
        if (!isNaN(index) && index >= 0) {
          stock = filteredRows[index] || allRows[index] || null;
          if (stock) {
            console.log('Found stock by index:', stock);
          }
        }
      }

      if (stock) {
        console.log('Selected stock found:', stock);
        console.log('Stock name:', stock.name, 'Type:', typeof stock.name);
        console.log('Stock symbol:', stock.symbol, 'Type:', typeof stock.symbol);
        console.log('Stock full object keys:', Object.keys(stock));
        console.log('History length:', stock.history?.length || 0);

        if (stock.name && typeof stock.name !== 'string') {
          console.warn('Stock name is not string, converting:', stock.name);
          stock = {
            ...stock,
            name:
              typeof stock.name === 'object'
                ? (stock.name as any)?.name || (stock.name as any)?.value || String(stock.name)
                : String(stock.name),
          };
        }

        return stock;
      } else {
        console.warn('Stock not found for ID:', selectedId, {
          idToFind,
          filteredRowsCount: filteredRows.length,
          allRowsCount: allRows.length,
          filteredRowsIds: filteredRows.slice(0, 3).map((r) => ({ id: r.id, name: r.name })),
        });

        const fallbackName = `Item ${selectedId}`;
        return {
          id: idToFind,
          symbol: fallbackName,
          name: fallbackName,
          logoUrl: '',
          price: 100,
          change: 0,
          changePercent: 0,
          volume: 0,
          qty: 0,
          category: 'UNKNOWN',
          history: [],
          prediction: [],
        } as StockData;
      }
    }
    return null;
  }, [selectedRowIds, filteredRows, allRows, apiRef]);

  const showPlaceholder = !selectedStock;

  const getStockName = (stock: StockData | null): string => {
    if (!stock) return '';

    if (stock.name) {
      if (typeof stock.name === 'string' && stock.name.trim() !== '') {
        return stock.name;
      }
      if (typeof stock.name === 'object') {
        console.warn('Stock name is object:', stock.name, 'Stock:', stock);
        if ('name' in stock.name && typeof (stock.name as any).name === 'string') {
          return (stock.name as any).name;
        }
        if ('value' in stock.name && typeof (stock.name as any).value === 'string') {
          return (stock.name as any).value;
        }
      }
    }

    if (stock.symbol && typeof stock.symbol === 'string' && stock.symbol.trim() !== '') {
      return stock.symbol;
    }

    return `Item ${stock.id}`;
  };

  const generateDataByPeriod = (
    history: Array<{ date: string; price: number }>,
    periodType: PeriodType,
    basePrice: number = 100
  ) => {
    if (!history || history.length === 0) return { labels: [], data: [] };

    let labels: string[] = [];
    let data: number[] = [];

    switch (periodType) {
      case 'week': {
        const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        labels = dayNames;

        const weeklyData = new Map<number, number[]>();
        history.forEach((h) => {
          const date = new Date(h.date);
          const dayOfWeek = getDay(date);

          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          if (!weeklyData.has(dayIndex)) {
            weeklyData.set(dayIndex, []);
          }
          weeklyData.get(dayIndex)!.push(h.price);
        });

        data = labels.map((_, index) => {
          const prices = weeklyData.get(index) || [];
          if (prices.length === 0) return basePrice;
          return prices.reduce((sum, p) => sum + p, 0) / prices.length;
        });
        break;
      }
      case 'month': {
        labels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());

        const monthlyData = new Map<number, number[]>();
        history.forEach((h) => {
          const date = new Date(h.date);
          const dayOfMonth = getDate(date);
          if (dayOfMonth <= 30) {
            if (!monthlyData.has(dayOfMonth)) {
              monthlyData.set(dayOfMonth, []);
            }
            monthlyData.get(dayOfMonth)!.push(h.price);
          }
        });

        data = labels.map((_, index) => {
          const day = index + 1;
          const prices = monthlyData.get(day) || [];
          if (prices.length === 0) return basePrice;
          return prices.reduce((sum, p) => sum + p, 0) / prices.length;
        });
        break;
      }
      case 'year': {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        labels = monthNames;

        const yearlyData = new Map<number, number[]>();
        history.forEach((h) => {
          const date = new Date(h.date);
          const month = getMonth(date);
          if (!yearlyData.has(month)) {
            yearlyData.set(month, []);
          }
          yearlyData.get(month)!.push(h.price);
        });

        data = labels.map((_, index) => {
          const prices = yearlyData.get(index) || [];
          if (prices.length === 0) return basePrice;
          return prices.reduce((sum, p) => sum + p, 0) / prices.length;
        });
        break;
      }
    }

    return { labels, data };
  };

  const getChartData = React.useMemo(() => {
    if (!selectedStock) {
      return null;
    }

    if (selectedStock.history && selectedStock.history.length > 0) {
      const periodData = generateDataByPeriod(selectedStock.history, period, selectedStock.price || 100);
      return {
        labels: periodData.labels,
        data: periodData.data,
        isDummy: false,
      };
    }

    const dummyData: number[] = [];
    const dummyLabels: string[] = [];
    const basePrice = selectedStock.price || 100;

    switch (period) {
      case 'week': {
        const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        dummyLabels.push(...dayNames);
        for (let i = 0; i < 7; i++) {
          const variation = (Math.random() - 0.5) * (basePrice * 0.05);
          dummyData.push(Number((basePrice + variation).toFixed(2)));
        }
        break;
      }
      case 'month': {
        for (let i = 1; i <= 30; i++) {
          dummyLabels.push(i.toString());
          const variation = (Math.random() - 0.5) * (basePrice * 0.05);
          dummyData.push(Number((basePrice + variation).toFixed(2)));
        }
        break;
      }
      case 'year': {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        dummyLabels.push(...monthNames);
        for (let i = 0; i < 12; i++) {
          const variation = (Math.random() - 0.5) * (basePrice * 0.05);
          dummyData.push(Number((basePrice + variation).toFixed(2)));
        }
        break;
      }
    }

    console.log('Using dummy data for chart - history not available');
    return {
      labels: dummyLabels,
      data: dummyData,
      isDummy: true,
    };
  }, [selectedStock, period]);

  const handleClose = () => {
    if (apiRef.current) {
      apiRef.current.setRowSelectionModel({ type: 'include', ids: new Set() });
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 320,
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
          borderColor: '#D1D5DB',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: '#E5E7EB',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          flexShrink: 0,
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '0.9375rem', md: '1.0625rem' },
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          }}
        >
          {showPlaceholder ? 'Price History' : `Quantity (${getStockName(selectedStock)})`}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!showPlaceholder && (
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(_, newPeriod) => {
                if (newPeriod !== null) {
                  setPeriod(newPeriod);
                }
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderColor: '#E5E7EB',
                  color: '#757575',
                  '&.Mui-selected': {
                    backgroundColor: '#6BA3D0',
                    color: '#FFFFFF',
                    borderColor: '#6BA3D0',
                    '&:hover': {
                      backgroundColor: '#5a92b8',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(107, 163, 208, 0.08)',
                  },
                },
              }}
            >
              <ToggleButton value="week">Minggu</ToggleButton>
              <ToggleButton value="month">Bulan</ToggleButton>
              <ToggleButton value="year">Tahun</ToggleButton>
            </ToggleButtonGroup>
          )}
          {!showPlaceholder && (
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: '#9E9E9E',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#6BA3D0',
                  bgcolor: '#FAFAFA',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {showPlaceholder ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              color: '#9E9E9E',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              }}
            >
              Pilih item dari tabel untuk melihat price history
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', maxHeight: '100%' }}>
            {getChartData ? (
              <Line
                data={{
                  labels: getChartData.labels,
                  datasets: [
                    {
                      label: 'Price',
                      data: getChartData.data,
                      borderColor:
                        getChartData.data[getChartData.data.length - 1] > getChartData.data[0]
                          ? '#2e7d32'
                          : '#d32f2f',
                      backgroundColor:
                        getChartData.data[getChartData.data.length - 1] > getChartData.data[0]
                          ? 'rgba(46, 125, 50, 0.1)'
                          : 'rgba(211, 47, 47, 0.1)',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 0,
                      pointHoverRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      callbacks: {
                        title: (items) => {
                          if (items.length > 0) {
                            const index = items[0].dataIndex;
                            const label = getChartData.labels[index];
                            return label || '';
                          }
                          return '';
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        maxTicksLimit: 10,
                      },
                    },
                    y: {
                      beginAtZero: false,
                    },
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false,
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#757575',
                }}
              >
                <Typography sx={{ fontSize: '0.875rem' }}>Loading chart data...</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}

export default StockDetailsPanel;

