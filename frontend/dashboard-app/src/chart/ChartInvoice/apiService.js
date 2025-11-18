const API_URL = 'http://localhost:8000/api';

/**
 * Build query parameters 
 */
export function buildApiParams({
  businessUnits,
  dateFilterType,
  years,
  rangeDates,
  specificDates,
  availableYears = null
}) {
  const params = new URLSearchParams();
  
  businessUnits.forEach(unit => params.append('business_units[]', unit));
  params.append('date_type', dateFilterType);
  
  if (dateFilterType === 'year') {
    years.forEach(year => params.append('years[]', year));
  } else if (dateFilterType === 'range') {
    if (years.length > 0 && rangeDates && rangeDates.length > 0) {
      const year = years[0];
      
      // Validasi format MM-DD
      const isValidMonthDay = (value) => {
        if (!value || typeof value !== 'string') return false;
        const parts = value.split('-');
        if (parts.length !== 2) return false;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        return !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      };
      
      const firstRange = rangeDates[0];
      
      if (!isValidMonthDay(firstRange.start) || !isValidMonthDay(firstRange.end)) {
        console.error('Invalid date format in range filter:', firstRange);
        throw new Error('Format tanggal tidak valid. Gunakan format MM-DD (contoh: 12-25)');
      }
      
      const startDate = `${year}-${firstRange.start}`;
      const endDate = `${year}-${firstRange.end}`;
      params.append('start_date', startDate);
      params.append('end_date', endDate);
    }
  } else if (dateFilterType === 'specific') {
    // Validasi jumlah tanggal
    if (!specificDates || !Array.isArray(specificDates) || specificDates.length === 0) {
      throw new Error('Pilih minimal 1 tanggal');
    }
    
    // Jika years dipilih, gunakan years yang dipilih
    const yearsToUse = (years && Array.isArray(years) && years.length > 0) 
      ? years 
      : (availableYears && Array.isArray(availableYears) && availableYears.length > 0)
        ? availableYears
        : [2021, 2022, 2023, 2024, 2025]; // Fallback default
    
    // Validasi format setiap tanggal
    const isValidMonthDay = (value) => {
      if (!value || typeof value !== 'string') return false;
      const parts = value.split('-');
      if (parts.length !== 2) return false;
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      return !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31;
    };
    
    // Validasi semua tanggal
    const invalidDates = specificDates.filter(date => !isValidMonthDay(date));
    if (invalidDates.length > 0) {
      console.error('Invalid dates found:', invalidDates);
      throw new Error(`Format tanggal tidak valid: ${invalidDates.join(', ')}. Gunakan format MM-DD (contoh: 12-25)`);
    }
    
    // API membatasi maksimal 30 tanggal YYYY-MM-DD
    const MAX_API_DATES = 30;
    const totalParams = specificDates.length * yearsToUse.length;
    
    if (totalParams > MAX_API_DATES) {
      const maxDates = Math.floor(MAX_API_DATES / yearsToUse.length);
      throw new Error(`Total tanggal yang akan dikirim (${totalParams}) melebihi batas API (${MAX_API_DATES}). Maksimal ${maxDates} tanggal MM-DD untuk ${yearsToUse.length} tahun.`);
    }
    
    try {
      specificDates.forEach(monthDay => {
        if (monthDay && monthDay.includes('-')) {
          yearsToUse.forEach(year => {
            const fullDate = `${year}-${monthDay}`;
            params.append('specific_dates[]', fullDate);
          });
        }
      });
    } catch (appendError) {
      console.error('Error appending specific dates to params:', appendError);
      throw new Error('Error memproses tanggal. Mungkin terlalu banyak tanggal yang dipilih.');
    }
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log('=== API Request Debug (Specific Dates) ===');
      console.log('Input specificDates (MM-DD):', specificDates);
      console.log('Number of dates:', specificDates.length);
      console.log('Years to use:', yearsToUse);
      console.log('Total parameters to send:', totalParams);
      const allDates = [];
      specificDates.forEach(monthDay => {
        yearsToUse.forEach(year => {
          allDates.push(`${year}-${monthDay}`);
        });
      });
      console.log('Converted to API format (YYYY-MM-DD):', allDates);
    }
  }
  
  return params;
}

/**
 * Load year summary data 
 */
export async function loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading) {
  try {
    setYearSummaryLoading(true);
    const params = new URLSearchParams();
    // Load BU
    params.append('business_units[]', 'Gosave');
    params.append('business_units[]', 'Goto');
    params.append('date_type', 'year');
    // Load All Years
    availableYears.forEach(year => {
      params.append('years[]', year);
    });
    
    const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.status === 'success' && Array.isArray(result.data)) {
      const summary = {};
      result.data.forEach(item => {
        const year = parseInt(item.year) || item.year;
        if (year) {
          if (!summary[year]) {
            summary[year] = { sales: 0, quantity: 0 };
          }
          const sales = parseFloat(item.total_sales) || 0;
          const quantity = parseFloat(item.total_quantity) || 0;
          summary[year].sales += sales;
          summary[year].quantity += quantity;
        }
      });
      setYearSummary(summary);
    }
  } catch (error) {
    console.error('Error loading year summary:', error);
  } finally {
    setYearSummaryLoading(false);
  }
}

/**
 * Load invoice 
 */
export async function loadInvoiceSales({
  businessUnits,
  dateFilterType,
  years,
  rangeDates,
  specificDates,
  availableYears = null,
  setInvoiceData,
  setInvoiceLoading
}) {
  // Validasi
  if (businessUnits.length === 0) {
    alert('Pilih minimal 1 Business Unit');
    return;
  }
  
  if (dateFilterType === 'year' && years.length === 0) {
    alert('Pilih minimal 1 tahun');
    return;
  }
  
  if (dateFilterType === 'range') {
    if (!rangeDates || rangeDates.length === 0) {
      alert('Tambahkan minimal 1 range tanggal');
      return;
    }
    if (years.length === 0) {
      alert('Pilih minimal 1 tahun dari card tahun');
      return;
    }
    if (years.length > 1) {
      alert('Range tanggal hanya bisa menggunakan 1 tahun. Pilih 1 tahun saja dari card tahun.');
      return;
    }
    
    const MAX_RANGE_DATES = 20;
    if (rangeDates.length > MAX_RANGE_DATES) {
      alert(`Maksimal ${MAX_RANGE_DATES} range yang bisa dipilih untuk menghindari error. Saat ini ada ${rangeDates.length} range.`);
      return;
    }
  }
  
  if (dateFilterType === 'specific') {
    if (specificDates.length === 0) {
      alert('Tambahkan minimal 1 tanggal');
      return;
    }
    
    // Untuk specific dates
    const yearsToUse = (years && Array.isArray(years) && years.length > 0) 
      ? years 
      : (availableYears && Array.isArray(availableYears) && availableYears.length > 0)
        ? availableYears
        : [2021, 2022, 2023, 2024, 2025]; 
    
    // Validasi total tanggal 
    const MAX_API_DATES = 30;
    const totalDates = specificDates.length * yearsToUse.length;
    
    if (totalDates > MAX_API_DATES) {
      const maxDates = Math.floor(MAX_API_DATES / yearsToUse.length);
      alert(`Total tanggal yang akan dikirim (${totalDates}) melebihi batas API (${MAX_API_DATES}). Maksimal ${maxDates} tanggal MM-DD untuk ${yearsToUse.length} tahun.`);
      return;
    }
  }
  
  try {
    setInvoiceLoading(true);
    
    // Untuk multiple ranges
    if (dateFilterType === 'range' && rangeDates && rangeDates.length > 0) {
      const allData = [];
      const errors = [];
      
      // Memanggil API 
      for (const range of rangeDates) {
        try {
          if (!range.year) {
            console.error('Range missing year:', range);
            errors.push(`Range ${range.start} - ${range.end}: Tahun tidak ditemukan`);
            continue;
          }
          
          const params = buildApiParams({
            businessUnits,
            dateFilterType,
            years: [range.year],
            rangeDates: [range],
            specificDates: []
          });
          
          const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
          console.log(`Request URL for range ${range.start} - ${range.end} (${range.year}):`, url);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response for range ${range.start} - ${range.end} (${range.year}):`, errorText);
            errors.push(`Range ${range.start} - ${range.end} (${range.year}): ${response.statusText}`);
            continue;
          }
          
          const result = await response.json();
          
          if (result.status === 'success' && Array.isArray(result.data)) {
            allData.push(...result.data);
          } else {
            errors.push(`Range ${range.start} - ${range.end} (${range.year}): ${result.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`Error loading range ${range.start} - ${range.end} (${range.year}):`, error);
          errors.push(`Range ${range.start} - ${range.end} (${range.year}): ${error.message || 'Unknown error'}`);
        }
      }
      
      if (errors.length > 0) {
        console.warn('Some ranges failed to load:', errors);
        if (allData.length === 0) {
          alert('Gagal memuat data untuk semua range. ' + errors.join('; '));
          return;
        } else {
          alert('Beberapa range gagal dimuat: ' + errors.join('; '));
        }
      }
      
      // Gabungkan dan set data
      if (allData.length > 0) {
        console.log('Total Invoice Data dari semua ranges:', allData.length);
        if (process.env.NODE_ENV === 'development') {
          console.log('=== API Response Structure (Multiple Ranges) ===');
          console.log('Sample record:', allData[0]);
          console.log('Unique periods:', [...new Set(allData.map(d => d.period))]);
          console.log('Unique years:', [...new Set(allData.map(d => d.year))]);
          console.log('Unique business units:', [...new Set(allData.map(d => d.business_unit))]);
        }
        setInvoiceData(allData);
      } else {
        setInvoiceData([]);
      }
    } else {
      let params;
      try {
        params = buildApiParams({
          businessUnits,
          dateFilterType,
          years,
          rangeDates: [],
          specificDates,
          availableYears
        });
      } catch (buildError) {
        console.error('Error building API params:', buildError);
        alert(buildError.message || 'Format tanggal tidak valid. Pastikan format tanggal benar (MM-DD).');
        return;
      }
      
      const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
      console.log('Request URL:', url);
      console.log('URL length:', url.length);
      
      if (url.length > 2000) {
        console.error('URL terlalu panjang:', url.length);
        alert(`URL request terlalu panjang (${url.length} karakter). Kurangi jumlah tanggal yang dipilih.`);
        return;
      }
      
      let response;
      try {
        response = await fetch(url);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
          alert('Gagal menghubungi server. Periksa koneksi internet atau coba kurangi jumlah tanggal yang dipilih.');
        } else {
          alert('Error: ' + (fetchError.message || 'Unknown error'));
        }
        return;
      }
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        let errorMessage = response.statusText || 'Unknown error';
        
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          // Parse JSON 
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.errors) {
              const errorMessages = Object.values(errorJson.errors).flat();
              errorMessage = errorMessages.join(', ') || errorMessage;
            } else if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (parseError) {
            if (errorText && errorText.length < 500) {
              errorMessage = errorText;
            }
          }
        } catch (textError) {
          console.error('Error reading error response:', textError);
        }
        
        alert(`Error dari server (${response.status}): ${errorMessage}`);
        return;
      }
      
      let result;
      try {
        const responseText = await response.text();
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        alert('Error memproses response dari server. Response mungkin tidak valid.');
        return;
      }
      
      if (result.status === 'success') {
        console.log('Invoice Data dari API:', result.data);
        console.log('Jumlah data:', result.data ? result.data.length : 0);
        
        if (Array.isArray(result.data)) {
          if (process.env.NODE_ENV === 'development' && result.data.length > 0) {
            console.log('=== API Response Structure ===');
            console.log('Sample record:', result.data[0]);
            console.log('Unique periods:', [...new Set(result.data.map(d => d.period))]);
            console.log('Unique years:', [...new Set(result.data.map(d => d.year))]);
            console.log('Unique business units:', [...new Set(result.data.map(d => d.business_unit))]);
          }
          setInvoiceData(result.data);
        } else {
          console.error('Data dari API bukan array:', result.data);
          alert('Format data tidak valid dari server. Data yang diterima: ' + (typeof result.data));
        }
      } else {
        const errorMessage = result.message || result.error || 'Unknown error';
        console.error('API returned error:', result);
        alert('Error dari server: ' + errorMessage);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load data: ' + (error.message || 'Unknown error'));
  } finally {
    setInvoiceLoading(false);
  }
}

/**
 * Refresh data 
 */
export async function refreshData({
  businessUnits,
  dateFilterType,
  years,
  rangeDates,
  specificDates,
  availableYears,
  setInvoiceData,
  setInvoiceLoading,
  setYearSummary,
  setYearSummaryLoading
}) {
  try {
    setInvoiceLoading(true);
    setInvoiceData([]);

    await loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading);
    
    if (businessUnits.length > 0) {
      const canLoadData = 
        (dateFilterType === 'year' && years.length > 0) ||
        (dateFilterType === 'range' && rangeDates && rangeDates.length > 0) ||
        (dateFilterType === 'specific' && specificDates.length > 0);
      
      if (canLoadData) {
        try {
          await loadInvoiceSales({
            businessUnits,
            dateFilterType,
            years,
            rangeDates,
            specificDates,
            availableYears,
            setInvoiceData,
            setInvoiceLoading
          });
        } catch (error) {
          console.error('Error loading invoice data on refresh:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    setInvoiceLoading(false);
  }
}

