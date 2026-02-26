import dayjs from 'dayjs';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH_REGEX = /^\d{4}-\d{2}$/;
const MONTH_DAY_REGEX = /^\d{2}-\d{2}$/;

const toNumericValue = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const parseIsoDate = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  const normalizedValue = rawValue.length >= 10 ? rawValue.slice(0, 10) : rawValue;
  if (!ISO_DATE_REGEX.test(normalizedValue)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = normalizedValue.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
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

  return dayjs(parsedDate);
};

const parseRangeDate = (year, monthDay) => {
  const numericYear = Number(year);
  const rawMonthDay = String(monthDay || '').trim();
  if (!Number.isInteger(numericYear) || !MONTH_DAY_REGEX.test(rawMonthDay)) {
    return null;
  }

  return parseIsoDate(`${numericYear}-${rawMonthDay}`);
};

const parseRangeBounds = (range) => {
  if (!range) {
    return null;
  }

  const startDate = parseRangeDate(range.year, range.start);
  const endDate = parseRangeDate(range.year, range.end);
  if (!startDate || !endDate || endDate.isBefore(startDate, 'day')) {
    return null;
  }

  return { startDate, endDate };
};

const accumulateChartValues = (targetMap, key, item) => {
  const previousValue = targetMap.get(key) || { credit: 0, debit: 0, total: 0 };
  targetMap.set(key, {
    credit: previousValue.credit + toNumericValue(item.credit),
    debit: previousValue.debit + toNumericValue(item.debit),
    total: previousValue.total + toNumericValue(item.total)
  });
};

const buildDailyTimeline = (startDate, endDate) => {
  const totalDays = endDate.diff(startDate, 'day');
  const timeline = [];

  for (let dayIndex = 0; dayIndex <= totalDays; dayIndex += 1) {
    const datePoint = startDate.add(dayIndex, 'day');
    timeline.push({
      key: datePoint.format('YYYY-MM-DD'),
      label: datePoint.format('DD MMM')
    });
  }

  return timeline;
};

const buildMonthTimeline = (startDate, endDate, monthShortNames) => {
  const timeline = [];
  let cursor = startDate.startOf('month');
  const endCursor = endDate.startOf('month');

  while (cursor.isBefore(endCursor) || cursor.isSame(endCursor, 'month')) {
    const monthIndex = cursor.month();
    const fallbackLabel = cursor.format('MMM');
    timeline.push({
      key: cursor.format('YYYY-MM'),
      label: monthShortNames?.[monthIndex] || fallbackLabel
    });
    cursor = cursor.add(1, 'month');
  }

  return timeline;
};

const extractPeriodDateKey = (item) => {
  const parsedDate = parseIsoDate(item?.period);
  if (!parsedDate) {
    return null;
  }

  return parsedDate.format('YYYY-MM-DD');
};

const extractPeriodMonthKey = (item) => {
  const rawPeriod = String(item?.period || '').trim();
  if (ISO_MONTH_REGEX.test(rawPeriod)) {
    return rawPeriod;
  }

  const parsedDate = parseIsoDate(rawPeriod);
  if (parsedDate) {
    return parsedDate.format('YYYY-MM');
  }

  const numericYear = Number(item?.year);
  const numericMonth = Number(item?.monthNumber || item?.month);
  if (
    Number.isInteger(numericYear) &&
    Number.isInteger(numericMonth) &&
    numericMonth >= 1 &&
    numericMonth <= 12
  ) {
    return `${numericYear}-${String(numericMonth).padStart(2, '0')}`;
  }

  return null;
};

const buildChartRowsFromTimeline = (timeline, valuesMap) => {
  return timeline.map((timelineItem) => {
    const values = valuesMap.get(timelineItem.key) || { credit: 0, debit: 0, total: 0 };
    return {
      xKey: timelineItem.key,
      xLabel: timelineItem.label,
      credit: values.credit,
      debit: values.debit,
      total: values.total
    };
  });
};

export const buildRangeChartModel = ({
  range,
  chartRows = [],
  monthShortNames = []
}) => {
  const bounds = parseRangeBounds(range);
  if (!bounds) {
    return null;
  }

  const { startDate, endDate } = bounds;
  const dailyTimeline = buildDailyTimeline(startDate, endDate);
  const dailyTimelineKeySet = new Set(dailyTimeline.map((item) => item.key));
  const dailyValues = new Map();

  (chartRows || []).forEach((item) => {
    const periodDateKey = extractPeriodDateKey(item);
    if (!periodDateKey || !dailyTimelineKeySet.has(periodDateKey)) {
      return;
    }

    accumulateChartValues(dailyValues, periodDateKey, item);
  });

  const hasDailyPeriodData = dailyValues.size > 0;
  const hasAnyRows = Array.isArray(chartRows) && chartRows.length > 0;

  // For an empty range result, keep date-based axis so the x-axis still follows selected dates.
  if (hasDailyPeriodData || !hasAnyRows) {
    const chartData = buildChartRowsFromTimeline(dailyTimeline, dailyValues);
    return {
      axisLabel: 'Tanggal',
      labels: dailyTimeline.map((item) => item.label),
      data: chartData
    };
  }

  const monthTimeline = buildMonthTimeline(startDate, endDate, monthShortNames);
  const monthTimelineKeySet = new Set(monthTimeline.map((item) => item.key));
  const monthlyValues = new Map();

  (chartRows || []).forEach((item) => {
    const periodMonthKey = extractPeriodMonthKey(item);
    if (!periodMonthKey || !monthTimelineKeySet.has(periodMonthKey)) {
      return;
    }

    accumulateChartValues(monthlyValues, periodMonthKey, item);
  });

  const chartData = buildChartRowsFromTimeline(monthTimeline, monthlyValues);
  return {
    axisLabel: 'Bulan',
    labels: monthTimeline.map((item) => item.label),
    data: chartData
  };
};
