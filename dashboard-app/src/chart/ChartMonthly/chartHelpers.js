import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { API_URL } from '../../config/api';
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

//  variable
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const monthShortNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const FINANCIAL_BASE_URL = `${String(API_URL ?? '').replace(/\/+$/, '')}/financial`;
const DEFAULT_MONTHLY_REVENUE_URL = `${FINANCIAL_BASE_URL}/monthly-revenue`;
const DEFAULT_INVOICE_SALES_URL = `${FINANCIAL_BASE_URL}/invoice-sales`;
const DEFAULT_BUSINESS_UNITS_URL = `${FINANCIAL_BASE_URL}/business-units`;

const normalizeBusinessUnits = (businessUnits) => {
  if (businessUnits instanceof Set) {
    return Array.from(businessUnits);
  }

  if (Array.isArray(businessUnits)) {
    return businessUnits;
  }

  return [];
};

const normalizeSubBusinessUnits = (subBusinessUnits) => {
  if (subBusinessUnits instanceof Set) {
    return Array.from(subBusinessUnits);
  }

  if (Array.isArray(subBusinessUnits)) {
    return subBusinessUnits;
  }

  return [];
};

const buildMonthlyRevenueQueryParams = (accountHeader, startDate, endDate, businessUnits) => {
  const params = new URLSearchParams();
  params.append('account_header', accountHeader);
  params.append('start_date', startDate);
  params.append('end_date', endDate);

  normalizeBusinessUnits(businessUnits).forEach((businessUnit) => {
    params.append('business_units[]', businessUnit);
  });

  return params;
};

const buildInvoiceSalesRangeQueryParams = (
  startDate,
  endDate,
  businessUnits,
  subBusinessUnits = []
) => {
  const params = new URLSearchParams();
  params.append('date_type', 'range');
  params.append('start_date', startDate);
  params.append('end_date', endDate);

  const normalizedSubBusinessUnits = normalizeSubBusinessUnits(subBusinessUnits)
    .map((subBusinessUnit) => String(subBusinessUnit || '').trim())
    .filter(Boolean);

  if (normalizedSubBusinessUnits.length > 0) {
    normalizedSubBusinessUnits.forEach((subBusinessUnit) => {
      params.append('sub_business_units[]', subBusinessUnit);
    });
    return params;
  }

  normalizeBusinessUnits(businessUnits).forEach((businessUnit) => {
    params.append('business_units[]', businessUnit);
  });

  return params;
};

const extractApiErrorMessage = (result, fallbackMessage = 'Error loading data from API') => {
  if (result?.message) {
    return result.message;
  }

  if (result?.errors && typeof result.errors === 'object') {
    const firstFieldErrors = Object.values(result.errors)[0];
    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      return firstFieldErrors[0];
    }
  }

  return fallbackMessage;
};

const normalizeMainBusinessUnit = (businessUnitValue) => {
  const normalizedValue = String(businessUnitValue || '').trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.includes('gosave')) {
    return 'Gosave';
  }

  if (normalizedValue.includes('goto') || normalizedValue === 'store') {
    return 'Goto';
  }

  return null;
};

const normalizeYears = (years) => {
  if (!Array.isArray(years)) {
    return [];
  }

  return Array.from(
    new Set(
      years
        .map((year) => Number.parseInt(year, 10))
        .filter(Number.isInteger)
    )
  );
};

const parseIsoDate = (value) => {
  const rawValue = String(value || '').trim();
  if (!ISO_DATE_PATTERN.test(rawValue)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = rawValue.split('-');
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return {
    iso: rawValue,
    year,
    month,
    day,
    date: parsedDate
  };
};

const normalizeCompareYearDateRanges = (dateRanges) => {
  if (!Array.isArray(dateRanges)) {
    return [];
  }

  return dateRanges
    .map((range) => {
      const start = parseIsoDate(range?.startDate || range?.start || '');
      const end = parseIsoDate(range?.endDate || range?.end || '');

      if (!start || !end || end.date < start.date) {
        return null;
      }

      const diffDays = Math.floor((end.date.getTime() - start.date.getTime()) / MS_PER_DAY) + 1;
      if (diffDays > 31) {
        return null;
      }

      return {
        startDate: start.iso,
        endDate: end.iso
      };
    })
    .filter(Boolean)
    .slice(0, 5);
};

const toMonthDay = (isoDate) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return null;
  }

  return parsed.iso.slice(5, 10);
};

const formatIsoDateLabel = (isoDate) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return isoDate;
  }

  const dayLabel = String(parsed.day).padStart(2, '0');
  const monthLabel = monthShortNames[parsed.month - 1] || String(parsed.month).padStart(2, '0');
  return `${dayLabel} ${monthLabel} ${parsed.year}`;
};

const resolveInvoiceMetrics = (item) => {
  const parsedCredit = Number.parseFloat(item?.total_credit);
  const parsedDebit = Number.parseFloat(item?.total_debit);
  const parsedDifference = Number.parseFloat(item?.total_difference);
  const parsedSales = Number.parseFloat(item?.total_sales);

  const hasCredit = Number.isFinite(parsedCredit);
  const hasDebit = Number.isFinite(parsedDebit);
  const hasDifference = Number.isFinite(parsedDifference);
  const hasSales = Number.isFinite(parsedSales);

  const credit = hasCredit
    ? parsedCredit
    : hasSales
      ? parsedSales
      : hasDifference
        ? parsedDifference
        : 0;
  const debit = hasDebit ? parsedDebit : 0;
  const total = (hasCredit || hasDebit)
    ? (credit - debit)
    : hasDifference
      ? parsedDifference
      : hasSales
        ? parsedSales
        : 0;

  return { credit, debit, total };
};

const aggregateInvoiceRowsByRange = (rows) => {
  const sourceRows = Array.isArray(rows) ? rows : [];
  return sourceRows.reduce((accumulator, item) => {
    const metrics = resolveInvoiceMetrics(item);
    accumulator.credit += metrics.credit;
    accumulator.debit += metrics.debit;
    accumulator.total += metrics.total;
    return accumulator;
  }, {
    credit: 0,
    debit: 0,
    total: 0
  });
};

const buildInvoiceSalesCompareYearQueryParams = ({
  startDate,
  endDate,
  compareYears,
  businessUnit
}) => {
  const compareStartMonthDay = toMonthDay(startDate);
  const compareEndMonthDay = toMonthDay(endDate);
  const normalizedCompareYears = normalizeYears(compareYears).sort((left, right) => left - right);

  if (!compareStartMonthDay || !compareEndMonthDay || normalizedCompareYears.length === 0 || !businessUnit) {
    return null;
  }

  const params = new URLSearchParams();
  params.append('date_type', 'compare_year');
  params.append('compare_dates[]', compareStartMonthDay);
  params.append('compare_dates[]', compareEndMonthDay);

  normalizedCompareYears.forEach((year) => {
    params.append('compare_years[]', String(year));
  });

  params.append('business_units[]', businessUnit);
  return params;
};

const sanitizeBusinessUnitId = (businessUnit) => {
  return String(businessUnit || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unit';
};

const loadInvoiceSalesCompareYearMultiRangeData = async ({
  dateRanges,
  compareYears,
  businessUnits,
  invoiceSalesUrl = DEFAULT_INVOICE_SALES_URL
}) => {
  const normalizedRanges = normalizeCompareYearDateRanges(dateRanges);
  const normalizedBusinessUnits = normalizeBusinessUnits(businessUnits)
    .map((businessUnit) => String(businessUnit || '').trim())
    .filter(Boolean);
  const normalizedCompareYears = normalizeYears(compareYears).sort((left, right) => left - right);
  const fallbackYear = parseIsoDate(normalizedRanges[0]?.startDate || '')?.year || new Date().getFullYear();
  const resolvedCompareYears = normalizedCompareYears.length > 0
    ? normalizedCompareYears
    : [fallbackYear - 1, fallbackYear];

  if (!invoiceSalesUrl) {
    return {
      success: false,
      error: 'URL API invoice sales tidak tersedia'
    };
  }

  if (normalizedBusinessUnits.length === 0) {
    return {
      success: false,
      error: 'Pilih minimal 1 business unit'
    };
  }

  if (normalizedRanges.length === 0) {
    return {
      success: true,
      data: []
    };
  }

  try {
    const requests = normalizedRanges.flatMap((range, rangeIndex) =>
      normalizedBusinessUnits.map((businessUnit) => ({
        range,
        rangeIndex,
        businessUnit
      }))
    );

    const responses = await Promise.all(
      requests.map(async ({ range, rangeIndex, businessUnit }) => {
        const params = buildInvoiceSalesCompareYearQueryParams({
          startDate: range.startDate,
          endDate: range.endDate,
          compareYears: resolvedCompareYears,
          businessUnit
        });

        if (!params) {
          throw new Error(`Range ${rangeIndex + 1} tidak valid untuk compare_year (${businessUnit})`);
        }

        const response = await fetch(`${invoiceSalesUrl}?${params.toString()}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        let result = null;
        try {
          result = await response.json();
        } catch (error) {
          throw new Error(`Response API tidak valid untuk Range ${rangeIndex + 1} (${businessUnit})`);
        }

        if (!response.ok || result?.status !== 'success') {
          const fallbackMessage = `Gagal memuat data Range ${rangeIndex + 1} (${businessUnit})`;
          throw new Error(extractApiErrorMessage(result, fallbackMessage));
        }

        const aggregated = aggregateInvoiceRowsByRange(result?.data);
        const formattedRangeLabel = `${formatIsoDateLabel(range.startDate)} - ${formatIsoDateLabel(range.endDate)}`;
        return {
          id: `range-${rangeIndex + 1}-${sanitizeBusinessUnitId(businessUnit)}`,
          rangeId: `range-${rangeIndex + 1}`,
          rangeOrder: rangeIndex,
          label: formattedRangeLabel,
          rangeLabel: formattedRangeLabel,
          startDate: range.startDate,
          endDate: range.endDate,
          business_unit: businessUnit,
          mainBusinessUnit: normalizeMainBusinessUnit(businessUnit),
          ...aggregated
        };
      })
    );

    return {
      success: true,
      data: responses
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Failed to load compare year data'
    };
  }
};

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
    let monthIndex = -1;

    if (item.month !== undefined && item.month !== null) {
      const parsedMonth = parseInt(item.month, 10);
      if (!Number.isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        monthIndex = parsedMonth - 1;
      }
    }

    if (monthIndex < 0 && typeof item.period === 'string') {
      const [, periodMonth] = item.period.split('-');
      const parsedPeriodMonth = parseInt(periodMonth, 10);
      if (!Number.isNaN(parsedPeriodMonth) && parsedPeriodMonth >= 1 && parsedPeriodMonth <= 12) {
        monthIndex = parsedPeriodMonth - 1;
      }
    }

    if (monthIndex < 0) {
      monthIndex = 0;
    }
    
    const parsedCredit = parseFloat(item.total_credit);
    const parsedDebit = parseFloat(item.total_debit);
    const parsedDifference = parseFloat(item.total_difference);
    const parsedSales = parseFloat(item.total_sales);
    const hasCredit = Number.isFinite(parsedCredit);
    const hasDebit = Number.isFinite(parsedDebit);
    const hasDifference = Number.isFinite(parsedDifference);
    const hasSales = Number.isFinite(parsedSales);

    const credit = hasCredit
      ? parsedCredit
      : hasSales
        ? parsedSales
        : hasDifference
          ? parsedDifference
          : 0;
    const debit = hasDebit ? parsedDebit : 0;
    const total = (hasCredit || hasDebit)
      ? (credit - debit)
      : hasDifference
        ? parsedDifference
        : hasSales
          ? parsedSales
          : 0;
    const parsedYearFromPeriod = typeof item.period === 'string'
      ? parseInt(item.period.split('-')[0], 10)
      : NaN;
    const parsedYearFromItem = parseInt(item.year, 10);
    const year = Number.isInteger(parsedYearFromItem)
      ? parsedYearFromItem
      : Number.isInteger(parsedYearFromPeriod)
        ? parsedYearFromPeriod
        : null;
    
    const businessUnit = typeof item.business_unit === 'string'
      ? item.business_unit.trim()
      : '';
    const mainBusinessUnit = normalizeMainBusinessUnit(businessUnit);

    processed.push({
      period: item.period ?? null,
      month: monthNames[monthIndex],
      monthShort: monthShortNames[monthIndex],
      monthNumber: monthIndex + 1,
      year,
      business_unit: businessUnit || null,
      mainBusinessUnit,
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
export const loadBusinessUnits = async (businessUnitsUrl = DEFAULT_BUSINESS_UNITS_URL) => {
  try {
    const response = await fetch(businessUnitsUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
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
export const loadRevenueData = async (
  accountHeader,
  startDate,
  endDate,
  businessUnits,
  monthlyRevenueUrl = DEFAULT_MONTHLY_REVENUE_URL,
  options = {}
) => {
  try {
    const queryParams = buildMonthlyRevenueQueryParams(
      accountHeader,
      startDate,
      endDate,
      businessUnits
    );
    const response = await fetch(`${monthlyRevenueUrl}?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const result = await response.json();

    if (response.ok && result.status === 'success') {
      const requestYear = parseInt(options?.requestYear, 10);
      const fallbackYear = Number.isInteger(requestYear)
        ? requestYear
        : parseInt(String(startDate || '').slice(0, 4), 10);
      const processedData = processData(result.data).map((item) => ({
        ...item,
        year: Number.isInteger(item.year) ? item.year : fallbackYear
      }));

      return {
        success: true,
        data: {
          data: processedData
        }
      };
    } else {
      return {
        success: false,
        error: extractApiErrorMessage(result)
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

export const loadInvoiceSalesRangeData = async (
  startDate,
  endDate,
  businessUnits,
  invoiceSalesUrl = DEFAULT_INVOICE_SALES_URL,
  options = {}
) => {
  try {
    const queryParams = buildInvoiceSalesRangeQueryParams(
      startDate,
      endDate,
      businessUnits,
      options?.subBusinessUnits
    );
    const response = await fetch(`${invoiceSalesUrl}?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const result = await response.json();

    if (response.ok && result.status === 'success') {
      const requestYear = parseInt(options?.requestYear, 10);
      const fallbackYear = Number.isInteger(requestYear)
        ? requestYear
        : parseInt(String(startDate || '').slice(0, 4), 10);
      const processedData = processData(result.data).map((item) => ({
        ...item,
        year: Number.isInteger(item.year) ? item.year : fallbackYear
      }));

      return {
        success: true,
        data: {
          data: processedData
        }
      };
    }

    return {
      success: false,
      error: extractApiErrorMessage(result)
    };
  } catch (error) {
    console.error('Error loading invoice sales range data:', error);
    return {
      success: false,
      error: error.message || 'Failed to load data'
    };
  }
};

// Custom Hooks
export const useChartData = (
  initialAccountHeader = '4000.01.00',
  initialStartDate = '2024-01-01',
  initialEndDate = '2025-12-31',
  initialBusinessUnits = ['Gosave', 'Goto'],
  apiConfig = {}
) => {
  const monthlyRevenueUrl = apiConfig?.monthlyRevenueUrl || DEFAULT_MONTHLY_REVENUE_URL;
  const invoiceSalesUrl = apiConfig?.invoiceSalesUrl || DEFAULT_INVOICE_SALES_URL;
  const [accountHeader, setAccountHeader] = useState(initialAccountHeader);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState(
    new Set(
      Array.isArray(initialBusinessUnits) && initialBusinessUnits.length > 0
        ? initialBusinessUnits
        : ['Gosave', 'Goto']
    )
  );
  const [allData, setAllData] = useState({ data: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRevenue = useCallback(async (onError, options = {}) => {
    const inputRanges = Array.isArray(options.dateRanges) ? options.dateRanges : [];
    const targetDateRanges = inputRanges
      .map((range) => ({
        startDate: range?.startDate || range?.start || '',
        endDate: range?.endDate || range?.end || '',
        year: parseInt(range?.year, 10)
      }))
      .filter((range) => Boolean(range.startDate && range.endDate));

    if (targetDateRanges.length > 0) {
      const hasInvalidRangeOrder = targetDateRanges.some((range) => new Date(range.startDate) > new Date(range.endDate));
      if (hasInvalidRangeOrder) {
        const errorMsg = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (options?.dateType === 'compare_year') {
          const compareYearResult = await loadInvoiceSalesCompareYearMultiRangeData({
            dateRanges: targetDateRanges,
            compareYears: options?.compareYears,
            businessUnits: selectedBusinessUnits,
            invoiceSalesUrl
          });

          if (compareYearResult.success) {
            setAllData({ data: compareYearResult.data || [] });
            setError(null);
            if (onError) onError(null);
          } else {
            const errorMsg = compareYearResult.error || 'Failed to load compare year data';
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }

          return;
        }

        const rangeResponses = await Promise.all(
          targetDateRanges.map((range) =>
            loadRevenueData(
              accountHeader,
              range.startDate,
              range.endDate,
              selectedBusinessUnits,
              monthlyRevenueUrl,
              { requestYear: range.year }
            )
          )
        );

        const failedResponse = rangeResponses.find((response) => !response.success);
        if (failedResponse) {
          const errorMsg = failedResponse.error || 'Failed to load data';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          return;
        }

        const mergedData = rangeResponses.flatMap((response) => response?.data?.data || []);
        setAllData({ data: mergedData });
        setError(null);
        if (onError) onError(null);
      } catch (err) {
        const errorMessage = err.message || 'Failed to load data';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        setLoading(false);
      }

      return;
    }

    const targetStartDate = options.startDate || startDate;
    const targetEndDate = options.endDate || endDate;

    // Validate dates
    if (!targetStartDate || !targetEndDate) {
      const errorMsg = 'Mohon pilih tanggal mulai dan tanggal akhir';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    if (new Date(targetStartDate) > new Date(targetEndDate)) {
      const errorMsg = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const useInvoiceSalesRangeApi = options?.dateType === 'range';
      const targetSubBusinessUnits = normalizeSubBusinessUnits(options?.subBusinessUnits)
        .map((subBusinessUnit) => String(subBusinessUnit || '').trim())
        .filter(Boolean);
      const result = useInvoiceSalesRangeApi
        ? await loadInvoiceSalesRangeData(
            targetStartDate,
            targetEndDate,
            selectedBusinessUnits,
            invoiceSalesUrl,
            { subBusinessUnits: targetSubBusinessUnits }
          )
        : await loadRevenueData(
            accountHeader,
            targetStartDate,
            targetEndDate,
            selectedBusinessUnits,
            monthlyRevenueUrl
          );
      
      if (result.success) {
        setAllData(result.data);
        setError(null);
        if (onError) onError(null);
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
  }, [accountHeader, startDate, endDate, selectedBusinessUnits, monthlyRevenueUrl, invoiceSalesUrl]);

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
export async function loadYearSummary(
  availableYears,
  setYearSummary,
  setYearSummaryLoading,
  accountHeader = '4000.01.00',
  businessUnits = new Set(['Gosave', 'Goto']),
  monthlyRevenueUrl = DEFAULT_MONTHLY_REVENUE_URL
) {
  try {
    setYearSummaryLoading(true);
    
    // Load data for each year
    const summary = {};
    
    for (const year of availableYears) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const queryParams = buildMonthlyRevenueQueryParams(
        accountHeader,
        startDate,
        endDate,
        businessUnits
      );
      
      try {
        const response = await fetch(`${monthlyRevenueUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        
        const result = await response.json();
        
        if (response.ok && result.status === 'success' && Array.isArray(result.data)) {
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

