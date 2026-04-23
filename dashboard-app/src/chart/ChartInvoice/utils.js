export function formatCurrency(num) {
  const value = parseFloat(num);
  if (isNaN(value)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatShortNumber(num) {
  const value = parseFloat(num);
  if (isNaN(value)) return '0';
  
  // 1.000.000.000 (1 miliar) = 1B
  if (value >= 1000000000) {
    const formatted = (value / 1000000000).toFixed(2).replace(/\.?0+$/, '');
    return formatted.replace('.', ',') + 'M';
  } 
  // 1.000.000 (1 juta) = 1M
  else if (value >= 1000000) {
    const formatted = (value / 1000000).toFixed(2).replace(/\.?0+$/, '');
    return formatted.replace('.', ',') + 'M';
  } 
  // 1.000 (1 ribu) = 1K
  else if (value >= 1000) {
    const formatted = (value / 1000).toFixed(2).replace(/\.?0+$/, '');
    return formatted.replace('.', ',') + 'K';
  }
  return value.toString();
}

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function getDefaultLabels(dateFilterType, specificDates) {
  if (dateFilterType === 'year') {
    return MONTH_LABELS;
  } else if (dateFilterType === 'specific') {
    if (specificDates && specificDates.length > 0) {
      return specificDates.sort().map(date => {
        const [year, month, day] = date.split('-');
        return `${parseInt(day)} ${MONTH_NAMES_ID[parseInt(month) - 1]} ${year}`;
      });
    }
    return ['No data'];
  } else {
    return ['No data'];
  }
}

export function getAvailableYears() {
  const availableYears = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    availableYears.push(currentYear - i);
  }
  return availableYears;
}

// Color palette 
export const COLOR_PALETTE_YEAR = [
  { sales: 'rgb(33, 150, 243)', quantity: 'rgb(66, 165, 245)' },      // Biru cerah 
  { sales: 'rgb(244, 67, 54)', quantity: 'rgb(255, 82, 82)' },         // Merah cerah
  { sales: 'rgb(255, 193, 7)', quantity: 'rgb(255, 213, 79)' },      // Kuning cerah
  { sales: 'rgb(76, 175, 80)', quantity: 'rgb(129, 199, 132)' },     // Hijau cerah
  { sales: 'rgb(158, 158, 158)', quantity: 'rgb(189, 189, 189)' },   // Abu-abu cerah
  { sales: 'rgb(156, 39, 176)', quantity: 'rgb(186, 104, 200)' },    // Ungu cerah
  { sales: 'rgb(255, 152, 0)', quantity: 'rgb(255, 183, 77)' },      // Oranye cerah
  { sales: 'rgb(0, 188, 212)', quantity: 'rgb(38, 198, 218)' }       // Cyan cerah
];

/**
 * Ambil Warna
 */
export function getYearColor(year) {
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) return COLOR_PALETTE_YEAR[0];
  
  const baseYear = 2020;
  const yearOffset = yearNum - baseYear;
  const colorIndex = Math.abs(yearOffset) % COLOR_PALETTE_YEAR.length;
  return COLOR_PALETTE_YEAR[colorIndex];
}

export const COLOR_BUSINESS_UNIT_SPECIFIC = {
  'Gosave': { 
    sales: 'rgba(47, 111, 178, 0.8)', 
    salesBorder: 'rgb(107, 163, 208)',
    quantity: 'rgba(137, 183, 220, 0.8)',
    quantityBorder: 'rgb(137, 183, 220)'
  },   
  'Goto': { 
    sales: 'rgba(47, 111, 178, 0.8)', 
    salesBorder: 'rgb(107, 163, 208)',
    quantity: 'rgba(137, 183, 220, 0.8)',
    quantityBorder: 'rgb(137, 183, 220)'
  }  
};

export const COLOR_BUSINESS_UNIT_RANGE = {
  'Gosave': { sales: 'rgb(107, 163, 208)', quantity: 'rgb(137, 183, 220)' },   // Biru soft
  'Goto': { sales: 'rgb(244, 67, 54)', quantity: 'rgb(255, 82, 82)' }          // Merah cerah
};

