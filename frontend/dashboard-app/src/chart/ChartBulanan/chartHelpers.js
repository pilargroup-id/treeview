import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js';

// Constants
const API_URL = 'http://localhost:8000/api';
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const monthShortNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

// Utility Functions
export const formatCurrency = (num) => {
  const value = parseFloat(num);
  if (isNaN(value)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const calculatePercentageChange = (val2024, val2025) => {
  if (val2024 === 0) {
    return val2025 > 0 ? 100 : 0;
  }
  return ((val2025 - val2024) / val2024) * 100;
};

export const processData = (apiData) => {
  const processed = [];
  apiData.forEach(item => {
    const date = new Date(item.date + '-01');
    const monthIndex = date.getMonth();
    processed.push({
      month: monthNames[monthIndex],
      monthShort: monthShortNames[monthIndex],
      total: item.total
    });
  });
  return processed;
};

export const getFilteredData = (allData, selectedMonths) => {
  if (selectedMonths.size === 0) {
    return {
      data2024: allData.data2024,
      data2025: allData.data2025
    };
  }
  
  return {
    data2024: allData.data2024.filter(item => selectedMonths.has(item.month)),
    data2025: allData.data2025.filter(item => selectedMonths.has(item.month))
  };
};

// API Service
export const loadRevenueData = async (accountHeader) => {
  try {
    const [response2024, response2025] = await Promise.all([
      fetch(`${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=2024-01-01&end_date=2024-12-31`),
      fetch(`${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=2025-01-01&end_date=2025-12-31`)
    ]);

    const [result2024, result2025] = await Promise.all([
      response2024.json(),
      response2025.json()
    ]);

    if (result2024.status === 'success' && result2025.status === 'success') {
      return {
        success: true,
        data: {
          data2024: processData(result2024.data),
          data2025: processData(result2025.data)
        }
      };
    } else {
      return {
        success: false,
        error: 'Error loading data from API'
      };
    }
  } catch (error) {
    console.error('Error loading revenue data:', error);
    return {
      success: false,
      error: error.message || 'Failed to load data'
    };
  }
};

// Custom Hooks
export const useChartData = (initialAccountHeader = '4000.01.00') => {
  const [accountHeader, setAccountHeader] = useState(initialAccountHeader);
  const [allData, setAllData] = useState({ data2024: [], data2025: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadRevenueData(accountHeader);
      
      if (result.success) {
        setAllData(result.data);
      } else {
        setError(result.error);
        alert('Error loading data: ' + result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data';
      setError(errorMessage);
      alert('Failed to load data: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accountHeader]);

  return {
    accountHeader,
    setAccountHeader,
    allData,
    loading,
    error,
    loadRevenue
  };
};

export const useMonthPicker = (selectedMonths) => {
  const [tempSelectedMonths, setTempSelectedMonths] = useState(new Set());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
        setMonthPickerOpen(false);
      }
    };

    if (monthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [monthPickerOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMonthPickerOpen(false);
      }
    };

    if (monthPickerOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [monthPickerOpen]);

  const handleMonthToggle = (month) => {
    const newSet = new Set(tempSelectedMonths);
    if (newSet.has(month)) {
      newSet.delete(month);
    } else {
      newSet.add(month);
    }
    setTempSelectedMonths(newSet);
  };

  const handleCancelMonths = () => {
    setTempSelectedMonths(new Set(selectedMonths));
    setMonthPickerOpen(false);
  };

  const handleOpenMonthPicker = () => {
    setTempSelectedMonths(new Set(selectedMonths));
    setMonthPickerOpen(true);
  };

  return {
    tempSelectedMonths,
    monthPickerOpen,
    monthPickerRef,
    handleMonthToggle,
    handleCancelMonths,
    handleOpenMonthPicker
  };
};

// Chart Plugin
export const createPercentageLabelsPlugin = (stateRef) => {
  return {
    id: 'percentageLabels',
    afterDatasetsDraw: (chart) => {
      const { showPercentage, show2024, show2025, filteredData } = stateRef.current;
      
      if (!showPercentage || !show2024 || !show2025) return;
      
      const ctx = chart.ctx;
      const meta2024 = chart.getDatasetMeta(0);
      const meta2025 = chart.getDatasetMeta(1);
      
      if (!meta2024 || !meta2025) return;
      
      meta2025.data.forEach((bar, index) => {
        const bar2024 = meta2024.data[index];
        if (!bar2024) return;
        
        const val2024 = filteredData.data2024[index]?.total || 0;
        const val2025 = filteredData.data2025[index]?.total || 0;
        const percentChange = calculatePercentageChange(val2024, val2025);
        
        if (val2024 > 0 || val2025 > 0) {
          const x = (bar2024.x + bar.x) / 2;
          const y = Math.min(bar2024.y, bar.y) - 15;
          
          ctx.save();
          ctx.font = 'bold 11px Segoe UI';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          if (percentChange >= 0) {
            ctx.fillStyle = '#10b981';
          } else {
            ctx.fillStyle = '#ef4444';
          }
          
          const arrow = percentChange >= 0 ? '▲' : '▼';
          const text = `${arrow} ${Math.abs(percentChange).toFixed(1)}%`;
          
          ctx.fillText(text, x, y);
          ctx.restore();
        }
      });
    }
  };
};

// Chart Configuration Hook
export const useChartConfig = (filteredData, show2024, show2025, showPercentage) => {
  const labels = useMemo(() => {
    return filteredData.data2024.map(item => item.monthShort);
  }, [filteredData.data2024]);

  const percentageChanges = useMemo(() => {
    return filteredData.data2024.map((item, index) => {
      const val2024 = item.total;
      const val2025 = filteredData.data2025[index]?.total || 0;
      return calculatePercentageChange(val2024, val2025);
    });
  }, [filteredData]);

  const datasets = useMemo(() => {
    const datasets = [];
    const barConfig = {
      type: 'bar',
      yAxisID: 'y',
      barPercentage: 0.8,
      categoryPercentage: 0.6,
      borderSkipped: false,
      borderRadius: 4,
      borderWidth: 1
    };

    if (show2024) {
      datasets.push({
        label: '2024 Revenue',
        data: filteredData.data2024.map(item => item.total),
        backgroundColor: 'rgba(54, 162, 235, 0.75)',
        borderColor: 'rgb(54, 162, 235)',
        ...barConfig
      });
    }

    if (show2025) {
      datasets.push({
        label: '2025 Revenue',
        data: filteredData.data2025.map(item => item.total),
        backgroundColor: 'rgba(255, 99, 132, 0.75)',
        borderColor: 'rgb(255, 99, 132)',
        ...barConfig
      });
    }

    if (showPercentage) {
      datasets.push({
        label: 'Persentase Perubahan',
        data: percentageChanges,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        type: 'line',
        yAxisID: 'y1',
        tension: 0,
        fill: false
      });
    }

    return datasets;
  }, [filteredData, show2024, show2025, showPercentage, percentageChanges]);

  const chartData = useMemo(() => {
    return {
      labels: labels,
      datasets: datasets
    };
  }, [labels, datasets]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: {
            size: 13,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: function(context) {
              const shortMonth = context[0].label;
              const monthIndex = monthShortNames.indexOf(shortMonth);
              return monthNames[monthIndex] || shortMonth;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              
              if (context.dataset.yAxisID === 'y1') {
                label += context.parsed.y.toFixed(2) + '%';
              } else {
                if (context.parsed.y !== null) {
                  label += formatCurrency(context.parsed.y);
                }
              }
              return label;
            },
            afterBody: function(context) {
              if (context.length > 0 && !showPercentage) {
                const dataIndex = context[0].dataIndex;
                const val2024 = filteredData.data2024[dataIndex]?.total || 0;
                const val2025 = filteredData.data2025[dataIndex]?.total || 0;
                const percentChange = calculatePercentageChange(val2024, val2025);
                
                const arrow = percentChange >= 0 ? '↑' : '↓';
                const color = percentChange >= 0 ? 'Naik' : 'Turun';
                
                return [
                  '',
                  `${color} ${arrow} ${Math.abs(percentChange).toFixed(2)}%`
                ];
              }
              return [];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Rupiah (IDR)',
            font: {
              size: 13,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.06)',
            drawBorder: false
          },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            },
            font: {
              size: 11
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Bulan',
            font: {
              size: 13,
              weight: 'bold'
            }
          },
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        ...(showPercentage && {
          y1: {
            beginAtZero: false,
            position: 'right',
            title: {
              display: true,
              text: 'Persentase (%)',
              font: {
                size: 13,
                weight: 'bold'
              },
              color: 'rgb(16, 185, 129)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: function(value) {
                return value.toFixed(1) + '%';
              },
              font: {
                size: 11
              },
              color: 'rgb(16, 185, 129)'
            }
          }
        })
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }, [showPercentage, filteredData]);

  return { chartData, chartOptions };
};

// Export monthNames for MonthPicker component
export { monthNames };

