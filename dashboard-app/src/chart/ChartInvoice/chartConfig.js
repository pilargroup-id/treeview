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
  const isMultiRange = dateFilterType === 'multi_range';
  
  let periods = [];
  if (isYearFilter) {
    periods = MONTH_LABELS;
  } else if (isMultiRange) {
    periods = invoiceData.length > 0 
      ? [...new Set(invoiceData.map(item => item.period))].sort()
      : [];
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
      if (dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'all') {
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
      if (dataType === 'quantity' || dataType === 'both' || dataType === 'quantity_order' || dataType === 'all') {
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
      if (dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all') {
        datasets.push({
          label: `${year} - Order`,
          data: periods.map(() => 0),
          borderColor: 'rgb(156, 39, 176)',
          backgroundColor: 'rgba(156, 39, 176, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [10, 5],
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
      
      if (dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'all') {
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
      if (dataType === 'quantity' || dataType === 'both' || dataType === 'quantity_order' || dataType === 'all') {
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
      
      // Order dataset
      if (dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all') {
        const orderData = periods.map((monthLabel, monthIndex) => {
          const monthNum = String(monthIndex + 1).padStart(2, '0');
          const period = `${year}-${monthNum}`;
          
          const records = invoiceData.filter(d => {
            const recordYear = parseInt(d.year) || d.year;
            return d.period === period && recordYear === year;
          });
          
          if (records.length > 0) {
            const total = records.reduce((sum, record) => {
              const invoiceCount = parseFloat(record.invoice_count) || 0;
              return sum + invoiceCount;
            }, 0);
            return total;
          }
          return 0;
        });
        
        datasets.push({
          label: `${year} - Order`,
          data: orderData,
          borderColor: 'rgb(156, 39, 176)',
          backgroundColor: 'rgba(156, 39, 176, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [10, 5],
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
    layout: {
      padding: {
        top: 4,
        right: 8,
        bottom: 0,
        left: 4
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      hoverGuideLine: {
        color: 'rgba(47, 111, 178, 0.55)',
        lineWidth: 1.2,
        dashPattern: [6, 4]
      },
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { 
            size: 12,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            weight: 500
          },
          color: '#212121'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
        itemSort: function(a, b) {
          // Extract tahun dari label dataset (format: "YYYY - Penjualan" atau "YYYY - Quantity")
          const getYear = (label) => {
            const match = label.match(/^(\d{4})\s*-/);
            return match ? parseInt(match[1], 10) : 0;
          };
          
          const yearA = getYear(a.dataset.label || '');
          const yearB = getYear(b.dataset.label || '');
          
          // Urutkan descending (tahun terbaru di atas)
          return yearB - yearA;
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Penjualan')) {
                label += formatCurrency(context.parsed.y);
              } else if (label.includes('Order')) {
                label += context.parsed.y.toLocaleString() + ' order';
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
          padding: {
            top: 6,
            bottom: 0
          },
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
          padding: 4
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both' || dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all',
        position: 'left',
        grid: {
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: dataType === 'quantity' || dataType === 'quantity_order' ? 'Quantity (Unit)' : dataType === 'order' ? 'Order' : 'Penjualan (Rp)',
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
            if (dataType === 'quantity' || dataType === 'quantity_order') {
              return value.toLocaleString();
            } else if (dataType === 'order') {
              return value.toLocaleString();
            }
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear',
        display: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all',
        position: 'right',
        title: {
          display: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all',
          text: dataType === 'penjualan_order' ? 'Order' : dataType === 'quantity_order' ? 'Order' : dataType === 'all' ? 'Order / Quantity' : 'Quantity (Unit)',
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
    // Cek apakah lebih dari 1 business unit dipilih
    const shouldCombine = businessUnits.length > 1;
    
    displayYears.forEach((year) => {
      const colorSet = getYearColor(year);
      
      // Filter periods yang sesuai dengan tahun ini
      const periodsForThisYear = periods.filter(periodLabel => {
        const periodParts = periodLabel.split(' ');
        if (periodParts.length === 3) {
          const yearFromLabel = parseInt(periodParts[2]);
          return yearFromLabel === year;
        } else if (periodParts.length === 2) {
          // Jika tidak ada tahun di label, cek apakah ada di specificDates untuk tahun ini
          const day = parseInt(periodParts[0]);
          const monthName = periodParts[1];
          const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
          if (monthIndex === -1) return false;
          const month = String(monthIndex + 1).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const monthDay = `${month}-${dayStr}`;
          
          // Cek apakah tanggal ini ada di specificDates untuk tahun ini
          return specificDates.some(date => {
            if (typeof date === 'string') {
              return date === monthDay;
            }
            return date.year === year && date.monthDay === monthDay;
          });
        }
        return false;
      });
      
      // Jika tidak ada periode untuk tahun ini, skip
      if (periodsForThisYear.length === 0) {
        return;
      }
      
      // Penjualan dataset
      if (dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'all') {
        // Map data hanya untuk periods yang sesuai dengan tahun ini
        const salesData = periods.map((periodLabel, periodIndex) => {
          // Jika period ini tidak untuk tahun ini, return null
          if (!periodsForThisYear.includes(periodLabel)) {
            return null;
          }

          let targetYear, targetMonthDay;
          
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return null;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return null;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = year;
            targetMonthDay = `${month}-${dayStr}`;
          } else {
            return null;
          }
          
          if (targetYear !== year) {
            return null;
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
          
          return null;
        });
        
        datasets.push({
          label: shouldCombine ? 'Total - Penjualan' : `${year} - Penjualan`,
          data: salesData,
          borderColor: shouldCombine ? '#2563EB' : colorSet.sales, // Biru lebih gelap untuk penjualan
          backgroundColor: shouldCombine ? 'rgba(37, 99, 235, 0.3)' : colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y',
          borderWidth: 2
        });
      }
      
      // Quantity dataset
      if (dataType === 'quantity' || dataType === 'both' || dataType === 'quantity_order' || dataType === 'all') {
        // Map data hanya untuk periods yang sesuai dengan tahun ini
        const quantityData = periods.map((periodLabel, periodIndex) => {
          // Jika period ini tidak untuk tahun ini, return null
          if (!periodsForThisYear.includes(periodLabel)) {
            return null;
          }
          
          let targetYear, targetMonthDay;
          
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return null;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return null;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = year;
            targetMonthDay = `${month}-${dayStr}`;
          } else {
            return null;
          }
          
          if (targetYear !== year) {
            return null;
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
          
          return null;
        });
        
        datasets.push({
          label: shouldCombine ? 'Total - Quantity' : `${year} - Quantity`,
          data: quantityData,
          borderColor: shouldCombine ? 'rgba(137, 183, 220, 1)' : colorSet.quantity,
          backgroundColor: shouldCombine ? 'rgba(137, 183, 220, 0.3)' : colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.3)'),
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderDash: [5, 5],
          yAxisID: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all' ? 'y1' : 'y',
          borderWidth: 2
        });
      }
      
      // Order dataset
      if (dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all') {
        const orderData = periods.map((periodLabel, periodIndex) => {
          if (!periodsForThisYear.includes(periodLabel)) {
            return null;
          }
          
          let targetYear, targetMonthDay;
          
          const periodParts = periodLabel.split(' ');
          if (periodParts.length === 3) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            const yearFromLabel = parseInt(periodParts[2]);
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return null;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = yearFromLabel;
            targetMonthDay = `${month}-${dayStr}`;
          } else if (periodParts.length === 2) {
            const day = parseInt(periodParts[0]);
            const monthName = periodParts[1];
            
            const monthIndex = MONTH_NAMES_ID.indexOf(monthName);
            if (monthIndex === -1) return null;
            const month = String(monthIndex + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            
            targetYear = year;
            targetMonthDay = `${month}-${dayStr}`;
          } else {
            return null;
          }
          
          if (targetYear !== year) {
            return null;
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
              if (record.invoice_count !== null && record.invoice_count !== undefined && record.invoice_count !== '') {
                const parsedOrder = parseFloat(record.invoice_count);
                if (!isNaN(parsedOrder)) {
                  total += parsedOrder;
                }
              }
            });
            
            return total;
          }
          
          return null;
        });
        
        datasets.push({
          label: shouldCombine ? 'Total - Order' : `${year} - Order`,
          data: orderData,
          borderColor: 'rgb(156, 39, 176)',
          backgroundColor: 'rgba(156, 39, 176, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderDash: [10, 5],
          yAxisID: dataType === 'order' ? 'y' : 'y1',
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
    layout: {
      padding: {
        top: 4,
        right: 8,
        bottom: 0,
        left: 4
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      hoverGuideLine: {
        color: 'rgba(47, 111, 178, 0.55)',
        lineWidth: 1.2,
        dashPattern: [6, 4]
      },
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
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
        mode: 'index',
        intersect: false,
        itemSort: function(a, b) {
          // Extract tahun dari label dataset (format: "YYYY - Penjualan" atau "YYYY - Quantity")
          const getYear = (label) => {
            const match = label.match(/^(\d{4})\s*-/);
            return match ? parseInt(match[1], 10) : 0;
          };
          
          const yearA = getYear(a.dataset.label || '');
          const yearB = getYear(b.dataset.label || '');
          
          // Urutkan descending (tahun terbaru di atas)
          return yearB - yearA;
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Penjualan')) {
                label += formatCurrency(context.parsed.y);
              } else if (label.includes('Order')) {
                label += context.parsed.y.toLocaleString() + ' order';
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
          padding: {
            top: 6,
            bottom: 0
          },
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
          minRotation: 45,
          padding: 4
        }
      },
      y: {
        type: 'linear',
        display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both' || dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all',
        position: 'left',
        grid: {
          color: '#F0F0F0',
          lineWidth: 0.5,
          drawBorder: false
        },
        title: {
          display: true,
          text: dataType === 'quantity' || dataType === 'quantity_order' ? 'Quantity (Unit)' : dataType === 'order' ? 'Order' : 'Penjualan (Rp)',
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
            if (dataType === 'quantity' || dataType === 'quantity_order') {
              return value.toLocaleString();
            } else if (dataType === 'order') {
              return value.toLocaleString();
            }
            return formatCurrency(value);
          }
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear',
        display: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all',
        position: 'right',
        title: {
          display: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all',
          text: dataType === 'penjualan_order' ? 'Order' : dataType === 'quantity_order' ? 'Order' : dataType === 'all' ? 'Order / Quantity' : 'Quantity (Unit)',
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
      if (dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'all') {
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
      if (dataType === 'quantity' || dataType === 'both' || dataType === 'quantity_order' || dataType === 'all') {
        datasets.push({
          label: `${unit} - Quantity`,
          data: periods.map(() => 0),
          borderColor: COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(129, 212, 250)',
          backgroundColor: (COLOR_BUSINESS_UNIT_RANGE[unit]?.quantity || 'rgb(129, 212, 250)').replace('rgb', 'rgba').replace(')', ', 0.3)'),
          yAxisID: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all' ? 'y1' : 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          borderWidth: 2
        });
      }
      if (dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all') {
        datasets.push({
          label: `${unit} - Order`,
          data: periods.map(() => 0),
          borderColor: 'rgb(156, 39, 176)',
          backgroundColor: 'rgba(156, 39, 176, 0.3)',
          yAxisID: dataType === 'order' ? 'y' : 'y1',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [10, 5],
          borderWidth: 2
        });
      }
    });
  } else {
    // Jika lebih dari 1 business unit dipilih, jumlahkan nilainya menjadi satu chart
    const shouldCombine = invoiceBusinessUnits.length > 1 || (businessUnits.length > 1 && invoiceBusinessUnits.length > 0);
    
    if (shouldCombine) {
      // Sales dataset - jumlahkan semua business units
      if (dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'all') {
        const salesData = periods.map(period => {
          const records = invoiceData.filter(d => d.period === period);
          if (records.length > 0) {
            const total = records.reduce((sum, record) => {
              if (record.total_sales !== null && record.total_sales !== undefined) {
                return sum + (parseFloat(record.total_sales) || 0);
              }
              return sum;
            }, 0);
            return total;
          }
          return 0;
        });
        
        datasets.push({
          label: 'Total - Penjualan',
          data: salesData,
          borderColor: '#2563EB', // Biru lebih gelap untuk penjualan
          backgroundColor: 'rgba(37, 99, 235, 0.3)',
          yAxisID: 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        });
      }
      
      // Quantity dataset - jumlahkan semua business units
      if (dataType === 'quantity' || dataType === 'both' || dataType === 'quantity_order' || dataType === 'all') {
        const quantityData = periods.map(period => {
          const records = invoiceData.filter(d => d.period === period);
          if (records.length > 0) {
            const total = records.reduce((sum, record) => {
              if (record.total_quantity !== null && record.total_quantity !== undefined) {
                return sum + (parseFloat(record.total_quantity) || 0);
              }
              return sum;
            }, 0);
            return total;
          }
          return 0;
        });
        
        datasets.push({
          label: 'Total - Quantity',
          data: quantityData,
          borderColor: 'rgba(137, 183, 220, 1)',
          backgroundColor: 'rgba(137, 183, 220, 0.3)',
          yAxisID: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all' ? 'y1' : 'y',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          borderWidth: 2
        });
      }
      
      // Order dataset - jumlahkan semua business units
      if (dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all') {
        const orderData = periods.map(period => {
          const records = invoiceData.filter(d => d.period === period);
          if (records.length > 0) {
            const total = records.reduce((sum, record) => {
              if (record.invoice_count !== null && record.invoice_count !== undefined) {
                return sum + (parseFloat(record.invoice_count) || 0);
              }
              return sum;
            }, 0);
            return total;
          }
          return 0;
        });
        
        datasets.push({
          label: 'Total - Order',
          data: orderData,
          borderColor: 'rgba(156, 39, 176, 1)',
          backgroundColor: 'rgba(156, 39, 176, 0.3)',
          yAxisID: dataType === 'order' ? 'y' : 'y1',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [10, 5],
          borderWidth: 2
        });
      }
    } else {
      // Jika hanya satu business unit, tampilkan seperti biasa
      invoiceBusinessUnits.forEach(unit => {
        // Sales dataset
        if (dataType === 'penjualan' || dataType === 'both' || dataType === 'penjualan_order' || dataType === 'all') {
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
        if (dataType === 'quantity' || dataType === 'both' || dataType === 'quantity_order' || dataType === 'all') {
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
            yAxisID: dataType === 'both' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all' ? 'y1' : 'y',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5],
            borderWidth: 2
          });
        }
        
        // Order dataset
        if (dataType === 'order' || dataType === 'penjualan_order' || dataType === 'quantity_order' || dataType === 'all') {
          const orderData = periods.map(period => {
            const record = invoiceData.find(d => d.period === period && d.business_unit === unit);
            if (record && record.invoice_count !== null && record.invoice_count !== undefined) {
              return parseFloat(record.invoice_count) || 0;
            }
            return 0;
          });
          
          datasets.push({
            label: `${unit} - Order`,
            data: orderData,
            borderColor: 'rgb(156, 39, 176)',
            backgroundColor: 'rgba(156, 39, 176, 0.3)',
            yAxisID: dataType === 'order' ? 'y' : 'y1',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [10, 5],
            borderWidth: 2
          });
        }
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
    layout: {
      padding: {
        top: 4,
        right: 8,
        bottom: 0,
        left: 4
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      hoverGuideLine: {
        color: 'rgba(47, 111, 178, 0.55)',
        lineWidth: 1.2,
        dashPattern: [6, 4]
      },
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { 
            size: 12,
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            weight: 500
          },
          color: '#212121'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
        itemSort: function(a, b) {
          // Urutkan berdasarkan tipe data: Penjualan -> Quantity -> Order
          const getDataTypeOrder = (label) => {
            if (label.includes('Penjualan')) return 1;
            if (label.includes('Quantity')) return 2;
            if (label.includes('Order')) return 3;
            return 4; // Untuk tipe lain, taruh di bawah
          };
          
          const orderA = getDataTypeOrder(a.dataset.label || '');
          const orderB = getDataTypeOrder(b.dataset.label || '');
          
          // Jika tipe data sama, urutkan berdasarkan label (alphabetical)
          if (orderA === orderB) {
            return (a.dataset.label || '').localeCompare(b.dataset.label || '');
          }
          
          // Urutkan berdasarkan tipe data
          return orderA - orderB;
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Penjualan')) {
                label += formatCurrency(context.parsed.y);
              } else if (label.includes('Order')) {
                label += context.parsed.y.toLocaleString() + ' order';
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
          padding: {
            top: 6,
            bottom: 0
          },
          font: { size: 12, weight: 500 },
          color: '#616161'
        },
        ticks: {
          font: { size: 11 },
          color: '#757575',
          padding: 4
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
  } else if (dateFilterType === 'multi_range') {
    // Multi range comparison chart - similar to range chart but with range labels
    const result = createRangeChart({
      invoiceData,
      businessUnits,
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

