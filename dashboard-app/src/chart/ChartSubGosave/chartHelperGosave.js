import { processData } from '../ChartMonthly/chartHelpers';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const GOSAVE_SUB_BUSINESS_UNIT_OPTIONS = ['Gosave GT', 'Store', 'Gosave B2B'];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTH_SHORT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const SUB_BUSINESS_UNIT_ALIASES = {
  'gosave gt': 'Gosave GT',
  gt: 'Gosave GT',
  'gosave b2b': 'Gosave B2B',
  b2b: 'Gosave B2B',
  store: 'Store',
  'gosave store': 'Store',
  'gosave e-com': 'Gosave E-Com',
  'gosave ecom': 'Gosave E-Com',
  'gosave e-commerce': 'Gosave E-Com',
  'gosave ecommerce': 'Gosave E-Com',
  'e-com': 'Gosave E-Com',
  'e commerce': 'Gosave E-Com',
  'e-commerce': 'Gosave E-Com',
  ecommerce: 'Gosave E-Com'
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

const buildGosaveCompareYearQueryParams = ({
  startDate,
  endDate,
  compareYears,
  subBusinessUnit
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

  params.append('sub_business_units[]', normalizeGosaveSubBusinessUnit(subBusinessUnit));
  return params;
};

export const normalizeGosaveSubBusinessUnit = (subBusinessUnit) => {
  const rawValue = String(subBusinessUnit || '').trim();
  if (!rawValue) {
    return GOSAVE_SUB_BUSINESS_UNIT_OPTIONS[0];
  }

  const aliasKey = rawValue.toLowerCase();
  return SUB_BUSINESS_UNIT_ALIASES[aliasKey] || rawValue;
};

export const normalizeGosaveSubBusinessUnitOptions = (options) => {
  const sourceOptions = Array.isArray(options) ? options : [];
  const normalizedOptions = sourceOptions
    .map((option) => normalizeGosaveSubBusinessUnit(option))
    .filter(Boolean);

  const uniqueOptions = Array.from(new Set(normalizedOptions));
  if (uniqueOptions.length > 0) {
    return uniqueOptions;
  }

  return [...GOSAVE_SUB_BUSINESS_UNIT_OPTIONS];
};

export const buildGosaveMonthlyYearQueryParams = ({ year, subBusinessUnit }) => {
  const params = new URLSearchParams();
  params.append('date_type', 'year');
  params.append('years[]', String(year));
  params.append('sub_business_units[]', normalizeGosaveSubBusinessUnit(subBusinessUnit));
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
      mainBusinessUnit: 'Gosave'
    };
  });
};

const fetchYearlyInvoiceSalesData = async ({
  year,
  subBusinessUnit,
  invoiceSalesUrl
}) => {
  const params = buildGosaveMonthlyYearQueryParams({ year, subBusinessUnit });
  const response = await fetch(`${invoiceSalesUrl}?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
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

  return normalizeInvoiceRowsForChart(result?.data, year, subBusinessUnit);
};

export const loadGosaveMonthlyInvoiceSalesData = async ({
  years,
  subBusinessUnit,
  invoiceSalesUrl
}) => {
  const normalizedYears = normalizeYears(years);
  const normalizedSubBusinessUnit = normalizeGosaveSubBusinessUnit(subBusinessUnit);

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

const fetchGosaveCompareYearByRange = async ({
  range,
  rangeIndex,
  compareYears,
  subBusinessUnit,
  invoiceSalesUrl
}) => {
  const params = buildGosaveCompareYearQueryParams({
    startDate: range.startDate,
    endDate: range.endDate,
    compareYears,
    subBusinessUnit
  });

  if (!params) {
    throw new Error(`Range ${rangeIndex + 1} tidak valid untuk compare_year`);
  }

  const response = await fetch(`${invoiceSalesUrl}?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
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

  const aggregated = aggregateInvoiceRowsByRange(result?.data);
  const formattedRangeLabel = `${formatDateLabel(range.startDate)} - ${formatDateLabel(range.endDate)}`;
  const normalizedSubBusinessUnit = normalizeGosaveSubBusinessUnit(subBusinessUnit);
  return {
    id: `range-${rangeIndex + 1}`,
    label: formattedRangeLabel,
    rangeLabel: formattedRangeLabel,
    startDate: range.startDate,
    endDate: range.endDate,
    business_unit: normalizedSubBusinessUnit,
    sub_business_unit: normalizedSubBusinessUnit,
    mainBusinessUnit: 'Gosave',
    ...aggregated
  };
};

export const loadGosaveMultiRangeCompareYearData = async ({
  dateRanges,
  compareYears,
  subBusinessUnit,
  invoiceSalesUrl
}) => {
  const normalizedRanges = normalizeDateRanges(dateRanges);
  const normalizedSubBusinessUnit = normalizeGosaveSubBusinessUnit(subBusinessUnit);

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
        fetchGosaveCompareYearByRange({
          range,
          rangeIndex,
          compareYears,
          subBusinessUnit: normalizedSubBusinessUnit,
          invoiceSalesUrl
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
