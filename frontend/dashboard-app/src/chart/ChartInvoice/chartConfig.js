// Chart configuration untuk ChartInvoice
import {
  formatCurrency,
  formatShortNumber,
  MONTH_LABELS,
  MONTH_NAMES_ID,
  getDefaultLabels,
  COLOR_PALETTE_YEAR,
  COLOR_BUSINESS_UNIT_SPECIFIC,
  COLOR_BUSINESS_UNIT_RANGE
} from './utils';

/**
 * Generate periods/labels untuk chart berdasarkan filter type
 */
export function generatePeriods({
  dateFilterType,
  specificDates,
  invoiceData
}) {
  const isYearFilter = dateFilterType === 'year';
  const isSpecificDate = dateFilterType === 'specific';
  
  let periods = [];
  if (isYearFilter) {
    // Untuk filter tahun, selalu gunakan 12 bulan
    periods = MONTH_LABELS;
  } else if (isSpecificDate) {
    // Untuk specific dates, format label dari specificDates (format: MM-DD)
    if (specificDates.length > 0) {
      const sortedDates = [...specificDates].sort();
      periods = sortedDates.map(monthDay => {
        const [month, day] = monthDay.split('-');
        return `${parseInt(day)} ${MONTH_NAMES_ID[parseInt(month) - 1]}`;
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('Specific Dates Periods:', periods);
        console.log('Specific Dates Count:', periods.length);
      }
    } else {
      periods = ['No data'];
    }
  } else {
    periods = invoiceData.length > 0 
      ? [...new Set(invoiceData.map(item => item.period))].sort()
      : getDefaultLabels(dateFilterType, specificDates);
  }
  
  return periods;
}

/**
 * Create chart data dan options untuk year filter
 */
function createYearFilterChart({
  invoiceData,
  years,
  periods,
  dataType,
  formatCurrency
}) {
  const invoiceYears = invoiceData.length > 0
    ? [...new Set(invoiceData.map(item => parseInt(item.year) || item.year))].sort((a, b) => a - b)
    : years.length > 0 ? years.sort((a, b) => a - b) : [];
  
  const datasets = [];
  
  if (invoiceYears.length === 0 && years.length > 0) {
    years.sort((a, b) => a - b).forEach((year, index) => {
      const colorSet = COLOR_PALETTE_YEAR[index % COLOR_PALETTE_YEAR.length];
      if (dataType === 'penjualan' || dataType === 'both') {
        datasets.push({
          label: `${year} - Penjualan`,
          data: periods.map(() => 0),
          borderColor: colorSet.sales,
          backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }
      if (dataType === 'quantity' || dataType === 'both') {
        datasets.push({
          label: `${year} - Quantity`,
          data: periods.map(() => 0),
          borderColor: colorSet.quantity,
          backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5]
        });
      }
    });
  } else if (invoiceYears.length === 0 && years.length === 0) {
    datasets.push({
      label: 'No data',
      data: periods.map(() => null),
      borderColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      pointRadius: 0,
      borderWidth: 0
    });
  } else {
    invoiceYears.forEach((year, index) => {
      const colorSet = COLOR_PALETTE_YEAR[index % COLOR_PALETTE_YEAR.length];
      
      if (dataType === 'penjualan' || dataType === 'both') {
        const salesData = periods.map((monthLabel, monthIndex) => {
          const monthNum = String(monthIndex + 1).padStart(2, '0');
          const period = `${year}-${monthNum}`;
          
          const records = invoiceData.filter(d => {
            const recordYear = parseInt(d.year) || d.year;
            return d.period === period && recordYear === year;
          });
          
          if (records.length > 0) {
            const total = records.reduce((sum, record) => {
              const sales = parseFloat(record.total_sales) || 0;
              return sum + sales;
            }, 0);
            return total;
          }
          return 0;
        });
        
        datasets.push({
          label: `${year} - Penjualan`,
          data: salesData,
          borderColor: colorSet.sales,
          backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }
      
      // Quantity dataset
      if (dataType === 'quantity' || dataType === 'both') {
        const quantityData = periods.map((monthLabel, monthIndex) => {
          const monthNum = String(monthIndex + 1).padStart(2, '0');
          const period = `${year}-${monthNum}`;
          
          const records = invoiceData.filter(d => {
            const recordYear = parseInt(d.year) || d.year;
            return d.period === period && recordYear === year;
          });
          
          if (records.length > 0) {
            const total = records.reduce((sum, record) => {
              const quantity = parseFloat(record.total_quantity) || 0;
              return sum + quantity;
            }, 0);
            return total;
          }
          return 0;
        });
        
        datasets.push({
          label: `${year} - Quantity`,
          data: quantityData,
          borderColor: colorSet.quantity,
          backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5]
        });
      }
    });
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutCubic'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 12 },
          color: '#424242'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Penjualan')) {
                label += formatCurrency(context.parsed.y);
              } else {
                label += context.parsed.y.toLocaleString() + ' unit';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: '#fafafa'
        },
        title: {
          display: true,
          text: 'Bulan',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575'
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
        position: dataType === 'quantity' ? 'left' : 'left',
        grid: {
          color: '#fafafa'
        },
        title: {
          display: true,
          text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          callback: function(value) {
            if (dataType === 'quantity') {
              return value.toLocaleString();
            }
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear',
        display: dataType === 'both',
        position: 'right',
        title: {
          display: dataType === 'both',
          text: 'Quantity (Unit)',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        grid: { 
          drawOnChartArea: false,
          color: '#fafafa'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };
  
  return { datasets, options };
}

function createSpecificDateChart({
  invoiceData,
  businessUnits,
  specificDates,
  periods,
  dataType,
  formatCurrency
}) {
  // Tahun yang akan ditampilkan
  const years = [2021, 2022, 2023, 2024, 2025];
  
  const datasets = [];

  if (specificDates.length === 0) {
    datasets.push({
      label: 'No data',
      data: periods.map(() => null),
      borderColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      pointRadius: 0,
      borderWidth: 0
    });
  } else {
    // Untuk setiap tahun
    years.forEach((year, yearIndex) => {
      const colorSet = COLOR_PALETTE_YEAR[yearIndex % COLOR_PALETTE_YEAR.length];
      
      // Sales dataset
      if (dataType === 'penjualan' || dataType === 'both') {
        const sortedDates = [...specificDates].sort();
        const salesData = sortedDates.map(monthDay => {
          // Convert MM-DD ke YYYY-MM-DD untuk setiap tahun
          const fullDate = `${year}-${monthDay}`;
          
          const records = invoiceData.filter(d => {
            if (!d.period) return false;
            // Normalize period untuk matching
            const periodNormalized = String(d.period).trim();
            const fullDateNormalized = fullDate.trim();
            return periodNormalized === fullDateNormalized;
          });
          
          if (records.length > 0) {
            let total = 0;
            records.forEach(record => {
              const sales = record.total_sales;
              if (sales !== null && sales !== undefined && sales !== '') {
                const parsedSales = parseFloat(sales);
                if (!isNaN(parsedSales)) {
                  total += parsedSales;
                }
              }
            });
            return total;
          }
          // Jika tidak ada data, tetap return 0 (bukan null)
          return 0;
        });
        
        datasets.push({
          label: `${year} - Penjualan`,
          data: salesData,
          borderColor: colorSet.sales,
          backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.3,
          fill: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y'
        });
      }
      
      // Quantity 
      if (dataType === 'quantity' || dataType === 'both') {
        const sortedDates = [...specificDates].sort();
        const quantityData = sortedDates.map(monthDay => {
          // Convert MM-DD ke YYYY-MM-DD 
          const fullDate = `${year}-${monthDay}`;
          
          const records = invoiceData.filter(d => {
            if (!d.period) return false;
            // Normalize period 
            const periodNormalized = String(d.period).trim();
            const fullDateNormalized = fullDate.trim();
            return periodNormalized === fullDateNormalized;
          });
          
          if (records.length > 0) {
            let total = 0;
            records.forEach(record => {
              const quantity = record.total_quantity;
              if (quantity !== null && quantity !== undefined && quantity !== '') {
                const parsedQuantity = parseFloat(quantity);
                if (!isNaN(parsedQuantity)) {
                  total += parsedQuantity;
                }
              }
            });
            return total;
          }
          // Jika tidak ada data
          return 0;
        });
        
        datasets.push({
          label: `${year} - Quantity`,
          data: quantityData,
          borderColor: colorSet.quantity,
          backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.3,
          fill: false,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderDash: [5, 5],
          yAxisID: dataType === 'both' ? 'y1' : 'y'
        });
      }
    });
    
    // Debug log 
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Specific Date Chart Debug ===');
      console.log('Selected Dates (MM-DD):', specificDates);
      console.log('Years to display:', years);
      console.log('Invoice Data from API:', invoiceData);
      console.log('Unique periods from API:', [...new Set(invoiceData.map(d => d.period))]);
      console.log('Datasets created:', datasets.length);
      console.log('Expected datasets:', years.length * (dataType === 'both' ? 2 : 1));
    }
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutCubic'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 12 },
          color: '#424242'
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Penjualan')) {
                label += formatCurrency(context.parsed.y);
              } else {
                label += context.parsed.y.toLocaleString() + ' unit';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: '#fafafa'
        },
        title: {
          display: true,
          text: 'Tanggal',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
        position: 'left',
        grid: {
          color: '#fafafa'
        },
        title: {
          display: true,
          text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          callback: function(value) {
            if (dataType === 'quantity') {
              return value.toLocaleString();
            }
            return formatCurrency(value);
          }
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear',
        display: dataType === 'both',
        position: 'right',
        title: {
          display: dataType === 'both',
          text: 'Quantity (Unit)',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        grid: { 
          drawOnChartArea: false,
          color: '#fafafa'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        beginAtZero: true
      }
    }
  };
  
  return { datasets, options };
}

/**
 * Create chart data dan options untuk range/default filter
 */
function createRangeChart({
  invoiceData,
  businessUnits,
  periods,
  dataType,
  formatCurrency
}) {
  const invoiceBusinessUnits = invoiceData.length > 0
    ? [...new Set(invoiceData.map(item => item.business_unit))]
    : businessUnits.length > 0 ? businessUnits : [];

  const datasets = [];

  if (invoiceBusinessUnits.length === 0 && businessUnits.length === 0) {
    datasets.push({
      label: 'No data',
      data: periods.map(() => null),
      borderColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      pointRadius: 0,
      borderWidth: 0
    });
  } else if (invoiceBusinessUnits.length === 0 && businessUnits.length > 0) {
    businessUnits.forEach(unit => {
      if (dataType === 'penjualan' || dataType === 'both') {
        datasets.push({
          label: `${unit} - Penjualan`,
          data: periods.map(() => 0),
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(75, 192, 192)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(75, 192, 192)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
          yAxisID: 'y',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }
      if (dataType === 'quantity' || dataType === 'both') {
        datasets.push({
          label: `${unit} - Quantity`,
          data: periods.map(() => 0),
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(54, 162, 235)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(54, 162, 235)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
          yAxisID: dataType === 'both' ? 'y1' : 'y',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5]
        });
      }
    });
  } else {
    invoiceBusinessUnits.forEach(unit => {
      // Sales dataset
      if (dataType === 'penjualan' || dataType === 'both') {
        const salesData = periods.map(period => {
          const record = invoiceData.find(d => d.period === period && d.business_unit === unit);
          if (record && record.total_sales !== null && record.total_sales !== undefined) {
            return parseFloat(record.total_sales) || 0;
          }
          return 0;
        });
        
        datasets.push({
          label: `${unit} - Penjualan`,
          data: salesData,
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(75, 192, 192)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(75, 192, 192)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
          yAxisID: 'y',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }
      
      // Quantity dataset
      if (dataType === 'quantity' || dataType === 'both') {
        const quantityData = periods.map(period => {
          const record = invoiceData.find(d => d.period === period && d.business_unit === unit);
          if (record && record.total_quantity !== null && record.total_quantity !== undefined) {
            return parseFloat(record.total_quantity) || 0;
          }
          return 0;
        });
        
        datasets.push({
          label: `${unit} - Quantity`,
          data: quantityData,
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(54, 162, 235)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(54, 162, 235)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
          yAxisID: dataType === 'both' ? 'y1' : 'y',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5]
        });
      }
    });
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutCubic'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 12 },
          color: '#424242'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Penjualan')) {
                label += formatCurrency(context.parsed.y);
              } else {
                label += context.parsed.y.toLocaleString() + ' unit';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: '#fafafa'
        },
        title: {
          display: true,
          text: 'Periode',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575'
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
        position: dataType === 'quantity' ? 'left' : 'left',
        grid: {
          color: '#fafafa'
        },
        title: {
          display: true,
          text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          callback: function(value) {
            if (dataType === 'quantity') {
              return value.toLocaleString();
            }
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear',
        display: dataType === 'both',
        position: 'right',
        title: {
          display: dataType === 'both',
          text: 'Quantity (Unit)',
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        grid: { 
          drawOnChartArea: false,
          color: '#fafafa'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };
  
  return { datasets, options };
}

/**
 * Main function untuk generate chart data dan options berdasarkan filter type
 */
export function generateChartConfig({
  dateFilterType,
  invoiceData,
  businessUnits,
  years,
  specificDates,
  dataType
}) {
  // Generate periods/labels
  const periods = generatePeriods({
    dateFilterType,
    specificDates,
    invoiceData
  });
  
  // Debug log untuk specific dates
  if (invoiceData.length > 0 && dateFilterType === 'specific' && process.env.NODE_ENV === 'development') {
    console.log('=== Specific Dates Debug Info ===');
    console.log('Selected Specific Dates (from user):', specificDates);
    console.log('Periods (Labels for chart):', periods);
    console.log('Periods Count:', periods.length);
    console.log('Invoice Data from API:', invoiceData);
    console.log('Invoice Data Count:', invoiceData.length);
    console.log('Unique Periods from API:', [...new Set(invoiceData.map(d => d.period))]);
    console.log('Dates selected but not in API:', specificDates.filter(date => 
      !invoiceData.some(d => d.period && d.period.trim() === date.trim())
    ));
  }
  
  let chartData = { labels: periods, datasets: [] };
  let chartOptions = {};
  
  // Generate chart berdasarkan filter type
  if (dateFilterType === 'year') {
    const result = createYearFilterChart({
      invoiceData,
      years,
      periods,
      dataType,
      formatCurrency
    });
    chartData.datasets = result.datasets;
    chartOptions = result.options;
  } else if (dateFilterType === 'specific') {
    const result = createSpecificDateChart({
      invoiceData,
      businessUnits,
      specificDates,
      periods,
      dataType,
      formatCurrency
    });
    chartData.datasets = result.datasets;
    chartOptions = result.options;
  } else {
    // Range atau default
    const result = createRangeChart({
      invoiceData,
      businessUnits,
      periods,
      dataType,
      formatCurrency
    });
    chartData.datasets = result.datasets;
    chartOptions = result.options;
  }
  
  return { chartData, chartOptions };
}

