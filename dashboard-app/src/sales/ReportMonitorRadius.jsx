import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { createRoot } from 'react-dom/client';
import { w2grid, w2layout, w2popup, w2ui, w2utils } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import { API_URL } from '../config/api';
import SummaryResult from './SummaryRadius';
import { exportMatrixToXlsx } from '../utils/exportToXlsx';
import { fetchWithAuth } from '../utils/fetchWithAuth';

const GRID_NAME = 'reportResultGrid';
const LAYOUT_NAME = 'reportResultLayout';
const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
  calendar: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z"/>
    </svg>
  `,
  map: `
    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
    </svg>
  `,
  radius: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 2a8 8 0 1 1-.001 16.001A8 8 0 0 1 12 4Zm0 3a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7Zm0 2a3 3 0 1 1-.001 6.001A3 3 0 0 1 12 9Z"/>
    </svg>
  `,
  photo: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2ZM5 5h14v10.17l-3.5-4.5-3.01 3.87-2.16-2.6L5 18.5V5Zm0 14 5.25-6.75 2.2 2.65 3.05-3.92L19 15.83V19H5Z"/>
    </svg>
  `,
  sales: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/>
    </svg>
  `,
  wilayah: `
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5"/>
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
  sales: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.sales}</span>`,
  wilayah: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.wilayah}</span>`,
  radius: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.radius}</span>`,
  reset: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.reset}</span>`,
  refresh: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.refresh}</span>`,
  export: `<span class="tv-w2ui-svg" aria-hidden="true">${TOOLBAR_SVGS.export}</span>`,
};

const ID_NUMBER = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const RADIUS_THRESHOLD_METERS = 200;

function toDateInputValue(date) {
  if (!(date instanceof Date)) return '';
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatIsoDateToDmyShort(isoDate) {
  const raw = String(isoDate ?? '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy.slice(2)}`;
}

function formatMaybeNumber(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return ID_NUMBER.format(n);
}

function parseMaybeNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes('.') ? raw : raw.replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
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

function buildMapsUrls(latRaw, lngRaw) {
  const lat = parseMaybeNumber(latRaw);
  const lng = parseMaybeNumber(lngRaw);
  if (lat == null || lng == null) return null;
  const q = `${lat},${lng}`;
  const openUrl = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed`;
  return { openUrl, embedUrl, label: q };
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
      field: 'plan_no',
      text: 'Plan No',
      size: '160px',
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
      field: 'maps_address',
      text: 'Maps Address',
      size: '100px',
      sortable: false,
      resizable: true,
      attr: 'style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"',
      render(record) {
        const urls = buildMapsUrls(record?.result_location_lat ?? null, record?.result_location_lng ?? null);
        if (!urls) return '-';
        const dataLat = escapeAttr(String(parseMaybeNumber(record?.result_location_lat)));
        const dataLng = escapeAttr(String(parseMaybeNumber(record?.result_location_lng)));
        return `
          <button type="button" class="tv-map-btn" data-lat="${dataLat}" data-lng="${dataLng}" title="Buka Maps" aria-label="Buka Maps">
            <span class="tv-map-btn__icon" aria-hidden="true">${TOOLBAR_SVGS.map}</span>
            <span class="tv-map-btn__text">Maps</span>
          </button>
        `.trim();
      },
    },
    {
      field: 'user_photo',
      text: 'Foto',
      size: '90px',
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
  const summaryRootRef = React.useRef(null);
  const toolbarInputsRef = React.useRef([]);
  const activeMainTabRef = React.useRef('data');
  const latestFilteredRowsRef = React.useRef([]);
  const latestFiltersRef = React.useRef(null);
  const abortRef = React.useRef(null);
  const requestIdRef = React.useRef(0);
  const [gridReadyTick, setGridReadyTick] = React.useState(0);
  const [activeMainTab, setActiveMainTab] = React.useState('data');

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [reloadTick, setReloadTick] = React.useState(0);

  const [filters, setFilters] = React.useState(() => ({
    query: '',
    sales: 'ALL',
    wilayah: 'ALL',
    radius: 'ALL', // ALL | IN_200 | OUT_200
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

    params.set('tujuan', 'Visit');

    const url = `${buildApiUrl('activity-plans/details')}?${params.toString()}`;

    setIsLoading(true);
    setLoadError(null);

    fetchWithAuth(url, {
      signal: controller.signal,
    })
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
  }, [filters.start_date, filters.end_date, filters.wilayah, reloadTick]);

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
    const list = Array.isArray(sourceData)
      ? sourceData.filter((item) => String(item?.tujuan ?? '').trim().toLowerCase() === 'visit')
      : [];
    return list.map((item, index) => ({
      id: index + 1,
      sales_name: item?.sales_name ?? '-',
      wilayah: item?.wilayah ?? item?.state ?? '-',
      customer_name: item?.customer_name ?? '-',
      plan_no: item?.plan_no ?? '-',
      plan_date: item?.plan_date ?? '-',
      tujuan: item?.tujuan ?? '-',
      result_location_lat: item?.result_location_lat ?? null,
      result_location_lng: item?.result_location_lng ?? null,
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
    const radiusFilter = String(filters.radius ?? 'ALL');

    return rows.filter((row) => {
      if (filters.sales !== 'ALL' && row.sales_name !== filters.sales) return false;
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) return false;

      if (radiusFilter !== 'ALL') {
        const radius = parseMaybeNumber(row.result_location_accuracy);
        if (radius == null) return false;
        if (radiusFilter === 'IN_200' && !(radius <= RADIUS_THRESHOLD_METERS)) return false;
        if (radiusFilter === 'OUT_200' && !(radius > RADIUS_THRESHOLD_METERS)) return false;
      }

      if (!normalizedQuery) return true;

      const haystack = `${row.sales_name} ${row.wilayah} ${row.customer_name} ${row.plan_no} ${row.plan_date} ${row.result}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, filters]);

  const pagedFilteredRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  React.useEffect(() => {
    latestFilteredRowsRef.current = filteredRows;
  }, [filteredRows]);

  React.useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  const exportCurrentRows = React.useCallback(() => {
    try {
      const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];
      const currentFilters = latestFiltersRef.current ?? {};
      const startDate = String(currentFilters?.start_date ?? '').trim() || 'all';
      const endDate = String(currentFilters?.end_date ?? '').trim() || 'all';

      exportMatrixToXlsx({
        fileName: `report-monitor-radius-${startDate}_${endDate}.xlsx`,
        sheetName: 'Monitor Radius',
        rows: [
          ['Sales', 'Wilayah', 'Customer', 'Plan No', 'Tanggal Visit', 'Radius', 'Result', 'Maps Address', 'Foto'],
          ...currentRows.map((row) => {
            const maps = buildMapsUrls(row?.result_location_lat ?? null, row?.result_location_lng ?? null);
            const photoUrl = normalizeHttpUrl(row?.user_photo ?? null);
            return [
              row?.sales_name ?? '',
              row?.wilayah ?? '',
              row?.customer_name ?? '',
              row?.plan_no ?? '',
              row?.plan_date ?? '',
              parseMaybeNumber(row?.result_location_accuracy) ?? '',
              row?.result ?? '',
              maps?.openUrl ?? '',
              photoUrl ?? '',
            ];
          }),
        ],
      });
    } catch (error) {
      console.error('Failed to export monitor radius report:', error);
    }
  }, []);

  const MAIN_DATA_ID = `${LAYOUT_NAME}__tab_data`;
  const MAIN_SUMMARY_ID = `${LAYOUT_NAME}__tab_summary`;

  const renderSummaryTab = React.useCallback(() => {
    const summaryEl = document.getElementById(MAIN_SUMMARY_ID);
    if (!summaryEl) return;

    const currentRows = Array.isArray(latestFilteredRowsRef.current) ? latestFilteredRowsRef.current : [];

    if (!summaryRootRef.current) {
      summaryRootRef.current = createRoot(summaryEl);
    }

    summaryRootRef.current.render(
      <SummaryResult rows={currentRows} filters={filters} isLoading={isLoading} loadError={loadError} />,
    );
  }, [MAIN_SUMMARY_ID, filters, isLoading, loadError]);

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
        sortData: [{ field: 'wilayah', direction: 'asc' }],
        columns: buildColumns(),
        records: [],
      });

      gridHostEl = dataHost;
      gridHostClickHandler = (e) => {
        const target = e?.target;
        if (!(target instanceof HTMLElement)) return;
        const mapBtn = target.closest?.('button.tv-map-btn');
        if (mapBtn) {
          const urls = buildMapsUrls(mapBtn.getAttribute('data-lat'), mapBtn.getAttribute('data-lng'));
          if (!urls) return;
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
          const width = Math.max(520, Math.min(980, viewportWidth - 40));
          const height = Math.max(420, Math.min(760, viewportHeight - 80));
          const src = escapeAttr(urls.embedUrl);
          const openUrl = escapeAttr(urls.openUrl);

          w2popup.open({
            title: `Maps (${urls.label})`,
            showMax: true,
            width,
            height,
            body: `
              <div class="tv-map-popup">
                <div class="tv-map-popup__actions">
                  <a class="tv-map-popup__link" href="${openUrl}" target="_blank" rel="noopener noreferrer">Buka di tab baru</a>
                </div>
                <iframe class="tv-map-popup__frame" src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
            `.trim(),
            actions: {
              Tutup() {
                w2popup.close();
              },
            },
          });
          return;
        }
        const btn = target.closest?.('button.tv-photo-btn');
        if (!btn) return;
        const url = btn.getAttribute('data-url');
        const safe = normalizeHttpUrl(url);
        if (!safe) return;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
        const width = Math.max(420, Math.min(960, viewportWidth - 40));
        const height = Math.max(320, Math.min(720, viewportHeight - 80));
        const src = escapeAttr(safe);

        w2popup.open({
          title: 'Foto',
          showMax: true,
          width,
          height,
          body: `
            <div class="tv-photo-popup">
              <img class="tv-photo-popup__img" src="${src}" alt="Foto" loading="lazy" />
            </div>
          `.trim(),
          actions: {
            Tutup() {
              w2popup.close();
            },
          },
        });
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
              <div class="tv-sales-toolbar-search" title="Cari sales / customer / plan no / address...">
                <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
                <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari sales / customer / plan no / address..." />
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
          {
            type: 'menu-radio',
            id: 'tbRadius',
            icon: TOOLBAR_ICONS.radius,
            text: 'Radius: Semua',
            selected: 'ALL',
            items: [
              { id: 'ALL', text: 'Semua', checked: true },
              { id: 'IN_200', text: `Dalam \u2264 ${RADIUS_THRESHOLD_METERS} m`, checked: false },
              { id: 'OUT_200', text: `Luar > ${RADIUS_THRESHOLD_METERS} m`, checked: false },
            ],
            },
            {
              type: 'html',
              id: 'tbDates',
             html: `
               <div class="tv-sales-toolbar-dates" title="Filter tanggal (maks 31 hari)">
                 <span class="tv-sales-toolbar-dates__label">Dari</span>
                 <div class="tv-sales-toolbar-datefield tv-sales-toolbar-datefield--icon">
                   <span class="tv-sales-toolbar-datefield__icon" aria-hidden="true">${TOOLBAR_SVGS.calendar}</span>
                   <input id="${GRID_NAME}__start_date" type="date" class="w2ui-input tv-sales-toolbar-dates__input tv-sales-toolbar-dates__native" />
                   <input id="${GRID_NAME}__start_date_display" type="text" class="w2ui-input tv-sales-toolbar-dates__input tv-sales-toolbar-dates__display" placeholder="dd-mm-yy" readonly tabindex="-1" aria-hidden="true" />
                 </div>
                 <span class="tv-sales-toolbar-dates__label">Sampai</span>
                 <div class="tv-sales-toolbar-datefield tv-sales-toolbar-datefield--icon">
                   <span class="tv-sales-toolbar-datefield__icon" aria-hidden="true">${TOOLBAR_SVGS.calendar}</span>
                   <input id="${GRID_NAME}__end_date" type="date" class="w2ui-input tv-sales-toolbar-dates__input tv-sales-toolbar-dates__native" />
                   <input id="${GRID_NAME}__end_date_display" type="text" class="w2ui-input tv-sales-toolbar-dates__input tv-sales-toolbar-dates__display" placeholder="dd-mm-yy" readonly tabindex="-1" aria-hidden="true" />
                 </div>
                </div>
              `,
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
              const now = new Date();
              const nextStart = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
             const nextEnd = toDateInputValue(now);
             setFilters({
               query: '',
               sales: 'ALL',
               wilayah: 'ALL',
               radius: 'ALL',
               start_date: nextStart,
               end_date: nextEnd,
             });
             const queryEl = document.getElementById(`${GRID_NAME}__query`);
             if (queryEl) queryEl.value = '';
             const startEl = document.getElementById(`${GRID_NAME}__start_date`);
             if (startEl) startEl.value = nextStart;
             const startDisplayEl = document.getElementById(`${GRID_NAME}__start_date_display`);
             if (startDisplayEl) startDisplayEl.value = formatIsoDateToDmyShort(nextStart);
             const endEl = document.getElementById(`${GRID_NAME}__end_date`);
             if (endEl) endEl.value = nextEnd;
             const endDisplayEl = document.getElementById(`${GRID_NAME}__end_date_display`);
             if (endDisplayEl) endDisplayEl.value = formatIsoDateToDmyShort(nextEnd);
             return;
           }

          if (!target.includes(':')) return;
          const [parentId, subIdRaw] = target.split(':');
          const subId = subIdRaw ?? '';

          if (parentId === 'tbSales') {
            setFilters((prev) => ({ ...prev, sales: subId === 'ALL' ? 'ALL' : subId }));
          }

          if (parentId === 'tbState') {
            setFilters((prev) => ({ ...prev, wilayah: subId === 'ALL' ? 'ALL' : subId }));
          }

          if (parentId === 'tbRadius') {
            const next =
              subId === 'IN_200' || subId === 'OUT_200'
                ? subId
                : 'ALL';
            setFilters((prev) => ({ ...prev, radius: next }));
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
           const startDisplayEl = document.getElementById(`${GRID_NAME}__start_date_display`);
           if (startDisplayEl) startDisplayEl.value = formatIsoDateToDmyShort(String(filters.start_date ?? ''));
           const endEl = document.getElementById(`${GRID_NAME}__end_date`);
           if (endEl) endEl.value = String(filters.end_date ?? '');
           const endDisplayEl = document.getElementById(`${GRID_NAME}__end_date_display`);
           if (endDisplayEl) endDisplayEl.value = formatIsoDateToDmyShort(String(filters.end_date ?? ''));

          attach(`${GRID_NAME}__query`, 'input', (e) => {
            setFilters((prev) => ({ ...prev, query: e.target.value }));
          });

           attach(`${GRID_NAME}__start_date`, 'change', (e) => {
             const next = e.target.value;
             const startDisplayEl = document.getElementById(`${GRID_NAME}__start_date_display`);
             if (startDisplayEl) startDisplayEl.value = formatIsoDateToDmyShort(next);
             setFilters((prev) => ({ ...prev, start_date: next }));
           });

           attach(`${GRID_NAME}__end_date`, 'change', (e) => {
             const next = e.target.value;
             const endDisplayEl = document.getElementById(`${GRID_NAME}__end_date_display`);
             if (endDisplayEl) endDisplayEl.value = formatIsoDateToDmyShort(next);
             setFilters((prev) => ({ ...prev, end_date: next }));
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
      summaryRootRef.current?.unmount?.();
      summaryRootRef.current = null;
      if (w2ui[GRID_NAME]) w2ui[GRID_NAME].destroy();
      if (w2ui[LAYOUT_NAME]) w2ui[LAYOUT_NAME].destroy();
      w2popup.close?.();
      gridRef.current = null;
      layoutRef.current = null;
    };
  }, [exportCurrentRows]);

  React.useEffect(() => {
    const tabId = String(activeMainTabRef.current || 'data');
    if (tabId === 'summary') renderSummaryTab();
  }, [filteredRows, filters, isLoading, loadError, sourceData, renderSummaryTab]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid) return;

    const records = pagedFilteredRows.map((row) => {
      return {
        recid: row.id,
        sales_name: row.sales_name,
        wilayah: row.wilayah,
        customer_name: row.customer_name,
        plan_no: row.plan_no,
        plan_date: row.plan_date,
        result_location_lat: row.result_location_lat,
        result_location_lng: row.result_location_lng,
        result_location_accuracy: row.result_location_accuracy,
        result: row.result,
        user_photo: row.user_photo,
      };
    });

    grid.clear();
    grid.add(records);
    grid.total = records.length;
    grid.refresh();
  }, [pagedFilteredRows, gridReadyTick]);

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

    const salesItems = [{ id: 'ALL', text: 'Semua', checked: filters.sales === 'ALL' }].concat(
      salesOptions.map((opt) => ({ id: opt, text: opt, checked: filters.sales === opt })),
    );

    const salesLabel = filters.sales === 'ALL' ? 'Semua' : String(filters.sales);
    const tbSales = grid.toolbar.get('tbSales');
    if (tbSales) {
      tbSales.items = salesItems;
      tbSales.selected = filters.sales;
      tbSales.text = `Sales: ${salesLabel}`;
      grid.toolbar.refresh('tbSales');
    }

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

    const radiusLabel =
      filters.radius === 'IN_200'
        ? `Dalam \u2264 ${RADIUS_THRESHOLD_METERS} m`
        : filters.radius === 'OUT_200'
          ? `Luar > ${RADIUS_THRESHOLD_METERS} m`
          : 'Semua';
    const tbRadius = grid.toolbar.get('tbRadius');
    if (tbRadius) {
      tbRadius.selected = filters.radius;
      tbRadius.items = [
        { id: 'ALL', text: 'Semua', checked: filters.radius === 'ALL' },
        { id: 'IN_200', text: `Dalam \u2264 ${RADIUS_THRESHOLD_METERS} m`, checked: filters.radius === 'IN_200' },
        { id: 'OUT_200', text: `Luar > ${RADIUS_THRESHOLD_METERS} m`, checked: filters.radius === 'OUT_200' },
      ];
      tbRadius.text = `Radius: ${radiusLabel}`;
      grid.toolbar.refresh('tbRadius');
    }
  }, [filters.sales, filters.wilayah, filters.radius, salesOptions, stateOptions, gridReadyTick]);

  React.useEffect(() => {
    const queryEl = document.getElementById(`${GRID_NAME}__query`);
    const nextQuery = String(filters.query ?? '');
    if (queryEl && queryEl.value !== nextQuery) queryEl.value = nextQuery;

    const startEl = document.getElementById(`${GRID_NAME}__start_date`);
    const nextStart = String(filters.start_date ?? '');
    if (startEl && startEl.value !== nextStart) startEl.value = nextStart;
    const startDisplayEl = document.getElementById(`${GRID_NAME}__start_date_display`);
    const nextStartDisplay = formatIsoDateToDmyShort(nextStart);
    if (startDisplayEl && startDisplayEl.value !== nextStartDisplay) startDisplayEl.value = nextStartDisplay;

    const endEl = document.getElementById(`${GRID_NAME}__end_date`);
    const nextEnd = String(filters.end_date ?? '');
    if (endEl && endEl.value !== nextEnd) endEl.value = nextEnd;
    const endDisplayEl = document.getElementById(`${GRID_NAME}__end_date_display`);
    const nextEndDisplay = formatIsoDateToDmyShort(nextEnd);
    if (endDisplayEl && endDisplayEl.value !== nextEndDisplay) endDisplayEl.value = nextEndDisplay;
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
            background-color: rgba(47, 111, 178, 0.08);
            color: #2F6FB2;
          }

          .tv-report-customers .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab.active {
            background-color: rgba(47, 111, 178, 0.12);
            color: #2F6FB2 !important;
            border-bottom: 2px solid #2F6FB2 !important;
            font-weight: 400 !important;
          }

          .tv-report-customers .w2ui-tabs.w2ui-tabs-up .w2ui-scroll-wrapper .w2ui-tab.active {
            border-top: 2px solid #2F6FB2 !important;
          }

          .tv-report-customers .w2ui-tabs .w2ui-scroll-wrapper .w2ui-tab:focus {
            outline: 2px solid rgba(47, 111, 178, 0.45);
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
          .tv-sales-toolbar-datefield {
            position: relative;
            display: inline-block;
          }
          .tv-sales-toolbar-datefield__icon {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            line-height: 1;
            pointer-events: none;
            z-index: 3;
          }
          .tv-sales-toolbar-datefield__icon svg {
            display: block;
            width: 14px;
            height: 14px;
            color: #8d99a7;
          }
          .tv-sales-toolbar-dates__native {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 2;
          }
          .tv-sales-toolbar-dates__display {
            position: relative;
            z-index: 1;
            pointer-events: none;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
          }
          .tv-sales-toolbar-datefield--icon .tv-sales-toolbar-dates__display {
            padding-right: 26px;
          }
          .tv-sales-toolbar-datefield:focus-within .tv-sales-toolbar-dates__display {
            outline: 2px solid rgba(47, 111, 178, 0.45);
            outline-offset: 1px;
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
            background: rgba(47, 111, 178, 0.08);
            border-color: rgba(47, 111, 178, 0.6);
            color: #1f2937;
          }
          .tv-photo-popup {
            width: 100%;
            height: 100%;
            padding: 12px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0b1220;
          }
          .tv-photo-popup__img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 10px;
            background: #111827;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          }
          .tv-map-btn {
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
            flex: 0 0 auto;
          }
          .tv-map-btn__icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .tv-map-btn svg {
            display: block;
            width: 16px;
            height: 16px;
          }
          .tv-map-btn__text {
            font-size: 12px;
            line-height: 1;
          }
          .tv-map-btn:hover {
            background: rgba(47, 111, 178, 0.08);
            border-color: rgba(47, 111, 178, 0.6);
            color: #1f2937;
          }
          .tv-map-popup {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: #0b1220;
          }
          .tv-map-popup__actions {
            padding: 10px 12px;
            background: #0b1220;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .tv-map-popup__link {
            color: #93c5fd;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
          }
          .tv-map-popup__link:hover {
            text-decoration: underline;
          }
          .tv-map-popup__frame {
            width: 100%;
            height: 100%;
            border: 0;
            flex: 1;
            background: #0b1220;
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
