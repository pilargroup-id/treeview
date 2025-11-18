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
  { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },
  { sales: 'rgb(13, 71, 161)', quantity: 'rgb(30, 136, 229)' },     
  { sales: 'rgb(0, 77, 64)', quantity: 'rgb(0, 150, 136)' },          
  { sales: 'rgb(74, 20, 140)', quantity: 'rgb(103, 58, 183)' },      
  { sales: 'rgb(109, 76, 65)', quantity: 'rgb(141, 110, 99)' }
];

export const COLOR_BUSINESS_UNIT_SPECIFIC = {
  'Gosave': { 
    sales: 'rgba(25, 118, 210, 0.8)', 
    salesBorder: 'rgb(25, 118, 210)',
    quantity: 'rgba(25, 118, 210, 0.6)',
    quantityBorder: 'rgb(21, 101, 192)'
  },   
  'Goto': { 
    sales: 'rgba(66, 165, 245, 0.8)', 
    salesBorder: 'rgb(66, 165, 245)',
    quantity: 'rgba(66, 165, 245, 0.6)',
    quantityBorder: 'rgb(33, 150, 243)'
  }  
};

export const COLOR_BUSINESS_UNIT_RANGE = {
  'Gosave': { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },   
  'Goto': { sales: 'rgb(66, 66, 66)', quantity: 'rgb(117, 117, 117)' }  
};

