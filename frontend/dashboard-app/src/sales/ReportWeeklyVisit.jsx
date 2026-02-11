import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import { createRoot } from 'react-dom/client';
import { w2grid, w2layout, w2ui, w2utils } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import { API_URL } from '../config/api';
import SummaryCustomer from './SummaryWeeklyVisit';

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
const LAYOUT_NAME = 'reportCustomersLayout';
const EN_MONTH_NAMES = [
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
  'November',
  'December',
];
const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
  wilayah: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5"/>
    </svg>
  `,
  sales: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/>
    </svg>
  `,
  reset: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 2.97-2.17 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93 0-4.42-3.58-8-8-8m-6 8c0-1.65.67-3.15 1.76-4.24L6.34 7.34C4.9 8.79 4 10.79 4 13c0 4.08 3.05 7.44 7 7.93v-2.02c-2.83-.48-5-2.94-5-5.91"/>
    </svg>
  `,
};

const TOOLBAR_ICONS = {
  wilayah: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.wilayah}</span>`,
  sales: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.sales}</span>`,
  // Rendered via React (see mountToolbarReactIcons)
  month: '<span class="tv-w2ui-svg tv-w2ui-react-icon tv-w2ui-svg--compact" data-tv-icon="month" aria-hidden="true"></span>',
  year: '<span class="tv-w2ui-svg tv-w2ui-react-icon tv-w2ui-svg--compact" data-tv-icon="year" aria-hidden="true"></span>',
  reset: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.reset}</span>`,
};

function monthNameToIndex(monthNameRaw) {
  const monthName = String(monthNameRaw ?? '').trim();
  if (!monthName) return null;

  const idx = EN_MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
  if (idx >= 0) return idx;

  const parsed = new Date(`${monthName} 1, 2000`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getMonth();
}

function getDefaultMonthSelection() {
  const currentMonthIndex = new Date().getMonth();
  const prevMonthIndex = (currentMonthIndex + 11) % 12;
  const nextMonthIndex = (currentMonthIndex + 1) % 12;
  return [prevMonthIndex, currentMonthIndex, nextMonthIndex];
}

function toFiniteNumberOrNull(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function mergeWeek4(week4, week5, week6) {
  const n4 = toFiniteNumberOrNull(week4);
  const n5 = toFiniteNumberOrNull(week5);
  const n6 = toFiniteNumberOrNull(week6);

  if (n4 == null && n5 == null && n6 == null) return null;
  return (n4 ?? 0) + (n5 ?? 0) + (n6 ?? 0);
}

function buildColumnGroups(visibleMonths) {
  return [{ text: '', span: 3 }].concat(
    visibleMonths.map((monthIndex) => ({
      text: MONTH_LABELS[monthIndex] ?? '-',
      span: WEEK_COLUMNS.length,
    })),
  );
}

function buildColumns(visibleMonths) {
  const base = [
    {
      field: 'sales_name',
      text: 'Sales',
      size: '180px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap;"',
    },
    {
      field: 'wilayah',
      text: 'Wilayah',
      size: '140px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap;"',
    },
    {
      field: 'customer',
      text: 'Customer',
      size: '420px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
    },
  ];

  const weekCols = visibleMonths.flatMap((monthIndex) =>
    WEEK_COLUMNS.map((label, weekIndex) => ({
      field: `m${monthIndex}_w${weekIndex}`,
      text: label,
      size: '72px',
      sortable: false,
      resizable: true,
      attr: 'align=right class=tv-week-cell style="white-space:nowrap;"',
    })),
  );

  return base.concat(weekCols);
}

export default function DataTableMonthly() {
  const layoutBoxRef = React.useRef(null);
  const lockBoxRef = React.useRef(null);
  const layoutRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const queryInputRef = React.useRef(null);
  const toolbarIconRootsRef = React.useRef(new Map());
  const summaryRootRef = React.useRef(null);
  const activeMainTabRef = React.useRef('data');
  const latestFilteredRowsRef = React.useRef([]);
  const latestVisibleMonthsRef = React.useRef([]);
  const abortRef = React.useRef(null);
  const requestIdRef = React.useRef(0);
  const [gridReadyTick, setGridReadyTick] = React.useState(0);
  const [activeMainTab, setActiveMainTab] = React.useState('data');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [filters, setFilters] = React.useState(() => ({
    query: '',
    wilayah: 'ALL',
    sales: 'ALL',
    year: new Date().getFullYear(),
    months: getDefaultMonthSelection(),
  }));

  const [summaryData, setSummaryData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

  const visibleMonths = React.useMemo(() => {
    const unique = Array.from(new Set(filters.months))
      .map((m) => Number(m))
      .filter((m) => Number.isInteger(m) && m >= 0 && m <= 11)
      .sort((a, b) => a - b);

    if (unique.length === 0) return [new Date().getMonth()];
    return unique.slice(0, 3);
  }, [filters.months]);

  const mountToolbarReactIcons = React.useCallback(() => {
    const gridEl = document.getElementById(`grid_${GRID_NAME}`);
    if (!gridEl) return;

    // Prune unmounted hosts to avoid leaking roots
    for (const [hostEl, root] of toolbarIconRootsRef.current.entries()) {
      if (!hostEl.isConnected) {
        root.unmount();
        toolbarIconRootsRef.current.delete(hostEl);
      }
    }

    const iconHosts = gridEl.querySelectorAll('.tv-w2ui-react-icon[data-tv-icon]');
    iconHosts.forEach((hostEl) => {
      const iconKey = hostEl.getAttribute('data-tv-icon');
      const IconComponent = iconKey === 'month' ? CalendarMonthIcon : iconKey === 'year' ? EventIcon : null;
      if (!IconComponent) return;

      let root = toolbarIconRootsRef.current.get(hostEl);
      if (!root) {
        root = createRoot(hostEl);
        toolbarIconRootsRef.current.set(hostEl, root);
      }

      root.render(<IconComponent />);
    });
  }, []);

  React.useEffect(() => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    const year = Number(filters.year);
    const yearIsValid = Number.isInteger(year);

    if (filters.wilayah && filters.wilayah !== 'ALL') {
      params.set('state', String(filters.wilayah));
    }

    if (yearIsValid) {
      params.set('year', String(year));
      for (const monthIndex of visibleMonths) {
        params.append('months[]', String(monthIndex + 1));
      }
    }

    const url = `${API_URL}/activity-plans/weekly-summary?${params.toString()}`;

    setIsLoading(true);
    setLoadError(null);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          const message = body?.message || `Request failed (${response.status})`;
          throw new Error(message);
        }
        return body;
      })
      .then((body) => {
        if (requestIdRef.current !== nextRequestId) return;

        if (body?.success !== true || !Array.isArray(body?.data)) {
          throw new Error(body?.message || 'Invalid response from server');
        }

        setSummaryData(body.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load weekly summary:', err);
        if (requestIdRef.current !== nextRequestId) return;
        setSummaryData([]);
        setLoadError(err?.message || 'Failed to load data');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== nextRequestId) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [filters.year, filters.wilayah, visibleMonths]);

  React.useEffect(() => {
    const lockTarget = lockBoxRef.current;
    if (!lockTarget) return;

    if (isLoading && !loadError) {
      w2utils.lock(lockTarget, 'Loading...', true);
    } else {
      w2utils.unlock(lockTarget);
    }

    return () => w2utils.unlock(lockTarget);
  }, [isLoading, loadError]);

  const rows = React.useMemo(() => {
    return (Array.isArray(summaryData) ? summaryData : []).map((item, index) => {
      const monthsByIndex = {};
      const years = new Set();

      const months = Array.isArray(item?.months) ? item.months : [];
      for (const m of months) {
        const monthIndex = monthNameToIndex(m?.month_name);
        if (monthIndex == null) continue;
        const year = Number(m?.year);
        if (Number.isInteger(year)) years.add(year);
        monthsByIndex[monthIndex] = {
          year,
          week1: m?.week1 ?? null,
          week2: m?.week2 ?? null,
          week3: m?.week3 ?? null,
          week4: mergeWeek4(m?.week4 ?? null, m?.week5 ?? null, m?.week6 ?? null),
        };
      }

      return {
        id: index + 1,
        wilayah: item?.wilayah ?? '-',
        sales_name: item?.sales_name ?? '-',
        customer: String(item?.customer ?? item?.customer_name ?? '').trim() || '-',
        monthsByIndex,
        years,
      };
    });
  }, [summaryData]);

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
      for (const y of row.years) unique.add(y);
    }

    return Array.from(unique).sort((a, b) => b - a);
  }, [rows]);

  const salesOptions = React.useMemo(() => {
    const unique = new Set();
    for (const row of rows) {
      const value = String(row?.sales_name ?? '').trim();
      if (value && value !== '-') unique.add(value);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase();

    return rows.filter((row) => {
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) return false;
      if (filters.sales !== 'ALL' && row.sales_name !== filters.sales) return false;

      const filterYear = Number(filters.year);
      if (Number.isInteger(filterYear) && row.years.size > 0 && !row.years.has(filterYear)) return false;

      if (!normalizedQuery) return true;

      const haystack = `${row.wilayah} ${row.sales_name} ${row.customer}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, filters]);

  React.useEffect(() => {
    latestFilteredRowsRef.current = filteredRows;
  }, [filteredRows]);

  React.useEffect(() => {
    latestVisibleMonthsRef.current = visibleMonths;
  }, [visibleMonths]);

  const MAIN_DATA_ID = `${LAYOUT_NAME}__tab_data`;
  const MAIN_SUMMARY_ID = `${LAYOUT_NAME}__tab_summary`;

  const renderSummaryTab = React.useCallback(() => {
    const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
    if (!summaryEl) return;

    const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];
    const months = Array.isArray(latestVisibleMonthsRef.current) ? latestVisibleMonthsRef.current : [];

    if (!summaryRootRef.current) {
      summaryRootRef.current = createRoot(summaryEl);
    }

    summaryRootRef.current.render(
      <SummaryCustomer
        rows={currentRows}
        visibleMonths={months}
        monthLabels={MONTH_LABELS}
        isLoading={isLoading}
        loadError={loadError}
      />,
    );
  }, [MAIN_SUMMARY_ID, isLoading, loadError]);

  const setMainTab = React.useCallback(
    (nextTabId) => {
      const tabId = String(nextTabId || 'data');
      if (activeMainTabRef.current === tabId) return;
      activeMainTabRef.current = tabId;
      setActiveMainTab(tabId);

      const dataEl = document.getElementById(MAIN_DATA_ID);
      const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
      if (!dataEl || !summaryEl) return;

      dataEl.style.display = tabId === 'data' ? 'block' : 'none';
      summaryEl.style.display = tabId === 'summary' ? 'block' : 'none';

      if (tabId === 'summary') renderSummaryTab();

      if (tabId === 'data') {
        setTimeout(() => {
          const grid = gridRef.current ?? w2ui[GRID_NAME];
          grid?.resize?.();
          grid?.refresh?.();
        }, 0);
      }
    },
    [renderSummaryTab, MAIN_DATA_ID, MAIN_SUMMARY_ID],
  );

  React.useEffect(() => {
    if (!layoutBoxRef.current) return;
    let disposed = false;
    let initialMountTimeoutId = null;

    summaryRootRef.current?.unmount?.();
    summaryRootRef.current = null;

    if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
    if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();

    activeMainTabRef.current = 'data';
    setActiveMainTab('data');

    layoutRef.current = new w2layout({
      box: layoutBoxRef.current,
      name: LAYOUT_NAME,
      panels: [
        {
          type: 'main',
          style: 'border: 1px solid #efefef; padding: 0',
          html: `
            <div style="height:100%; display:flex; flex-direction:column;">
              <div id="${MAIN_DATA_ID}" style="flex:1; min-height:0;"></div>
              <div id="${MAIN_SUMMARY_ID}" style="flex:1; min-height:0; display:none; overflow:auto; padding:20px;"></div>
            </div>
          `,
          tabs: {
            active: 'data',
            tabs: [
              { id: 'data', text: 'Data' },
              { id: 'summary', text: 'Summary' },
            ],
            onClick(event) {
              setMainTab(String(event.target));
            },
          },
        },
      ],
    });

    initialMountTimeoutId = setTimeout(() => {
      if (disposed) return;
      const dataHost = document.getElementById(MAIN_DATA_ID);
      if (!dataHost) return;

      const initialVisibleMonths = Array.from(new Set(getDefaultMonthSelection()))
        .map((m) => Number(m))
        .filter((m) => Number.isInteger(m) && m >= 0 && m <= 11)
        .sort((a, b) => a - b)
        .slice(0, 3);

      gridRef.current = new w2grid({
        name: GRID_NAME,
        box: dataHost,
        show: {
          footer: false,
          toolbar: true,
          toolbarSearch: false,
          toolbarColumns: true,
          toolbarReload: false,
        },
        sortData: [{ field: 'wilayah', direction: 'asc' }],
        columnGroups: buildColumnGroups(initialVisibleMonths),
        columns: buildColumns(initialVisibleMonths),
        records: [],
      });

      setGridReadyTick((v) => v + 1);

      const grid = gridRef.current;
      if (grid?.toolbar) {
        grid.toolbar.add([
          {
            type: 'html',
            id: 'tbQuery',
            html: `
              <div class="tv-sales-toolbar-search" title="Cari wilayah / sales / customer...">
                <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
                <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari wilayah / sales / customer..." />
              </div>
            `,
          },
          { type: 'break', id: 'tbBreak1' },
          {
            type: 'menu-check',
            id: 'tbMonth',
            icon: TOOLBAR_ICONS.month,
            text: 'Bulan: -',
            selected: getDefaultMonthSelection(),
            overlay: { class: 'w2ui-white tv-report-customers__month-menu' },
            items: MONTH_LABELS.map((label, monthIndex) => ({ id: monthIndex, text: label, checked: false })),
          },
          {
            type: 'menu-radio',
            id: 'tbYear',
            icon: TOOLBAR_ICONS.year,
            text: `Tahun: ${new Date().getFullYear()}`,
            selected: String(new Date().getFullYear()),
            items: [{ id: String(new Date().getFullYear()), text: String(new Date().getFullYear()), checked: true }],
          },
          {
            type: 'menu-radio',
            id: 'tbState',
            icon: TOOLBAR_ICONS.wilayah,
            text: 'Wilayah: Semua',
            selected: 'ALL',
            items: [{ id: 'ALL', text: 'Semua', checked: true }],
          },
          {
            type: 'menu-radio',
            id: 'tbSales',
            icon: TOOLBAR_ICONS.sales,
            text: 'Sales: Semua',
            selected: 'ALL',
            items: [{ id: 'ALL', text: 'Semua', checked: true }],
          },
          { type: 'spacer', id: 'tbSpacer1' },
          { type: 'button', id: 'tbReset', icon: TOOLBAR_ICONS.reset},
        ]);

        setTimeout(() => {
          if (disposed) return;
          mountToolbarReactIcons();
        }, 0);

        grid.toolbar.on('click', (event) => {
          const target = String(event.target ?? '');
          if (!target) return;

          if (target === 'tbReset') {
            setFilters({
              query: '',
              wilayah: 'ALL',
              sales: 'ALL',
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
          } else if (parentId === 'tbSales') {
            setFilters((prev) => ({ ...prev, sales: subId === 'ALL' ? 'ALL' : subId }));
          } else if (parentId === 'tbYear') {
            const year = Number(subId);
            if (!Number.isInteger(year)) return;
            setFilters((prev) => ({ ...prev, year }));
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
    }, 0);

    const handleResize = () => {
      const grid = gridRef.current ?? w2ui[GRID_NAME];
      if (grid) grid.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      if (initialMountTimeoutId) clearTimeout(initialMountTimeoutId);

      window.removeEventListener('resize', handleResize);
      if (queryInputRef.current?.el && queryInputRef.current?.handler) {
        queryInputRef.current.el.removeEventListener('input', queryInputRef.current.handler);
      }
      queryInputRef.current = null;
      for (const [, root] of toolbarIconRootsRef.current.entries()) root.unmount();
      toolbarIconRootsRef.current.clear();
      summaryRootRef.current?.unmount?.();
      summaryRootRef.current = null;
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();
      gridRef.current = null;
      layoutRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const tabId = String(activeMainTabRef.current || 'data');
    if (tabId === 'summary') renderSummaryTab();
  }, [filteredRows, visibleMonths, filters, isLoading, loadError, summaryData, renderSummaryTab]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const nextGroups = buildColumnGroups(visibleMonths);
    const nextColumns = buildColumns(visibleMonths);

    grid.columnGroups = nextGroups;
    grid.columns = nextColumns.map((col) => w2utils.extend({}, grid.colTemplate, col));
    grid.refresh();
    grid.resize();
  }, [visibleMonths, gridReadyTick]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const selectedSet = new Set(visibleMonths);
    const records = filteredRows.map((row) => {
      const record = {
        recid: row.id,
        wilayah: row.wilayah,
        sales_name: row.sales_name,
        customer: row.customer,
      };

      for (const monthIndex of selectedSet) {
        const monthData = row.monthsByIndex?.[monthIndex] ?? null;
        for (let weekIndex = 0; weekIndex < WEEK_COLUMNS.length; weekIndex += 1) {
          const field = `m${monthIndex}_w${weekIndex}`;
          const weekKey = `week${weekIndex + 1}`;
          const value = monthData ? monthData[weekKey] : null;
          record[field] = value == null ? '' : String(value);
        }
      }

      return record;
    });

    grid.clear();
    grid.add(records);
    grid.total = records.length;
    grid.refresh();
  }, [filteredRows, visibleMonths, gridReadyTick]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    grid.limit = rowsPerPage;
    grid.offset = page * rowsPerPage;
    grid.refresh();
  }, [gridReadyTick, page, rowsPerPage]);

  React.useEffect(() => {
    const total = filteredRows.length;
    const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
    if (page > maxPage) setPage(0);
  }, [filteredRows.length, page, rowsPerPage]);

  const handleChangePage = React.useCallback((event, nextPage) => {
    setPage(nextPage);
  }, []);

  const handleChangeRowsPerPage = React.useCallback((event) => {
    const next = Number.parseInt(event.target.value, 10);
    setRowsPerPage(Number.isFinite(next) && next > 0 ? next : 25);
    setPage(0);
  }, []);

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

    const yearItems =
      yearOptions.length === 0
        ? [{ id: String(filters.year), text: String(filters.year), checked: true }]
        : yearOptions.map((year) => ({ id: String(year), text: String(year), checked: Number(filters.year) === year }));

    const stateItems = [{ id: 'ALL', text: 'Semua', checked: filters.wilayah === 'ALL' }].concat(
      stateOptions.map((opt) => ({ id: opt, text: opt, checked: filters.wilayah === opt })),
    );

    const salesItems = [{ id: 'ALL', text: 'Semua', checked: filters.sales === 'ALL' }].concat(
      salesOptions.map((opt) => ({ id: opt, text: opt, checked: filters.sales === opt })),
    );

    const tbMonth = grid.toolbar.get('tbMonth');
    if (tbMonth) {
      tbMonth.items = monthItems;
      tbMonth.selected = selectedMonths;
      tbMonth.text = `Bulan: ${monthLabel}`;
      grid.toolbar.refresh('tbMonth');
    }

    const yearLabel = String(filters.year);
    const tbYear = grid.toolbar.get('tbYear');
    if (tbYear) {
      tbYear.items = yearItems;
      tbYear.selected = String(filters.year);
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

    const salesLabel = filters.sales === 'ALL' ? 'Semua' : String(filters.sales);
    const tbSales = grid.toolbar.get('tbSales');
    if (tbSales) {
      tbSales.items = salesItems;
      tbSales.selected = filters.sales;
      tbSales.text = `Sales: ${salesLabel}`;
      grid.toolbar.refresh('tbSales');
    }

    // w2ui refresh can recreate DOM nodes, so re-mount React icons afterwards
    setTimeout(() => {
      mountToolbarReactIcons();
    }, 0);
  }, [filters.year, filters.wilayah, filters.sales, visibleMonths, stateOptions, yearOptions, salesOptions, gridReadyTick]);

  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      className="tv-report-customers"
    >
      {loadError ? (
        <Box sx={{ mb: 1, color: 'error.main', fontSize: 13 }}>
          {loadError}
        </Box>
      ) : null}
      <style>
        {`
          .tv-report-customers .w2ui-panel-tabs,
          .tv-report-customers .w2ui-tabs {
            background: transparent;
          }

          /* Override w2ui default active blue (#0175ff) */
          .tv-report-customers .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab {
            color: #5b6775;
            font-weight: 400 !important;
          }

          .tv-report-customers .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab:hover {
            background-color: rgba(107, 163, 208, 0.08);
            color: #6BA3D0;
          }

          .tv-report-customers .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab.active {
            background-color: rgba(107, 163, 208, 0.12);
            color: #6BA3D0 !important;
            border-bottom: 2px solid #6BA3D0 !important;
            font-weight: 400 !important;
          }

          .tv-report-customers .w2ui-tabs.w2ui-tabs-up .w2ui-scroll-wrapper .w2ui-tab.active {
            border-top: 2px solid #6BA3D0 !important;
          }

          .tv-report-customers .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab:focus {
            outline: 2px solid rgba(107, 163, 208, 0.45);
            outline-offset: 2px;
          }

          .tv-report-customers .w2ui-grid .w2ui-grid-records td div,
          .tv-report-customers .w2ui-grid .w2ui-grid-columns td div,
          .tv-report-customers .w2ui-grid .w2ui-col-header,
          .tv-report-customers .w2ui-grid .w2ui-group-title {
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
          }

          .tv-report-customers .w2ui-grid .w2ui-grid-records td.tv-week-cell div {
            text-align: right;
            padding-right: 8px;
          }

          .tv-report-customers .w2ui-grid .w2ui-grid-columns td.tv-week-cell div,
          .tv-report-customers .w2ui-grid .w2ui-grid-columns td.tv-week-cell .w2ui-col-header {
            text-align: right;
            padding-right: 8px;
          }

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
          
          /* Make w2ui toolbar icon/text align consistently (override float-based default layout). */
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon {
            float: none;
            width: auto !important;
            margin: 0 0 0 2px !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-text,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-text {
            margin-left: 0 !important;
            display: inline-flex;
            align-items: center;
            padding: 5px 6px 5px 0;
          }

          /* Fixed icon container with proper sizing */
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            min-width: 20px;
            min-height: 20px;
            color: #8d99a7;
            line-height: 1;
            overflow: visible;
            flex-shrink: 0;
          }
          
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg svg,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg svg {
            display: block;
            width: 16px;
            height: 16px;
            flex-shrink: 0;
          }

          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg--compact,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg--compact {
            width: 16px;
            height: 16px;
            min-width: 16px;
            min-height: 16px;
          }
          
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg--compact svg,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg--compact svg {
            width: 16px;
            height: 16px;
          }
          
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button.over .w2ui-tb-icon .tv-w2ui-svg,
          .tv-report-customers .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button.checked .w2ui-tb-icon .tv-w2ui-svg,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button.over .w2ui-tb-icon .tv-w2ui-svg,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-scroll-wrapper .w2ui-tb-button.checked .w2ui-tb-icon .tv-w2ui-svg {
            color: #5b6775;
          }

          /* Keep dropdown arrow vertically centered (w2ui default offsets it). */
          .tv-report-customers .w2ui-toolbar .w2ui-tb-text .w2ui-tb-down,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-tb-text .w2ui-tb-down {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 6px;
          }

          .tv-report-customers .w2ui-toolbar .w2ui-tb-text .w2ui-tb-down > span,
          #grid_${GRID_NAME} .w2ui-toolbar .w2ui-tb-text .w2ui-tb-down > span {
            position: static !important;
            top: auto !important;
            left: auto !important;
          }

          /* Month dropdown: show checkbox UI for menu-check items. */
          .tv-report-customers__month-menu .menu-icon .w2ui-icon.w2ui-icon-empty,
          .tv-report-customers__month-menu .menu-icon .w2ui-icon.w2ui-icon-check {
            position: relative;
            width: 16px;
            height: 16px;
            display: inline-block;
            line-height: 16px;
          }

          .tv-report-customers__month-menu .menu-icon .w2ui-icon.w2ui-icon-empty:before,
          .tv-report-customers__month-menu .menu-icon .w2ui-icon.w2ui-icon-check:before {
            content: "";
            display: block;
            width: 16px;
            height: 16px;
            box-sizing: border-box;
            border: 1px solid #9aa4b2;
            border-radius: 3px;
            background: #fff;
          }

          .tv-report-customers__month-menu .menu-icon .w2ui-icon.w2ui-icon-check:after {
            content: "";
            position: absolute;
            left: 4px;
            top: 5px;
            width: 7px;
            height: 4px;
            border-left: 2px solid #6BA3D0;
            border-bottom: 2px solid #6BA3D0;
            transform: rotate(-45deg);
          }

          .tv-report-customers__month-menu .w2ui-menu-item.w2ui-disabled .menu-text {
            opacity: 0.55;
          }

          .tv-report-customers__month-menu .w2ui-menu-item.w2ui-disabled .menu-icon .w2ui-icon:before {
            background: #f3f4f6;
            border-color: #c9cfd7;
          }
        `}
      </style>
      <Paper sx={{ width: '100%', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box ref={lockBoxRef} sx={{ width: '100%', flex: 1, minHeight: 0, position: 'relative' }}>
          <Box ref={layoutBoxRef} sx={{ width: '100%', height: '100%' }} />
        </Box>
        {activeMainTab === 'data' ? (
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ flex: '0 0 auto', borderTop: 1, borderColor: 'divider' }}
          />
        ) : null}
      </Paper>
    </Box>
  );
}
