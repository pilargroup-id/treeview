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

// Color palette - Warna terang dan bervariasi
export const COLOR_PALETTE_YEAR = [
  { sales: 'rgb(66, 165, 245)', quantity: 'rgb(129, 212, 250)' },      // Biru terang
  { sales: 'rgb(102, 187, 106)', quantity: 'rgb(165, 214, 167)' },    // Hijau terang
  { sales: 'rgb(255, 152, 0)', quantity: 'rgb(255, 183, 77)' },       // Orange terang
  { sales: 'rgb(156, 39, 176)', quantity: 'rgb(186, 104, 200)' },     // Ungu terang
  { sales: 'rgb(236, 64, 122)', quantity: 'rgb(244, 143, 177)' },     // Pink terang
  { sales: 'rgb(0, 188, 212)', quantity: 'rgb(77, 208, 225)' },       // Cyan terang
  { sales: 'rgb(255, 87, 34)', quantity: 'rgb(255, 138, 101)' },      // Orange merah terang
  { sales: 'rgb(121, 85, 72)', quantity: 'rgb(161, 136, 127)' }       // Coklat terang
];

export const COLOR_BUSINESS_UNIT_SPECIFIC = {
  'Gosave': { 
    sales: 'rgba(66, 165, 245, 0.8)', 
    salesBorder: 'rgb(66, 165, 245)',
    quantity: 'rgba(129, 212, 250, 0.8)',
    quantityBorder: 'rgb(129, 212, 250)'
  },   
  'Goto': { 
    sales: 'rgba(102, 187, 106, 0.8)', 
    salesBorder: 'rgb(102, 187, 106)',
    quantity: 'rgba(165, 214, 167, 0.8)',
    quantityBorder: 'rgb(165, 214, 167)'
  }  
};

export const COLOR_BUSINESS_UNIT_RANGE = {
  'Gosave': { sales: 'rgb(66, 165, 245)', quantity: 'rgb(129, 212, 250)' },   // Biru terang
  'Goto': { sales: 'rgb(102, 187, 106)', quantity: 'rgb(165, 214, 167)' }     // Hijau terang
};

