import * as React from 'react'

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

const DEFAULT_MIN_ZOOM = 1
const DEFAULT_MAX_ZOOM = 20

function clampZoom(value, minZoom, maxZoom) {
  const numeric = toFiniteNumber(value)

  if (numeric == null) {
    return minZoom
  }

  return Math.max(minZoom, Math.min(maxZoom, numeric))
}

function projectCoordinates(latitude, longitude, zoom) {
  const latitudeRad = (latitude * Math.PI) / 180
  const worldSize = 256 * 2 ** zoom
  const x = ((longitude + 180) / 360) * worldSize
  const safeSin = Math.min(Math.max(Math.sin(latitudeRad), -0.999999), 0.999999)
  const y =
    (0.5 - Math.log((1 + safeSin) / (1 - safeSin)) / (4 * Math.PI)) * worldSize

  return { x, y }
}

function metersPerPixel(latitude, zoom) {
  const cosine = Math.max(Math.cos((latitude * Math.PI) / 180), 0.0001)
  return (156543.03392 * cosine) / 2 ** zoom
}

function useElementSize(ref) {
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect()

      setSize((current) => {
        if (
          Math.abs(current.width - rect.width) < 0.5 &&
          Math.abs(current.height - rect.height) < 0.5
        ) {
          return current
        }

        return {
          width: rect.width,
          height: rect.height,
        }
      })
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return size
}

function buildMarkerStyle(marker, x, y) {
  const scale = Number.isFinite(marker.scale) ? Math.max(marker.scale, 0.5) : 1
  const diameter = Math.max(24, 28 * scale)
  const tailSize = Math.max(6, Math.round(diameter * 0.22))
  const labelSize = Math.max(11, Math.round(diameter * 0.42))
  const color = marker.color || '#1f4e8c'

  return {
    wrapper: {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 3,
    },
    body: {
      width: `${diameter}px`,
      height: `${diameter}px`,
      borderRadius: '999px',
      background: color,
      border: '3px solid rgba(255, 255, 255, 0.96)',
      boxShadow: '0 12px 24px rgba(15, 23, 42, 0.24)',
      display: 'grid',
      placeItems: 'center',
      color: '#ffffff',
      fontSize: `${labelSize}px`,
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: '0.02em',
    },
    tail: {
      width: 0,
      height: 0,
      borderLeft: `${tailSize}px solid transparent`,
      borderRight: `${tailSize}px solid transparent`,
      borderTop: `${Math.max(8, Math.round(diameter * 0.28))}px solid ${color}`,
      marginTop: '-1px',
      filter: 'drop-shadow(0 4px 8px rgba(15, 23, 42, 0.18))',
    },
  }
}

function extractMarkerLocation(marker) {
  if (!marker || typeof marker !== 'object') {
    return null
  }

  return normalizeLocation(marker)
}

function resolveCenterLocation({
  centerOverride,
  latitude,
  longitude,
  additionalMarkers,
  radiusCircle,
}) {
  const override = normalizeLocation(centerOverride)
  if (override) {
    return override
  }

  const primary = normalizeLocation({ latitude, longitude })
  if (primary) {
    return primary
  }

  if (Array.isArray(additionalMarkers)) {
    for (const marker of additionalMarkers) {
      const location = extractMarkerLocation(marker)
      if (location) {
        return location
      }
    }
  }

  return normalizeLocation(radiusCircle)
}

function MapMarker({ marker, x, y }) {
  const styles = buildMarkerStyle(marker, x, y)

  return (
    <div
      title={marker.title ?? marker.label ?? ''}
      style={styles.wrapper}
      aria-hidden="true"
    >
      <div style={styles.body}>{marker.label ?? '•'}</div>
      <div style={styles.tail} />
    </div>
  )
}

function RadiusOverlay({ overlay }) {
  if (!overlay) {
    return null
  }

  const left = toFiniteNumber(overlay.left)
  const top = toFiniteNumber(overlay.top)
  const size = toFiniteNumber(overlay.size)

  if (left == null || top == null || size == null || size <= 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.12)',
        border: '2px solid rgba(59, 130, 246, 0.56)',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.25)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
      aria-hidden="true"
    />
  )
}

export function AddressMap({
  address,
  latitude,
  longitude,
  onLocationChange,
  primaryMarkerLabel = 'R',
  primaryMarkerTitle,
  primaryMarkerColor = '#29924f',
  primaryMarkerShape = 'pin',
  primaryMarkerScale = 1,
  primaryMarkerDraggable = false,
  hidePrimaryMarker = false,
  additionalMarkers = [],
  radiusCircle = null,
  centerOverride = null,
  zoomOverride = 15,
  mapTypeControl = false,
  fullscreenControl = false,
  mapOptions = {},
}) {
  const containerRef = React.useRef(null)
  const size = useElementSize(containerRef)
  const resolvedMinZoom = React.useMemo(() => {
    const requested = toFiniteNumber(mapOptions?.minZoom)

    if (requested == null) {
      return DEFAULT_MIN_ZOOM
    }

    return clampZoom(requested, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM)
  }, [mapOptions?.minZoom])
  const resolvedMaxZoom = React.useMemo(() => {
    const requested = toFiniteNumber(mapOptions?.maxZoom)

    if (requested == null) {
      return DEFAULT_MAX_ZOOM
    }

    return Math.max(resolvedMinZoom, clampZoom(requested, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM))
  }, [mapOptions?.maxZoom, resolvedMinZoom])
  const initialZoom = React.useMemo(
    () => clampZoom(zoomOverride, resolvedMinZoom, resolvedMaxZoom),
    [resolvedMaxZoom, resolvedMinZoom, zoomOverride],
  )
  const [zoom, setZoom] = React.useState(initialZoom)
  const hasManualZoomRef = React.useRef(false)

  React.useEffect(() => {
    if (hasManualZoomRef.current) {
      return undefined
    }

    setZoom(initialZoom)
    return undefined
  }, [initialZoom])

  const zoomLevel = clampZoom(zoom, resolvedMinZoom, resolvedMaxZoom)
  const centerLocation = React.useMemo(
    () =>
      resolveCenterLocation({
        centerOverride,
        latitude,
        longitude,
        additionalMarkers,
        radiusCircle,
      }),
    [additionalMarkers, centerOverride, latitude, longitude, radiusCircle],
  )
  const primaryLocation = normalizeLocation({ latitude, longitude })
  const iframeQuery = centerLocation
    ? `${centerLocation.latitude},${centerLocation.longitude}`
    : String(address ?? '').trim()
  const iframeSrc = iframeQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(iframeQuery)}&z=${zoomLevel}&output=embed`
    : null

  React.useEffect(() => {
    const element = containerRef.current

    if (!element || !iframeSrc) {
      return undefined
    }

    const handleWheel = (event) => {
      if (!Number.isFinite(event.deltaY) || event.deltaY === 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      hasManualZoomRef.current = true
      setZoom((current) =>
        clampZoom(current + (event.deltaY < 0 ? 1 : -1), resolvedMinZoom, resolvedMaxZoom),
      )
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [iframeSrc, resolvedMaxZoom, resolvedMinZoom])

  const overlayData = React.useMemo(() => {
    if (!centerLocation || size.width <= 0 || size.height <= 0) {
      return {
        centerPoint: null,
        markers: [],
        radiusCircle: null,
      }
    }

    const centerPoint = projectCoordinates(
      centerLocation.latitude,
      centerLocation.longitude,
      zoomLevel,
    )

    const toPixel = (location) => {
      const point = projectCoordinates(location.latitude, location.longitude, zoomLevel)
      return {
        x: size.width / 2 + (point.x - centerPoint.x),
        y: size.height / 2 + (point.y - centerPoint.y),
      }
    }

    const markers = []

    if (!hidePrimaryMarker && primaryLocation) {
      markers.push({
        key: 'primary-marker',
        ...primaryLocation,
        label: primaryMarkerLabel,
        title: primaryMarkerTitle,
        color: primaryMarkerColor,
        shape: primaryMarkerShape,
        scale: primaryMarkerScale,
      })
    }

    if (Array.isArray(additionalMarkers)) {
      additionalMarkers.forEach((marker, index) => {
        const location = extractMarkerLocation(marker)
        if (!location) {
          return
        }

        markers.push({
          key: marker?.id ?? `marker-${index}`,
          ...location,
          label: marker?.label ?? '•',
          title: marker?.title ?? '',
          color: marker?.color ?? '#1f4e8c',
          shape: marker?.shape ?? 'pin',
          scale: marker?.scale ?? 1,
        })
      })
    }

    const resolvedRadiusCircle = (() => {
      const location = normalizeLocation(radiusCircle)
      const radiusMeters = toFiniteNumber(radiusCircle?.radiusMeters)

      if (!location || radiusMeters == null || radiusMeters <= 0) {
        return null
      }

      const metersPerPx = metersPerPixel(location.latitude, zoomLevel)
      if (!Number.isFinite(metersPerPx) || metersPerPx <= 0) {
        return null
      }

      const radiusPx = radiusMeters / metersPerPx
      if (!Number.isFinite(radiusPx) || radiusPx <= 0) {
        return null
      }

      const point = toPixel(location)
      return {
        left: point.x - radiusPx,
        top: point.y - radiusPx,
        size: radiusPx * 2,
      }
    })()

    return {
      centerPoint,
      markers: markers.map((marker) => ({
        ...marker,
        ...toPixel(marker),
      })),
      radiusCircle: resolvedRadiusCircle,
    }
  }, [
    additionalMarkers,
    centerLocation,
    hidePrimaryMarker,
    primaryLocation,
    primaryMarkerColor,
    primaryMarkerLabel,
    primaryMarkerScale,
    primaryMarkerShape,
    primaryMarkerTitle,
    radiusCircle,
    size.height,
    size.width,
    zoomLevel,
  ])

  if (!iframeSrc) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 320,
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background:
            'linear-gradient(145deg, rgba(31, 78, 140, 0.18), rgba(22, 58, 107, 0.24))',
          color: '#15355f',
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Lokasi peta belum tersedia
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 320,
        position: 'relative',
        overflow: 'hidden',
        background: '#0b1220',
      }}
    >
      <iframe
        title="Address map"
        src={iframeSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          pointerEvents: 'none',
          background: '#0b1220',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <RadiusOverlay overlay={overlayData.radiusCircle} />

        {overlayData.markers.map((marker) => (
          <MapMarker key={marker.key} marker={marker} x={marker.x} y={marker.y} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 999,
          background: 'rgba(11, 18, 32, 0.76)',
          color: '#ffffff',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
        aria-hidden="true"
      >
        Scroll untuk zoom
      </div>
    </div>
  )
}

export default AddressMap
