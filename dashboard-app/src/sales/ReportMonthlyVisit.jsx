import * as React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { API_URL } from '../config/api'
import DataTable, { buildPaginationModel } from './DataTable'
import FilterMonthlyVisit from './FilterMonthlyVisit'
import { exportMatrixToXlsx } from '../utils/exportToXlsx'
import { fetchWithAuth } from '../utils/fetchWithAuth'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const IDENTITY_GROUP = { key: 'identity', label: 'General Information' }
const SUMMARY_GROUP = { key: 'summary', label: 'Done' }
const EMPTY_GROUP = { key: 'missed-empty', label: '' }

function buildApiUrl(pathname) {
  const base = String(API_URL ?? '').replace(/\/+$/, '')
  const cleanPath = String(pathname ?? '').replace(/^\/+/, '')

  if (!base) {
    return `/${cleanPath}`
  }

  const baseHasApi = /\/api$/i.test(base)
  const prefix = baseHasApi ? base : `${base}/api`
  return `${prefix}/${cleanPath}`
}

function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parsePeriod(period) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period ?? ''))
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

export default function ReportMonthlyVisit() {
  const [filters, setFilters] = React.useState({
    query: '',
    wilayah: 'ALL',
    sales: 'ALL',
  })
  const [period, setPeriod] = React.useState(getCurrentPeriod())
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(25)
  const [reloadTick, setReloadTick] = React.useState(0)
  const [sourceData, setSourceData] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(null)

  React.useEffect(() => {
    const pageContent = document.querySelector('.page-content')
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousPageContentOverflow = pageContent?.style.overflow ?? ''

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    if (pageContent) {
      pageContent.style.overflow = 'hidden'
    }

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow

      if (pageContent) {
        pageContent.style.overflow = previousPageContentOverflow
      }
    }
  }, [])

  React.useEffect(() => {
    const parsed = parsePeriod(period) ?? parsePeriod(getCurrentPeriod())
    const month = parsed?.month ?? new Date().getMonth() + 1
    const year = parsed?.year ?? new Date().getFullYear()
    const controller = new AbortController()
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    })
    const url = `${buildApiUrl('activity-plans/monthly-visit')}?${params.toString()}`

    setIsLoading(true)
    setLoadError(null)

    fetchWithAuth(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(body?.message || `Request failed (${response.status})`)
        }

        if (body?.success !== true || !Array.isArray(body?.data)) {
          throw new Error(body?.message || 'Invalid response from server')
        }

        setSourceData(body.data)
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }

        console.error('Failed to load monthly visit report:', error)
        setSourceData([])
        setLoadError(error?.message || 'Failed to load data')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [period, reloadTick])

  const rows = React.useMemo(
    () =>
      (Array.isArray(sourceData) ? sourceData : []).map((item, index) => ({
        id: index + 1,
        sales_name: item?.sales_name ?? '-',
        wilayah: item?.wilayah ?? item?.state ?? '-',
        customer_name: item?.customer_name ?? '-',
        visit_count: item?.done_visit_count ?? item?.visit_count ?? 0,
        follow_up_count: item?.done_follow_up_count ?? item?.follow_up_count ?? 0,
        missed_count: item?.missed_count ?? item?.missed ?? 0,
      })),
    [sourceData],
  )

  const stateOptions = React.useMemo(() => {
    const unique = new Set()

    for (const row of rows) {
      if (row.wilayah && row.wilayah !== '-') {
        unique.add(row.wilayah)
      }
    }

    return Array.from(unique).sort((left, right) => left.localeCompare(right))
  }, [rows])

  const salesOptions = React.useMemo(() => {
    const unique = new Set()

    for (const row of rows) {
      if (row.sales_name && row.sales_name !== '-') {
        unique.add(row.sales_name)
      }
    }

    return Array.from(unique).sort((left, right) => left.localeCompare(right))
  }, [rows])

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase()

    return rows.filter((row) => {
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) {
        return false
      }

      if (filters.sales !== 'ALL' && row.sales_name !== filters.sales) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack =
        `${row.customer_name} ${row.wilayah} ${row.sales_name}`.trim().toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [filters, rows])

  React.useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1)

    if (page > maxPage) {
      setPage(0)
    }
  }, [filteredRows.length, page, rowsPerPage])

  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page, rowsPerPage])

  const pagination = React.useMemo(
    () =>
      buildPaginationModel({
        totalItems: filteredRows.length,
        page,
        pageSize: rowsPerPage,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        label: 'data',
        onPageChange: setPage,
        onPageSizeChange: (nextPageSize) => {
          setRowsPerPage(Number.isFinite(nextPageSize) && nextPageSize > 0 ? nextPageSize : 25)
          setPage(0)
        },
      }),
    [filteredRows.length, page, rowsPerPage],
  )

  const columns = React.useMemo(
    () => [
      { key: 'sales_name', header: 'Sales', group: IDENTITY_GROUP },
      { key: 'wilayah', header: 'Wilayah', group: IDENTITY_GROUP },
      { key: 'customer_name', header: 'Customer', group: IDENTITY_GROUP },
      { key: 'visit_count', header: 'Visit', align: 'right', group: SUMMARY_GROUP },
      {
        key: 'follow_up_count',
        header: 'Follow Up',
        align: 'right',
        group: SUMMARY_GROUP,
      },
      { key: 'missed_count', header: 'Missed', align: 'right', group: EMPTY_GROUP },
    ],
    [],
  )

  const exportCurrentRows = React.useCallback(() => {
    try {
      const currentPeriod = String(period).trim() || getCurrentPeriod()

      exportMatrixToXlsx({
        fileName: `report-monthly-visit-${currentPeriod}.xlsx`,
        sheetName: 'Monthly Visit',
        rows: [
          ['General Information', '', '', 'Done', '', ''],
          ['Sales', 'Wilayah', 'Customer', 'Visit', 'Follow Up', 'Missed'],
          ...filteredRows.map((row) => [
            row.sales_name,
            row.wilayah,
            row.customer_name,
            row.visit_count,
            row.follow_up_count,
            row.missed_count,
          ]),
        ],
        merges: [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
          { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } },
        ],
      })
    } catch (error) {
      console.error('Failed to export monthly visit report:', error)
    }
  }, [filteredRows, period])

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
      className="tv-report-sales"
    >
      {loadError ? (
        <Typography sx={{ mb: 1, color: 'error.main', fontSize: 13 }}>{loadError}</Typography>
      ) : null}

      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <FilterMonthlyVisit
            filters={filters}
            period={period}
            salesOptions={salesOptions}
            stateOptions={stateOptions}
            isLoading={isLoading}
            filteredCount={filteredRows.length}
            onQueryChange={(value) => {
              setFilters((current) => ({ ...current, query: value }))
              setPage(0)
            }}
            onPeriodChange={(value) => {
              const next = String(value ?? '').trim()
              setPeriod(parsePeriod(next) ? next : getCurrentPeriod())
              setPage(0)
            }}
            onSalesChange={(value) => {
              setFilters((current) => ({ ...current, sales: value }))
              setPage(0)
            }}
            onWilayahChange={(value) => {
              setFilters((current) => ({ ...current, wilayah: value }))
              setPage(0)
            }}
            onRefresh={() => setReloadTick((value) => value + 1)}
            onExport={exportCurrentRows}
          />
        </Box>

        {isLoading ? (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading...</Typography>
        ) : null}

        <Box sx={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            rows={pagedRows}
            emptyMessage={isLoading ? 'Loading...' : 'Tidak ada data monthly visit'}
            pagination={pagination}
            scrollBody
            fillHeight
            scrollBodyMaxHeight="none"
            wrapperTopMargin="6px"
          />
        </Box>
      </Paper>
    </Box>
  )
}
