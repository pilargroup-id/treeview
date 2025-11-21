import {
  formatCurrency,
  formatShortNumber,
  MONTH_LABELS,
  MONTH_NAMES_ID,
  getDefaultLabels,
  COLOR_PALETTE_YEAR,
  COLOR_BUSINESS_UNIT_SPECIFIC,
  COLOR_BUSINESS_UNIT_RANGE,
  getYearColor
} from './utils';

export function generatePeriods({
  dateFilterType,
  specificDates,
  invoiceData
}) {
  const isYearFilter = dateFilterType === 'year';
  const isSpecificDate = dateFilterType === 'specific';
  
  let periods = [];
  if (isYearFilter) {
    periods = MONTH_LABELS;
  } else if (isSpecificDate) {
    if (specificDates.length > 0) {
      const sortedDates = [...specificDates].sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        if (typeof a === 'string') {
          return -1; 
        }
        if (typeof b === 'string') {
          return 1; 
        }
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.monthDay.localeCompare(b.monthDay);
      });
      
      periods = sortedDates.map(date => {
        let monthDay;
        if (typeof date === 'string') {
          monthDay = date;
        } else {
          monthDay = date.monthDay;
        }
        const [month, day] = monthDay.split('-');
        const monthName = MONTH_NAMES_ID[parseInt(month) - 1];
        const dayNum = parseInt(day);
        
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
    years.sort((a, b) => a - b).forEach((year) => {
      const colorSet = getYearColor(year);
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
      borderColor: 'rgba(229, 229, 229, 0.5)',
      backgroundColor: 'rgba(245, 245, 245, 0.5)',
      pointRadius: 0,
      borderWidth: 0
    });
  } else {
    invoiceYears.forEach((year) => {
      const colorSet = getYearColor(year);
      
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
          padding: 16,
          font: { 
            size: 12,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            weight: 500
          },
          color: '#212121'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#212121',
        bodyColor: '#757575',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 12,
          weight: 600,
          family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        },
        bodyFont: {
          size: 12,
          weight: 500,
          family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        },
        boxPadding: 8,
        usePointStyle: true,
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
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: 'Bulan',
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E'
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
        position: dataType === 'quantity' ? 'left' : 'left',
        grid: {
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
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
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        grid: { 
          drawOnChartArea: false,
          color: '#F0F0F0',
          lineWidth: 0.5
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
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

  const years = [...new Set(specificDates.map(date => {
    if (typeof date === 'string') {
      return null; 
    } else {
      return date.year;
    }
  }).filter(year => year !== null))].sort((a, b) => a - b);
  
  const displayYears = years.length > 0 ? years : [2021, 2022, 2023, 2024, 2025];
  
  const datasets = [];

  if (specificDates.length === 0) {
    datasets.push({
      label: 'No data',
      data: periods.map(() => null),
      borderColor: 'rgba(229, 229, 229, 0.5)',
      backgroundColor: 'rgba(245, 245, 245, 0.5)',
      pointRadius: 0,
      borderWidth: 0
    });
  } else {
    displayYears.forEach((year) => {
      const colorSet = getYearColor(year);
      
      // Penjualan dataset
      if (dataType === 'penjualan' || dataType === 'both') {
        const salesData = periods.map((periodLabel, periodIndex) => {

          let targetYear, targetMonthDay;
          
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return 0;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
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
          
          if (targetYear !== year) {
            return 0;
          }
          
          const fullDate = `${targetYear}-${targetMonthDay}`;
          
          const records = invoiceData.filter(d => {
            if (!d.period) return false;
            
            const periodNormalized = String(d.period).trim();
            const fullDateNormalized = fullDate.trim();
            
            const periodMatches = periodNormalized === fullDateNormalized;
            
            const businessUnitMatches = businessUnits.length === 0 || 
            (d.business_unit && businessUnits.includes(d.business_unit));
            
            return periodMatches && businessUnitMatches;
          });
          
          if (records.length > 0) {
            let total = 0;
            records.forEach(record => {
              if (record.total_sales !== null && record.total_sales !== undefined && record.total_sales !== '') {
                const parsedSales = parseFloat(record.total_sales);
                if (!isNaN(parsedSales)) {
                  total += parsedSales;
                }
              }
            });
            
            if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
              console.log(`[Sales] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, Records: ${records.length}, Total: ${total}`);
            }
            
            return total;
          }
          
          if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
            console.log(`[Sales] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, No records found`);
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
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y',
          borderWidth: 2
        });
      }
      
      // Quantity dataset
      if (dataType === 'quantity' || dataType === 'both') {
        const quantityData = periods.map((periodLabel, periodIndex) => {
          let targetYear, targetMonthDay;
          
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return 0;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
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
          
          if (targetYear !== year) {
            return 0;
          }
          
          const fullDate = `${targetYear}-${targetMonthDay}`;
          
          const records = invoiceData.filter(d => {
            if (!d.period) return false;
            
            const periodNormalized = String(d.period).trim();
            const fullDateNormalized = fullDate.trim();
            
            const periodMatches = periodNormalized === fullDateNormalized;
            
            const businessUnitMatches = businessUnits.length === 0 || 
                                       (d.business_unit && businessUnits.includes(d.business_unit));
            
            return periodMatches && businessUnitMatches;
          });
          
          if (records.length > 0) {
            let total = 0;
            records.forEach(record => {
              if (record.total_quantity !== null && record.total_quantity !== undefined && record.total_quantity !== '') {
                const parsedQuantity = parseFloat(record.total_quantity);
                if (!isNaN(parsedQuantity)) {
                  total += parsedQuantity;
                }
              }
            });
            
            if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
              console.log(`[Quantity] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, Records: ${records.length}, Total: ${total}`);
            }
            
            return total;
          }
          
          if (process.env.NODE_ENV === 'development' && periodIndex < 3) {
            console.log(`[Quantity] Period ${periodIndex}: "${periodLabel}" -> Date: ${fullDate}, No records found`);
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
          pointRadius: 6,
          pointHoverRadius: 8,
          borderDash: [5, 5],
          yAxisID: dataType === 'both' ? 'y1' : 'y',
          borderWidth: 2
        });
      }
    });
    
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
          padding: 16,
          font: { 
            size: 12,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            weight: 500
          },
          color: '#212121'
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
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: 'Tanggal',
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
        position: 'left',
        grid: {
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
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
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        grid: { 
          drawOnChartArea: false,
          color: '#F0F0F0',
          lineWidth: 0.5
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
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
      borderColor: 'rgba(229, 229, 229, 0.5)',
      backgroundColor: 'rgba(245, 245, 245, 0.5)',
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
          padding: 16,
          font: { 
            size: 12,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            weight: 500
          },
          color: '#212121'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#212121',
        bodyColor: '#757575',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 12,
          weight: 600,
          family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        },
        bodyFont: {
          size: 12,
          weight: 500,
          family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        },
        boxPadding: 8,
        usePointStyle: true,
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
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
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
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
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
          font: { 
            size: 12, 
            weight: 500,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#757575'
        },
        grid: { 
          drawOnChartArea: false,
          color: '#F0F0F0',
          lineWidth: 0.5
        },
        ticks: {
          font: { 
            size: 11,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          },
          color: '#9E9E9E',
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
 * Generate Chart Data
 */
export function generateChartConfig({
  dateFilterType,
  invoiceData,
  businessUnits,
  years,
  specificDates,
  dataType
}) {
  const periods = generatePeriods({
    dateFilterType,
    specificDates,
    invoiceData
  });
  
  if (invoiceData.length > 0 && dateFilterType === 'specific' && process.env.NODE_ENV === 'development') {
    console.log('=== Specific Dates Debug Info ===');
    console.log('Selected Specific Dates (from user):', specificDates);
    console.log('Periods (Labels for chart):', periods);
    console.log('Periods Count:', periods.length);
    console.log('Invoice Data from API:', invoiceData);
    console.log('Invoice Data Count:', invoiceData.length);
    console.log('Unique Periods from API:', [...new Set(invoiceData.map(d => d.period))]);
    
    const datesForComparison = specificDates.map(date => {
      if (typeof date === 'string') {
        const year = years && years.length > 0 ? years[0] : new Date().getFullYear();
        return `${year}-${date}`;
      } else {
        return `${date.year}-${date.monthDay}`;
      }
    });
    
    console.log('Dates selected but not in API:', datesForComparison.filter(dateStr => 
      !invoiceData.some(d => d.period && d.period.trim() === dateStr.trim())
    ));
  }
  
  let chartData = { labels: periods, datasets: [] };
  let chartOptions = {};
  
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

