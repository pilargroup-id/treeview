import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { w2grid, w2layout, w2ui, w2utils } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import { API_URL } from '../config/api';

const WEEK_COLUMNS = ['Week1', 'Week2', 'Week3', 'Week4'];

const GRID_NAME = 'reportCustomersGrid';
const LAYOUT_NAME = 'reportCustomersLayout';
const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
};

const TOOLBAR_ICONS = {
  wilayah: 'tv-w2-icon tv-w2-icon-wilayah',
  year: 'tv-w2-icon tv-w2-icon-year',
  reset: 'tv-w2-icon tv-w2-icon-reset',
};

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

function buildColumns() {
  const base = [
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
      size: '450px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
    },
  ];

  const weekCols = WEEK_COLUMNS.map((label, weekIndex) => ({
    field: `week${weekIndex + 1}`,
    text: label,
    size: '92px',
    sortable: false,
    resizable: true,
    attr: 'align=right class=tv-week-cell style="white-space:nowrap;"',
  }));

  const totalCol = {
    field: 'total',
    text: 'Total (week1-4)',
    size: '120px',
    sortable: false,
    resizable: true,
    attr: 'align=right class=tv-week-cell style="white-space:nowrap;"',
  };

  return base.concat(weekCols, totalCol);
}

export default function DataTableMonthly() {
  const layoutBoxRef = React.useRef(null);
  const lockBoxRef = React.useRef(null);
  const layoutRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const queryInputRef = React.useRef(null);
  const activeMainTabRef = React.useRef('data');
  const latestFilteredRowsRef = React.useRef([]);
  const latestSummaryDataRef = React.useRef([]);
  const abortRef = React.useRef(null);
  const requestIdRef = React.useRef(0);
  const [gridReadyTick, setGridReadyTick] = React.useState(0);
  const [activeMainTab, setActiveMainTab] = React.useState('data');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [filters, setFilters] = React.useState(() => ({
    query: '',
    wilayah: 'ALL',
    year: new Date().getFullYear(),
  }));

  const [summaryData, setSummaryData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

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
  }, [filters.year, filters.wilayah]);

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
      const years = new Set();
      const weeksByYear = {};

      const months = Array.isArray(item?.months) ? item.months : [];
      for (const m of months) {
        const year = Number(m?.year);
        if (!Number.isInteger(year)) continue;

        years.add(year);
        const acc = (weeksByYear[year] ??= { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 });

        const week4 = mergeWeek4(m?.week4 ?? null, m?.week5 ?? null, m?.week6 ?? null);
        acc.week1 += toFiniteNumberOrNull(m?.week1) ?? 0;
        acc.week2 += toFiniteNumberOrNull(m?.week2) ?? 0;
        acc.week3 += toFiniteNumberOrNull(m?.week3) ?? 0;
        acc.week4 += (typeof week4 === 'number' ? week4 : toFiniteNumberOrNull(week4) ?? 0);
      }

      for (const yearKey of Object.keys(weeksByYear)) {
        const acc = weeksByYear[yearKey];
        acc.total = acc.week1 + acc.week2 + acc.week3 + acc.week4;
      }

      return {
        id: index + 1,
        wilayah: item?.wilayah ?? '-',
        customer: item?.customer ?? '-',
        weeksByYear,
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

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase();

    return rows.filter((row) => {
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) return false;

      const filterYear = Number(filters.year);
      if (Number.isInteger(filterYear) && row.years.size > 0 && !row.years.has(filterYear)) return false;

      if (!normalizedQuery) return true;

      const haystack = `${row.wilayah} ${row.customer}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, filters]);

  React.useEffect(() => {
    latestSummaryDataRef.current = Array.isArray(summaryData) ? summaryData : [];
  }, [summaryData]);

  React.useEffect(() => {
    latestFilteredRowsRef.current = filteredRows;
  }, [filteredRows]);

  const MAIN_DATA_ID = `${LAYOUT_NAME}__tab_data`;
  const MAIN_SUMMARY_ID = `${LAYOUT_NAME}__tab_summary`;
  const MAIN_JSON_ID = `${LAYOUT_NAME}__tab_json`;

  const escapeHTML = React.useCallback((value) => {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }, []);

  const formatNumber = React.useCallback((value) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return '-';
    return new Intl.NumberFormat('id-ID').format(num);
  }, []);

  const renderSummaryTab = React.useCallback(() => {
    const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
    if (!summaryEl) return;

    const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];
    const filterYear = Number(filters.year);
    const yearIsValid = Number.isInteger(filterYear);

    const grand = currentRows.reduce(
      (acc, row) => {
        const yd = yearIsValid ? row?.weeksByYear?.[filterYear] : null;
        if (!yd) return acc;
        acc.week1 += typeof yd.week1 === 'number' ? yd.week1 : 0;
        acc.week2 += typeof yd.week2 === 'number' ? yd.week2 : 0;
        acc.week3 += typeof yd.week3 === 'number' ? yd.week3 : 0;
        acc.week4 += typeof yd.week4 === 'number' ? yd.week4 : 0;
        acc.total += typeof yd.total === 'number' ? yd.total : 0;
        return acc;
      },
      { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
    );

    const headerNote = loadError
      ? `<div style="margin-bottom:10px; color:#b42318;">${escapeHTML(loadError)}</div>`
      : isLoading
        ? `<div style="margin-bottom:10px; color:#6b7685;">Loading...</div>`
        : '';

    const yearLabel = yearIsValid ? String(filterYear) : '-';

    summaryEl.innerHTML = `
      ${headerNote}
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div>Summary</div>
        <div style="display:grid; grid-template-columns: 1fr auto; gap:6px 10px; font-size:13px;">
          <div>Tahun</div>
          <div style="text-align:right;">${escapeHTML(yearLabel)}</div>

          <div>Jumlah customer</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(
            formatNumber(currentRows.length),
          )}</div>

          <div>Total week1</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(formatNumber(grand.week1))}</div>

          <div>Total week2</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(formatNumber(grand.week2))}</div>

          <div>Total week3</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(formatNumber(grand.week3))}</div>

          <div>Total week4</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(formatNumber(grand.week4))}</div>

          <div>Total (week1-4)</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(formatNumber(grand.total))}</div>
        </div>
      </div>
    `;
  }, [MAIN_SUMMARY_ID, escapeHTML, formatNumber, filters.year, isLoading, loadError]);

  const renderJsonTab = React.useCallback(() => {
    const jsonEl = document.getElementById(MAIN_JSON_ID);
    if (!jsonEl) return;

    const payload = {
      filters,
      data: Array.isArray(latestSummaryDataRef.current) ? latestSummaryDataRef.current : [],
    };

    jsonEl.innerHTML = `
      <pre style="margin:0; white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.45; color:#111827;">${escapeHTML(
        JSON.stringify(payload, null, 2),
      )}</pre>
    `;
  }, [MAIN_JSON_ID, escapeHTML, filters]);

  const setMainTab = React.useCallback(
    (nextTabId) => {
      const tabId = String(nextTabId || 'data');
      if (activeMainTabRef.current === tabId) return;
      activeMainTabRef.current = tabId;
      setActiveMainTab(tabId);

      const dataEl = document.getElementById(MAIN_DATA_ID);
      const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
      const jsonEl = document.getElementById(MAIN_JSON_ID);
      if (!dataEl || !summaryEl || !jsonEl) return;

      dataEl.style.display = tabId === 'data' ? 'block' : 'none';
      summaryEl.style.display = tabId === 'summary' ? 'block' : 'none';
      jsonEl.style.display = tabId === 'json' ? 'block' : 'none';

      if (tabId === 'summary') renderSummaryTab();
      if (tabId === 'json') renderJsonTab();

      if (tabId === 'data') {
        setTimeout(() => {
          const grid = gridRef.current ?? w2ui[GRID_NAME];
          grid?.resize?.();
          grid?.refresh?.();
        }, 0);
      }
    },
    [renderJsonTab, renderSummaryTab, MAIN_DATA_ID, MAIN_SUMMARY_ID, MAIN_JSON_ID],
  );

  React.useEffect(() => {
    if (!layoutBoxRef.current) return;
    let disposed = false;
    let initialMountTimeoutId = null;

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
              <div id="${MAIN_SUMMARY_ID}" style="flex:1; min-height:0; display:none; overflow:auto; padding:12px;"></div>
              <div id="${MAIN_JSON_ID}" style="flex:1; min-height:0; display:none; overflow:auto; padding:12px;"></div>
            </div>
          `,
          tabs: {
            active: 'data',
            tabs: [
              { id: 'data', text: 'Data' },
              { id: 'summary', text: 'Summary' },
              { id: 'json', text: 'JSON' },
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
        columns: buildColumns(),
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
              <div class="tv-sales-toolbar-search" title="Cari wilayah / customer...">
                <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
                <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari wilayah / customer..." />
              </div>
            `,
          },
          { type: 'break', id: 'tbBreak1' },
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
            const year = Number(subId);
            if (!Number.isInteger(year)) return;
            setFilters((prev) => ({ ...prev, year }));
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
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();
      gridRef.current = null;
      layoutRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const tabId = String(activeMainTabRef.current || 'data');
    if (tabId === 'summary') renderSummaryTab();
    if (tabId === 'json') renderJsonTab();
  }, [filteredRows, filters, isLoading, loadError, summaryData, renderSummaryTab, renderJsonTab]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const filterYear = Number(filters.year);
    const yearIsValid = Number.isInteger(filterYear);
    const records = filteredRows.map((row) => {
      const yd = yearIsValid ? row.weeksByYear?.[filterYear] : null;
      const record = {
        recid: row.id,
        wilayah: row.wilayah,
        customer: row.customer,
        week1: yd ? String(yd.week1) : '',
        week2: yd ? String(yd.week2) : '',
        week3: yd ? String(yd.week3) : '',
        week4: yd ? String(yd.week4) : '',
        total: yd ? String(yd.total) : '',
      };

      return record;
    });

    grid.clear();
    grid.add(records);
    grid.total = records.length;
    grid.refresh();
  }, [filteredRows, filters.year, gridReadyTick]);

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

    const yearItems =
      yearOptions.length === 0
        ? [{ id: String(filters.year), text: String(filters.year), checked: true }]
        : yearOptions.map((year) => ({ id: String(year), text: String(year), checked: Number(filters.year) === year }));

    const stateItems = [{ id: 'ALL', text: 'Semua', checked: filters.wilayah === 'ALL' }].concat(
      stateOptions.map((opt) => ({ id: opt, text: opt, checked: filters.wilayah === opt })),
    );

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
  }, [filters.year, filters.wilayah, stateOptions, yearOptions, gridReadyTick]);

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
