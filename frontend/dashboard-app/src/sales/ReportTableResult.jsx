import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { w2grid, w2layout, w2ui, w2utils } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import { API_URL } from '../config/api';

const GRID_NAME = 'reportResultGrid';
const LAYOUT_NAME = 'reportResultLayout';
const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
  photo: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2ZM5 5h14v10.17l-3.5-4.5-3.01 3.87-2.16-2.6L5 18.5V5Zm0 14 5.25-6.75 2.2 2.65 3.05-3.92L19 15.83V19H5Z"/>
    </svg>
  `,
};

const TOOLBAR_ICONS = {
  wilayah: 'tv-w2-icon tv-w2-icon-wilayah',
  reset: 'tv-w2-icon tv-w2-icon-reset',
};

const ID_NUMBER = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

function toDateInputValue(date) {
  if (!(date instanceof Date)) return '';
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMaybeNumber(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return ID_NUMBER.format(n);
}

function normalizeHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildApiUrl(pathname) {
  const base = String(API_URL ?? '').replace(/\/+$/, '');
  const cleanPath = String(pathname ?? '').replace(/^\/+/, '');
  if (!base) return `/${cleanPath}`;

  // Make this component tolerant when API_URL is configured with or without "/api".
  const baseHasApi = /\/api$/i.test(base);
  const prefix = baseHasApi ? base : `${base}/api`;
  return `${prefix}/${cleanPath}`;
}

function buildColumns() {
  const base = [
    {
      field: 'sales_name',
      text: 'Sales',
      size: '140px',
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
      field: 'customer_name',
      text: 'Customer',
      size: '450px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
    },
    {
      field: 'plan_date',
      text: 'Tanggal Visit',
      size: '220px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
    },
    {
      field: 'result_location_accuracy',
      text: 'Radius',
      size: '120px',
      sortable: true,
      resizable: true,
      attr: 'align=right style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
      render(record) {
        return formatMaybeNumber(record?.result_location_accuracy ?? null);
      },
    },
    {
      field: 'result',
      text: 'Result',
      size: '450px',
      sortable: true,
      resizable: true,
      attr: 'style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
    },
    {
      field: 'user_photo',
      text: 'Foto',
      size: '100px',
      sortable: true,
      resizable: true,
      attr: 'style="text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
      render(record) {
        const safe = normalizeHttpUrl(record?.user_photo ?? null);
        if (!safe) return '';
        const href = escapeAttr(safe);
        return `
          <button type="button" class="tv-photo-btn" data-url="${href}" title="Lihat foto" aria-label="Lihat foto">
            <span class="tv-photo-btn__icon" aria-hidden="true">${TOOLBAR_SVGS.photo}</span>
            <span class="tv-photo-btn__text">Foto</span>
          </button>
        `.trim();
      },
    },
  ];

  return base;
}

export default function ReportTableResult() {
  const layoutBoxRef = React.useRef(null);
  const lockBoxRef = React.useRef(null);
  const layoutRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const toolbarInputsRef = React.useRef([]);
  const activeMainTabRef = React.useRef('data');
  const latestFilteredRowsRef = React.useRef([]);
  const abortRef = React.useRef(null);
  const requestIdRef = React.useRef(0);
  const [gridReadyTick, setGridReadyTick] = React.useState(0);
  const [activeMainTab, setActiveMainTab] = React.useState('data');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [filters, setFilters] = React.useState(() => ({
    query: '',
    wilayah: 'ALL',
    start_date: toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end_date: toDateInputValue(new Date()),
  }));

  const [sourceData, setSourceData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

  React.useEffect(() => {
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    const startDate = String(filters.start_date ?? '').trim();
    const endDate = String(filters.end_date ?? '').trim();

    if (filters.wilayah && filters.wilayah !== 'ALL') {
      params.set('state', String(filters.wilayah));
    }

    if (startDate) {
      params.set('start_date', startDate);
    }

    if (endDate) {
      params.set('end_date', endDate);
    }

    const url = `${buildApiUrl('activity-plans/details')}?${params.toString()}`;

    setIsLoading(true);
    setLoadError(null);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          const message = body?.message || `Request failed (${response.status})`;
          const extraErrors = body?.errors
            ? Object.values(body.errors)
                .flat()
                .filter(Boolean)
                .join(' ')
            : null;
          const extra = extraErrors || body?.error || null;
          const baseMsg = extra ? `${message}: ${extra}` : message;
          throw new Error(`${baseMsg} | ${url}`);
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
        console.error('Failed to load activity details:', err);
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
  }, [filters.start_date, filters.end_date, filters.wilayah]);

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
      id: index + 1,
      sales_name: item?.sales_name ?? '-',
      wilayah: item?.wilayah ?? item?.state ?? '-',
      customer_name: item?.customer_name ?? '-',
      plan_date: item?.plan_date ?? '-',
      result_location_accuracy: item?.result_location_accuracy ?? null,
      result: item?.result == null || item?.result === '' ? '-' : item.result,
      user_photo: item?.user_photo ?? null,
    }));
  }, [sourceData]);

  const stateOptions = React.useMemo(() => {
    const unique = new Set();
    for (const row of rows) {
      if (row.wilayah && row.wilayah !== '-') unique.add(row.wilayah);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase();

    return rows.filter((row) => {
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) return false;

      if (!normalizedQuery) return true;

      const haystack = `${row.sales_name} ${row.wilayah} ${row.customer_name} ${row.plan_date} ${row.result}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, filters]);

  React.useEffect(() => {
    latestFilteredRowsRef.current = filteredRows;
  }, [filteredRows]);

  const MAIN_DATA_ID = `${LAYOUT_NAME}__tab_data`;
  const MAIN_SUMMARY_ID = `${LAYOUT_NAME}__tab_summary`;

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

    const radiusStats = currentRows.reduce(
      (acc, row) => {
        const n = typeof row?.result_location_accuracy === 'number' ? row.result_location_accuracy : Number(row?.result_location_accuracy);
        if (Number.isFinite(n)) {
          acc.sum += n;
          acc.count += 1;
        }
        return acc;
      },
      { sum: 0, count: 0 },
    );

    const photoCount = currentRows.reduce((acc, row) => (row?.user_photo ? acc + 1 : acc), 0);

    const headerNote = loadError
      ? `<div style="margin-bottom:10px; color:#b42318;">${escapeHTML(loadError)}</div>`
      : isLoading
        ? `<div style="margin-bottom:10px; color:#6b7685;">Loading...</div>`
        : '';

    const startDate = String(filters.start_date ?? '').trim();
    const endDate = String(filters.end_date ?? '').trim();
    const periodLabel =
      startDate && endDate ? `${startDate} s/d ${endDate}` : startDate ? `Dari ${startDate}` : endDate ? `Sampai ${endDate}` : 'Semua';
    const stateLabel = filters.wilayah === 'ALL' ? 'Semua' : String(filters.wilayah);
    const avgRadius = radiusStats.count > 0 ? radiusStats.sum / radiusStats.count : null;

    summaryEl.innerHTML = `
      ${headerNote}
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div>Summary</div>
        <div style="display:grid; grid-template-columns: 1fr auto; gap:6px 10px; font-size:13px;">
          <div>Periode</div>
          <div style="text-align:right;">${escapeHTML(periodLabel)}</div>

          <div>Wilayah</div>
          <div style="text-align:right;">${escapeHTML(stateLabel)}</div>

          <div>Jumlah baris</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(
            formatNumber(currentRows.length),
          )}</div>

          <div>Rata-rata radius</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(
            avgRadius == null ? '-' : formatMaybeNumber(avgRadius),
          )}</div>

          <div>Foto tersedia</div>
          <div style="text-align:right; font-variant-numeric: tabular-nums;">${escapeHTML(formatNumber(photoCount))}</div>
        </div>
      </div>
    `;
  }, [MAIN_SUMMARY_ID, escapeHTML, formatNumber, filters.end_date, filters.start_date, filters.wilayah, isLoading, loadError]);

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
    let gridHostEl = null;
    let gridHostClickHandler = null;

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
        sortData: [{ field: 'wilayah', direction: 'asc' }],
        columns: buildColumns(),
        records: [],
      });

      gridHostEl = dataHost;
      gridHostClickHandler = (e) => {
        const target = e?.target;
        if (!(target instanceof HTMLElement)) return;
        const btn = target.closest?.('button.tv-photo-btn');
        if (!btn) return;
        const url = btn.getAttribute('data-url');
        const safe = normalizeHttpUrl(url);
        if (!safe) return;
        window.open(safe, '_blank', 'noopener,noreferrer');
      };
      gridHostEl.addEventListener('click', gridHostClickHandler);

      setGridReadyTick((v) => v + 1);

      const grid = gridRef.current;
      if (grid?.toolbar) {
        grid.toolbar.add([
          {
            type: 'html',
            id: 'tbQuery',
            html: `
              <div class="tv-sales-toolbar-search" title="Cari sales / customer / result...">
                <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
                <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari sales / customer / result..." />
              </div>
            `,
          },
          {
            type: 'html',
            id: 'tbDates',
            html: `
              <div class="tv-sales-toolbar-dates" title="Filter tanggal (maks 31 hari)">
                <span class="tv-sales-toolbar-dates__label">Dari</span>
                <input id="${GRID_NAME}__start_date" type="date" class="w2ui-input tv-sales-toolbar-dates__input" />
                <span class="tv-sales-toolbar-dates__label">Sampai</span>
                <input id="${GRID_NAME}__end_date" type="date" class="w2ui-input tv-sales-toolbar-dates__input" />
              </div>
            `,
          },
          { type: 'break', id: 'tbBreak1' },
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
            const now = new Date();
            setFilters({
              query: '',
              wilayah: 'ALL',
              start_date: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
              end_date: toDateInputValue(now),
            });
            const queryEl = document.getElementById(`${GRID_NAME}__query`);
            if (queryEl) queryEl.value = '';
            const startEl = document.getElementById(`${GRID_NAME}__start_date`);
            if (startEl) startEl.value = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
            const endEl = document.getElementById(`${GRID_NAME}__end_date`);
            if (endEl) endEl.value = toDateInputValue(now);
            return;
          }

          if (!target.includes(':')) return;
          const [parentId, subIdRaw] = target.split(':');
          const subId = subIdRaw ?? '';

          if (parentId === 'tbState') {
            setFilters((prev) => ({ ...prev, wilayah: subId === 'ALL' ? 'ALL' : subId }));
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
          if (queryEl) queryEl.value = String(filters.query ?? '');
          const startEl = document.getElementById(`${GRID_NAME}__start_date`);
          if (startEl) startEl.value = String(filters.start_date ?? '');
          const endEl = document.getElementById(`${GRID_NAME}__end_date`);
          if (endEl) endEl.value = String(filters.end_date ?? '');

          attach(`${GRID_NAME}__query`, 'input', (e) => {
            setFilters((prev) => ({ ...prev, query: e.target.value }));
          });

          attach(`${GRID_NAME}__start_date`, 'change', (e) => {
            setFilters((prev) => ({ ...prev, start_date: e.target.value }));
          });

          attach(`${GRID_NAME}__end_date`, 'change', (e) => {
            setFilters((prev) => ({ ...prev, end_date: e.target.value }));
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
      if (gridHostEl && gridHostClickHandler) {
        gridHostEl.removeEventListener('click', gridHostClickHandler);
      }
      for (const { el, eventName, handler } of toolbarInputsRef.current) {
        el.removeEventListener(eventName, handler);
      }
      toolbarInputsRef.current = [];
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();
      gridRef.current = null;
      layoutRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const tabId = String(activeMainTabRef.current || 'data');
    if (tabId === 'summary') renderSummaryTab();
  }, [filteredRows, filters, isLoading, loadError, sourceData, renderSummaryTab]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const records = filteredRows.map((row) => {
      return {
        recid: row.id,
        sales_name: row.sales_name,
        wilayah: row.wilayah,
        customer_name: row.customer_name,
        plan_date: row.plan_date,
        result_location_accuracy: row.result_location_accuracy,
        result: row.result,
        user_photo: row.user_photo,
      };
    });

    grid.clear();
    grid.add(records);
    grid.total = records.length;
    grid.refresh();
  }, [filteredRows, gridReadyTick]);

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

    const stateItems = [{ id: 'ALL', text: 'Semua', checked: filters.wilayah === 'ALL' }].concat(
      stateOptions.map((opt) => ({ id: opt, text: opt, checked: filters.wilayah === opt })),
    );

    const stateLabel = filters.wilayah === 'ALL' ? 'Semua' : String(filters.wilayah);
    const tbState = grid.toolbar.get('tbState');
    if (tbState) {
      tbState.items = stateItems;
      tbState.selected = filters.wilayah;
      tbState.text = `Wilayah: ${stateLabel}`;
      grid.toolbar.refresh('tbState');
    }
  }, [filters.wilayah, stateOptions, gridReadyTick]);

  React.useEffect(() => {
    const queryEl = document.getElementById(`${GRID_NAME}__query`);
    const nextQuery = String(filters.query ?? '');
    if (queryEl && queryEl.value !== nextQuery) queryEl.value = nextQuery;

    const startEl = document.getElementById(`${GRID_NAME}__start_date`);
    const nextStart = String(filters.start_date ?? '');
    if (startEl && startEl.value !== nextStart) startEl.value = nextStart;

    const endEl = document.getElementById(`${GRID_NAME}__end_date`);
    const nextEnd = String(filters.end_date ?? '');
    if (endEl && endEl.value !== nextEnd) endEl.value = nextEnd;
  }, [filters.end_date, filters.query, filters.start_date, gridReadyTick]);

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

          .tv-sales-toolbar-dates {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 30px;
            padding: 0 6px;
            white-space: nowrap;
            transform: translateY(-2px);
          }
          .tv-sales-toolbar-dates__label {
            font-size: 12px;
            color: #5b6775;
          }
          .tv-sales-toolbar-dates__input {
            height: 26px;
            line-height: 26px;
            padding: 0 6px;
            width: 140px;
            box-sizing: border-box;
          }

          .tv-photo-btn {
            height: 24px;
            padding: 0 10px;
            border: 1px solid #cfd6de;
            border-radius: 6px;
            background: #fff;
            color: #5b6775;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            line-height: 1;
          }
          .tv-photo-btn__icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .tv-photo-btn svg {
            display: block;
            width: 16px;
            height: 16px;
          }
          .tv-photo-btn__text {
            font-size: 12px;
            line-height: 1;
          }
          .tv-photo-btn:hover {
            background: rgba(107, 163, 208, 0.08);
            border-color: rgba(107, 163, 208, 0.6);
            color: #1f2937;
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
