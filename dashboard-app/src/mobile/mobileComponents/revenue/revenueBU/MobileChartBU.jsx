import React from 'react';
import { Box, Card, CircularProgress, Fade, Typography, useMediaQuery } from '@mui/material';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsTooltipContainer, useAxesTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';

const SERIES_COLORS = {
  credit: 'rgb(75, 192, 192)',
  debit: 'rgb(255, 99, 132)',
  total: 'rgb(16, 185, 129)'
};
const LEGEND_TONES = {
  credit: {
    surface: 'rgba(75, 192, 192, 0.1)',
    border: 'rgba(75, 192, 192, 0.22)'
  },
  debit: {
    surface: 'rgba(255, 99, 132, 0.1)',
    border: 'rgba(255, 99, 132, 0.22)'
  },
  line: {
    surface: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.22)'
  }
};

const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "SF  ro Display", "Segoe UI", sans-serif';
const AXIS_ID = 'monthAxisMobileId';
const DEFAULT_CHART_MARGIN = { top: 18, right: 28, bottom: 40, left: 28 };
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
    return {
      year: null,
      hasExplicitYear: false,
      metricLabel: normalizeTooltipMetricLabel(label)
    };
  }

  return {
    year: match[1],
    hasExplicitYear: true,
    metricLabel: normalizeTooltipMetricLabel(label.replace(TOOLTIP_YEAR_REGEX, '').trim())
  };
}

const MobileAxisTooltip = React.memo(function MobileAxisTooltip({ enabled = false }) {
  const tooltipData = useAxesTooltip();
  if (!enabled || !Array.isArray(tooltipData) || tooltipData.length === 0) {
    return null;
  }

  const axisTooltip = tooltipData[0];
  const groupedByYear = new Map();
  let hasExplicitYear = false;

  (axisTooltip?.seriesItems || []).forEach((seriesItem) => {
    if (seriesItem?.formattedValue == null) {
      return;
    }

    const { year, hasExplicitYear: isYearLabel, metricLabel } = extractTooltipYearAndLabel(
      seriesItem.formattedLabel || seriesItem.label || seriesItem.seriesId
    );
    const yearBucketKey = year || 'default';
    const yearBucket = groupedByYear.get(yearBucketKey) || [];
    yearBucket.push({
      key: `${seriesItem.seriesId}-${yearBucketKey}`,
      color: seriesItem.color,
      metricLabel,
      value: seriesItem.formattedValue
    });
    groupedByYear.set(yearBucketKey, yearBucket);
    hasExplicitYear = hasExplicitYear || isYearLabel;
  });

  if (groupedByYear.size === 0) {
    return null;
  }

  const orderedYears = hasExplicitYear
    ? Array.from(groupedByYear.keys()).sort((left, right) => Number(left) - Number(right))
    : [];
  const isMultiYearTooltip = orderedYears.length > 1;
  const defaultItems = groupedByYear.get('default') || [];

  return (
    <ChartsTooltipContainer trigger="axis">
      <Card
        sx={{
          p: 1.25,
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
          minWidth: hasExplicitYear && orderedYears.length > 1 ? 260 : 180,
          bgcolor: '#FFFFFF'
        }}
      >
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 400,
            color: '#111827',
            mb: 0.75,
            fontFamily: FONT_FAMILY
          }}
        >
          {axisTooltip?.axisFormattedValue || axisTooltip?.axisValue || '-'}
        </Typography>
        {hasExplicitYear ? (
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
                    fontWeight: 400,
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
                          fontWeight: 400,
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
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            {defaultItems.map((item) => (
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
                    fontWeight: 400,
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
        )}
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
  const accentColor = type === 'line' ? SERIES_COLORS.total : SERIES_COLORS[type];
  const accentTone = LEGEND_TONES[type];

  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.95,
        py: 0.5,
        minHeight: 30,
        borderRadius: '999px',
        border: '1px solid',
        borderColor: active ? accentTone.border : 'rgba(226, 232, 240, 0.9)',
        bgcolor: active ? accentTone.surface : 'transparent',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: active ? accentTone.border : '#CBD5E1',
          bgcolor: active ? accentTone.surface : 'rgba(248, 250, 252, 0.85)'
        },
        '&:focus-visible': {
          outline: '2px solid rgba(47, 111, 178, 0.45)',
          outlineOffset: '2px'
        }
      }}
      aria-label={`Toggle ${label} visibility`}
      aria-pressed={active}
    >
      {type === 'line' ? (
        <Box
          sx={{
            width: 12,
            height: 0,
            borderTop: `2px dashed ${active ? SERIES_COLORS.total : '#B8C3D1'}`,
            borderRadius: '2px'
          }}
        />
      ) : (
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: '3px',
            bgcolor: active ? accentColor : '#D7DEE7',
            border: `1px solid ${active ? accentColor : '#B8C3D1'}`
          }}
        />
      )}
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: active ? '#334155' : '#64748B',
          lineHeight: 1,
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
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 0.5,
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none'
      }}
    >
      <LegendItem label="Revenue" active={showCredit} type="credit" onToggle={onToggleCredit} />
      <LegendItem label="Retur" active={showDebit} type="debit" onToggle={onToggleDebit} />
      <LegendItem label="Net Revenue" active={showTotal} type="line" onToggle={onToggleTotal} />
    </Box>
  );
}

function MobileChartBU({
  loading = false,
  chartTitle = 'Monthly Revenue',
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
      return Math.max(210, Math.min(baseHeight, 230));
    }

    return Math.max(220, Math.min(baseHeight, 246));
  }, [chartCanvasHeight, isExtraSmallScreen]);

  const resolvedChartMargin = React.useMemo(() => {
    const margin = chartLayout?.margin ?? DEFAULT_CHART_MARGIN;
    const horizontalDelta = isExtraSmallScreen ? 12 : 8;
    const verticalDelta = isExtraSmallScreen ? 6 : 4;

    return {
      top: Math.max(12, (margin?.top ?? DEFAULT_CHART_MARGIN.top) - verticalDelta),
      right: Math.max(16, (margin?.right ?? DEFAULT_CHART_MARGIN.right) - horizontalDelta),
      bottom: Math.max(26, (margin?.bottom ?? DEFAULT_CHART_MARGIN.bottom) - (isExtraSmallScreen ? 16 : 14)),
      left: Math.max(16, (margin?.left ?? DEFAULT_CHART_MARGIN.left) - horizontalDelta)
    };
  }, [chartLayout?.margin, isExtraSmallScreen]);

  const resolvedAxisFontSize = Math.max(9, (chartLayout?.axisFontSize ?? 10) - (isExtraSmallScreen ? 1 : 0));
  const resolvedTickFontSize = Math.max(9, (chartLayout?.tickFontSize ?? 10) - (isExtraSmallScreen ? 1 : 0));
  const resolvedXAxisHeight = Math.max(28, (chartLayout?.xAxisHeight ?? 52) - (isExtraSmallScreen ? 18 : 16));

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
        border: '1px solid rgba(226, 232, 240, 0.75)',
        mt: 0.45,
        pt: 2,
        px: 2,
        pb: 1.25,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        fontFamily: FONT_FAMILY
      }}
    >
      <Box
        sx={{
          mb: 1.25,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0.75
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            mb: 0,
            fontFamily: FONT_FAMILY
          }}
        >
          {chartTitle}
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

      <Box
        sx={{
          width: '100%',
          borderRadius: '12px',
          border: '1px solid rgba(241, 245, 249, 0.95)',
          bgcolor: '#FFFFFF',
          px: 0.6,
          pt: 0.55,
          pb: 0.2
        }}
      >
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'visible',
            pb: 0,
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
                      color: '#2F6FB2',
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
                    stroke: 'rgba(47, 111, 178, 0.65)',
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
                <MobileAxisTooltip enabled />
              </ChartContainer>
            ) : null}

            {!loading && isMonthlyDataEmpty ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  px: 0.75,
                  py: 0.35,
                  borderRadius: '999px',
                  bgcolor: 'rgba(255, 255, 255, 0.96)',
                  border: '1px solid #E2E8F0',
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
