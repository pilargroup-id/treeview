import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';


const WEEK_COLUMNS = ['Week1', 'Week2', 'Week3', 'Week4'];
const MONTH_LABELS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const GRID_NAME = 'reportTable';
const LAYOUT_NAME = 'reportLayout';
const EN_MONTH = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',]

    function monthName(monthNameRaw) {
        const monthName = String(monthNameRaw ?? '').trim();
        if (!monthName) = String(monthNameRaw ?? '').trim();

        const idx = EN_MONTH.findIndex((m) => m.toLowercaes)
    }