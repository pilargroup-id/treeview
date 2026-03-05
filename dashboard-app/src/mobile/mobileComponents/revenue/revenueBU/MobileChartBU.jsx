import React from 'react';
import { Box, Card, CircularProgress, Fade, Typography, useMediaQuery } from '@mui/material';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsTooltip, ChartsTooltipContainer, useAxesTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import FilterListIcon from '@mui/icons-material/FilterList';

const SERIES_COLORS = {
  credit: 'rgb(75, 192, 192)',
  debit: 'rgb(255, 99, 132)',
  total: 'rgb(16, 185, 129)'
};

const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
const AXIS_ID = 'monthAxisMobileId';
const DEFAULT_CHART_MARGIN = { top: 18, right: 28, bottom: 50, left: 28 };
const TOOLTIP_YEAR_REGEX = /\((\d{4})\)\s*$/;
const TOOLTIP_METRIC_LABEL_MAP = {
  Credit: 'Revenue',
  Debit: 'Retur',
  Total: 'Net Revenue',
  'Total (Credit - Debit)': 'Net Revenue'
};

function normalizeTooltipMetricLabel(label) {
  const normalizedLabel = String(label || '').trim();
  if (!normalizedLabel) {
    return 'Value';
  }

  return TOOLTIP_METRIC_LABEL_MAP[normalizedLabel] || normalizedLabel;
}

function extractTooltipYearAndLabel(formattedLabel) {
  const label = String(formattedLabel || '').trim();
  const match = label.match(TOOLTIP_YEAR_REGEX);
  if (!match) {
    return { year: '-', metricLabel: normalizeTooltipMetricLabel(label) };
  }

  return {
    year: match[1],
    metricLabel: normalizeTooltipMetricLabel(label.replace(TOOLTIP_YEAR_REGEX, '').trim())
  };
}

const MonthlyComparisonTooltip = React.memo(function MonthlyComparisonTooltip({ enabled = false }) {
  const tooltipData = useAxesTooltip();
  if (!enabled || !Array.isArray(tooltipData) || tooltipData.length === 0) {
    return null;
  }

  const axisTooltip = tooltipData[0];
  const groupedByYear = new Map();

  (axisTooltip?.seriesItems || []).forEach((seriesItem) => {
    if (seriesItem?.formattedValue == null) {
      return;
    }

    const { year, metricLabel } = extractTooltipYearAndLabel(seriesItem.formattedLabel);
    const yearBucket = groupedByYear.get(year) || [];
    yearBucket.push({
      key: `${seriesItem.seriesId}-${year}`,
      color: seriesItem.color,
      metricLabel,
      value: seriesItem.formattedValue
    });
    groupedByYear.set(year, yearBucket);
  });

  if (groupedByYear.size === 0) {
    return null;
  }

  const orderedYears = Array.from(groupedByYear.keys()).sort((left, right) => Number(left) - Number(right));
  const isMultiYearTooltip = orderedYears.length > 1;

  return (
    <ChartsTooltipContainer trigger="axis">
      <Card
        sx={{
          p: 1.25,
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
          minWidth: orderedYears.length > 1 ? 260 : 180,
          bgcolor: '#FFFFFF'
        }}
      >
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: isMultiYearTooltip ? 400 : 700,
            color: '#111827',
            mb: 0.75,
            fontFamily: FONT_FAMILY
          }}
        >
          {axisTooltip?.axisFormattedValue || axisTooltip?.axisValue || '-'}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${orderedYears.length}, minmax(0, 1fr))`,
            gap: 1.25
          }}
        >
          {orderedYears.map((year) => (
            <Box key={year} sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: isMultiYearTooltip ? 400 : 700,
                  color: '#4B5563',
                  mb: 0.5,
                  fontFamily: FONT_FAMILY
                }}
              >
                {year}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {(groupedByYear.get(year) || []).map((item) => (
                  <Box
                    key={item.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 0.75
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: item.color,
                          flexShrink: 0
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.69rem',
                          color: '#6B7280',
                          lineHeight: 1.2,
                          fontFamily: FONT_FAMILY
                        }}
                      >
                        {item.metricLabel}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: isMultiYearTooltip ? 400 : 700,
                        color: '#111827',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        fontFamily: FONT_FAMILY
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Card>
    </ChartsTooltipContainer>
  );
});

function getNumericSize(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function LegendItem({ label, active, type, onToggle }) {
  return (
    <Box
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.35,
        px: 0,
        py: 0,
        cursor: 'pointer',
        opacity: active ? 1 : 0.5,
        transition: 'opacity 0.2s ease',
        '&:hover': {
          opacity: active ? 0.85 : 0.65
        },
        '&:focus-visible': {
          outline: '2px solid #6BA3D0',
          outlineOffset: '2px'
        }
      }}
      aria-label={`Toggle ${label} visibility`}
      aria-pressed={active}
    >
      {type === 'line' ? (
        <Box
          sx={{
            width: 14,
            height: 0,
            borderTop: `2px dashed ${active ? SERIES_COLORS.total : '#BDBDBD'}`,
            borderRadius: '2px'
          }}
        />
      ) : (
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            bgcolor: active ? SERIES_COLORS[type] : '#D1D5DB',
            border: `1px solid ${active ? SERIES_COLORS[type] : '#9CA3AF'}`
          }}
        />
      )}
      <Typography
        sx={{
          fontSize: '0.625rem',
          fontWeight: 600,
          color: active ? '#1F2937' : '#94A3B8',
          lineHeight: 1.2,
          fontFamily: FONT_FAMILY
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function MobileLegendToggles({
  showCredit,
  showDebit,
  showTotal,
  onToggleCredit,
  onToggleDebit,
  onToggleTotal
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.35, alignItems: 'center', minWidth: 'max-content' }}>
      <LegendItem label="Revenue" active={showCredit} type="credit" onToggle={onToggleCredit} />
      <LegendItem label="Retur" active={showDebit} type="debit" onToggle={onToggleDebit} />
      <LegendItem label="Net Revenue" active={showTotal} type="line" onToggle={onToggleTotal} />
    </Box>
  );
}

function MobileChartBU({
  loading = false,
  chartSeries = [],
  xAxisLabels = [],
  xAxisTitle = 'Bulan',
  chartLayout = {
    xAxisHeight: 52,
    axisFontSize: 10,
    tickFontSize: 10,
    margin: { top: 18, right: 28, bottom: 50, left: 28 }
  },
  yAxisConfig = [],
  chartCanvasHeight = 320,
  chartMinWidth = '620px',
  chartSeriesSx = {},
  isMultiRangeMode = false,
  hasLeftAxisSeries = true,
  hasRightAxisSeries = true,
  isMonthlyDataEmpty = false,
  emptyStateAxisMessage = '',
  isMonthlyComparisonMode = false,
  showCredit = true,
  showDebit = true,
  showTotal = true,
  onToggleCredit = () => {},
  onToggleDebit = () => {},
  onToggleTotal = () => {}
}) {
  const isExtraSmallScreen = useMediaQuery('(max-width:380px)');
  const resolvedChartMinWidth = React.useMemo(() => {
    const floorWidth = isExtraSmallScreen ? 460 : 520;
    const parsedWidth = getNumericSize(chartMinWidth);

    if (parsedWidth === null) {
      return chartMinWidth;
    }

    const adjustedWidth = parsedWidth - (isExtraSmallScreen ? 70 : 40);
    return `${Math.max(floorWidth, Math.round(adjustedWidth))}px`;
  }, [chartMinWidth, isExtraSmallScreen]);

  const resolvedChartCanvasHeight = React.useMemo(() => {
    const parsedHeight = getNumericSize(chartCanvasHeight);
    const baseHeight = parsedHeight ?? 320;

    if (isExtraSmallScreen) {
      return Math.max(228, Math.min(baseHeight, 246));
    }

    return Math.max(238, Math.min(baseHeight, 276));
  }, [chartCanvasHeight, isExtraSmallScreen]);

  const resolvedChartMargin = React.useMemo(() => {
    const margin = chartLayout?.margin ?? DEFAULT_CHART_MARGIN;
    const horizontalDelta = isExtraSmallScreen ? 12 : 8;
    const verticalDelta = isExtraSmallScreen ? 6 : 4;

    return {
      top: Math.max(12, (margin?.top ?? DEFAULT_CHART_MARGIN.top) - verticalDelta),
      right: Math.max(16, (margin?.right ?? DEFAULT_CHART_MARGIN.right) - horizontalDelta),
      bottom: Math.max(42, (margin?.bottom ?? DEFAULT_CHART_MARGIN.bottom) - (isExtraSmallScreen ? 8 : 4)),
      left: Math.max(16, (margin?.left ?? DEFAULT_CHART_MARGIN.left) - horizontalDelta)
    };
  }, [chartLayout?.margin, isExtraSmallScreen]);

  const resolvedAxisFontSize = Math.max(9, (chartLayout?.axisFontSize ?? 10) - (isExtraSmallScreen ? 1 : 0));
  const resolvedTickFontSize = Math.max(9, (chartLayout?.tickFontSize ?? 10) - (isExtraSmallScreen ? 1 : 0));
  const resolvedXAxisHeight = Math.max(44, (chartLayout?.xAxisHeight ?? 52) - (isExtraSmallScreen ? 6 : 4));
  const shouldShowScrollHint = React.useMemo(() => {
    const parsedWidth = getNumericSize(resolvedChartMinWidth);
    return Number.isFinite(parsedWidth) && parsedWidth > 560;
  }, [resolvedChartMinWidth]);

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 1px 5px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
        border: '1px solid #E5E7EB',
        mt: 0.35,
        pt: 1.25,
        px: 1,
        pb: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        fontFamily: FONT_FAMILY
      }}
    >
      <Box
        sx={{
          mb: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            fontFamily: FONT_FAMILY
          }}
        >
          Monthly Revenue
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 0.2,
            pr: 0.25,
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': {
              height: 4
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '999px',
              bgcolor: 'rgba(148, 163, 184, 0.36)'
            }
          }}
        >
          <FilterListIcon sx={{ fontSize: '0.8125rem', color: '#94A3B8', flexShrink: 0 }} />
          <Typography
            sx={{
              fontSize: '0.625rem',
              color: '#64748B',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.2,
              fontFamily: FONT_FAMILY,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Filter Chart
          </Typography>
          <MobileLegendToggles
            showCredit={showCredit}
            showDebit={showDebit}
            showTotal={showTotal}
            onToggleCredit={onToggleCredit}
            onToggleDebit={onToggleDebit}
            onToggleTotal={onToggleTotal}
          />
        </Box>
      </Box>

      <Box
        sx={{
          width: '100%',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          bgcolor: '#F8FAFC',
          px: 0.5,
          pt: 0.5,
          pb: 0.25
        }}
      >
        {shouldShowScrollHint ? (
          <Typography
            sx={{
              fontSize: '0.625rem',
              color: '#64748B',
              fontWeight: 500,
              mb: 0.35,
              px: 0.25,
              fontFamily: FONT_FAMILY
            }}
          >
            Geser chart ke samping untuk lihat semua periode.
          </Typography>
        ) : null}

        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'visible',
            pb: 0.2,
            scrollbarGutter: 'stable both-edges',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain'
          }}
        >
          <Box
            sx={{
              width: '100%',
              minWidth: resolvedChartMinWidth,
              position: 'relative',
              height: resolvedChartCanvasHeight
            }}
          >
            {loading && (
              <Fade in={loading}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.88)',
                    zIndex: 10,
                    borderRadius: 1.75,
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <CircularProgress
                    size={34}
                    thickness={4}
                    sx={{
                      color: '#6BA3D0',
                      mb: 1.25
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: '#64748B',
                      fontFamily: FONT_FAMILY
                    }}
                  >
                    Memuat data...
                  </Typography>
                </Box>
              </Fade>
            )}

            {!loading ? (
              <ChartContainer
                series={chartSeries}
                xAxis={[
                  {
                    id: AXIS_ID,
                    scaleType: isMultiRangeMode ? 'band' : 'point',
                    data: xAxisLabels,
                    height: resolvedXAxisHeight,
                    label: xAxisTitle,
                    tickLabelInterval: () => true,
                    tickLabelMinGap: 0,
                    valueFormatter: (value) => value,
                    tickLabelStyle: {
                      fontSize: resolvedTickFontSize,
                      fontFamily: FONT_FAMILY
                    }
                  }
                ]}
                yAxis={yAxisConfig}
                margin={resolvedChartMargin}
                height={resolvedChartCanvasHeight}
                sx={{
                  touchAction: 'pan-x',
                  '& svg': {
                    touchAction: 'pan-x'
                  },
                  '& .MuiBarElement-root': {
                    rx: 3.25
                  },
                  '& .MuiLineElement-root': {
                    strokeWidth: 2.35
                  },
                  '& .MuiMarkElement-root': {
                    strokeWidth: 1.4
                  },
                  '& .MuiChartsGrid-line': {
                    stroke: 'rgba(148, 163, 184, 0.26)'
                  },
                  ...chartSeriesSx,
                  '& .MuiChartsAxis-label': {
                    fontSize: resolvedAxisFontSize,
                    fontFamily: FONT_FAMILY,
                    fill: '#64748B'
                  },
                  '& .MuiChartsAxis-tickLabel': {
                    fontSize: resolvedTickFontSize,
                    fontFamily: FONT_FAMILY,
                    fill: '#64748B'
                  },
                  '& .MuiChartsAxisHighlight-root': {
                    stroke: 'rgba(107, 163, 208, 0.65)',
                    strokeDasharray: '6 4',
                    strokeWidth: 1.2
                  }
                }}
              >
                <ChartsGrid horizontal />
                <ChartsAxisHighlight x="line" y="none" />
                {isMultiRangeMode ? (
                  <BarPlot />
                ) : (
                  <>
                    <LinePlot />
                    <MarkPlot />
                  </>
                )}
                <ChartsXAxis axisId={AXIS_ID} />
                {hasLeftAxisSeries ? <ChartsYAxis axisId="leftAxisId" /> : null}
                {hasRightAxisSeries ? <ChartsYAxis axisId="rightAxisId" /> : null}
                {isMonthlyComparisonMode ? (
                  <MonthlyComparisonTooltip enabled />
                ) : (
                  <ChartsTooltip trigger="axis" />
                )}
              </ChartContainer>
            ) : null}

            {!loading && isMonthlyDataEmpty ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  px: 0.875,
                  py: 0.45,
                  borderRadius: '8px',
                  bgcolor: 'rgba(250, 250, 250, 0.94)',
                  border: '1px solid #E5E7EB',
                  pointerEvents: 'none'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.65625rem',
                    color: '#64748B',
                    fontWeight: 500,
                    fontFamily: FONT_FAMILY
                  }}
                >
                  {emptyStateAxisMessage}
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

export default React.memo(MobileChartBU);
