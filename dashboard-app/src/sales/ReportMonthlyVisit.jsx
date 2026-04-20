import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { createRoot } from 'react-dom/client';
import { w2grid, w2layout, w2ui, w2utils } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import { API_URL } from '../config/api';
import SummarySales from './SummaryMonthlyVisit';
import { exportMatrixToXlsx } from '../utils/exportToXlsx';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const GRID_NAME = 'reportSalesGrid';
const LAYOUT_NAME = 'reportSalesLayout';

const MAIN_DATA_ID = `${LAYOUT_NAME}__tab_data`;
const MAIN_SUMMARY_ID = `${LAYOUT_NAME}__tab_summary`;

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parsePeriod(period) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period ?? ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
  bulan: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 8H6v10h14V10Z"/>
    </svg>
  `,
  tahun: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 6H6v12h14V8Z"/>
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
  refresh: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 12.65-5.65Z"/>
    </svg>
  `,
  export: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M5 20h14v-2H5v2Zm7-18-5.5 5.5h3.5V15h4V7.5H17.5L12 2Z"/>
    </svg>
  `,
};

const TOOLBAR_ICONS = {
  bulan: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.bulan}</span>`,
  tahun: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.tahun}</span>`,
  wilayah: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.wilayah}</span>`,
  sales: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.sales}</span>`,
  reset: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.reset}</span>`,
  refresh: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.refresh}</span>`,
  export: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.export}</span>`,
};

export default function ReportTableSales() {
  const layoutBoxRef = React.useRef(null);
  const lockBoxRef = React.useRef(null);
  const layoutRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const summaryRootRef = React.useRef(null);
  const toolbarInputsRef = React.useRef([]);
  const activeMainTabRef = React.useRef('data');
  const latestFilteredRowsRef = React.useRef([]);
  const latestFiltersRef = React.useRef(null);
  const latestPeriodRef = React.useRef(getCurrentPeriod());
  const latestIsLoadingRef = React.useRef(true);
  const latestLoadErrorRef = React.useRef(null);
  const abortRef = React.useRef(null);
  const requestIdRef = React.useRef(0);
  const [gridReadyTick, setGridReadyTick] = React.useState(0);
  const [activeMainTab, setActiveMainTab] = React.useState('data');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [reloadTick, setReloadTick] = React.useState(0);

  const [filters, setFilters] = React.useState(() => ({
    query: '',
    wilayah: 'ALL',
    sales: 'ALL',
  }));

  const [period, setPeriod] = React.useState(() => getCurrentPeriod());
  const [sourceData, setSourceData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

  React.useEffect(() => {
    const parsed = parsePeriod(period) ?? parsePeriod(getCurrentPeriod());
    const month = parsed?.month ?? new Date().getMonth() + 1;
    const year = parsed?.year ?? new Date().getFullYear();
    
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    params.set('month', String(month));
    params.set('year', String(year));
    const url = `${API_URL}/activity-plans/monthly-visit?${params.toString()}`;

    setIsLoading(true);
    setLoadError(null);

    fetchWithAuth(url, { 
      signal: controller.signal,
    })
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
        setSourceData(body.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load missed summary:', err);
        if (requestIdRef.current !== nextRequestId) return;
        setSourceData([]);
        setLoadError(err?.message || 'Failed to load data');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== nextRequestId) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [period, reloadTick]);

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
    const list = Array.isArray(sourceData) ? sourceData : [];
    return list.map((item, index) => ({
      recid: index + 1,
      customer_name: item?.customer_name ?? '-',
      wilayah: item?.wilayah ?? item?.state ?? '-',
      sales_name: item?.sales_name ?? '-',
      year: item?.year ?? null,
      month: item?.month ?? null,
      month_name: item?.month_name ?? null,
      visit_count: item?.done_visit_count ?? item?.visit_count ?? 0,
      follow_up_count: item?.done_follow_up_count ?? item?.follow_up_count ?? 0,
      missed_count: item?.missed_count ?? item?.missed ?? 0,
    }));
  }, [sourceData]);

  const stateOptions = React.useMemo(() => {
    const unique = new Set();
    for (const record of rows) {
      if (record.wilayah && record.wilayah !== '-') unique.add(record.wilayah);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const salesOptions = React.useMemo(() => {
    const unique = new Set();
    for (const record of rows) {
      if (record.sales_name && record.sales_name !== '-') unique.add(record.sales_name);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRecords = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase();
    return rows.filter((record) => {
      if (filters.wilayah !== 'ALL' && record.wilayah !== filters.wilayah) return false;
      if (filters.sales !== 'ALL' && record.sales_name !== filters.sales) return false;

      if (!normalizedQuery) return true;

      const haystack =
        `${record.customer_name} ${record.wilayah} ${record.sales_name} ${record.month_name ?? ''} ${record.month ?? ''} ${record.year ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [filters, rows]);

  const pagedFilteredRecords = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, page, rowsPerPage]);

  React.useEffect(() => {
    latestFilteredRowsRef.current = filteredRecords;
  }, [filteredRecords]);

  React.useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  React.useEffect(() => {
    latestPeriodRef.current = period;
  }, [period]);

  React.useEffect(() => {
    latestIsLoadingRef.current = isLoading;
  }, [isLoading]);

  React.useEffect(() => {
    latestLoadErrorRef.current = loadError;
  }, [loadError]);

  const exportCurrentRows = React.useCallback(() => {
    try {
      const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];
      const currentPeriod = String(latestPeriodRef.current ?? getCurrentPeriod()).trim() || getCurrentPeriod();

      exportMatrixToXlsx({
        fileName: `report-monthly-visit-${currentPeriod}.xlsx`,
        sheetName: 'Monthly Visit',
        rows: [
          ['Sales', 'Wilayah', 'Customer', 'Visit', 'Follow Up', 'Missed'],
          ...currentRows.map((row) => [
            row?.sales_name ?? '',
            row?.wilayah ?? '',
            row?.customer_name ?? '',
            row?.visit_count ?? 0,
            row?.follow_up_count ?? 0,
            row?.missed_count ?? 0,
          ]),
        ],
      });
    } catch (error) {
      console.error('Failed to export monthly visit report:', error);
    }
  }, []);

  const renderSummaryTab = React.useCallback(() => {
    const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
    if (!summaryEl) return;

    const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];
    const currentFilters = latestFiltersRef.current ?? { query: '', wilayah: 'ALL', sales: 'ALL' };
    const currentPeriod = latestPeriodRef.current ?? getCurrentPeriod();
    const currentIsLoading = Boolean(latestIsLoadingRef.current);
    const currentLoadError = latestLoadErrorRef.current;

    if (!summaryRootRef.current) {
      summaryRootRef.current = createRoot(summaryEl);
    }

    summaryRootRef.current.render(
      <SummarySales
        rows={currentRows}
        filters={currentFilters}
        period={currentPeriod}
        isLoading={currentIsLoading}
        loadError={currentLoadError}
      />,
    );
  }, []);

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
    [renderSummaryTab],
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
              <div id="${MAIN_SUMMARY_ID}" style="flex:1; min-height:0; display:none; overflow:auto; padding:12px;"></div>
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
        sortData: [{ field: 'recid', direction: 'asc' }],
        columnGroups: [
          { text: 'General Information', span: 3 },
          { text: 'Done', span: 2 },
        ],
        columns: [
          { field: 'sales_name', text: 'Sales', size: '20%', sortable: true, resizable: true },
          { field: 'wilayah', text: 'Wilayah', size: '20%', sortable: true, resizable: true },
          { field: 'customer_name', text: 'Customer', size: '20%', sortable: true, resizable: true },
          { field: 'visit_count', text: 'Visit', size: '90px', sortable: true, resizable: true, attr: 'align=right' },
          { field: 'follow_up_count', text: 'Follow Up', size: '90px', sortable: true, resizable: true, attr: 'align=right' },
          { field: 'missed_count', text: 'Missed', size: '110px', sortable: true, resizable: true, attr: 'align=right' },
        ],
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
              <div class="tv-sales-toolbar-search" title="Cari sales / customer / wilayah...">
                <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
                <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari sales / customer / wilayah..." />
              </div>
            `,
          },
          {
            type: 'html',
            id: 'tbPeriod',
            html: `
              <div class="tv-sales-toolbar-period" title="Filter bulan laporan">
                <input id="${GRID_NAME}__period" type="month" class="w2ui-input tv-sales-toolbar-period__input" />
              </div>
            `,
          },
          {
            type: 'menu-radio',
            id: 'tbSales',
            icon: TOOLBAR_ICONS.sales,
            text: 'Sales: Semua',
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
          { type: 'button', id: 'tbRefresh', text: 'Refresh', icon: TOOLBAR_ICONS.refresh, hint: 'Refresh Data' },
          { type: 'button', id: 'tbExport', text: 'Export XLSX', icon: TOOLBAR_ICONS.export, hint: 'Export ke XLSX' },
          { type: 'button', id: 'tbReset', text: 'Reset', icon: TOOLBAR_ICONS.reset, hint: 'Reset Filter' },
        ]);

        grid.toolbar.on('click', (event) => {
          const target = String(event.target ?? '');
          if (!target) return;

          if (target === 'tbRefresh') {
            setReloadTick((value) => value + 1);
            return;
          }

          if (target === 'tbExport') {
            exportCurrentRows();
            return;
          }

          if (target === 'tbReset') {
            setFilters({
              query: '',
              wilayah: 'ALL',
              sales: 'ALL',
            });
            const defaultPeriod = getCurrentPeriod();
            setPeriod(defaultPeriod);
            const queryEl = document.getElementById(`${GRID_NAME}__query`);
            if (queryEl) queryEl.value = '';
            const periodEl = document.getElementById(`${GRID_NAME}__period`);
            if (periodEl) periodEl.value = defaultPeriod;
            return;
          }

          if (!target.includes(':')) return;
          const [parentId, subIdRaw] = target.split(':');
          const subId = subIdRaw ?? '';

          if (parentId === 'tbState') {
            setFilters((prev) => ({ ...prev, wilayah: subId === 'ALL' ? 'ALL' : subId }));
          } else if (parentId === 'tbSales') {
            setFilters((prev) => ({ ...prev, sales: subId === 'ALL' ? 'ALL' : subId }));
          }
        });

        setTimeout(() => {
          const listeners = [];
          const attach = (id, eventName, handler) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(eventName, handler);
            listeners.push({ el, eventName, handler });
          };

          const queryEl = document.getElementById(`${GRID_NAME}__query`);
          if (queryEl) queryEl.value = '';

          const periodEl = document.getElementById(`${GRID_NAME}__period`);
          if (periodEl) periodEl.value = period;

          attach(`${GRID_NAME}__query`, 'input', (e) => {
            setFilters((prev) => ({ ...prev, query: e.target.value }));
          });

          attach(`${GRID_NAME}__period`, 'change', (e) => {
            const next = String(e.target.value ?? '').trim();
            const parsed = parsePeriod(next);
            setPeriod(parsed ? next : getCurrentPeriod());
            setPage(0);
          });

          toolbarInputsRef.current = listeners;
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
      for (const { el, eventName, handler } of toolbarInputsRef.current) {
        el.removeEventListener(eventName, handler);
      }
      toolbarInputsRef.current = [];
      summaryRootRef.current?.unmount?.();
      summaryRootRef.current = null;
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();
      gridRef.current = null;
      layoutRef.current = null;
    };
  }, [exportCurrentRows, setMainTab]);

  React.useEffect(() => {
    const tabId = String(activeMainTabRef.current || 'data');
    if (tabId === 'summary') renderSummaryTab();
  }, [filteredRecords, filters, isLoading, loadError, renderSummaryTab]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const records = pagedFilteredRecords.map((record) => ({
      recid: record.recid,
      customer_name: record.customer_name,
      wilayah: record.wilayah,
      sales_name: record.sales_name,
      visit_count: record.visit_count,
      follow_up_count: record.follow_up_count,
      missed_count: record.missed_count,
    }));

    grid.clear();
    grid.add(records);
    grid.total = records.length;
    grid.refresh();
  }, [pagedFilteredRecords, gridReadyTick]);

  React.useEffect(() => {
    const periodEl = document.getElementById(`${GRID_NAME}__period`);
    if (periodEl && periodEl.value !== period) periodEl.value = period;
  }, [gridReadyTick, period]);

  React.useEffect(() => {
    const total = filteredRecords.length;
    const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
    if (page > maxPage) setPage(0);
  }, [filteredRecords.length, page, rowsPerPage]);

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

    const stateItems = [{ id: 'ALL', text: 'Semua', checked: filters.wilayah === 'ALL' }].concat(
      stateOptions.map((opt) => ({ id: opt, text: opt, checked: filters.wilayah === opt })),
    );

    const salesItems = [{ id: 'ALL', text: 'Semua', checked: filters.sales === 'ALL' }].concat(
      salesOptions.map((opt) => ({ id: opt, text: opt, checked: filters.sales === opt })),
    );

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
  }, [filters.wilayah, filters.sales, stateOptions, salesOptions, gridReadyTick]);

  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      className="tv-report-sales"
    >
      {loadError ? (
        <Box sx={{ mb: 1, color: 'error.main', fontSize: 13 }}>
          {loadError}
        </Box>
      ) : null}
      <style>
        {`
          .tv-report-sales .w2ui-panel-tabs,
          .tv-report-sales .w2ui-tabs {
            background: transparent;
          }

          /* Override w2ui default active blue (#0175ff) */
          .tv-report-sales .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab {
            color: #5b6775;
            font-weight: 400 !important;
          }

          .tv-report-sales .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab:hover {
            background-color: rgba(47, 111, 178, 0.08);
            color: #2F6FB2;
          }

          .tv-report-sales .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab.active {
            background-color: rgba(47, 111, 178, 0.12);
            color: #2F6FB2 !important;
            border-bottom: 2px solid #2F6FB2 !important;
            font-weight: 400 !important;
          }

          .tv-report-sales .w2ui-tabs.w2ui-tabs-up .w2ui-scroll-wrapper .w2ui-tab.active {
            border-top: 2px solid #2F6FB2 !important;
          }

          .tv-report-sales .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab:focus {
            outline: 2px solid rgba(47, 111, 178, 0.45);
            outline-offset: 2px;
          }

          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            color: #8d99a7;
            line-height: 1;
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon .tv-w2ui-svg svg {
            display: block;
            width: 16px;
            height: 16px;
          }
          .w2ui-toolbar .w2ui-tb-button.over .w2ui-tb-icon .tv-w2ui-svg,
          .w2ui-toolbar .w2ui-tb-button.checked .w2ui-tb-icon .tv-w2ui-svg {
            color: #5b6775;
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

          .tv-sales-toolbar-period {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 30px;
            padding: 0 6px;
            white-space: nowrap;
            transform: translateY(-2px);
          }
          .tv-sales-toolbar-period__icon {
            display: inline-flex;
            align-items: center;
            line-height: 1;
            color: #8d99a7;
          }
          .tv-sales-toolbar-period__icon svg {
            display: block;
            width: 16px;
            height: 16px;
          }
          .tv-sales-toolbar-period__input {
            height: 26px;
            line-height: 26px;
            padding: 0 8px;
            width: 150px;
            box-sizing: border-box;
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
            count={filteredRecords.length}
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
