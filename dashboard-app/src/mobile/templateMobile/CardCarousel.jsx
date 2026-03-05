import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';

const SWIPE_DISTANCE_THRESHOLD = 46;
const SWIPE_VELOCITY_THRESHOLD = 0.36;
const SLIDE_GAP = 14;
const DEFAULT_CONTAINER_PADDING = 16;
const TRACK_TRANSITION = 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)';
const MAX_ROTATE_Y = 52;
const MAX_SCALE_REDUCTION = 0.08;
const MAX_OPACITY_REDUCTION = 0.34;

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function a11yProps(index) {
  return {
    id: `carousel-tab-${index}`,
    'aria-controls': `carousel-tabpanel-${index}`
  };
}

function CardCarousel({
  items = [],
  renderItem,
  getItemKey,
  getTabLabel,
  initialIndex = 0,
  showTabs = false,
  showIndicators = true,
  indicatorsPlacement = 'bottom',
  sx,
  containerPadding = DEFAULT_CONTAINER_PADDING
}) {
  const normalizedContainerPadding = Number.isFinite(Number(containerPadding))
    ? Math.max(Number(containerPadding), 0)
    : DEFAULT_CONTAINER_PADDING;
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const maxIndex = Math.max(totalItems - 1, 0);
  const hasMultipleItems = totalItems > 1;
  const touchStartXRef = React.useRef(null);
  const touchStartTimeRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);
  const viewportRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(() => clamp(initialIndex, 0, maxIndex));
  const [dragOffset, setDragOffset] = React.useState(0);
  const [viewportWidth, setViewportWidth] = React.useState(0);

  React.useEffect(() => {
    setActiveIndex((prev) => clamp(prev, 0, maxIndex));
  }, [maxIndex]);

  React.useEffect(() => {
    setActiveIndex(clamp(initialIndex, 0, maxIndex));
  }, [initialIndex, maxIndex]);

  React.useEffect(() => {
    if (!viewportRef.current) return undefined;

    const updateViewportWidth = () => {
      const nextWidth = viewportRef.current?.clientWidth ?? 0;
      setViewportWidth(nextWidth);
    };

    updateViewportWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      updateViewportWidth();
    });

    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMovePrevious = React.useCallback(() => {
    setActiveIndex((prev) => clamp(prev - 1, 0, maxIndex));
  }, [maxIndex]);

  const handleMoveNext = React.useCallback(() => {
    setActiveIndex((prev) => clamp(prev + 1, 0, maxIndex));
  }, [maxIndex]);

  const handleTouchStart = (event) => {
    if (!hasMultipleItems) return;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setDragOffset(0);
  };

  const handleTouchMove = (event) => {
    if (!hasMultipleItems || touchStartXRef.current === null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
    setDragOffset(currentX - touchStartXRef.current);
  };

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = touchEndX - touchStartXRef.current;
    const durationMs = Math.max(Date.now() - touchStartTimeRef.current, 1);
    const velocityX = deltaX / durationMs;

    touchStartXRef.current = null;
    touchStartTimeRef.current = 0;
    isDraggingRef.current = false;
    setDragOffset(0);

    const hasDistanceSwipe = Math.abs(deltaX) >= SWIPE_DISTANCE_THRESHOLD;
    const hasVelocitySwipe = Math.abs(velocityX) >= SWIPE_VELOCITY_THRESHOLD;
    if (!hasDistanceSwipe && !hasVelocitySwipe) return;

    if (deltaX > 0) {
      handleMovePrevious();
    } else {
      handleMoveNext();
    }
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
    touchStartTimeRef.current = 0;
    isDraggingRef.current = false;
    setDragOffset(0);
  };

  const handleTabChange = React.useCallback(
    (_event, newValue) => {
      if (!Number.isInteger(newValue)) return;
      setActiveIndex(clamp(newValue, 0, maxIndex));
      setDragOffset(0);
    },
    [maxIndex]
  );

  const resolveTabLabel = React.useCallback(
    (item, index) => {
      if (typeof getTabLabel === 'function') {
        const customLabel = getTabLabel(item, index);
        if (customLabel !== null && customLabel !== undefined && customLabel !== '') {
          return String(customLabel);
        }
      }

      if (typeof item === 'string' || typeof item === 'number') {
        return String(item);
      }

      return `Item ${index + 1}`;
    },
    [getTabLabel]
  );

  if (totalItems === 0 || typeof renderItem !== 'function') {
    return null;
  }

  const fallbackSlideWidth = `calc(100% - ${normalizedContainerPadding * 2}px)`;
  const slideWidth = Math.max(viewportWidth - normalizedContainerPadding * 2, 0);
  const stepWidth = slideWidth + SLIDE_GAP;
  const baseTranslate = normalizedContainerPadding - activeIndex * stepWidth;
  const transformX = baseTranslate + dragOffset;
  const progressIndex = stepWidth > 0 ? activeIndex - dragOffset / stepWidth : activeIndex;
  const perspectiveOriginX =
    stepWidth > 0 ? progressIndex * stepWidth + slideWidth / 2 : slideWidth / 2;
  const shouldRenderIndicators = hasMultipleItems && showIndicators && !showTabs;
  const showIndicatorsOnTop = indicatorsPlacement === 'top';

  const renderIndicators = () => {
    if (!shouldRenderIndicators) {
      return null;
    }

    return (
      <Box
        sx={{
          mt: showIndicatorsOnTop ? 0 : 1.25,
          mb: showIndicatorsOnTop ? 1.1 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Tabs
          value={activeIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="mobile carousel year tabs"
          sx={{
            width: '100%',
            minHeight: 34,
            '& .MuiTabs-flexContainer': {
              gap: 0.75
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          {safeItems.map((item, index) => {
            const key = getItemKey ? getItemKey(item, index) : index;
            const tabLabel = resolveTabLabel(item, index);
            return (
              <Tab
                key={`indicator-tab-${key}`}
                value={index}
                label={
                  <Box
                    component="span"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      lineHeight: 1
                    }}
                  >
                    {tabLabel}
                  </Box>
                }
                aria-label={`Pilih card ${index + 1}`}
                sx={{
                  minHeight: 34,
                  py: 0.45,
                  px: 1.25,
                  borderRadius: '999px',
                  position: 'relative',
                  overflow: 'hidden',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'rgba(71, 85, 105, 0.9)',
                  minWidth: 0,
                  maxWidth: 'none',
                  flex: 1,
                  border: '1px solid rgba(148, 163, 184, 0.45)',
                  transition: 'all 220ms ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #6BA3D0 0%, #87BBE3 100%)',
                    opacity: 0,
                    transition: 'opacity 220ms ease',
                    zIndex: 0
                  },
                  '&.Mui-selected': {
                    color: '#FFFFFF !important',
                    borderColor: 'transparent',
                    boxShadow: '0 4px 12px rgba(107, 163, 208, 0.32)'
                  },
                  '&.Mui-selected::before': {
                    opacity: 1
                  }
                }}
              />
            );
          })}
        </Tabs>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        ...sx
      }}
    >
      {hasMultipleItems && showTabs ? (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.1 }}>
          <Tabs
            value={activeIndex}
            onChange={handleTabChange}
            aria-label="mobile carousel tabs"
          >
            {safeItems.map((item, index) => {
              const key = getItemKey ? getItemKey(item, index) : index;
              return (
                <Tab
                  key={`tab-${key}`}
                  label={resolveTabLabel(item, index)}
                  {...a11yProps(index)}
                />
              );
            })}
          </Tabs>
        </Box>
      ) : null}

      {showIndicatorsOnTop ? renderIndicators() : null}

      <Box
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        sx={{
          overflow: 'hidden',
          width: '100%',
          position: 'relative',
          px: 0,
          py: 0,
          touchAction: hasMultipleItems ? 'pan-y' : 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: `${SLIDE_GAP}px`,
            transform: `translate3d(${transformX}px, 0, 0)`,
            transition: isDraggingRef.current ? 'none' : TRACK_TRANSITION,
            willChange: 'transform',
            perspective: '1000px',
            perspectiveOrigin: `${perspectiveOriginX}px 50%`,
            position: 'relative',
            zIndex: 1
          }}
        >
          {safeItems.map((item, index) => {
            const key = getItemKey ? getItemKey(item, index) : index;
            const distanceFromActive = index - progressIndex;
            const distance = Math.min(Math.abs(distanceFromActive), 1.4);
            const rotateY = clamp(
              distanceFromActive * -MAX_ROTATE_Y,
              -MAX_ROTATE_Y,
              MAX_ROTATE_Y
            );
            const scale = 1 - distance * MAX_SCALE_REDUCTION;
            const opacity = 1 - distance * MAX_OPACITY_REDUCTION;
            const translateY = distance * 7;
            const isActive = Math.abs(distanceFromActive) < 0.55;

            return (
              <Box
                key={key}
                sx={{
                  minWidth: slideWidth > 0 ? `${slideWidth}px` : fallbackSlideWidth,
                  width: slideWidth > 0 ? `${slideWidth}px` : fallbackSlideWidth,
                  flex: '0 0 auto',
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale}) rotateY(${rotateY}deg)`,
                  transformOrigin: 'center center',
                  transformStyle: 'preserve-3d',
                  transition: isDraggingRef.current
                    ? 'none'
                    : 'opacity 360ms ease, transform 460ms cubic-bezier(0.22, 1, 0.36, 1)',
                  '& > .MuiCard-root': {
                    borderRadius: '18px',
                    boxShadow:
                      isActive
                        ? '0 8px 14px rgba(15, 23, 42, 0.08)'
                        : '0 4px 10px rgba(15, 23, 42, 0.05)',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    transition:
                      'box-shadow 320ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
                  }
                }}
              >
                {renderItem(item, index)}
              </Box>
            );
          })}
        </Box>
      </Box>

      {!showIndicatorsOnTop ? renderIndicators() : null}
    </Box>
  );
}

export default CardCarousel;
