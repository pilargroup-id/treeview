import * as React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { API_URL } from '../config/api'
import DataTable, { buildPaginationModel } from './DataTable'
import FilterWeeklyVisit from './FilterWeeklyVisit'
import { exportMatrixToXlsx } from '../utils/exportToXlsx'
import { fetchWithAuth } from '../utils/fetchWithAuth'

const WEEK_COLUMNS = ['Week1', 'Week2', 'Week3', 'Week4']
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
]
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
]
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const CUSTOMER_GROUP = { key: 'general-information', label: 'General Information' }

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

function monthNameToIndex(monthNameRaw) {
  const monthName = String(monthNameRaw ?? '').trim()
  if (!monthName) {
    return null
  }

  const knownIndex = EN_MONTH_NAMES.findIndex(
    (item) => item.toLowerCase() === monthName.toLowerCase(),
  )

  if (knownIndex >= 0) {
    return knownIndex
  }

  const parsed = new Date(`${monthName} 1, 2000`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getMonth()
}

function getDefaultMonthSelection() {
  const currentMonth = new Date().getMonth()
  return Array.from({ length: 3 }, (_, index) => currentMonth - index).filter(
    (monthIndex) => monthIndex >= 0,
  )
}

function toFiniteNumberOrNull(value) {
  if (value == null || value === '') {
    return null
  }

  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function mergeWeek4(week4, week5, week6) {
  const n4 = toFiniteNumberOrNull(week4)
  const n5 = toFiniteNumberOrNull(week5)
  const n6 = toFiniteNumberOrNull(week6)

  if (n4 == null && n5 == null && n6 == null) {
    return null
  }

  return (n4 ?? 0) + (n5 ?? 0) + (n6 ?? 0)
}

function normalizeMonthSelection(value) {
  const rawValues = Array.isArray(value) ? value : String(value ?? '').split(',')
  const uniqueMonths = Array.from(
    new Set(
      rawValues
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0 && item <= 11),
    ),
  ).sort((left, right) => right - left)

  if (uniqueMonths.length === 0) {
    return [new Date().getMonth()]
  }

  return uniqueMonths.slice(0, 3)
}

export default function ReportWeeklyVisit() {
  const [filters, setFilters] = React.useState({
    query: '',
    wilayah: 'ALL',
    sales: 'ALL',
    year: new Date().getFullYear(),
    months: getDefaultMonthSelection(),
  })
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(25)
  const [reloadTick, setReloadTick] = React.useState(0)
  const [summaryData, setSummaryData] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(null)

  const visibleMonths = React.useMemo(
    () => normalizeMonthSelection(filters.months),
    [filters.months],
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    const year = Number(filters.year)

    if (filters.wilayah && filters.wilayah !== 'ALL') {
      params.set('state', String(filters.wilayah))
    }

    if (Number.isInteger(year)) {
      params.set('year', String(year))
    }

    for (const monthIndex of visibleMonths) {
      params.append('months[]', String(monthIndex + 1))
    }

    const url = `${buildApiUrl('activity-plans/weekly-summary')}?${params.toString()}`

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

        setSummaryData(body.data)
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }

        console.error('Failed to load weekly visit report:', error)
        setSummaryData([])
        setLoadError(error?.message || 'Failed to load data')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [filters.year, filters.wilayah, visibleMonths, reloadTick])

  const rows = React.useMemo(
    () =>
      (Array.isArray(summaryData) ? summaryData : []).map((item, index) => {
        const monthsByIndex = {}
        const years = new Set()
        const months = Array.isArray(item?.months) ? item.months : []

        for (const monthItem of months) {
          const monthIndex = monthNameToIndex(monthItem?.month_name)
          if (monthIndex == null) {
            continue
          }

          const year = Number(monthItem?.year)
          if (Number.isInteger(year)) {
            years.add(year)
          }

          monthsByIndex[monthIndex] = {
            year,
            week1: monthItem?.week1 ?? null,
            week2: monthItem?.week2 ?? null,
            week3: monthItem?.week3 ?? null,
            week4: mergeWeek4(
              monthItem?.week4 ?? null,
              monthItem?.week5 ?? null,
              monthItem?.week6 ?? null,
            ),
          }
        }

        return {
          id: index + 1,
          wilayah: item?.wilayah ?? '-',
          sales_name: item?.sales_name ?? '-',
          customer: String(item?.customer ?? item?.customer_name ?? '').trim() || '-',
          monthsByIndex,
          years,
        }
      }),
    [summaryData],
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

  const yearOptions = React.useMemo(() => {
    const unique = new Set()

    for (const row of rows) {
      for (const year of row.years) {
        unique.add(year)
      }
    }

    return Array.from(unique).sort((left, right) => right - left)
  }, [rows])

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = String(filters.query ?? '').trim().toLowerCase()
    const filterYear = Number(filters.year)

    return rows.filter((row) => {
      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) {
        return false
      }

      if (filters.sales !== 'ALL' && row.sales_name !== filters.sales) {
        return false
      }

      if (Number.isInteger(filterYear) && row.years.size > 0 && !row.years.has(filterYear)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = `${row.wilayah} ${row.sales_name} ${row.customer}`.toLowerCase()
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

    return filteredRows.slice(start, start + rowsPerPage).map((row) => {
      const nextRow = {
        id: row.id,
        sales_name: row.sales_name,
        wilayah: row.wilayah,
        customer: row.customer,
      }

      for (const monthIndex of visibleMonths) {
        const monthData = row.monthsByIndex?.[monthIndex] ?? null

        for (let weekIndex = 0; weekIndex < WEEK_COLUMNS.length; weekIndex += 1) {
          const field = `m${monthIndex}_w${weekIndex}`
          const weekKey = `week${weekIndex + 1}`
          nextRow[field] = monthData?.[weekKey] ?? ''
        }
      }

      return nextRow
    })
  }, [filteredRows, page, rowsPerPage, visibleMonths])

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

  const columns = React.useMemo(() => {
    const baseColumns = [
      { key: 'sales_name', header: 'Sales', group: CUSTOMER_GROUP },
      { key: 'wilayah', header: 'Wilayah', group: CUSTOMER_GROUP },
      { key: 'customer', header: 'Customer', group: CUSTOMER_GROUP },
    ]

    const weekColumns = visibleMonths.flatMap((monthIndex) =>
      WEEK_COLUMNS.map((weekLabel, weekIndex) => ({
        key: `m${monthIndex}_w${weekIndex}`,
        header: weekLabel,
        align: 'right',
        group: {
          key: `month-${monthIndex}`,
          label: MONTH_LABELS[monthIndex] ?? `Bulan ${monthIndex + 1}`,
        },
      })),
    )

    return baseColumns.concat(weekColumns)
  }, [visibleMonths])

  const exportCurrentRows = React.useCallback(() => {
    try {
      const exportYear = Number.isInteger(Number(filters.year))
        ? Number(filters.year)
        : new Date().getFullYear()
      const headerTop = ['Sales', 'Wilayah', 'Customer']
      const headerBottom = ['', '', '']
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      ]

      visibleMonths.forEach((monthIndex, index) => {
        const startColumn = 3 + index * WEEK_COLUMNS.length
        headerTop.push(MONTH_LABELS[monthIndex] ?? `Bulan ${monthIndex + 1}`, '', '', '')
        headerBottom.push(...WEEK_COLUMNS)
        merges.push({
          s: { r: 0, c: startColumn },
          e: { r: 0, c: startColumn + WEEK_COLUMNS.length - 1 },
        })
      })

      exportMatrixToXlsx({
        fileName: `report-weekly-visit-${exportYear}.xlsx`,
        sheetName: 'Weekly Visit',
        rows: [
          headerTop,
          headerBottom,
          ...filteredRows.map((row) => {
            const cells = [row.sales_name, row.wilayah, row.customer]

            visibleMonths.forEach((monthIndex) => {
              const monthData = row.monthsByIndex?.[monthIndex] ?? null

              for (let weekIndex = 0; weekIndex < WEEK_COLUMNS.length; weekIndex += 1) {
                const weekKey = `week${weekIndex + 1}`
                cells.push(monthData?.[weekKey] ?? '')
              }
            })

            return cells
          }),
        ],
        merges,
      })
    } catch (error) {
      console.error('Failed to export weekly visit report:', error)
    }
  }, [filteredRows, filters.year, visibleMonths])

  const availableYearOptions = yearOptions.length > 0 ? yearOptions : [Number(filters.year)]

  return (
    <Box
      sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      className="tv-report-customers"
    >
      {loadError ? (
        <Typography sx={{ mb: 1, color: 'error.main', fontSize: 13 }}>{loadError}</Typography>
      ) : null}

      <Paper
        sx={{
          p: 2,
          display: 'grid',
          gap: 1.25,
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
          }}
        >
          <FilterWeeklyVisit
            filters={filters}
            visibleMonths={visibleMonths}
            monthLabels={MONTH_LABELS}
            yearOptions={availableYearOptions}
            salesOptions={salesOptions}
            stateOptions={stateOptions}
            isLoading={isLoading}
            filteredCount={filteredRows.length}
            onQueryChange={(value) => {
              setFilters((current) => ({ ...current, query: value }))
              setPage(0)
            }}
            onMonthsChange={(value) => {
              setFilters((current) => ({
                ...current,
                months: normalizeMonthSelection(value),
              }))
              setPage(0)
            }}
            onYearChange={(value) => {
              setFilters((current) => ({ ...current, year: Number(value) }))
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

        <Box sx={{ minHeight: 0, overflow: 'auto', mt: -0.25 }}>
          <DataTable
            columns={columns}
            rows={pagedRows}
            emptyMessage={isLoading ? 'Loading...' : 'Tidak ada data weekly visit'}
            pagination={pagination}
          />
        </Box>
      </Paper>
    </Box>
  )
}
