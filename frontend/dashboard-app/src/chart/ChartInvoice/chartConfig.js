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
    // Untuk specific dates, format label dari specificDates
    // Support both old format (string MM-DD) and new format (object {year, monthDay})
    if (specificDates.length > 0) {
      // Sort dates: by year first, then by monthDay
      const sortedDates = [...specificDates].sort((a, b) => {
        // Handle old format (string)
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        if (typeof a === 'string') {
          return -1; // Old format comes first
        }
        if (typeof b === 'string') {
          return 1; // Old format comes first
        }
        // New format: compare by year, then by monthDay
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.monthDay.localeCompare(b.monthDay);
      });
      
      periods = sortedDates.map(date => {
        let monthDay;
        if (typeof date === 'string') {
          // Old format: MM-DD string
          monthDay = date;
        } else {
          // New format: {year, monthDay}
          monthDay = date.monthDay;
        }
        const [month, day] = monthDay.split('-');
        const monthName = MONTH_NAMES_ID[parseInt(month) - 1];
        const dayNum = parseInt(day);
        
        // Include year in label if using new format
        if (typeof date === 'object' && date.year) {
          return `${dayNum} ${monthName} ${date.year}`;
        }
        return `${dayNum} ${monthName}`;
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
          backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        });
      }
      if (dataType === 'quantity' || dataType === 'both') {
        datasets.push({
          label: `${year} - Quantity`,
          data: periods.map(() => 0),
          borderColor: colorSet.quantity,
          backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          borderWidth: 2
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
          backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
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
          backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          borderWidth: 2
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

/**
 * Create chart data dan options untuk specific date filter
 * Format specificDates: Support both old format (string MM-DD) and new format (object {year, monthDay})
 * Chart menampilkan garis untuk setiap tahun yang ada di specificDates
 */
function createSpecificDateChart({
  invoiceData,
  businessUnits,
  specificDates,
  periods,
  dataType,
  formatCurrency
}) {
  // Extract unique years from specificDates
  // Support both old format (string MM-DD) and new format (object {year, monthDay})
  const years = [...new Set(specificDates.map(date => {
    if (typeof date === 'string') {
      // Old format: MM-DD - use default years (2021-2025)
      return null; // Will be filtered out
    } else {
      // New format: {year, monthDay}
      return date.year;
    }
  }).filter(year => year !== null))].sort((a, b) => a - b);
  
  // If no years found (all old format), use default years
  const displayYears = years.length > 0 ? years : [2021, 2022, 2023, 2024, 2025];
  
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
    // Untuk setiap tahun, buat dataset
    displayYears.forEach((year, yearIndex) => {
      const colorSet = COLOR_PALETTE_YEAR[yearIndex % COLOR_PALETTE_YEAR.length];
      
      // Sales dataset
      if (dataType === 'penjualan' || dataType === 'both') {
        // Map periods to data points - sesuai dengan urutan periods dari generatePeriods
        // Setiap period label akan di-map ke data yang sesuai dari API
        // Pastikan urutan data sesuai dengan urutan periods
        const salesData = periods.map((periodLabel, periodIndex) => {
          // Extract date info from period label
          // Format period label: "DD MonthName YYYY" atau "DD MonthName"
          let targetYear, targetMonthDay;
          
          // Parse period label untuk mendapatkan tahun dan monthDay
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            // Format: "DD MonthName YYYY"
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            // Convert month name to number
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return 0;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
            // Format: "DD MonthName" (old format)
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return 0;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = year;
            targetMonthDay = `${month}-${dayStr}`;
          } else {
            return 0;
          }
          
          // Only process if this period matches current year
          if (targetYear !== year) {
            return 0;
          }
          
          // Convert to YYYY-MM-DD format untuk matching dengan API
          const fullDate = `${targetYear}-${targetMonthDay}`;
          
          // Ambil semua data untuk tanggal ini dari API
          // Filter berdasarkan period (YYYY-MM-DD) dan business_unit yang dipilih
          // API mengembalikan period dalam format YYYY-MM-DD dan data sudah di-group per business_unit
          const records = invoiceData.filter(d => {
            if (!d.period) return false;
            
            // Normalize period untuk matching (API format: YYYY-MM-DD)
            const periodNormalized = String(d.period).trim();
            const fullDateNormalized = fullDate.trim();
            
            // Match period
            const periodMatches = periodNormalized === fullDateNormalized;
            
            // Filter business_unit jika ada yang dipilih
            const businessUnitMatches = businessUnits.length === 0 || 
                                       (d.business_unit && businessUnits.includes(d.business_unit));
            
            return periodMatches && businessUnitMatches;
          });
          
          if (records.length > 0) {
            let total = 0;
            records.forEach(record => {
              // Pastikan field total_sales ada dan valid
              if (record.total_sales !== null && record.total_sales !== undefined && record.total_sales !== '') {
                const parsedSales = parseFloat(record.total_sales);
                if (!isNaN(parsedSales)) {
                  total += parsedSales;
                }
              }
            });
            
            // Debug log untuk development
            if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
              console.log(`[Sales] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, Records: ${records.length}, Total: ${total}`);
            }
            
            return total;
          }
          
          // Debug log untuk development
          if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
            console.log(`[Sales] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, No records found`);
          }
          
          // Jika tidak ada data, tetap return 0 (bukan null)
          return 0;
        });
        
        datasets.push({
          label: `${year} - Penjualan`,
          data: salesData,
          borderColor: colorSet.sales,
          backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y',
          borderWidth: 2
        });
      }
      
      // Quantity dataset
      if (dataType === 'quantity' || dataType === 'both') {
        // Map periods to data points - sesuai dengan urutan periods dari generatePeriods
        // Pastikan urutan data sesuai dengan urutan periods
        const quantityData = periods.map((periodLabel, periodIndex) => {
          // Extract date info from period label
          // Format period label: "DD MonthName YYYY" atau "DD MonthName"
          let targetYear, targetMonthDay;
          
          // Parse period label untuk mendapatkan tahun dan monthDay
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            // Format: "DD MonthName YYYY"
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            // Convert month name to number
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return 0;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
            // Format: "DD MonthName" (old format)
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return 0;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = year;
            targetMonthDay = `${month}-${dayStr}`;
          } else {
            return 0;
          }
          
          // Only process if this period matches current year
          if (targetYear !== year) {
            return 0;
          }
          
          // Convert to YYYY-MM-DD format untuk matching dengan API
          const fullDate = `${targetYear}-${targetMonthDay}`;
          
          // Ambil semua data untuk tanggal ini dari API
          // Filter berdasarkan period (YYYY-MM-DD) dan business_unit yang dipilih
          // API mengembalikan period dalam format YYYY-MM-DD dan data sudah di-group per business_unit
          const records = invoiceData.filter(d => {
            if (!d.period) return false;
            
            // Normalize period untuk matching (API format: YYYY-MM-DD)
            const periodNormalized = String(d.period).trim();
            const fullDateNormalized = fullDate.trim();
            
            // Match period
            const periodMatches = periodNormalized === fullDateNormalized;
            
            // Filter business_unit jika ada yang dipilih
            const businessUnitMatches = businessUnits.length === 0 || 
                                       (d.business_unit && businessUnits.includes(d.business_unit));
            
            return periodMatches && businessUnitMatches;
          });
          
          if (records.length > 0) {
            let total = 0;
            records.forEach(record => {
              // Pastikan field total_quantity ada dan valid
              if (record.total_quantity !== null && record.total_quantity !== undefined && record.total_quantity !== '') {
                const parsedQuantity = parseFloat(record.total_quantity);
                if (!isNaN(parsedQuantity)) {
                  total += parsedQuantity;
                }
              }
            });
            
            // Debug log untuk development
            if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
              console.log(`[Quantity] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, Records: ${records.length}, Total: ${total}`);
            }
            
            return total;
          }
          
          // Debug log untuk development
          if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
            console.log(`[Quantity] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, No records found`);
          }
          
          // Jika tidak ada data, tetap return 0 (bukan null)
          return 0;
        });
        
        datasets.push({
          label: `${year} - Quantity`,
          data: quantityData,
          borderColor: colorSet.quantity,
          backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderDash: [5, 5],
          yAxisID: dataType === 'both' ? 'y1' : 'y',
          borderWidth: 2
        });
      }
    });
    
    // Debug log untuk memastikan semua tahun ada dan data sesuai API
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Specific Date Chart Debug ===');
      console.log('Selected Dates:', specificDates);
      console.log('Display Years:', displayYears);
      console.log('Periods (Labels):', periods);
      console.log('Invoice Data from API:', invoiceData);
      console.log('Unique periods from API:', [...new Set(invoiceData.map(d => d.period))]);
      console.log('Datasets created:', datasets.length);
      console.log('Expected datasets:', displayYears.length * (dataType === 'both' ? 2 : 1));
      
      // Verify data matching
      console.log('Business Units selected:', businessUnits);
      displayYears.forEach(year => {
        const datesForYear = specificDates.filter(date => {
          if (typeof date === 'string') return displayYears.includes(year);
          return date.year === year;
        });
        console.log(`Year ${year} - Selected dates:`, datesForYear);
        datesForYear.forEach(date => {
          const monthDay = typeof date === 'string' ? date : date.monthDay;
          const fullDate = `${year}-${monthDay}`;
          
          // Filter dengan business_unit juga
          const matchingRecords = invoiceData.filter(d => {
            if (!d.period) return false;
            const periodMatches = String(d.period).trim() === fullDate.trim();
            const businessUnitMatches = businessUnits.length === 0 || 
                                       (d.business_unit && businessUnits.includes(d.business_unit));
            return periodMatches && businessUnitMatches;
          });
          
          console.log(`  Date ${fullDate}: ${matchingRecords.length} records found`);
          if (matchingRecords.length > 0) {
            console.log(`    Records:`, matchingRecords.map(r => ({
              period: r.period,
              business_unit: r.business_unit,
              total_sales: r.total_sales,
              total_quantity: r.total_quantity
            })));
          }
        });
      });
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
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(66, 165, 245)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(66, 165, 245)').replace('rgb', 'rgba').replace(')', ', 0.3)'),
          yAxisID: 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        });
      }
      if (dataType === 'quantity' || dataType === 'both') {
        datasets.push({
          label: `${unit} - Quantity`,
          data: periods.map(() => 0),
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(129, 212, 250)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(129, 212, 250)').replace('rgb', 'rgba').replace(')', ', 0.3)'),
          yAxisID: dataType === 'both' ? 'y1' : 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          borderWidth: 2
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
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(66, 165, 245)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.sales || 'rgb(66, 165, 245)').replace('rgb', 'rgba').replace(')', ', 0.3)'),
          yAxisID: 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
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
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(129, 212, 250)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(129, 212, 250)').replace('rgb', 'rgba').replace(')', ', 0.3)'),
          yAxisID: dataType === 'both' ? 'y1' : 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          borderWidth: 2
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
    
    // Convert specificDates to YYYY-MM-DD format for comparison
    const datesForComparison = specificDates.map(date => {
      if (typeof date === 'string') {
        // Old format: MM-DD - need to determine year (use first available year or current)
        const year = years && years.length > 0 ? years[0] : new Date().getFullYear();
        return `${year}-${date}`;
      } else {
        // New format: {year, monthDay}
        return `${date.year}-${date.monthDay}`;
      }
    });
    
    console.log('Dates selected but not in API:', datesForComparison.filter(dateStr => 
      !invoiceData.some(d => d.period && d.period.trim() === dateStr.trim())
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

