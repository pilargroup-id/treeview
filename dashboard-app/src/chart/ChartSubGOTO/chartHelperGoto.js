import { processData } from '../ChartBU/chartHelpers';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

export const GOTO_SUB_BUSINESS_UNIT_OPTIONS = ['GOTO E-Com', 'GOTO GT', 'Store'];
const GOTO_BUSINESS_UNIT = 'Goto';
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_SHORT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const EMPTY_MONTHLY_SALES = Array.from({ length: 12 }, () => 0);

const SUB_BUSINESS_UNIT_ALIASES = {
  'goto e-com': 'GOTO E-Com',
  'goto ecom': 'GOTO E-Com',
  'goto e-commerce': 'GOTO E-Com',
  'goto ecommerce': 'GOTO E-Com',
  'e-com': 'GOTO E-Com',
  'e commerce': 'GOTO E-Com',
  'e-commerce': 'GOTO E-Com',
  ecommerce: 'GOTO E-Com',
  'goto gt': 'GOTO GT',
  gt: 'GOTO GT',
  store: 'Store',
  'goto store': 'Store'
};

const extractApiErrorMessage = (result, fallbackMessage = 'Gagal memuat data invoice sales') => {
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

const normalizeDateRanges = (dateRanges) => {
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

const buildCompareYears = ({ compareYears, fallbackStartDate, fallbackEndDate }) => {
  const normalizedCompareYears = normalizeYears(compareYears).sort((left, right) => left - right);
  if (normalizedCompareYears.length > 0) {
    return normalizedCompareYears;
  }

  const start = parseIsoDate(fallbackStartDate);
  const end = parseIsoDate(fallbackEndDate);
  if (!start || !end) {
    return [];
  }

  if (start.year === end.year) {
    return [start.year];
  }

  return [Math.min(start.year, end.year), Math.max(start.year, end.year)];
};

const toMonthDay = (isoDate) => {
  if (!ISO_DATE_PATTERN.test(String(isoDate || '').trim())) {
    return null;
  }

  return String(isoDate).slice(5, 10);
};

const formatDateLabel = (isoDate) => {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return isoDate;
  }

  const dayLabel = String(parsed.day).padStart(2, '0');
  const monthLabel = MONTH_SHORT_LABELS[parsed.month - 1] || String(parsed.month).padStart(2, '0');
  return `${dayLabel} ${monthLabel} ${parsed.year}`;
};

const resolveInvoiceMetrics = (item) => {
  const parsedCredit = Number.parseFloat(item?.total_credit);
  const parsedDebit = Number.parseFloat(item?.total_debit);
  const parsedDifference = Number.parseFloat(item?.total_difference);
  const parsedSales = Number.parseFloat(item?.total_sales);
  const parsedQuantity = Number.parseFloat(item?.total_quantity ?? item?.quantity);
  const parsedOrder = Number.parseFloat(item?.invoice_count ?? item?.order);

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
  const quantity = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
  const order = Number.isFinite(parsedOrder) ? parsedOrder : 0;

  return { credit, debit, total, quantity, order };
};

const aggregateInvoiceRowsByRange = (rows) => {
  const sourceRows = Array.isArray(rows) ? rows : [];
  return sourceRows.reduce((accumulator, item) => {
    const metrics = resolveInvoiceMetrics(item);
    accumulator.credit += metrics.credit;
    accumulator.debit += metrics.debit;
    accumulator.total += metrics.total;
    accumulator.quantity += metrics.quantity;
    accumulator.order += metrics.order;
    return accumulator;
  }, {
    credit: 0,
    debit: 0,
    total: 0,
    quantity: 0,
    order: 0
  });
};

const extractInvoiceSalesRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const buildGotoCompareYearQueryParams = ({
  startDate,
  endDate,
  compareYears,
  subBusinessUnit,
  businessUnit = 'Goto'
}) => {
  const compareStartMonthDay = toMonthDay(startDate);
  const compareEndMonthDay = toMonthDay(endDate);
  const resolvedYears = buildCompareYears({
    compareYears,
    fallbackStartDate: startDate,
    fallbackEndDate: endDate
  });

  if (!compareStartMonthDay || !compareEndMonthDay || resolvedYears.length === 0) {
    return null;
  }

  const params = new URLSearchParams();
  params.append('date_type', 'compare_year');
  params.append('compare_dates[]', compareStartMonthDay);
  params.append('compare_dates[]', compareEndMonthDay);

  resolvedYears.forEach((year) => {
    params.append('compare_years[]', String(year));
  });

  params.append('business_units[]', String(businessUnit || 'Goto'));
  params.append('channel[]', resolveGotoChannelForApi(subBusinessUnit));
  return params;
};

export const normalizeGotoSubBusinessUnit = (subBusinessUnit) => {
  const rawValue = String(subBusinessUnit || '').trim();
  if (!rawValue) {
    return GOTO_SUB_BUSINESS_UNIT_OPTIONS[0];
  }

  const aliasKey = rawValue.toLowerCase();
  return SUB_BUSINESS_UNIT_ALIASES[aliasKey] || rawValue;
};

const resolveGotoChannelForApi = (subBusinessUnit) => {
  return normalizeGotoSubBusinessUnit(subBusinessUnit);
};

export const normalizeGotoSubBusinessUnitOptions = (options) => {
  const sourceOptions = Array.isArray(options) ? options : [];
  const normalizedOptions = sourceOptions
    .map((option) => normalizeGotoSubBusinessUnit(option))
    .filter(Boolean);

  const uniqueOptions = Array.from(new Set(normalizedOptions));
  if (uniqueOptions.length > 0) {
    return uniqueOptions;
  }

  return [...GOTO_SUB_BUSINESS_UNIT_OPTIONS];
};

export const buildGotoMonthlyYearQueryParams = ({
  year,
  subBusinessUnit,
  businessUnit = 'Goto'
}) => {
  const params = new URLSearchParams();
  params.append('business_units[]', String(businessUnit || 'Goto'));
  params.append('channel[]', resolveGotoChannelForApi(subBusinessUnit));
  params.append('date_type', 'year');
  params.append('years[]', String(year));
  return params;
};

const buildGotoRangeQueryParams = ({
  startDate,
  endDate,
  subBusinessUnit,
  businessUnit = 'Goto'
}) => {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end.date < start.date) {
    return null;
  }

  const params = new URLSearchParams();
  params.append('business_units[]', String(businessUnit || 'Goto'));
  params.append('channel[]', resolveGotoChannelForApi(subBusinessUnit));
  params.append('date_type', 'range');
  params.append('start_date', start.iso);
  params.append('end_date', end.iso);
  return params;
};

const normalizeInvoiceRowsForChart = (rows, fallbackYear, subBusinessUnit) => {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const preparedRows = sourceRows.map((item) => ({
    ...item,
    year: item?.year ?? fallbackYear,
    business_unit: item?.business_unit || item?.businessUnit || subBusinessUnit,
    sub_business_unit: item?.sub_business_unit || item?.subBusinessUnit || subBusinessUnit
  }));

  return processData(preparedRows).map((item) => {
    const parsedYear = Number.parseInt(item?.year, 10);
    return {
      ...item,
      year: Number.isInteger(parsedYear) ? parsedYear : fallbackYear,
      business_unit: String(item?.business_unit || subBusinessUnit).trim(),
      sub_business_unit: String(item?.sub_business_unit || subBusinessUnit).trim(),
      mainBusinessUnit: 'Goto'
    };
  });
};

const resolveRowSubBusinessUnit = (item) => {
  const candidates = [
    item?.sub_business_unit,
    item?.subBusinessUnit,
    item?.channel,
    item?.business_unit,
    item?.businessUnit
  ];

  const firstNonEmpty = candidates.find((candidate) => String(candidate || '').trim() !== '');
  return normalizeGotoSubBusinessUnit(firstNonEmpty || '');
};

const resolveMonthIndex = (item) => {
  const parsedMonth = Number.parseInt(item?.month, 10);
  if (Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
    return parsedMonth - 1;
  }

  const periodValue = String(item?.period || '').trim();
  if (periodValue.length >= 7) {
    const parsedPeriodMonth = Number.parseInt(periodValue.slice(5, 7), 10);
    if (Number.isInteger(parsedPeriodMonth) && parsedPeriodMonth >= 1 && parsedPeriodMonth <= 12) {
      return parsedPeriodMonth - 1;
    }
  }

  return null;
};

export const loadGotoRangeInvoiceSalesData = async ({
  startDate,
  endDate,
  subBusinessUnit,
  invoiceSalesUrl,
  businessUnit = 'Goto'
}) => {
  if (!invoiceSalesUrl) {
    return {
      success: false,
      error: 'URL API invoice sales tidak tersedia'
    };
  }

  const normalizedSubBusinessUnit = normalizeGotoSubBusinessUnit(subBusinessUnit);
  const queryParams = buildGotoRangeQueryParams({
    startDate,
    endDate,
    subBusinessUnit: normalizedSubBusinessUnit,
    businessUnit
  });

  if (!queryParams) {
    return {
      success: false,
      error: 'Range tanggal tidak valid'
    };
  }

  try {
    const response = await fetchWithAuth(`${invoiceSalesUrl}?${queryParams.toString()}`, {
      method: 'GET',
    });

    let result = null;
    try {
      result = await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Response API tidak valid untuk range'
      };
    }

    if (!response.ok || result?.status !== 'success') {
      return {
        success: false,
        error: extractApiErrorMessage(result, 'Gagal memuat data range')
      };
    }

    const fallbackYear = parseIsoDate(startDate)?.year || new Date().getFullYear();
    const normalizedRows = (Array.isArray(result?.data) ? result.data : []).map((item) => ({
      ...item,
      business_unit: item?.business_unit || item?.businessUnit || businessUnit,
      sub_business_unit: item?.sub_business_unit || item?.subBusinessUnit || item?.channel || normalizedSubBusinessUnit
    }));
    const processedData = normalizeInvoiceRowsForChart(normalizedRows, fallbackYear, normalizedSubBusinessUnit).map((item) => ({
      ...item,
      business_unit: String(item?.business_unit || businessUnit).trim(),
      sub_business_unit: String(item?.sub_business_unit || normalizedSubBusinessUnit).trim(),
      channel: normalizedSubBusinessUnit,
      mainBusinessUnit: 'Goto'
    }));

    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Failed to load range invoice sales data'
    };
  }
};

const fetchYearlyInvoiceSalesData = async ({
  year,
  subBusinessUnit,
  invoiceSalesUrl
}) => {
  const params = buildGotoMonthlyYearQueryParams({ year, subBusinessUnit });
  const response = await fetchWithAuth(`${invoiceSalesUrl}?${params.toString()}`, {
    method: 'GET',
  });

  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error(`Response API tidak valid untuk tahun ${year}`);
  }

  if (!response.ok || result?.status !== 'success') {
    const fallbackMessage = `Gagal memuat data untuk tahun ${year}`;
    throw new Error(extractApiErrorMessage(result, fallbackMessage));
  }

  return normalizeInvoiceRowsForChart(extractInvoiceSalesRows(result?.data), year, subBusinessUnit);
};

export const loadGotoMonthlyInvoiceSalesData = async ({
  years,
  subBusinessUnit,
  invoiceSalesUrl
}) => {
  const normalizedYears = normalizeYears(years);
  const normalizedSubBusinessUnit = normalizeGotoSubBusinessUnit(subBusinessUnit);

  if (!invoiceSalesUrl) {
    return {
      success: false,
      error: 'URL API invoice sales tidak tersedia'
    };
  }

  if (normalizedYears.length === 0) {
    return {
      success: true,
      data: []
    };
  }

  try {
    const responses = await Promise.all(
      normalizedYears.map((year) =>
        fetchYearlyInvoiceSalesData({
          year,
          subBusinessUnit: normalizedSubBusinessUnit,
          invoiceSalesUrl
        })
      )
    );

    return {
      success: true,
      data: responses.flat()
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Failed to load invoice sales data'
    };
  }
};

const fetchGotoCompareYearByRange = async ({
  range,
  rangeIndex,
  compareYears,
  subBusinessUnit,
  invoiceSalesUrl,
  businessUnit = 'Goto'
}) => {
  const params = buildGotoCompareYearQueryParams({
    startDate: range.startDate,
    endDate: range.endDate,
    compareYears,
    subBusinessUnit,
    businessUnit
  });

  if (!params) {
    throw new Error(`Range ${rangeIndex + 1} tidak valid untuk compare_year`);
  }

  const response = await fetchWithAuth(`${invoiceSalesUrl}?${params.toString()}`, {
    method: 'GET',
  });

  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error(`Response API tidak valid untuk Range ${rangeIndex + 1}`);
  }

  if (!response.ok || result?.status !== 'success') {
    const fallbackMessage = `Gagal memuat data Range ${rangeIndex + 1}`;
    throw new Error(extractApiErrorMessage(result, fallbackMessage));
  }

  const sourceRows = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.data?.rows)
      ? result.data.rows
      : [];
  const aggregated = aggregateInvoiceRowsByRange(sourceRows);
  const normalizedBusinessUnit = String(businessUnit || 'Goto').trim() || 'Goto';
  const normalizedSubBusinessUnit = normalizeGotoSubBusinessUnit(subBusinessUnit);
  const formattedRangeLabel = `${formatDateLabel(range.startDate)} - ${formatDateLabel(range.endDate)}`;
  return {
    id: `range-${rangeIndex + 1}`,
    label: formattedRangeLabel,
    rangeLabel: formattedRangeLabel,
    startDate: range.startDate,
    endDate: range.endDate,
    business_unit: normalizedBusinessUnit,
    sub_business_unit: normalizedSubBusinessUnit,
    channel: normalizedSubBusinessUnit,
    mainBusinessUnit: 'Goto',
    ...aggregated
  };
};

export const loadGotoMultiRangeInvoiceSalesData = async ({
  dateRanges,
  compareYears,
  subBusinessUnit,
  invoiceSalesUrl,
  businessUnit = 'Goto'
}) => {
  const normalizedRanges = normalizeDateRanges(dateRanges);
  const normalizedSubBusinessUnit = normalizeGotoSubBusinessUnit(subBusinessUnit);

  if (!invoiceSalesUrl) {
    return {
      success: false,
      error: 'URL API invoice sales tidak tersedia'
    };
  }

  if (normalizedRanges.length === 0) {
    return {
      success: true,
      data: []
    };
  }

  try {
    const responses = await Promise.all(
      normalizedRanges.map((range, rangeIndex) =>
        fetchGotoCompareYearByRange({
          range,
          rangeIndex,
          compareYears,
          subBusinessUnit: normalizedSubBusinessUnit,
          invoiceSalesUrl,
          businessUnit
        })
      )
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

export const loadGotoYearSummary = async (
  availableYears,
  setYearSummary,
  setYearSummaryLoading,
  subBusinessUnit,
  invoiceSalesUrl
) => {
  try {
    setYearSummaryLoading(true);

    const normalizedYears = normalizeYears(availableYears);
    if (normalizedYears.length === 0) {
      setYearSummary({});
      return;
    }

    if (!invoiceSalesUrl) {
      setYearSummary(
        normalizedYears.reduce((accumulator, year) => {
          accumulator[year] = { sales: 0, quantity: 0, order: 0, monthlySales: [...EMPTY_MONTHLY_SALES] };
          return accumulator;
        }, {})
      );
      return;
    }

    const normalizedSubBusinessUnit = normalizeGotoSubBusinessUnit(subBusinessUnit);
    const allowedYears = new Set(normalizedYears);

    const aggregateRowsToSummary = (rows, targetSubBusinessUnit) => {
      const summary = normalizedYears.reduce((accumulator, year) => {
        accumulator[year] = { sales: 0, quantity: 0, order: 0, monthlySales: [...EMPTY_MONTHLY_SALES] };
        return accumulator;
      }, {});

      rows.forEach((item) => {
        const parsedYear = Number.parseInt(item?.year, 10);
        const periodYear = Number.parseInt(String(item?.period || '').slice(0, 4), 10);
        const resolvedYear = Number.isInteger(parsedYear)
          ? parsedYear
          : Number.isInteger(periodYear)
            ? periodYear
            : null;

        if (!Number.isInteger(resolvedYear) || !allowedYears.has(resolvedYear)) {
          return;
        }

        if (targetSubBusinessUnit) {
          const normalizedRowSubBusinessUnit = resolveRowSubBusinessUnit(item);
          if (normalizedRowSubBusinessUnit !== targetSubBusinessUnit) {
            return;
          }
        }

        const metrics = resolveInvoiceMetrics(item);
        const monthIndex = resolveMonthIndex(item);
        summary[resolvedYear].sales += metrics.total;
        summary[resolvedYear].quantity += metrics.quantity;
        summary[resolvedYear].order += metrics.order;
        if (monthIndex !== null) {
          summary[resolvedYear].monthlySales[monthIndex] += metrics.total;
        }
      });

      return summary;
    };

    const requestYearRows = async (includeChannelFilter) => {
      const params = new URLSearchParams();
      params.append('date_type', 'year');
      normalizedYears.forEach((year) => {
        params.append('years[]', String(year));
      });
      params.append('business_units[]', GOTO_BUSINESS_UNIT);

      if (includeChannelFilter) {
        params.append('channel[]', resolveGotoChannelForApi(normalizedSubBusinessUnit));
      }

      const response = await fetchWithAuth(`${invoiceSalesUrl}?${params.toString()}`, {
        method: 'GET',
      });

      let result = null;
      try {
        result = await response.json();
      } catch (error) {
        throw new Error('Response API tidak valid untuk ringkasan tahunan Goto');
      }

      if (!response.ok || result?.status !== 'success') {
        throw new Error(extractApiErrorMessage(result, 'Gagal memuat ringkasan tahunan Goto'));
      }

      return extractInvoiceSalesRows(result?.data);
    };

    const primaryRows = await requestYearRows(true);
    let summary = aggregateRowsToSummary(primaryRows, null);

    const hasAnyValue = normalizedYears.some((year) => {
      const yearSummary = summary[year] || { sales: 0, quantity: 0, order: 0 };
      return yearSummary.sales !== 0 || yearSummary.quantity !== 0 || yearSummary.order !== 0;
    });

    if (!hasAnyValue) {
      const fallbackRows = await requestYearRows(false);
      summary = aggregateRowsToSummary(fallbackRows, normalizedSubBusinessUnit);
    }

    setYearSummary(summary);
  } catch (error) {
    console.error('Error loading Goto year summary:', error);
    const normalizedYears = normalizeYears(availableYears);
    setYearSummary(
      normalizedYears.reduce((accumulator, year) => {
        accumulator[year] = { sales: 0, quantity: 0, order: 0, monthlySales: [...EMPTY_MONTHLY_SALES] };
        return accumulator;
      }, {})
    );
  } finally {
    setYearSummaryLoading(false);
  }
};

export const loadGotoMultiRangeCompareYearData = async (options = {}) => {
  return loadGotoMultiRangeInvoiceSalesData(options);
};
