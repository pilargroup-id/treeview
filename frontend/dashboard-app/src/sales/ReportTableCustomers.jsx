import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { isValid, parseISO } from 'date-fns';
import { w2grid, w2ui, w2utils } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import dummyMonthly from './dummyMonthly.json';

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

const GRID_NAME = 'reportCustomersGrid';
const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
};

const TOOLBAR_ICONS = {
  wilayah: 'tv-w2-icon tv-w2-icon-wilayah',
  month: 'tv-w2-icon tv-w2-icon-month',
  year: 'tv-w2-icon tv-w2-icon-year',
  reset: 'tv-w2-icon tv-w2-icon-reset',
};

function getWeekIndexInMonth(date) {
  const day = date.getDate();
  if (day <= 7) return 0;
  if (day <= 14) return 1;
  if (day <= 21) return 2;
  return 3;
}

function getDefaultMonthSelection() {
  const currentMonthIndex = new Date().getMonth();
  const prevMonthIndex = (currentMonthIndex + 11) % 12;
  const nextMonthIndex = (currentMonthIndex + 1) % 12;
  return [prevMonthIndex, currentMonthIndex, nextMonthIndex];
}

function buildColumnGroups(visibleMonths) {
  return [{ text: '', span: 2 }].concat(
    visibleMonths.map((monthIndex) => ({
      text: MONTH_LABELS[monthIndex] ?? '-',
      span: WEEK_COLUMNS.length,
    })),
  );
}

function buildColumns(visibleMonths) {
  const base = [
    { field: 'wilayah', text: 'Wilayah', size: '160px', sortable: true, resizable: true },
    { field: 'customer', text: 'Customer', size: '40%', sortable: true, resizable: true },
  ];

  const weekCols = visibleMonths.flatMap((monthIndex) =>
    WEEK_COLUMNS.map((label, weekIndex) => ({
      field: `m${monthIndex}_w${weekIndex}`,
      text: label,
      size: '90px',
      sortable: false,
      resizable: true,
      attr: 'align=center',
    })),
  );

  return base.concat(weekCols);
}

export default function DataTableMonthly() {
  const gridBoxRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const queryInputRef = React.useRef(null);

  const [filters, setFilters] = React.useState(() => ({
    query: '',
    wilayah: 'ALL',
    year: new Date().getFullYear(),
    months: getDefaultMonthSelection(),
  }));

  const rows = React.useMemo(() => {
    return (Array.isArray(dummyMonthly) ? dummyMonthly : []).map((item, index) => ({
      ...(() => {
        const planDateRaw = item?.plan_date ?? null;
        if (!planDateRaw) {
          return { planMonth: null, planYear: null, planWeek: null, planDay: null };
        }

        const parsed = parseISO(String(planDateRaw));
        if (!isValid(parsed)) {
          return { planMonth: null, planYear: null, planWeek: null, planDay: null };
        }

        return {
          planMonth: parsed.getMonth(),
          planYear: parsed.getFullYear(),
          planWeek: getWeekIndexInMonth(parsed),
          planDay: String(parsed.getDate()).padStart(2, '0'),
        };
      })(),
      id: index + 1,
      wilayah: item?.state ?? '-',
      customer: item?.customer_name ?? '-',
      planDate: item?.plan_date ?? null,
    }));
  }, []);

  const stateOptions = React.useMemo(() => {
    const unique = new Set();
    for (const row of rows) {
      if (row.wilayah && row.wilayah !== '-') unique.add(row.wilayah);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const yearOptions = React.useMemo(() => {
    const unique = new Set();

    for (const row of rows) {
      if (row.planYear == null) continue;
      unique.add(row.planYear);
    }

    return Array.from(unique).sort((a, b) => b - a);
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase();

    return rows.filter((row) => {
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) return false;

      if (filters.year !== 'ALL') {
        if (row.planYear == null) return false;
        if (row.planYear !== Number(filters.year)) return false;
      }

      if (!normalizedQuery) return true;

      const haystack = `${row.wilayah} ${row.customer}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, filters]);

  const visibleMonths = React.useMemo(() => {
    const unique = Array.from(new Set(filters.months))
      .map((m) => Number(m))
      .filter((m) => Number.isInteger(m) && m >= 0 && m <= 11)
      .sort((a, b) => a - b);

    if (unique.length === 0) return [new Date().getMonth()];
    return unique.slice(0, 3);
  }, [filters.months]);

  React.useEffect(() => {
    if (!gridBoxRef.current) return;

    if (w2ui[GRID_NAME]) {
      w2ui[GRID_NAME].destroy();
    }

    const initialVisibleMonths = Array.from(new Set(getDefaultMonthSelection()))
      .map((m) => Number(m))
      .filter((m) => Number.isInteger(m) && m >= 0 && m <= 11)
      .sort((a, b) => a - b)
      .slice(0, 3);

    gridRef.current = new w2grid({
      name: GRID_NAME,
      box: gridBoxRef.current,
      show: {
        footer: true,
        toolbar: true,
        toolbarSearch: false,
        toolbarColumns: true,
        toolbarReload: false,
        lineNumbers: true,
      },
      sortData: [{ field: 'wilayah', direction: 'asc' }],
      columnGroups: buildColumnGroups(initialVisibleMonths),
      columns: buildColumns(initialVisibleMonths),
      records: [],
    });

    const grid = gridRef.current;
    if (grid?.toolbar) {
      grid.toolbar.add([
        {
          type: 'html',
          id: 'tbQuery',
          html: `
            <div class="tv-sales-toolbar-search" title="Cari wilayah / customer...">
              <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
              <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari wilayah / customer..." />
            </div>
          `,
        },
        { type: 'break', id: 'tbBreak1' },
        {
          type: 'menu-check',
          id: 'tbMonth',
          icon: TOOLBAR_ICONS.month,
          text: 'Bulan: -',
          items: MONTH_LABELS.map((label, monthIndex) => ({ id: monthIndex, text: label, checked: false })),
        },
        {
          type: 'menu-radio',
          id: 'tbYear',
          icon: TOOLBAR_ICONS.year,
          text: 'Tahun: -',
          selected: 'ALL',
          items: [{ id: 'ALL', text: 'Semua', checked: true }],
        },
        {
          type: 'menu-radio',
          id: 'tbState',
          icon: TOOLBAR_ICONS.wilayah,
          text: 'Wilayah: Semua',
          selected: 'ALL',
          items: [{ id: 'ALL', text: 'Semua', checked: true }],
        },
        { type: 'spacer', id: 'tbSpacer1' },
        { type: 'button', id: 'tbReset', icon: TOOLBAR_ICONS.reset, text: 'Reset' },
      ]);

      grid.toolbar.on('click', (event) => {
        const target = String(event.target ?? '');
        if (!target) return;

        if (target === 'tbReset') {
          setFilters({
            query: '',
            wilayah: 'ALL',
            year: new Date().getFullYear(),
            months: getDefaultMonthSelection(),
          });
          const input = document.getElementById(`${GRID_NAME}__query`);
          if (input) input.value = '';
          return;
        }

        if (!target.includes(':')) return;
        const [parentId, subIdRaw] = target.split(':');
        const subId = subIdRaw ?? '';

        if (parentId === 'tbState') {
          setFilters((prev) => ({ ...prev, wilayah: subId === 'ALL' ? 'ALL' : subId }));
        } else if (parentId === 'tbYear') {
          setFilters((prev) => ({ ...prev, year: subId === 'ALL' ? 'ALL' : Number(subId) }));
        } else if (parentId === 'tbMonth') {
          const monthIndex = Number(subId);
          if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return;

          setFilters((prev) => {
            const current = Array.from(new Set(Array.isArray(prev.months) ? prev.months : []))
              .map((m) => Number(m))
              .filter((m) => Number.isInteger(m) && m >= 0 && m <= 11);

            const exists = current.includes(monthIndex);
            let next = exists ? current.filter((m) => m !== monthIndex) : current.concat(monthIndex);
            next = Array.from(new Set(next)).sort((a, b) => a - b);

            if (next.length === 0) next = [new Date().getMonth()];
            if (!exists && next.length > 3) return prev;

            return { ...prev, months: next.slice(0, 3) };
          });
        }
      });

      setTimeout(() => {
        const input = document.getElementById(`${GRID_NAME}__query`);
        if (!input) return;

        const handler = (e) => {
          setFilters((prev) => ({ ...prev, query: e.target.value }));
        };

        input.addEventListener('input', handler);
        queryInputRef.current = { el: input, handler };
      }, 0);
    }

    const handleResize = () => {
      const grid = gridRef.current ?? w2ui[GRID_NAME];
      if (grid) grid.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (queryInputRef.current?.el && queryInputRef.current?.handler) {
        queryInputRef.current.el.removeEventListener('input', queryInputRef.current.handler);
      }
      queryInputRef.current = null;
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      gridRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const nextGroups = buildColumnGroups(visibleMonths);
    const nextColumns = buildColumns(visibleMonths);

    grid.columnGroups = nextGroups;
    grid.columns = nextColumns.map((col) => w2utils.extend({}, grid.colTemplate, col));
    grid.refresh();
    grid.resize();
  }, [visibleMonths]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const selectedSet = new Set(visibleMonths);
    const records = filteredRows.map((row) => {
      const record = {
        recid: row.id,
        wilayah: row.wilayah,
        customer: row.customer,
      };

      for (const monthIndex of selectedSet) {
        for (let weekIndex = 0; weekIndex < WEEK_COLUMNS.length; weekIndex += 1) {
          const field = `m${monthIndex}_w${weekIndex}`;
          const match = row.planMonth === monthIndex && row.planWeek === weekIndex;
          record[field] = match ? row.planDay ?? '-' : '-';
        }
      }

      return record;
    });

    grid.clear();
    grid.add(records);
    grid.refresh();
  }, [filteredRows, visibleMonths]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid?.toolbar) return;

    const selectedMonths = Array.from(new Set(visibleMonths)).sort((a, b) => a - b);
    const monthLabel =
      selectedMonths.length === 0 ? '-' : selectedMonths.map((m) => MONTH_LABELS[m] ?? String(m)).join(', ');

    const monthItems = MONTH_LABELS.map((label, monthIndex) => {
      const checked = selectedMonths.includes(monthIndex);
      const disabled = !checked && selectedMonths.length >= 3;
      return { id: monthIndex, text: label, checked, disabled };
    });

    const yearItems = [{ id: 'ALL', text: 'Semua', checked: filters.year === 'ALL' }].concat(
      yearOptions.map((year) => ({ id: year, text: String(year), checked: Number(filters.year) === year })),
    );

    const stateItems = [{ id: 'ALL', text: 'Semua', checked: filters.wilayah === 'ALL' }].concat(
      stateOptions.map((opt) => ({ id: opt, text: opt, checked: filters.wilayah === opt })),
    );

    const tbMonth = grid.toolbar.get('tbMonth');
    if (tbMonth) {
      tbMonth.items = monthItems;
      tbMonth.text = `Bulan: ${monthLabel}`;
      grid.toolbar.refresh('tbMonth');
    }

    const yearLabel = filters.year === 'ALL' ? 'Semua' : String(filters.year);
    const tbYear = grid.toolbar.get('tbYear');
    if (tbYear) {
      tbYear.items = yearItems;
      tbYear.selected = filters.year;
      tbYear.text = `Tahun: ${yearLabel}`;
      grid.toolbar.refresh('tbYear');
    }

    const stateLabel = filters.wilayah === 'ALL' ? 'Semua' : String(filters.wilayah);
    const tbState = grid.toolbar.get('tbState');
    if (tbState) {
      tbState.items = stateItems;
      tbState.selected = filters.wilayah;
      tbState.text = `Wilayah: ${stateLabel}`;
      grid.toolbar.refresh('tbState');
    }
  }, [filters.year, filters.wilayah, visibleMonths, stateOptions, yearOptions]);

  return (
    <Box sx={{ width: '100%' }}>
      <style>
        {`
          .tv-sales-toolbar-search {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 30px;
            padding: 0 6px;
            white-space: nowrap;
            transform: translateY(-2px);
          }
          .tv-sales-toolbar-search__icon {
            display: inline-flex;
            align-items: center;
            line-height: 1;
          }
          .tv-sales-toolbar-search__icon svg {
            display: block;
            width: 14px;
            height: 14px;
            color: #8d99a7;
          }
          .tv-sales-toolbar-search__input {
            height: 26px;
            line-height: 26px;
            padding: 0 8px;
            width: min(280px, 42vw);
            box-sizing: border-box;
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon {
            background-color: #8d99a7;
            -webkit-mask-position: center;
            -webkit-mask-repeat: no-repeat;
            -webkit-mask-size: 14px 14px;
            mask-position: center;
            mask-repeat: no-repeat;
            mask-size: 14px 14px;
          }
          .w2ui-toolbar .w2ui-tb-button.over .w2ui-tb-icon.tv-w2-icon,
          .w2ui-toolbar .w2ui-tb-button.checked .w2ui-tb-icon.tv-w2-icon {
            background-color: #5b6775;
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-wilayah {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-month {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M7%202h2v2h6V2h2v2h3v18H4V4h3V2Zm13%208H6v10h14V10Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M7%202h2v2h6V2h2v2h3v18H4V4h3V2Zm13%208H6v10h14V10Z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-year {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M7%202h2v2h6V2h2v2h3v18H4V4h3V2Zm13%206H6v12h14V8Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M7%202h2v2h6V2h2v2h3v18H4V4h3V2Zm13%206H6v12h14V8Z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-reset {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%206V3l-4%204l4%204V8a4%204%200%201%201-4%204H6a6%206%200%201%200%206-6Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%206V3l-4%204l4%204V8a4%204%200%201%201-4%204H6a6%206%200%201%200%206-6Z'%2F%3E%3C%2Fsvg%3E");
          }
        `}
      </style>
      <Paper sx={{ width: '100%', height: 560, overflow: 'hidden' }}>
        <Box ref={gridBoxRef} sx={{ width: '100%', height: '100%' }} />
      </Paper>
    </Box>
  );
}
