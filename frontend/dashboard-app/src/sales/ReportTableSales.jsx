import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { isValid, parseISO } from 'date-fns';
import { w2grid, w2ui } from 'w2ui';
import 'w2ui/w2ui-2.0.min.css';
import dummyTableSales from './dummyTableSales.json';

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

const GRID_NAME = 'reportSalesGrid';
const DEFAULT_FILTERS = {
  query: '',
  sales: 'ALL',
  wilayah: 'ALL',
  month: 'ALL',
  year: 'ALL',
};
const TOOLBAR_SVGS = {
  search: `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L19 20.49L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"/>
    </svg>
  `,
};

const TOOLBAR_ICONS = {
  sales: 'tv-w2-icon tv-w2-icon-sales',
  wilayah: 'tv-w2-icon tv-w2-icon-wilayah',
  month: 'tv-w2-icon tv-w2-icon-month',
  year: 'tv-w2-icon tv-w2-icon-year',
  reset: 'tv-w2-icon tv-w2-icon-reset',
};

export default function DataTableSales() {
  const gridBoxRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const queryInputRef = React.useRef(null);
  const [filters, setFilters] = React.useState(DEFAULT_FILTERS);

  const rows = React.useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    return (Array.isArray(dummyTableSales) ? dummyTableSales : []).map((item, index) => {
      const tujuan = String(item?.tujuan ?? '').toLowerCase();
      const status = String(item?.status ?? '').toLowerCase();

      return {
        id: index + 1,
        sales: item?.sales_name ?? '-',
        wilayah: item?.state ?? '-',
        customer: item?.customer_name ?? '-',
        visit: tujuan.includes('visit') ? 1 : 0,
        followUp: tujuan.includes('follow') ? 1 : 0,
        missed: status.includes('miss') ? 1 : 0,
        planDate: item?.plan_date ?? todayISO,
        planMonth: (() => {
          const parsed = parseISO(String(item?.plan_date ?? todayISO));
          if (!isValid(parsed)) return null;
          return parsed.getMonth();
        })(),
        planYear: (() => {
          const parsed = parseISO(String(item?.plan_date ?? todayISO));
          if (!isValid(parsed)) return null;
          return parsed.getFullYear();
        })(),
      };
    });
  }, []);

  const salesOptions = React.useMemo(() => {
    const unique = new Set();
    for (const row of rows) {
      if (row.sales && row.sales !== '-') unique.add(row.sales);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [rows]);

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
      if (filters.sales !== 'ALL' && row.sales !== filters.sales) return false;
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) return false;

      if (filters.year !== 'ALL' || filters.month !== 'ALL') {
        if (row.planYear == null || row.planMonth == null) return false;
        if (filters.year !== 'ALL' && row.planYear !== Number(filters.year)) return false;
        if (filters.month !== 'ALL' && row.planMonth !== Number(filters.month)) return false;
      }

      if (!normalizedQuery) return true;
      const haystack = `${row.sales} ${row.wilayah} ${row.customer}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, filters]);

  React.useEffect(() => {
    if (!gridBoxRef.current) return;

    if (w2ui[GRID_NAME]) {
      w2ui[GRID_NAME].destroy();
    }

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
      sortData: [{ field: 'sales', direction: 'asc' }],
      columnGroups: [
        { text: '', span: 3 },
        { text: 'Tujuan', span: 2 },
        { text: '', span: 3 },
      ],
      columns: [
        { field: 'sales', text: 'sales', size: '140px', sortable: true, resizable: true },
        { field: 'wilayah', text: 'wilayah', size: '140px', sortable: true, resizable: true },
        { field: 'customer', text: 'customer', size: '40%', sortable: true, resizable: true },
        { field: 'visit', text: 'visit', size: '90px', sortable: true, resizable: true, attr: 'align=center' },
        {
          field: 'followUp',
          text: 'follow up',
          size: '110px',
          sortable: true,
          resizable: true,
          attr: 'align=center',
        },
        { field: 'missed', text: 'missed', size: '90px', sortable: true, resizable: true, attr: 'align=center' },
        { field: 'planDate', text: 'plan date', size: '120px', sortable: true, resizable: true },
      ],
      records: [],
    });

    const grid = gridRef.current;
    if (grid?.toolbar) {
      grid.toolbar.add([
        {
          type: 'html',
          id: 'tbQuery',
          html: `
            <div class="tv-sales-toolbar-search" title="Cari sales / wilayah / customer...">
              <span class="tv-sales-toolbar-search__icon" aria-hidden="true">${TOOLBAR_SVGS.search}</span>
              <input id="${GRID_NAME}__query" class="w2ui-input tv-sales-toolbar-search__input" placeholder="Cari sales / wilayah / customer..." />
            </div>
          `,
        },
        { type: 'break', id: 'tbBreak1' },
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
          id: 'tbMonth',
          icon: TOOLBAR_ICONS.month,
          text: 'Bulan: Semua',
          selected: 'ALL',
          items: [{ id: 'ALL', text: 'Semua', checked: true }],
        },
        {
          type: 'menu-radio',
          id: 'tbYear',
          icon: TOOLBAR_ICONS.year,
          text: 'Tahun: Semua',
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
          setFilters(DEFAULT_FILTERS);
          const input = document.getElementById(`${GRID_NAME}__query`);
          if (input) input.value = '';
          return;
        }

        if (!target.includes(':')) return;
        const [parentId, subIdRaw] = target.split(':');
        const subId = subIdRaw ?? 'ALL';

        if (parentId === 'tbSales') {
          setFilters((prev) => ({ ...prev, sales: subId === 'ALL' ? 'ALL' : subId }));
        } else if (parentId === 'tbState') {
          setFilters((prev) => ({ ...prev, wilayah: subId === 'ALL' ? 'ALL' : subId }));
        } else if (parentId === 'tbMonth') {
          setFilters((prev) => ({ ...prev, month: subId === 'ALL' ? 'ALL' : Number(subId) }));
        } else if (parentId === 'tbYear') {
          setFilters((prev) => ({ ...prev, year: subId === 'ALL' ? 'ALL' : Number(subId) }));
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

    const records = filteredRows.map((row) => ({
      recid: row.id,
      sales: row.sales,
      wilayah: row.wilayah,
      customer: row.customer,
      visit: row.visit,
      followUp: row.followUp,
      missed: row.missed,
      planDate: row.planDate,
    }));

    grid.clear();
    grid.add(records);
    grid.refresh();
  }, [filteredRows]);

  React.useEffect(() => {
    const grid = gridRef.current ?? w2ui[GRID_NAME];
    if (!grid?.toolbar) return;

    const monthItems = [{ id: 'ALL', text: 'Semua', checked: filters.month === 'ALL' }].concat(
      MONTH_LABELS.map((label, monthIndex) => ({
        id: monthIndex,
        text: label,
        checked: Number(filters.month) === monthIndex,
      })),
    );

    const salesItems = [{ id: 'ALL', text: 'Semua', checked: filters.sales === 'ALL' }].concat(
      salesOptions.map((opt) => ({ id: opt, text: opt, checked: filters.sales === opt })),
    );

    const stateItems = [{ id: 'ALL', text: 'Semua', checked: filters.wilayah === 'ALL' }].concat(
      stateOptions.map((opt) => ({ id: opt, text: opt, checked: filters.wilayah === opt })),
    );

    const yearItems = [{ id: 'ALL', text: 'Semua', checked: filters.year === 'ALL' }].concat(
      yearOptions.map((year) => ({ id: year, text: String(year), checked: Number(filters.year) === year })),
    );

    const salesLabel = filters.sales === 'ALL' ? 'Semua' : String(filters.sales);
    const stateLabel = filters.wilayah === 'ALL' ? 'Semua' : String(filters.wilayah);
    const monthLabel =
      filters.month === 'ALL' ? 'Semua' : MONTH_LABELS[Number(filters.month)] ?? String(filters.month);
    const yearLabel = filters.year === 'ALL' ? 'Semua' : String(filters.year);

    const tbSales = grid.toolbar.get('tbSales');
    if (tbSales) {
      tbSales.items = salesItems;
      tbSales.selected = filters.sales;
      tbSales.text = `Sales: ${salesLabel}`;
      grid.toolbar.refresh('tbSales');
    }

    const tbState = grid.toolbar.get('tbState');
    if (tbState) {
      tbState.items = stateItems;
      tbState.selected = filters.wilayah;
      tbState.text = `Wilayah: ${stateLabel}`;
      grid.toolbar.refresh('tbState');
    }

    const tbMonth = grid.toolbar.get('tbMonth');
    if (tbMonth) {
      tbMonth.items = monthItems;
      tbMonth.selected = filters.month;
      tbMonth.text = `Bulan: ${monthLabel}`;
      grid.toolbar.refresh('tbMonth');
    }

    const tbYear = grid.toolbar.get('tbYear');
    if (tbYear) {
      tbYear.items = yearItems;
      tbYear.selected = filters.year;
      tbYear.text = `Tahun: ${yearLabel}`;
      grid.toolbar.refresh('tbYear');
    }
  }, [filters.sales, filters.wilayah, filters.month, filters.year, salesOptions, stateOptions, yearOptions]);

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
          .w2ui-toolbar .w2ui-tb-button .w2ui-tb-icon.tv-w2-icon-sales {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%2012a4%204%200%201%200-4-4a4%204%200%200%200%204%204Zm0%202c-4.4%200-8%202.2-8%205v1h16v-1c0-2.8-3.6-5-8-5Z'%2F%3E%3C%2Fsvg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cpath%20d%3D'M12%2012a4%204%200%201%200-4-4a4%204%200%200%200%204%204Zm0%202c-4.4%200-8%202.2-8%205v1h16v-1c0-2.8-3.6-5-8-5Z'%2F%3E%3C%2Fsvg%3E");
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
