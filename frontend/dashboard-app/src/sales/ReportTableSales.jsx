import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { w2grid, w2layout, w2ui } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import { API_URL } from '../config/api';

const GRID_NAME = 'reportSalesGrid';
const LAYOUT_NAME = 'reportSalesLayout';

const MAIN_DATA_ID = `${LAYOUT_NAME}__tab_data`;
const MAIN_SUMMARY_ID = `${LAYOUT_NAME}__tab_summary`;

const TOOLBAR_ICONS = {
  bulan: 'tv-w2-icon tv-w2-icon-bulan',      // ← TAMBAH ini
  tahun: 'tv-w2-icon tv-w2-icon-tahun',  
  wilayah: 'tv-w2-icon tv-w2-icon-wilayah',
  sales: 'tv-w2-icon tv-w2-icon-sales',
  reset: 'tv-w2-icon tv-w2-icon-reset',
};



function escapeHTML(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export default function ReportTableSales() {
  const layoutBoxRef = React.useRef(null);
  const layoutRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const activeMainTabRef = React.useRef('data');
  const latestFilteredRowsRef = React.useRef([]);
  const abortRef = React.useRef(null);
  const requestIdRef = React.useRef(0);
  const [gridReadyTick, setGridReadyTick] = React.useState(0);
  const [activeMainTab, setActiveMainTab] = React.useState('data');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [filters, setFilters] = React.useState(() => ({
    wilayah: 'ALL',
    sales: 'ALL',
  }));

  const [sourceData, setSourceData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

  const escapeHTMLCallback = React.useCallback((value) => {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }, []);

  const formatNumber = React.useCallback((value) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return '-';
    return new Intl.NumberFormat('id-ID').format(num);
  }, []);

  React.useEffect(() => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${API_URL}/activity-plans/missed-summary`;
    const grid = gridRef.current ?? w2ui[GRID_NAME];

    setIsLoading(true);
    setLoadError(null);
    grid?.lock?.('Loading...', true);

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
        grid?.unlock?.();
      });

    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;
    if (isLoading) grid?.lock?.('Loading...', true);
    else grid?.unlock?.();
  }, [gridReadyTick, isLoading]);

  const rows = React.useMemo(() => {
    const list = Array.isArray(sourceData) ? sourceData : [];
    return list.map((item, index) => ({
      recid: index + 1,
      customer_name: item?.customer_name ?? '-',
      wilayah: item?.wilayah ?? item?.state ?? '-',
      sales_name: item?.sales_name ?? '-',
      visit_count: item?.visit_count ?? 0,
      follow_up_count: item?.follow_up_count ?? 0,
      tujuan: item?.tujuan ?? '-',
      status: item?.status ?? '-',
      plan_date: item?.plan_date ?? '-',
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
    return rows.filter((record) => {
      if (filters.wilayah !== 'ALL' && record.wilayah !== filters.wilayah) return false;
      if (filters.sales !== 'ALL' && record.sales_name !== filters.sales) return false;
      return true;
    });
  }, [filters, rows]);

  React.useEffect(() => {
    latestFilteredRowsRef.current = filteredRecords;
  }, [filteredRecords]);

  const renderSummaryTab = React.useCallback(() => {
    const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
    if (!summaryEl) return;

    const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];
    const totalVisit = currentRows.reduce((sum, row) => sum + (Number(row?.visit_count) || 0), 0);
    const totalFollowUp = currentRows.reduce((sum, row) => sum + (Number(row?.follow_up_count) || 0), 0);

    summaryEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div>Summary</div>
        ${
          loadError
            ? `<div style="color:#b42318; font-size:13px;">${escapeHTMLCallback(loadError)}</div>`
            : isLoading
              ? `<div style="color:#5b6775; font-size:13px;">Loading...</div>`
              : ''
        }
        <div style="display:grid; grid-template-columns: 1fr auto; gap:6px 10px; font-size:13px;">
          <div>Jumlah baris</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTMLCallback(
            formatNumber(currentRows.length),
          )}</div>
          <div>Total Visit</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTMLCallback(
            formatNumber(totalVisit),
          )}</div>
          <div>Total Follow Up</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTMLCallback(
            formatNumber(totalFollowUp),
          )}</div>
        </div>
      </div>
    `;
  }, [escapeHTMLCallback, formatNumber, isLoading, loadError]);

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
          toolbarSearch: true,
          toolbarColumns: true,
          toolbarReload: false,
        },
        searches: [
          { field: 'customer_name', text: 'Customer', type: 'text' },
          { field: 'wilayah', text: 'Wilayah', type: 'text' },
          { field: 'sales_name', text: 'Sales', type: 'text' },
        ],
        sortData: [{ field: 'recid', direction: 'asc' }],
        columnGroups: [
          { text: 'General Information', span: 3 },
          { text: 'Tujuan', span: 2 },
        ],
        columns: [
          { field: 'customer_name', text: 'Customer', size: '20%', sortable: true, resizable: true },
          { field: 'wilayah', text: 'Wilayah', size: '20%', sortable: true, resizable: true },
          { field: 'sales_name', text: 'Sales', size: '20%', sortable: true, resizable: true },
          { field: 'visit_count', text: 'Visit', size: '90px', sortable: true, resizable: true, attr: 'align=right' },
          { field: 'follow_up_count', text: 'Follow Up', size: '90px', sortable: true, resizable: true, attr: 'align=right' },
          { field: 'status', text: 'Status', size: '150px', sortable: true, resizable: true },
          { field: 'plan_date', text: 'Plan Date', size: '150px', sortable: true, resizable: true },
        ],
        records: [],
      });

      setGridReadyTick((v) => v + 1);

      const grid = gridRef.current;
      if (grid?.toolbar) {
        grid.toolbar.add([
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
          { type: 'button', id: 'tbReset', icon: TOOLBAR_ICONS.reset, hint: 'Reset Filter' },
        ]);

        grid.toolbar.on('click', (event) => {
          const target = String(event.target ?? '');
          if (!target) return;

          if (target === 'tbReset') {
            setFilters({
              wilayah: 'ALL',
              sales: 'ALL',
            });
            // Reset built-in search
            if (grid.searchData && grid.searchData.length > 0) {
              grid.searchReset();
            }
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
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();
      gridRef.current = null;
      layoutRef.current = null;
    };
  }, [setMainTab]);

  React.useEffect(() => {
    const tabId = String(activeMainTabRef.current || 'data');
    if (tabId === 'summary') renderSummaryTab();
  }, [filteredRecords, filters, renderSummaryTab]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const records = filteredRecords.map((record) => ({
      recid: record.recid,
      customer_name: record.customer_name,
      wilayah: record.wilayah,
      sales_name: record.sales_name,
      visit_count: record.visit_count,
      follow_up_count: record.follow_up_count,
      tujuan: record.tujuan,
      status: record.status,
      plan_date: record.plan_date,
    }));

    grid.clear();
    grid.add(records);
    grid.total = records.length;
    grid.refresh();
  }, [filteredRecords, gridReadyTick]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    grid.limit = rowsPerPage;
    grid.offset = page * rowsPerPage;
    grid.refresh();
  }, [gridReadyTick, page, rowsPerPage]);

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
      {isLoading && !loadError ? (
        <Box sx={{ mb: 1, color: 'text.secondary', fontSize: 13 }}>Loading...</Box>
      ) : null}
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
            background-color: rgba(107, 163, 208, 0.08);
            color: #6BA3D0;
          }

          .tv-report-sales .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab.active {
            background-color: rgba(107, 163, 208, 0.12);
            color: #6BA3D0 !important;
            border-bottom: 2px solid #6BA3D0 !important;
            font-weight: 400 !important;
          }

          .tv-report-sales .w2ui-tabs.w2ui-tabs-up .w2ui-scroll-wrapper .w2ui-tab.active {
            border-top: 2px solid #6BA3D0 !important;
          }

          .tv-report-sales .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab:focus {
            outline: 2px solid rgba(107, 163, 208, 0.45);
            outline-offset: 2px;
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
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-bulan {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-tahun {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-wilayah {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%202a7%207%200%200%200-7%207c0%205.2%207%2013%207%2013s7-7.8%207-13a7%207%200%200%200-7-7Zm0%209.5A2.5%202.5%200%201%201%2014.5%209A2.5%202.5%200%200%201%2012%2011.5Z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-sales {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%2012c2.21%200%204-1.79%204-4s-1.79-4-4-4-4%201.79-4%204%201.79%204%204%204zm0%202c-2.67%200-8%201.34-8%204v2h16v-2c0-2.66-5.33-4-8-4z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%2012c2.21%200%204-1.79%204-4s-1.79-4-4-4-4%201.79-4%204%201.79%204%204%204zm0%202c-2.67%200-8%201.34-8%204v2h16v-2c0-2.66-5.33-4-8-4z'%2F%3E%3C%2Fsvg%3E");
          }
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-reset {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%206V3l-4%204l4%204V8a4%204%200%201%201-4%204H6a6%206%200%201%200%206-6Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%206V3l-4%204l4%204V8a4%204%200%201%201-4%204H6a6%206%200%201%200%206-6Z'%2F%3E%3C%2Fsvg%3E");
          }
        `}
      </style>
      <Paper sx={{ width: '100%', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box ref={layoutBoxRef} sx={{ width: '100%', flex: 1, minHeight: 0 }} />
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
