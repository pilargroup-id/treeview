import * as React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { AddressMap } from '../maps'

const DISTANCE_LIMIT_KM = 2
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const geocodeCache = new Map()

function toFiniteNumber(value) {
  if (value == null || value === '') {
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

function normalizeLocation(location) {
  const latitude = toFiniteNumber(location?.latitude ?? location?.lat)
  const longitude = toFiniteNumber(location?.longitude ?? location?.lng)

  if (latitude == null || longitude == null) {
    return null
  }

  return { latitude, longitude }
}

function haversineDistanceKm(start, end) {
  if (!start || !end) {
    return null
  }

  const fromLat = toFiniteNumber(start.latitude)
  const fromLng = toFiniteNumber(start.longitude)
  const toLat = toFiniteNumber(end.latitude)
  const toLng = toFiniteNumber(end.longitude)

  if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
    return null
  }

  const earthRadiusKm = 6371
  const latDelta = ((toLat - fromLat) * Math.PI) / 180
  const lngDelta = ((toLng - fromLng) * Math.PI) / 180
  const fromLatRad = (fromLat * Math.PI) / 180
  const toLatRad = (toLat * Math.PI) / 180

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.sin(lngDelta / 2) ** 2 * Math.cos(fromLatRad) * Math.cos(toLatRad)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

function midpoint(start, end) {
  if (!start || !end) {
    return null
  }

  const latitude = (start.latitude + end.latitude) / 2
  const longitude = (start.longitude + end.longitude) / 2
  return { latitude, longitude }
}

async function geocodeAddress(query, signal) {
  const raw = String(query ?? '').trim()

  if (!raw) {
    return null
  }

  const cacheKey = raw.toLowerCase()
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)
  }

  const url = new URL(NOMINATIM_SEARCH_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('q', raw)
  url.searchParams.set('accept-language', 'id')
  url.searchParams.set('countrycodes', 'id')

  const response = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Geocode request failed (${response.status})`)
  }

  const body = await response.json().catch(() => [])
  const first = Array.isArray(body) ? body[0] : null
  const location = normalizeLocation({
    latitude: first?.lat,
    longitude: first?.lon,
  })

  if (location) {
    geocodeCache.set(cacheKey, location)
  }

  return location
}

export default function MapsMonitorRadius({
  currentLocation,
  customerLocation = null,
  customerAddress,
  resultAddress,
  distanceKm = null,
  locationLoading = false,
  saving = false,
  showCurrentLocationAction = true,
  onGetCurrentLocation,
  onMapLocationChange,
}) {
  const normalizedCurrentLocation = React.useMemo(
    () => normalizeLocation(currentLocation),
    [currentLocation],
  )
  const normalizedCustomerLocation = React.useMemo(
    () => normalizeLocation(customerLocation),
    [customerLocation],
  )
  const customerAddressQuery = React.useMemo(
    () => String(customerAddress ?? '').trim(),
    [customerAddress],
  )

  const [resolvedCustomerLocation, setResolvedCustomerLocation] = React.useState(
    normalizedCustomerLocation,
  )
  const [customerLookupState, setCustomerLookupState] = React.useState(
    normalizedCustomerLocation ? { status: 'ready', error: null } : { status: 'idle', error: null },
  )

  React.useEffect(() => {
    if (normalizedCustomerLocation) {
      setResolvedCustomerLocation(normalizedCustomerLocation)
      setCustomerLookupState({ status: 'ready', error: null })
      return undefined
    }

    if (!customerAddressQuery) {
      setResolvedCustomerLocation(null)
      setCustomerLookupState({ status: 'idle', error: null })
      return undefined
    }

    const controller = new AbortController()
    let active = true

    setCustomerLookupState({ status: 'loading', error: null })

    geocodeAddress(customerAddressQuery, controller.signal)
      .then((location) => {
        if (!active) {
          return
        }

        if (location) {
          setResolvedCustomerLocation(location)
          setCustomerLookupState({ status: 'ready', error: null })
          return
        }

        setResolvedCustomerLocation(null)
        setCustomerLookupState({
          status: 'error',
          error: 'Lokasi customer tidak ditemukan',
        })
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) {
          return
        }

        console.error('Failed to geocode customer address:', error)
        setResolvedCustomerLocation(null)
        setCustomerLookupState({
          status: 'error',
          error: 'Gagal memuat lokasi customer',
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [customerAddressQuery, normalizedCustomerLocation])

  const hasCurrentLocation = Boolean(normalizedCurrentLocation)
  const hasCustomerLocation = Boolean(resolvedCustomerLocation)

  const resolvedDistanceKm = React.useMemo(() => {
    if (Number.isFinite(distanceKm)) {
      return distanceKm
    }

    if (hasCurrentLocation && hasCustomerLocation) {
      return haversineDistanceKm(normalizedCurrentLocation, resolvedCustomerLocation)
    }

    return null
  }, [distanceKm, hasCurrentLocation, hasCustomerLocation, normalizedCurrentLocation, resolvedCustomerLocation])

  const isOutsideDistanceLimit =
    Number.isFinite(resolvedDistanceKm) && resolvedDistanceKm > DISTANCE_LIMIT_KM

  const centerOverride = React.useMemo(() => {
    if (hasCurrentLocation && hasCustomerLocation) {
      return midpoint(normalizedCurrentLocation, resolvedCustomerLocation)
    }

    if (hasCurrentLocation) {
      return normalizedCurrentLocation
    }

    if (hasCustomerLocation) {
      return resolvedCustomerLocation
    }

    return null
  }, [hasCurrentLocation, hasCustomerLocation, normalizedCurrentLocation, resolvedCustomerLocation])

  const mapZoom = (() => {
    if (!Number.isFinite(resolvedDistanceKm)) {
      return hasCurrentLocation ? 15 : 13
    }

    if (resolvedDistanceKm > 10) return 10
    if (resolvedDistanceKm > 5) return 11
    if (resolvedDistanceKm > 2) return 12
    if (resolvedDistanceKm > 1) return 13
    if (resolvedDistanceKm > 0.4) return 14
    return 15
  })()

  const statusMessage =
    customerLookupState.status === 'loading'
      ? 'Mencari lokasi customer...'
      : customerLookupState.error

  const customerMarker = hasCustomerLocation
    ? [
        {
          id: 'customer-location',
          latitude: resolvedCustomerLocation.latitude,
          longitude: resolvedCustomerLocation.longitude,
          title: customerAddressQuery
            ? `Lokasi customer: ${customerAddressQuery}`
            : 'Lokasi customer',
          label: 'C',
          color: '#1f4e8c',
          shape: 'pin',
          scale: 1.35,
        },
      ]
    : []

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        mt: 0,
        height: '100%',
        minHeight: { xs: 320, sm: 380, md: 430 },
        overflow: 'hidden',
        borderRadius: 0,
        borderBottom: '1px solid rgba(22, 58, 107, 0.14)',
        background:
          'linear-gradient(145deg, rgba(31, 78, 140, 0.18), rgba(22, 58, 107, 0.24))',
      }}
    >
      <AddressMap
        address={customerAddressQuery}
        latitude={hasCurrentLocation ? normalizedCurrentLocation.latitude : resolvedCustomerLocation?.latitude}
        longitude={hasCurrentLocation ? normalizedCurrentLocation.longitude : resolvedCustomerLocation?.longitude}
        onLocationChange={onMapLocationChange}
        primaryMarkerLabel="R"
        primaryMarkerTitle={
          resultAddress?.trim()
            ? isOutsideDistanceLimit
              ? `Lokasi hasil result: ${resultAddress}`
              : `Lokasi Anda: ${resultAddress}`
            : isOutsideDistanceLimit
              ? 'Lokasi hasil result'
              : 'Lokasi Anda'
        }
        primaryMarkerColor="#29924f"
        primaryMarkerShape="pin"
        primaryMarkerScale={1.55}
        primaryMarkerDraggable={hasCurrentLocation}
        hidePrimaryMarker={!hasCurrentLocation}
        additionalMarkers={customerMarker}
        radiusCircle={
          hasCustomerLocation
            ? {
                latitude: resolvedCustomerLocation.latitude,
                longitude: resolvedCustomerLocation.longitude,
                radiusMeters: DISTANCE_LIMIT_KM * 1000,
              }
            : null
        }
        centerOverride={centerOverride}
        zoomOverride={mapZoom}
        mapTypeControl={false}
        fullscreenControl={false}
        mapOptions={{
          gestureHandling: 'greedy',
          minZoom: 4,
          maxZoom: 20,
        }}
      />

      {statusMessage ? (
        <Box
          sx={{
            position: 'absolute',
            left: 12,
            top: 12,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            maxWidth: 'calc(100% - 24px)',
            px: 1.25,
            py: 0.75,
            borderRadius: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
            color: 'text.primary',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {customerLookupState.status === 'loading' ? (
            <CircularProgress size={12} color="inherit" />
          ) : null}
          <span>{statusMessage}</span>
        </Box>
      ) : null}

      {showCurrentLocationAction && !hasCurrentLocation ? (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            width: 'calc(100% - 28px)',
            maxWidth: 320,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 1,
              color: '#15355f',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Ambil lokasi Anda untuk validasi radius kunjungan
          </Typography>
          <Button
            variant="contained"
            onClick={onGetCurrentLocation}
            disabled={locationLoading || saving}
            sx={{
              textTransform: 'none',
              borderRadius: 2.5,
              py: 1,
              fontWeight: 700,
              backgroundColor: '#163a6b',
              '&:hover': {
                backgroundColor: '#1f4e8c',
              },
            }}
          >
            {locationLoading ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Mengambil lokasi...
              </Box>
            ) : (
              'Ambil Lokasi Saat Ini'
            )}
          </Button>
        </Box>
      ) : null}
    </Box>
  )
}
