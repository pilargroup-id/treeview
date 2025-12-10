import { API_URL } from '../../config/api';

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
    if (!specificDates || !Array.isArray(specificDates) || specificDates.length === 0) {
      throw new Error('Pilih minimal 1 tanggal');
    }
    
    const isValidDate = (date) => {
      if (typeof date === 'string') {
      
        const parts = date.split('-');
        if (parts.length !== 2) return false;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        return !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      } else if (typeof date === 'object' && date.year && date.monthDay) {
     
        const parts = date.monthDay.split('-');
        if (parts.length !== 2) return false;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        return !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31 &&
               !isNaN(date.year) && date.year > 0;
      }
      return false;
    };
    
    const invalidDates = specificDates.filter(date => !isValidDate(date));
    if (invalidDates.length > 0) {
      console.error('Invalid dates found:', invalidDates);
      throw new Error(`Format tanggal tidak valid: ${invalidDates.length} tanggal. Pastikan format benar.`);
    }
    
    const MAX_API_DATES = 30;
    
    if (specificDates.length > MAX_API_DATES) {
      throw new Error(`Total tanggal yang akan dikirim (${specificDates.length}) melebihi batas API (${MAX_API_DATES}).`);
    }
    
    const selectedYears = [...new Set(specificDates.map(date => {
      if (typeof date === 'string') {
        return (years && years.length > 0) ? years[0] : (availableYears && availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());
      }
      return date.year;
    }))];
    
    try {
      specificDates.forEach(date => {
        let year, monthDay;
        
        if (typeof date === 'string') {
          monthDay = date;
          year = selectedYears[0] || (availableYears && availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());
        } else {
          year = date.year;
          monthDay = date.monthDay;
        }
        
        const fullDate = `${year}-${monthDay}`;
        params.append('specific_dates[]', fullDate);
      });
    } catch (appendError) {
      console.error('Error appending specific dates to params:', appendError);
      throw new Error('Error memproses tanggal. Mungkin terlalu banyak tanggal yang dipilih.');
    }
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log('=== API Request Debug (Specific Dates) ===');
      console.log('Input specificDates:', specificDates);
      console.log('Number of dates:', specificDates.length);
      console.log('Selected years from dates:', selectedYears);
      const allDates = [];
      specificDates.forEach(date => {
        let year, monthDay;
        if (typeof date === 'string') {
          monthDay = date;
          year = selectedYears[0] || (availableYears && availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());
        } else {
          year = date.year;
          monthDay = date.monthDay;
        }
        allDates.push(`${year}-${monthDay}`);
      });
      console.log('Converted to API format (YYYY-MM-DD):', allDates);
    }
  } else if (dateFilterType === 'multi_range') {
    if (!rangeDates || !Array.isArray(rangeDates) || rangeDates.length === 0) {
      throw new Error('Pilih minimal 1 range tanggal');
    }
    
    if (rangeDates.length > 5) {
      throw new Error('Maksimal 5 range tanggal');
    }
    
    rangeDates.forEach((range, index) => {
      if (!range.start || !range.end) {
        throw new Error(`Range ${index + 1} tidak valid. Pastikan start dan end sudah diisi.`);
      }
      
      // Validasi format YYYY-MM-DD
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(`Range ${index + 1}: Format tanggal tidak valid`);
      }
      
      if (endDate < startDate) {
        throw new Error(`Range ${index + 1}: Tanggal akhir harus setelah tanggal mulai`);
      }
      
      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 31) {
        throw new Error(`Range ${index + 1}: Maksimal 31 hari per range`);
      }
      
      params.append(`date_ranges[${index}][start]`, range.start);
      params.append(`date_ranges[${index}][end]`, range.end);
    });
  }
  
  return params;
}

/**
 * Load year summary data 
 */
export async function loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading, businessUnits = ['Gosave', 'Goto']) {
  try {
    setYearSummaryLoading(true);
    const params = new URLSearchParams();
    
    // Gunakan businessUnits yang dipilih, atau default ke ['Gosave', 'Goto']
    const unitsToLoad = businessUnits && businessUnits.length > 0 ? businessUnits : ['Gosave', 'Goto'];
    unitsToLoad.forEach(unit => {
      params.append('business_units[]', unit);
    });
    
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
            summary[year] = { sales: 0, quantity: 0, order: 0 };
          }
          const sales = parseFloat(item.total_sales) || 0;
          const quantity = parseFloat(item.total_quantity) || 0;
          const order = parseFloat(item.invoice_count) || 0;
          summary[year].sales += sales;
          summary[year].quantity += quantity;
          summary[year].order += order;
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
  setInvoiceLoading,
  showAlert = null
}) {
  // Validasi
  if (businessUnits.length === 0) {
    if (showAlert) {
      showAlert('Pilih minimal 1 Business Unit', { severity: 'warning' });
    } else {
      window.alert('Pilih minimal 1 Business Unit');
    }
    return;
  }
  
  if (dateFilterType === 'year' && years.length === 0) {
    if (showAlert) {
      showAlert('Pilih minimal 1 tahun', { severity: 'warning' });
    } else {
      window.alert('Pilih minimal 1 tahun');
    }
    return;
  }
  
  if (dateFilterType === 'range') {
    if (!rangeDates || rangeDates.length === 0) {
      if (showAlert) {
        showAlert('Tambahkan minimal 1 range tanggal', { severity: 'warning' });
      } else {
        window.alert('Tambahkan minimal 1 range tanggal');
      }
      return;
    }
    
    const MAX_RANGE_DATES = 20;
    if (rangeDates.length > MAX_RANGE_DATES) {
      const msg = `Maksimal ${MAX_RANGE_DATES} range yang bisa dipilih untuk menghindari error. Saat ini ada ${rangeDates.length} range.`;
      if (showAlert) {
        showAlert(msg, { severity: 'warning' });
      } else {
        window.alert(msg);
      }
      return;
    }
  }
  
  if (dateFilterType === 'multi_range') {
    if (!rangeDates || rangeDates.length === 0) {
      if (showAlert) {
        showAlert('Tambahkan minimal 1 range tanggal', { severity: 'warning' });
      } else {
        window.alert('Tambahkan minimal 1 range tanggal');
      }
      return;
    }
    
    if (rangeDates.length > 5) {
      const msg = 'Maksimal 5 range tanggal untuk perbandingan';
      if (showAlert) {
        showAlert(msg, { severity: 'warning' });
      } else {
        window.alert(msg);
      }
      return;
    }
  }
  
  if (dateFilterType === 'specific') {
    if (specificDates.length === 0) {
      if (showAlert) {
        showAlert('Tambahkan minimal 1 tanggal', { severity: 'warning' });
      } else {
        window.alert('Tambahkan minimal 1 tanggal');
      }
      return;
    }
    
    const selectedYears = [...new Set(specificDates.map(date => {
      if (typeof date === 'string') {
        return (years && years.length > 0) ? years[0] : (availableYears && availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());
      }
      return date.year;
    }))];
    
    const MAX_API_DATES = 30;
    
    if (specificDates.length > MAX_API_DATES) {
      const msg = `Total tanggal yang akan dikirim (${specificDates.length}) melebihi batas API (${MAX_API_DATES}).`;
      if (showAlert) {
        showAlert(msg, { severity: 'warning' });
      } else {
        window.alert(msg);
      }
      return;
    }
  }
  
  try {
    setInvoiceLoading(true);
    
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
          const msg = 'Gagal memuat data untuk semua range. ' + errors.join('; ');
          if (showAlert) {
            showAlert(msg, { severity: 'error' });
          } else {
            window.alert(msg);
          }
          return;
        } else {
          const msg = 'Beberapa range gagal dimuat: ' + errors.join('; ');
          if (showAlert) {
            showAlert(msg, { severity: 'warning' });
          } else {
            window.alert(msg);
          }
        }
      }
      
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
        // Untuk multi_range, gunakan rangeDates yang dikirim, bukan array kosong
        const paramsRangeDates = (dateFilterType === 'multi_range') ? rangeDates : [];
        params = buildApiParams({
          businessUnits,
          dateFilterType,
          years,
          rangeDates: paramsRangeDates,
          specificDates,
          availableYears
        });
      } catch (buildError) {
        console.error('Error building API params:', buildError);
        const msg = buildError.message || 'Format tanggal tidak valid. Pastikan format tanggal benar (MM-DD).';
        if (showAlert) {
          showAlert(msg, { severity: 'error' });
        } else {
          window.alert(msg);
        }
        return;
      }
      
      const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
      console.log('Request URL:', url);
      console.log('URL length:', url.length);
      
      if (url.length > 2000) {
        console.error('URL terlalu panjang:', url.length);
        const msg = `URL request terlalu panjang (${url.length} karakter). Kurangi jumlah tanggal yang dipilih.`;
        if (showAlert) {
          showAlert(msg, { severity: 'warning' });
        } else {
          window.alert(msg);
        }
        return;
      }
      
      let response;
      try {
        response = await fetch(url);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
          const msg = 'Gagal menghubungi server. Periksa koneksi internet atau coba kurangi jumlah tanggal yang dipilih.';
          if (showAlert) {
            showAlert(msg, { severity: 'error' });
          } else {
            window.alert(msg);
          }
        } else {
          const msg = 'Error: ' + (fetchError.message || 'Unknown error');
          if (showAlert) {
            showAlert(msg, { severity: 'error' });
          } else {
            window.alert(msg);
          }
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
        
        const msg = `Error dari server (${response.status}): ${errorMessage}`;
        if (showAlert) {
          showAlert(msg, { severity: 'error' });
        } else {
          window.alert(msg);
        }
        return;
      }
      
      let result;
      try {
        const responseText = await response.text();
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const msg = 'Error memproses response dari server. Response mungkin tidak valid.';
        if (showAlert) {
          showAlert(msg, { severity: 'error' });
        } else {
          window.alert(msg);
        }
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
          const msg = 'Format data tidak valid dari server. Data yang diterima: ' + (typeof result.data);
          if (showAlert) {
            showAlert(msg, { severity: 'error' });
          } else {
            window.alert(msg);
          }
        }
      } else {
        const errorMessage = result.message || result.error || 'Unknown error';
        console.error('API returned error:', result);
        const msg = 'Error dari server: ' + errorMessage;
        if (showAlert) {
          showAlert(msg, { severity: 'error' });
        } else {
          window.alert(msg);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    const msg = 'Failed to load data: ' + (error.message || 'Unknown error');
    if (showAlert) {
      showAlert(msg, { severity: 'error' });
    } else {
      window.alert(msg);
    }
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
  setYearSummaryLoading,
  showAlert = null
}) {
  try {
    setInvoiceLoading(true);
    setInvoiceData([]);

    await loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading, businessUnits);
    
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
            setInvoiceLoading,
            showAlert
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

