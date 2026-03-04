import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';

const SWIPE_DISTANCE_THRESHOLD = 46;
const SWIPE_VELOCITY_THRESHOLD = 0.36;
const SLIDE_GAP = 14;
const CONTAINER_PADDING = 16;
const TRACK_TRANSITION = 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)';
const MAX_ROTATE_Y = 52;
const MAX_SCALE_REDUCTION = 0.08;
const MAX_OPACITY_REDUCTION = 0.34;
const INDICATOR_SIZE = 8;
const INDICATOR_GAP = 9;

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
  sx
}) {
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

  const fallbackSlideWidth = `calc(100% - ${CONTAINER_PADDING * 2}px)`;
  const slideWidth = Math.max(viewportWidth - CONTAINER_PADDING * 2, 0);
  const stepWidth = slideWidth + SLIDE_GAP;
  const baseTranslate = CONTAINER_PADDING - activeIndex * stepWidth;
  const transformX = baseTranslate + dragOffset;
  const progressIndex = stepWidth > 0 ? activeIndex - dragOffset / stepWidth : activeIndex;
  const perspectiveOriginX =
    stepWidth > 0 ? progressIndex * stepWidth + slideWidth / 2 : slideWidth / 2;
  const indicatorTrackWidth = totalItems * INDICATOR_SIZE + (totalItems - 1) * INDICATOR_GAP;

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

      <Box
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        sx={{
          overflow: 'hidden',
          width: '100%',
          borderRadius: '24px',
          border: '1px solid rgba(148, 163, 184, 0.34)',
          background:
            'linear-gradient(178deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 251, 255, 0.92) 100%)',
          boxShadow:
            '0 18px 36px rgba(15, 23, 42, 0.11), 0 8px 18px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.62)',
          position: 'relative',
          px: 0,
          py: 1.2,
          touchAction: hasMultipleItems ? 'pan-y' : 'auto',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: '24px',
            background:
              'radial-gradient(circle at 100% 0%, rgba(107, 163, 208, 0.24), transparent 58%), radial-gradient(circle at 0% 100%, rgba(151, 194, 225, 0.22), transparent 54%)',
            pointerEvents: 'none',
            zIndex: 0
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 8,
            height: 44,
            borderRadius: '16px',
            background: 'linear-gradient(180deg, rgba(173, 208, 233, 0), rgba(173, 208, 233, 0.23))',
            pointerEvents: 'none',
            zIndex: 0
          }
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
                    borderRadius: '20px',
                    boxShadow:
                      isActive
                        ? '0 22px 36px rgba(15, 23, 42, 0.14), 0 8px 18px rgba(15, 23, 42, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.38)'
                        : '0 12px 24px rgba(15, 23, 42, 0.08), 0 5px 12px rgba(15, 23, 42, 0.06)',
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

      {hasMultipleItems && showIndicators ? (
        <Box
          sx={{
            mt: 1.35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              width: `${indicatorTrackWidth}px`,
              display: 'flex',
              alignItems: 'center',
              gap: `${INDICATOR_GAP}px`,
              py: 0.1
            }}
          >
            {safeItems.map((item, index) => {
              const key = getItemKey ? getItemKey(item, index) : index;
              const isActive = index === activeIndex;
              return (
                <Box
                  key={`dot-${key}`}
                  component="button"
                  type="button"
                  aria-label={`Pilih card ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  sx={{
                    width: `${INDICATOR_SIZE}px`,
                    height: `${INDICATOR_SIZE}px`,
                    borderRadius: '50%',
                    border: 'none',
                    p: 0,
                    m: 0,
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(90deg, #6BA3D0 0%, #87BBE3 100%)'
                      : 'rgba(148, 163, 184, 0.42)',
                    boxShadow: isActive ? '0 2px 8px rgba(107, 163, 208, 0.45)' : 'none',
                    transform: isActive ? 'scale(1.22)' : 'scale(1)',
                    transition: 'all 220ms ease'
                  }}
                />
              );
            })}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

export default CardCarousel;
