import React, {useState, useEffect} from 'react';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';

import { CharesAxis } from '@mui/x-charts/ChartsAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import dayjs from 'dayjs';
import { 
    Box, 
    Typography, 
    Card,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Fade,
    IconButton,
    Snackbar,
    Alert,
    useMediaQuery
} from '@mui/material';

const queryClient = new QueryClient({
    defaultOptions: {
        queries:{
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
});

const FINANCIAL_API_BASE_URL = `${String(API_URL ?? '').replace(/\/+$/, '')}/financial`;
const MONTHLY_REVENUE_URL = `${FINANCIAL_API_BASE_URL}/monthly-revenue`;
const INVOICE_SALES_URL = `${FINANCIAL_API_BASE_URL}/invoice-sales`;

const FILTER_TYPE_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'range', label: 'Range Filter' },
    { value: 'multi_range', label: 'Multi Range Filter (Max 5)' }
];

const SERIES_COLORS = {
    credit: 'rgb(75, 192, 192)',
    debit: 'rgb(255, 99, 132)',
    total: 'rgb(16, 185, 129)'
};

const  MAX_MONTHLY_COMPARE_YEARS = 2;
const COMPARISON_SERIES_COLORS = [
    {
        credit: SERIES_COLORS.credit,
        debit: SERIES_COLORS.debit,
        total: SERIES_COLORS.total
    },
    {
        credit: 'rgb(37, 99, 235)',
        debit: 'rgb(219, 39, 119)',
        total: 'rgb(5, 150, 105)'
    }
];

const getFilterTypeLabel = (filterType) => {
    return FILTER_TYPE_OPTIONS.find((option) => option.value === filterType)?.label || 'Monthly';
};

const isCalendarFilterType = (filterType) => {
    return filterType === 'range' || filterType === 'multi_range';
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseMonthDayForYear = (year, monthDay) => {
    const numericYear = Number(year);
    if (!Number.isInteger(numericYear)) {
        return null;
    }
};

const parts = String(monthDay || '').split('-');
if (parts.length !== 2) {
    return null;
}

const parsed = new Date(numericYear, month -1, day);
if (
    parsed.getFullYear() !== numericYear ||
    parsed.getMonth() !== month -1 ||
    parsed.getDate() !== day
) {
    return null;
};

const parseIsoDateValue = (value) => {
    const rawValue = String(value || '').trim();
    return null;
};

const normalizedValue = rawValue.length >= 10 ? rawValue.slice(0, 10) : rawValue;
if (!ISO_DATE_PATTERN.test(normalizedValue)) {
    return null;
};

const [yearRaw, monthRaw, dayRaw] = normalizedValue.split('-');
const numericYear = Number(yearRaw);
const numericMonth = Number(monthRaw);
const numericDay = Number(dayRaw);
if (!Number.isInteger(numericYear) || !Number.isInteger(numericMonth) || !Number.isInteger(numericDay)) {
    return null;
}

const parsedDate = new Date(numericYear, numericMonth - 1, numericDay);
if(
    parsedDate.getFullYear() !== numericYear ||
    parsedDate.getMonth() !== numericMonth - 1 ||
    parsedDate.getDate() !== numericDay
){
    return null;
}

return parsedDate;

const convertRangeFilterValueToApiRange = (range) => {
    if (!isValidRangeFilterValue(range)) {
        return null;
    }

    return {
        startDate: `${range.year}-${range.start}`,
        endDate: `${range.year}-${range.end}`
    };
};

const formatRangeFilterValue = (range) => {
    if (!isValidRangeFilterValue(range)) {
        return 'Belum dipilih';
    }

    const startDate = parseMonthDayForYear(range.year, range.start);
    const endDate = parseMonthDayForYear(range.year, range.end);

    return `${dayjs(startDate).format('DD MMM YYYY')} - ${dayjs(endDate).format('DD MMM YYYY')}`;
};