import * as React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { createRoot } from 'react-dom/client'
import { w2popup } from 'w2ui'
import 'w2ui/w2ui-2.0.min.css'
import MapsMonitorRadius from '../components/MapsMonitorRadius'
import RangeDateFilter from '../components/RangeDateFilter'
import { API_URL } from '../config/api'
import DataTable, { buildPaginationModel } from './DataTable'
import FilterMonitorRadius from './FilterMonitorRadius'
import { exportMatrixToXlsx } from '../utils/exportToXlsx'
import { fetchWithAuth } from '../utils/fetchWithAuth'

const ID_NUMBER = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const RADIUS_THRESHOLD_METERS = 2000
const MAP_BUTTON_ICONS = {
  maps: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3 6.5 8 4l5 2 5-2 3 1.5V19l-3-1.5-5 2-5-2-5 2V6.5Zm5 .1v9.8l5 2V8.4l-5-1.8Zm7 .8v9.8l2-.8V6.6l-2 .8Zm-12 0v9.8l2-.8V6.6l-2 .8Z"
      />
    </svg>
  ),
  result: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7Zm0 10.75A2.75 2.75 0 1 1 12 7.25a2.75 2.75 0 0 1 0 5.5Z"
      />
    </svg>
  )
}

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

function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(value) {
  const raw = String(value ?? '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return raw || '-'
  }

  return `${match[3]}-${match[2]}-${match[1]}`
}

function formatMaybeNumber(value) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? ID_NUMBER.format(number) : '-'
}

function parseMaybeNumber(value) {
  if (value == null) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const raw = String(value).trim()
  if (!raw) {
    return null
  }

  const normalized = raw.includes('.') ? raw : raw.replace(',', '.')
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!match) {
    return null
  }

  const number = Number(match[0])
  return Number.isFinite(number) ? number : null
}

function buildLocation(latRaw, lngRaw) {
  const latitude = parseMaybeNumber(latRaw)
  const longitude = parseMaybeNumber(lngRaw)

  if (latitude == null || longitude == null) {
    return null
  }

  return { latitude, longitude }
}

function normalizeHttpUrl(value) {
  if (!value) {
    return null
  }

  try {
    const url = new URL(String(value))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function buildMapsUrls(latRaw, lngRaw) {
  const lat = parseMaybeNumber(latRaw)
  const lng = parseMaybeNumber(lngRaw)

  if (lat == null || lng == null) {
    return null
  }

  const query = `${lat},${lng}`
  return {
    label: query,
    openUrl: `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=17`,
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=17&output=embed`,
  }
}

function buildAddressMapUrls(value) {
  const query = String(value ?? '').trim()

  if (!query) {
    return null
  }

  return {
    label: query,
    openUrl: `https://www.google.com/maps?q=${encodeURIComponent(query)}`,
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`,
  }
}


function buildCustomerMapQuery(row) {
  const parts = [
    row?.customer_address,
    row?.customer_city,
    row?.wilayah,
    row?.customer_name,
  ]
    .map((value) => String(value ?? '').trim())
    .filter((value, index, values) => value && value !== '-' && values.indexOf(value) === index)

  return parts.join(', ')

}

function hasMapData(row) {
  return Boolean(
    buildLocation(row?.result_location_lat, row?.result_location_lng) ||
      buildLocation(row?.customer_location_lat, row?.customer_location_lng) ||
      String(row?.customer_map_query ?? '').trim(),
  )
}

function renderExternalLink(label, href) {
  if (!href) {
    return '-'
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="users-table__link"
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  )
}

function MapActionButton({ label, variant = 'result', onClick }) {
  if (typeof onClick !== 'function') {
    return '-'
  }

  const icon = MAP_BUTTON_ICONS[variant] ?? MAP_BUTTON_ICONS.result

  return (
    <button
      type="button"
      className={`users-table__map-action users-table__map-action--${variant}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <span className="users-table__map-action-icon">{icon}</span>
      <span className="users-table__map-action-text">{label}</span>
    </button>
  )
}

function renderDetailValue(value, className) {
  if (React.isValidElement(value)) {
    return value
  }

  const displayValue =
    value === undefined || value === null || value === '' ? '-' : String(value)

  return (
    <span
      className={`users-table__detail-value${
        displayValue === '-' ? ' users-table__detail-value--muted' : ''
      }${className ? ` ${className}` : ''}`}
    >
      {displayValue}
    </span>
  )
}

function DetailSection({ title, fields, wide = false }) {
  return (
    <section
      className={`users-table__detail-section${wide ? ' users-table__detail-section--wide' : ''}`}
    >
      <div className="users-table__detail-section-header">
        <p className="users-table__detail-section-eyebrow">{title}</p>
      </div>

      <dl className="users-table__detail-list">
        {fields.map((field) => (
          <div
            key={field.label}
            className={`users-table__detail-row${field.stacked ? ' users-table__detail-row--stacked' : ''}`}
          >
            <dt className="users-table__detail-label">{field.label}</dt>
            <dd
              className={`users-table__detail-field${field.fieldClassName ? ` ${field.fieldClassName}` : ''}`}
            >
              {renderDetailValue(field.value, field.valueClassName)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function PhotoPreview({ src, alt }) {
  if (!src) {
    return <span className="users-table__detail-value users-table__detail-value--muted">-</span>
  }

  return (
    <div className="users-table__photo-shell">
      <img src={src} alt={alt} className="users-table__photo-preview" loading="lazy" />
      <div className="users-table__photo-actions">{renderExternalLink('Buka Foto', src)}</div>
    </div>
  )
}

export default function ReportMonitorRadius() {
  const [filters, setFilters] = React.useState({
    query: '',
    sales: 'ALL',
    wilayah: 'ALL',
    radius: 'ALL', // ALL | IN_2KM | OUT_2KM
    start_date: toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end_date: toDateInputValue(new Date()),
  })
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(25)
  const [reloadTick, setReloadTick] = React.useState(0)
  const [rangePickerSignal, setRangePickerSignal] = React.useState(0)
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
    const controller = new AbortController()
    const params = new URLSearchParams()
    const startDate = String(filters.start_date ?? '').trim()
    const endDate = String(filters.end_date ?? '').trim()

    if (filters.wilayah && filters.wilayah !== 'ALL') {
      params.set('state', String(filters.wilayah))
    }

    if (startDate) {
      params.set('start_date', startDate)
    }

    if (endDate) {
      params.set('end_date', endDate)
    }

    params.set('tujuan', 'Visit')

    const url = `${buildApiUrl('activity-plans/details')}?${params.toString()}`

    setIsLoading(true)
    setLoadError(null)

    fetchWithAuth(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null)

        if (!response.ok) {
          const message = body?.message || `Request failed (${response.status})`
          const extraErrors = body?.errors
            ? Object.values(body.errors).flat().filter(Boolean).join(' ')
            : null
          const extra = extraErrors || body?.error || null
          throw new Error(extra ? `${message}: ${extra}` : message)
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

        console.error('Failed to load monitor radius report:', error)
        setSourceData([])
        setLoadError(error?.message || 'Failed to load data')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [filters.end_date, filters.start_date, filters.wilayah, reloadTick])


  const rows = React.useMemo(
    () =>
      (Array.isArray(sourceData) ? sourceData : [])
        .filter((item) => String(item?.tujuan ?? '').trim().toLowerCase() === 'visit')
        .map((item, index) => ({
          id: index + 1,
          sales_name: item?.sales_name ?? '-',
          wilayah: item?.wilayah ?? item?.state ?? '-',
          customer_name: item?.customer_name ?? '-',
          customer_address: item?.customer_address ?? null,
          customer_city: item?.customer_city ?? null,
          customer_location_lat: item?.customer_location_lat ?? null,
          customer_location_lng: item?.customer_location_lng ?? null,
          customer_map_query: buildCustomerMapQuery(item),
          plan_no: item?.plan_no ?? '-',
          plan_date: item?.plan_date ?? '-',
          tujuan: item?.tujuan ?? '-',
          result_location_lat: item?.result_location_lat ?? null,
          result_location_lng: item?.result_location_lng ?? null,
          result_location_accuracy: item?.result_location_accuracy ?? null,
          result: item?.result == null || item?.result === '' ? '-' : item.result,
          user_photo: item?.user_photo ?? null,
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
    const radiusFilter = String(filters.radius ?? 'ALL')

    return rows.filter((row) => {

      if (filters.sales !== 'ALL' && row.sales_name !== filters.sales) {
        return false

      }

      if (filters.wilayah !== 'ALL' && row.wilayah !== filters.wilayah) {
        return false
      }

      if (radiusFilter !== 'ALL') {
        const radius = parseMaybeNumber(row.result_location_accuracy)

        if (radius == null) {
          return false
        }

        if (radiusFilter === 'IN_2KM' && !(radius <= RADIUS_THRESHOLD_METERS)) {
          return false
        }

        if (radiusFilter === 'OUT_2KM' && !(radius > RADIUS_THRESHOLD_METERS)) {
          return false
        }
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack =
        `${row.sales_name} ${row.wilayah} ${row.customer_name} ${row.plan_no} ${row.plan_date} ${row.result}`
          .trim()
          .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [filters, rows])

  const radiusOptions = React.useMemo(
    () => [
      { value: 'ALL', label: 'Semua' },
      { value: 'IN_2KM', label: 'Dalam radius (2km)' },
      { value: 'OUT_2KM', label: 'Di luar radius (2km)' },
    ],
    [],
  )

  const currentRangeDates = React.useMemo(() => {
    const startDate = String(filters.start_date ?? '').trim()
    const endDate = String(filters.end_date ?? '').trim()
    const startMatch = startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const endMatch = endDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    if (!startMatch || !endMatch || startMatch[1] !== endMatch[1]) {
      return []
    }

    return [
      {
        start: `${startMatch[2]}-${startMatch[3]}`,
        end: `${endMatch[2]}-${endMatch[3]}`,
        year: Number(startMatch[1]),
      },
    ]
  }, [filters.end_date, filters.start_date])

  const dateRangeLabel = React.useMemo(() => {
    const startDate = String(filters.start_date ?? '').trim()
    const endDate = String(filters.end_date ?? '').trim()

    if (!startDate && !endDate) {
      return 'All Time'
    }

    if (!startDate || !endDate) {
      return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`
    }

    return `${formatDateLabel(startDate)} s/d ${formatDateLabel(endDate)}`
  }, [filters.end_date, filters.start_date])

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

  const openMapPopup = React.useCallback((row) => {
    const customerQuery = String(row?.customer_map_query ?? '').trim()
    const currentLocation = buildLocation(row?.result_location_lat, row?.result_location_lng)
    const customerLocation = buildLocation(row?.customer_location_lat, row?.customer_location_lng)
    const customerMap = customerLocation
      ? buildMapsUrls(customerLocation.latitude, customerLocation.longitude)
      : buildAddressMapUrls(customerQuery)
    const resultMap = currentLocation
      ? buildMapsUrls(currentLocation.latitude, currentLocation.longitude)
      : null

    if (!currentLocation && !customerLocation && !customerQuery) {
      return
    }

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    const width = Math.max(520, Math.min(980, viewportWidth - 40))
    const height = Math.max(420, Math.min(760, viewportHeight - 80))
    const popupId = `tv-map-popup-root-${Date.now()}-${Math.random().toString(36).slice(2)}`
    let popupRoot = null
    const safeTitle = `Maps - ${String(row?.customer_name ?? '').trim() || 'Customer'}`
    const openUrl = escapeAttr(customerMap?.openUrl ?? resultMap?.openUrl ?? '')
    const popupLabel = escapeAttr(
      `${String(row?.customer_name ?? '').trim() || 'Customer'} | Radius 2 km`,
    )

    w2popup.open({
      title: safeTitle,
      showMax: true,
      width,
      height,
      body: `
        <div class="tv-map-popup tv-map-popup--react">
          <div class="tv-map-popup__actions">
            <span class="tv-map-popup__label">${popupLabel}</span>
            ${openUrl ? `<a class="tv-map-popup__link" href="${openUrl}" target="_blank" rel="noopener noreferrer">Buka di tab baru</a>` : ''}
          </div>
          <div id="${popupId}" class="tv-map-popup__react-root"></div>
        </div>
      `.trim(),
      onOpen(event) {
        event.onComplete = () => {
          const mountElement = document.getElementById(popupId)

          if (!mountElement) {
            return
          }

          popupRoot = createRoot(mountElement)
          popupRoot.render(
            <MapsMonitorRadius
              currentLocation={currentLocation}
              customerLocation={customerLocation}
              customerAddress={customerQuery}
              resultAddress={
                currentLocation
                  ? `${currentLocation.latitude}, ${currentLocation.longitude}`
                  : ''
              }
              showCurrentLocationAction={false}
            />,
          )
        }
      },
      onClose() {
        popupRoot?.unmount()
        popupRoot = null
      },
      actions: {
        Tutup() {
          popupRoot?.unmount()
          popupRoot = null
          w2popup.close()
        },
      },
    })
  }, [])

  React.useEffect(() => () => w2popup.close?.(), [])

  const columns = React.useMemo(
    () => [
      { key: 'sales_name', header: 'Sales' },
      { key: 'wilayah', header: 'Wilayah' },
      { key: 'customer_name', header: 'Customer' },
      { key: 'plan_no', header: 'Plan No' },
      { key: 'plan_date', header: 'Tanggal Visit' },
      {
        key: 'result_location_accuracy',
        header: 'Radius',
        align: 'right',
        render: (row) => formatMaybeNumber(row.result_location_accuracy),
      },
      {
        key: 'maps',
        header: 'Maps',
        render: (row) =>
          (
            <MapActionButton
              label="Maps"
              variant="maps"
              onClick={hasMapData(row) ? () => openMapPopup(row) : null}
            />
          ),
      },
    ],
    [openMapPopup],
  )

  const exportCurrentRows = React.useCallback(() => {
    try {
      const rawStartDate = String(filters.start_date ?? '').trim()
      const rawEndDate = String(filters.end_date ?? '').trim()
      const dateKey = rawStartDate || rawEndDate
        ? `${rawStartDate || 'all'}_${rawEndDate || 'all'}`
        : 'all-time'

      exportMatrixToXlsx({
        fileName: `report-monitor-radius-${dateKey}.xlsx`,
        sheetName: 'Monitor Radius',
          rows: [
          ['Sales', 'Wilayah', 'Customer', 'Plan No', 'Tanggal Visit', 'Radius', 'Result', 'Maps', 'Foto'],
          ...filteredRows.map((row) => [
            row.sales_name,
            row.wilayah,
            row.customer_name,
            row.plan_no,
            row.plan_date,
            parseMaybeNumber(row.result_location_accuracy) ?? '',
            row.result,
            [
              buildMapsUrls(row.result_location_lat, row.result_location_lng)?.openUrl,
              buildMapsUrls(row.customer_location_lat, row.customer_location_lng)?.openUrl ||
                buildAddressMapUrls(row.customer_map_query)?.openUrl,
            ]
              .filter(Boolean)
              .join(' | '),
            normalizeHttpUrl(row.user_photo) ?? '',
          ]),
        ],
      })
    } catch (error) {
      console.error('Failed to export monitor radius report:', error)
    }

  }, [filteredRows, filters.end_date, filters.start_date])


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
      className="tv-report-customers"
    >
      {loadError ? (
        <Typography sx={{ mb: 1, color: 'error.main', fontSize: 13 }}>{loadError}</Typography>
      ) : null}

      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            minHeight: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <FilterMonitorRadius
              filters={filters}
              dateRangeLabel={dateRangeLabel}
              salesOptions={salesOptions}
              stateOptions={stateOptions}
              radiusOptions={radiusOptions}
              isLoading={isLoading}
              filteredCount={filteredRows.length}
              onQueryChange={(value) => {
                setFilters((current) => ({ ...current, query: value }))
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
              onRadiusChange={(value) => {
                setFilters((current) => ({ ...current, radius: value }))
                setPage(0)
              }}
              onOpenRangePicker={() => setRangePickerSignal((value) => value + 1)}
              onRefresh={() => setReloadTick((value) => value + 1)}
              onExport={exportCurrentRows}
            />
          </Box>

          <Box sx={{ display: 'none' }}>
            <RangeDateFilter
              rangeDates={currentRangeDates}
              onAddRange={(range) => {
                const year = Number(range?.year)
                const start = String(range?.start ?? '').trim()
                const end = String(range?.end ?? '').trim()

                if (!Number.isInteger(year) || !start || !end) {
                  return
                }

                setFilters((current) => ({
                  ...current,
                  start_date: `${year}-${start}`,
                  end_date: `${year}-${end}`,
                }))
                setPage(0)
              }}
              onRemoveRange={() => {}}
              availableYears={[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]}
              selectedYears={[new Date().getFullYear()]}
              openPickerSignal={rangePickerSignal}
              showTitle={false}
              showSummary={false}
              allowReplaceExistingRange
              calendarMonths={2}
              calendarDirection="horizontal"
              hideTrigger
              includeYearAndAllTimePresets
              onSelectAllTime={() => {
                setFilters((current) => ({
                  ...current,
                  start_date: '',
                  end_date: '',
                }))
                setPage(0)
              }}
              maxRangeDays={366}
            />
          </Box>

          {isLoading ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading...</Typography>
          ) : null}

          <Box sx={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
            <DataTable
              columns={columns}
              rows={pagedRows}
              emptyMessage={isLoading ? 'Loading...' : 'Tidak ada data monitor radius'}
              pagination={pagination}
              scrollBody
              fillHeight
              scrollBodyMaxHeight="none"
              wrapperTopMargin="6px"
              getDetailTitle={(row) => row.customer_name}
              getDetailDescription={(row) => `${row.sales_name} - ${row.plan_date}`}
              detailRenderer={(row) => {
                const photoUrl = normalizeHttpUrl(row.user_photo)

                return (
                  <div className="users-table__detail-shell">
                    <DetailSection
                      title="Visit"
                      fields={[
                        { label: 'sales', value: row.sales_name },
                        { label: 'wilayah', value: row.wilayah },
                        { label: 'customer', value: row.customer_name },
                        { label: 'plan_no', value: row.plan_no },
                        { label: 'plan_date', value: row.plan_date },
                        { label: 'tujuan', value: row.tujuan },
                      ]}
                    />

                    <DetailSection
                      title="Location"
                      fields={[
                        {
                          label: 'radius',
                          value: `${formatMaybeNumber(row.result_location_accuracy)} m`,
                        },
                        {
                          label: 'maps',
                          value: (
                            <MapActionButton
                              label="Maps"
                              variant="maps"
                              onClick={hasMapData(row) ? () => openMapPopup(row) : null}
                            />
                          ),
                        },
                        {
                          label: 'photo',
                          stacked: true,
                          value: (
                            <PhotoPreview
                              src={photoUrl}
                              alt={`Foto visit ${row.customer_name}`}
                            />
                          ),
                        },
                      ]}
                    />

                    <DetailSection
                      title="Result"
                      wide
                      fields={[
                        {
                          label: 'result',
                          value: row.result,
                          valueClassName: 'users-table__detail-value--block-right',
                        },
                      ]}
                    />
                  </div>
                )
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
