import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

//  variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const monthShortNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

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

export const processData = (apiData) => {
  const processed = [];
  apiData.forEach(item => {
    const date = new Date(item.period + '-01');
    const monthIndex = date.getMonth();
    
    const credit = parseFloat(item.total_credit) || 0;
    const debit = parseFloat(item.total_debit) || 0;
    const total = parseFloat(item.total_difference) || (credit - debit);
    
    processed.push({
      month: monthNames[monthIndex],
      monthShort: monthShortNames[monthIndex],
      credit: credit,
      debit: debit,
      total: total
    });
  });
  
  return processed;
};

export const getFilteredData = (allData, selectedMonths) => {
  if (!selectedMonths || selectedMonths.size === 0) {
    return {
      data: allData.data || []
    };
  }
  
  return {
    data: (allData.data || []).filter(item => selectedMonths.has(item.month))
  };
};

// Convert rangeMonths 
export const convertRangeMonthsToSelectedMonths = (rangeMonths) => {
  if (!rangeMonths || rangeMonths.length === 0) {
    return new Set();
  }
  
  const selectedMonths = new Set();
  rangeMonths.forEach(range => {
    const start = parseInt(range.start);
    const end = parseInt(range.end);
    for (let i = start; i <= end; i++) {
      const monthIndex = i - 1; 
      if (monthIndex >= 0 && monthIndex < monthNames.length) {
        selectedMonths.add(monthNames[monthIndex]);
      }
    }
  });
  return selectedMonths;
};

// Load BU from API
export const loadBusinessUnits = async () => {
  try {
    const response = await fetch(`${API_URL}/financial/business-units`);
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: true,
        data: ['Gosave', 'Goto']
      };
    }
  } catch (error) {
    console.error('Error loading business units:', error);
    return {
      success: true,
      data: ['Gosave', 'Goto']
    };
  }
};

// API 
export const loadRevenueData = async (accountHeader, startDate, endDate, businessUnits) => {
  try {
    // Build BU query params
    const buParams = Array.from(businessUnits).map(bu => `business_units[]=${bu}`).join('&');
    const buQuery = businessUnits.size > 0 ? `&${buParams}` : '';
    
    const response = await fetch(
      `${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=${startDate}&end_date=${endDate}${buQuery}`
    );

    const result = await response.json();

    if (result.status === 'success') {
      return {
        success: true,
        data: {
          data: processData(result.data)
        }
      };
    } else {
      return {
        success: false,
        error: result.message || 'Error loading data from API'
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
export const useChartData = (initialAccountHeader = '4000.01.00', initialStartDate = '2024-01-01', initialEndDate = '2025-12-31') => {
  const [accountHeader, setAccountHeader] = useState(initialAccountHeader);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState(new Set(['Gosave', 'Goto']));
  const [allData, setAllData] = useState({ data: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRevenue = useCallback(async (onError) => {
    // Validate dates
    if (!startDate || !endDate) {
      const errorMsg = 'Mohon pilih tanggal mulai dan tanggal akhir';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      const errorMsg = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await loadRevenueData(accountHeader, startDate, endDate, selectedBusinessUnits);
      
      if (result.success) {
        setAllData(result.data);
        setError(null);
      } else {
        setError(result.error);
        if (onError) onError(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accountHeader, startDate, endDate, selectedBusinessUnits]);

  return {
    accountHeader,
    setAccountHeader,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedBusinessUnits,
    setSelectedBusinessUnits,
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

export const useChartConfig = (filteredData, showCredit, showDebit, showTotal) => {
  const labels = useMemo(() => {
    return filteredData.data.map(item => item.monthShort);
  }, [filteredData.data]);

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

    // Credit dataset
    if (showCredit) {
      datasets.push({
        label: 'Credit',
        data: filteredData.data.map(item => item.credit),
        backgroundColor: 'rgba(75, 192, 192, 0.75)',
        borderColor: 'rgb(75, 192, 192)',
        ...barConfig
      });
    }

    // Debit dataset
    if (showDebit) {
      datasets.push({
        label: 'Debit',
        data: filteredData.data.map(item => item.debit),
        backgroundColor: 'rgba(255, 99, 132, 0.75)',
        borderColor: 'rgb(255, 99, 132)',
        ...barConfig
      });
    }

    // Total (Credit - Debit) as line chart
    if (showTotal) {
      datasets.push({
        label: 'Total (Credit - Debit)',
        data: filteredData.data.map(item => item.total),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        type: 'line',
        yAxisID: 'y',
        tension: 0,
        fill: false
      });
    }

    return datasets;
  }, [filteredData, showCredit, showDebit, showTotal]);

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
              if (context.parsed.y !== null) {
                label += formatCurrency(context.parsed.y);
              }
              return label;
            },
            afterLabel: function(context) {
              // Add additional information to tooltip
              const dataIndex = context.dataIndex;
              const allData = context.chart.data.datasets;
              const creditData = allData.find(d => d.label === 'Credit');
              const debitData = allData.find(d => d.label === 'Debit');
              const totalData = allData.find(d => d.label === 'Total (Credit - Debit)');
              
              if (creditData && debitData && totalData && dataIndex >= 0) {
                const credit = creditData.data[dataIndex] || 0;
                const debit = debitData.data[dataIndex] || 0;
                const total = totalData.data[dataIndex] || 0;
                
                // Calculate percentage change if we have previous data
                if (dataIndex > 0 && totalData.data[dataIndex - 1] !== undefined) {
                  const prevTotal = totalData.data[dataIndex - 1];
                  if (prevTotal !== 0) {
                    const change = ((total - prevTotal) / Math.abs(prevTotal)) * 100;
                    const changeText = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
                    return `Perubahan: ${changeText}`;
                  }
                }
                
                // Show credit/debit breakdown
                if (context.dataset.label === 'Total (Credit - Debit)') {
                  return `Detail: Credit ${formatCurrency(credit)} - Debit ${formatCurrency(debit)}`;
                }
              }
              return '';
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
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }, [filteredData]);

  return { chartData, chartOptions };
};

// Get years 
export function getAvailableYears() {
  const availableYears = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    availableYears.push(currentYear - i);
  }
  return availableYears;
}

// year summary monthly revenue
export async function loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading, accountHeader = '4000.01.00', businessUnits = new Set(['Gosave', 'Goto'])) {
  try {
    setYearSummaryLoading(true);
    
    // Load data for each year
    const summary = {};
    
    for (const year of availableYears) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      // Build business units query params
      const buArray = businessUnits instanceof Set ? Array.from(businessUnits) : (Array.isArray(businessUnits) ? businessUnits : ['Gosave', 'Goto']);
      const buParams = buArray.map(bu => `business_units[]=${bu}`).join('&');
      const buQuery = buArray.length > 0 ? `&${buParams}` : '';
      
      try {
        const response = await fetch(
          `${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=${startDate}&end_date=${endDate}${buQuery}`
        );
        
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
          let totalSales = 0;
          let totalQuantity = 0;
          
          // Calculate total from monthly data
          result.data.forEach(item => {
            const credit = parseFloat(item.total_credit) || 0;
            const debit = parseFloat(item.total_debit) || 0;
            const difference = parseFloat(item.total_difference) || (credit - debit);
            totalSales += difference;
            // For quantity, we'll use the count of records as a proxy
            totalQuantity += 1;
          });
          
          summary[year] = {
            sales: totalSales,
            quantity: totalQuantity
          };
        } else {
          summary[year] = { sales: 0, quantity: 0 };
        }
      } catch (error) {
        console.error(`Error loading data for year ${year}:`, error);
        summary[year] = { sales: 0, quantity: 0 };
      }
    }
    
    setYearSummary(summary);
  } catch (error) {
    console.error('Error loading year summary:', error);
  } finally {
    setYearSummaryLoading(false);
  }
}

export { monthNames, monthShortNames };

