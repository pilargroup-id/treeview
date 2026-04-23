import React from 'react';
import { Box, ButtonBase, Typography, Card, Skeleton, useMediaQuery } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CardCarousel from '../../mobile/templateMobile/CardCarousel';

const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
const ACCENT_TEAL_DARK = '#23857a';
const ACCENT_TEAL_DARK_HOVER = '#1f756c';

function formatCurrency(num) {
  const value = parseFloat(num);
  if (Number.isNaN(value)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function getPreviousYearSummary(currentYear, yearTotals, availableYears) {
  const currentIndex = availableYears.indexOf(currentYear);

  if (currentIndex === -1 || currentIndex === availableYears.length - 1) {
    return null;
  }

  const previousYearValue = availableYears[currentIndex + 1];
  return {
    year: previousYearValue,
    data: yearTotals[previousYearValue] || { sales: 0, quantity: 0, order: 0 }
  };
}

function calculatePercentageChange(currentYear, yearTotals, availableYears) {
  const currentData = yearTotals[currentYear] || { sales: 0 };
  const previousSummary = getPreviousYearSummary(currentYear, yearTotals, availableYears);
  if (!previousSummary) return null;

  const previousData = previousSummary.data || { sales: 0 };
  if (!previousData.sales || previousData.sales === 0) return null;

  return ((currentData.sales - previousData.sales) / previousData.sales) * 100;
}

function LoadingYearCard({ year }) {
  return (
    <Card
      key={year}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #E5E5E5',
        bgcolor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        height: 'fit-content',
        fontFamily: FONT_FAMILY
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5
          }}
        >
          <Skeleton variant="text" width={60} height={22} />
          <Skeleton variant="text" width={50} height={16} />
        </Box>

        <Box>
          <Skeleton variant="text" width={80} height={14} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="100%" height={18} />
        </Box>

        <Box
          sx={{
            pt: 1,
            borderTop: '1px solid #F1F5F9',
            mt: 0.5
          }}
        >
          <Skeleton variant="text" width={100} height={16} />
        </Box>
      </Box>
    </Card>
  );
}

function DataYearCard({
  year,
  selectedYears,
  yearTotals,
  availableYears,
  onToggleYear,
  isDisabled,
  salesLabel,
  showPreviousYearSummary,
  previousYearSummaryLabel
}) {
  const isSelected = selectedYears.some((selectedYear) => Number(selectedYear) === Number(year));
  const yearData = yearTotals[year] || { sales: 0, quantity: 0, order: 0 };
  const previousYearSummary = getPreviousYearSummary(year, yearTotals, availableYears);
  const previousYearSalesValue = Number(previousYearSummary?.data?.sales ?? 0);
  const hasPreviousYearSummary = Boolean(previousYearSummary);
  const percentageChange = calculatePercentageChange(year, yearTotals, availableYears);
  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;
  const absPercentage = Math.abs(percentageChange ?? 0);

  return (
    <Card
      key={year}
      onClick={() => !isDisabled && onToggleYear && onToggleYear(year)}
      sx={{
        p: { xs: 1.75, md: 3 },
        borderRadius: '16px',
        boxShadow: isSelected
          ? '0 6px 16px rgba(35, 133, 122, 0.18), 0 2px 6px rgba(35, 133, 122, 0.12)'
          : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${isSelected ? ACCENT_TEAL_DARK : '#E5E7EB'}`,
        cursor: isDisabled ? 'default' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        bgcolor: isSelected ? '#FFFFFF' : '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        height: 'fit-content',
        minWidth: 0,
        opacity: isDisabled ? 0.6 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
        fontFamily: FONT_FAMILY,
        zIndex: 1,
        '&:hover': !isDisabled
          ? {
              borderColor: isSelected ? ACCENT_TEAL_DARK : '#D1D5DB',
              boxShadow: isSelected
                ? '0 8px 18px rgba(35, 133, 122, 0.22), 0 3px 8px rgba(35, 133, 122, 0.14)'
                : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
              bgcolor: '#FFFFFF',
              transform: 'translateY(-2px)'
            }
          : {},
        '&:active': !isDisabled
          ? {
              transform: 'scale(0.98)',
              transition: 'all 0.1s ease'
            }
          : {}
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 0.75, md: 1 },
          width: '100%',
          minWidth: 0,
          position: 'relative',
          zIndex: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5,
            minWidth: 0,
            gap: 1
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.5rem' },
              color: isSelected ? ACCENT_TEAL_DARK : '#212121',
              fontWeight: 600,
              fontFamily: FONT_FAMILY,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              transition: 'color 0.2s ease',
              minWidth: 0,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {year}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.25,
              flexShrink: 0
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '0.625rem', md: '0.75rem' },
                fontWeight: 600,
                color: isSelected ? ACCENT_TEAL_DARK : '#9CA3AF',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
                transition: 'color 0.2s ease',
                letterSpacing: '-0.01em'
              }}
            >
              {yearData.order.toLocaleString('id-ID')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: '#9E9E9E',
                fontFamily: FONT_FAMILY,
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'color 0.2s ease'
              }}
            >
              Order
            </Typography>
          </Box>
        </Box>

        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography
            sx={{
              fontSize: { xs: '0.625rem', md: '0.6875rem' },
              color: '#757575',
              fontWeight: 500,
              mb: { xs: 0.75, md: 1 },
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.2,
              fontFamily: FONT_FAMILY,
              transition: 'color 0.2s ease'
            }}
          >
            {salesLabel}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.875rem', md: '1.25rem' },
              fontWeight: 600,
              color: '#212121',
              fontFamily: FONT_FAMILY,
              lineHeight: 1.3,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              transition: 'color 0.2s ease',
              letterSpacing: '-0.01em',
              minWidth: 0,
              width: '100%'
            }}
          >
            {formatCurrency(yearData.sales)}
          </Typography>
          {showPreviousYearSummary ? (
            <Typography
              sx={{
                fontSize: { xs: '0.625rem', md: '0.75rem' },
                color: '#9CA3AF',
                fontWeight: 500,
                mt: 0.75,
                lineHeight: 1.4,
                fontFamily: FONT_FAMILY
              }}
            >
              {hasPreviousYearSummary
                ? `${previousYearSummaryLabel} (${previousYearSummary.year}): ${formatCurrency(previousYearSalesValue)}`
                : `${previousYearSummaryLabel}: -`}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            pt: { xs: 1, md: 1.5 },
            borderTop: '1px solid #F5F5F5',
            mt: { xs: 0.75, md: 1 },
            transition: 'border-color 0.2s ease',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '0.625rem', md: '0.6875rem' },
                color: '#9E9E9E',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.5,
                transition: 'color 0.2s ease',
                flex: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  fontWeight: 500,
                  color: '#757575',
                  transition: 'color 0.2s ease'
                }}
              >
                {yearData.quantity.toLocaleString('id-ID')}
              </Box>{' '}
              Qty
            </Typography>
            {percentageChange === null || percentageChange === undefined ? null : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  flexShrink: 0
                }}
              >
                {isPositive ? (
                  <ArrowUpwardIcon
                    sx={{
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      color: '#10B981',
                      lineHeight: 1
                    }}
                  />
                ) : isNegative ? (
                  <ArrowDownwardIcon
                    sx={{
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      color: '#EF4444',
                      lineHeight: 1
                    }}
                  />
                ) : null}
                <Typography
                  sx={{
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    fontWeight: 600,
                    color: isPositive ? '#10B981' : isNegative ? '#EF4444' : '#64748B',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {absPercentage.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

function YearCards({
  availableYears = [],
  selectedYears = [],
  yearTotals = {},
  onToggleYear,
  isLoading = false,
  dateFilterType = 'year',
  salesLabel = 'Net Revenue',
  showPreviousYearSummary = false,
  previousYearSummaryLabel = 'Tahun Lalu',
  carouselIndicatorsPlacement = 'bottom'
}) {
  const isMobileScreen = useMediaQuery('(max-width:600px)');
  const isDisabled =
    dateFilterType === 'range' || dateFilterType === 'specific' || dateFilterType === 'multi_range';
  const [mobileInitialIndex, setMobileInitialIndex] = React.useState(0);

  const getYearIndex = React.useCallback(
    (targetYear) => availableYears.findIndex((year) => Number(year) === Number(targetYear)),
    [availableYears]
  );

  React.useEffect(() => {
    if (availableYears.length === 0) {
      setMobileInitialIndex(0);
      return;
    }

    const preferredSelectedYear = [...selectedYears]
      .reverse()
      .find((year) => getYearIndex(year) !== -1);

    if (preferredSelectedYear !== undefined) {
      setMobileInitialIndex(getYearIndex(preferredSelectedYear));
      return;
    }

    setMobileInitialIndex((previousIndex) =>
      Math.min(previousIndex, Math.max(availableYears.length - 1, 0))
    );
  }, [availableYears, selectedYears, getYearIndex]);

  const renderCardByYear = (year) => {
    if (isLoading) {
      return <LoadingYearCard year={year} />;
    }

    return (
      <DataYearCard
        year={year}
        selectedYears={selectedYears}
        yearTotals={yearTotals}
        availableYears={availableYears}
        onToggleYear={onToggleYear}
        isDisabled={isDisabled}
        salesLabel={salesLabel}
        showPreviousYearSummary={showPreviousYearSummary}
        previousYearSummaryLabel={previousYearSummaryLabel}
      />
    );
  };

  const renderMobileYearPills = () => {
    if (availableYears.length <= 1) {
      return null;
    }

    return (
      <Box
        sx={{
          mt: carouselIndicatorsPlacement === 'top' ? 0 : 1.25,
          mb: carouselIndicatorsPlacement === 'top' ? 1.1 : 0,
          px: 0.05
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(availableYears.length, 1)}, minmax(0, 1fr))`,
            alignItems: 'center',
            gap: 0.5,
            width: '100%',
            px: 0,
            py: 0.25,
            overflow: 'hidden'
          }}
        >
          {availableYears.map((year, index) => {
            const isSelectedYear = selectedYears.some(
              (selectedYear) => Number(selectedYear) === Number(year)
            );

            return (
              <ButtonBase
                key={`year-pill-${year}`}
                onClick={() => {
                  setMobileInitialIndex(index);
                  if (!isDisabled && onToggleYear) {
                    onToggleYear(year);
                  }
                }}
                aria-label={`Pilih tahun ${year}`}
                aria-pressed={isSelectedYear}
                sx={{
                  minHeight: 34,
                  minWidth: 0,
                  width: '100%',
                  py: 0.45,
                  px: 0.5,
                  borderRadius: '999px',
                  fontSize: 'clamp(0.625rem, 2.8vw, 0.75rem)',
                  fontWeight: 600,
                  fontFamily: FONT_FAMILY,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  justifyContent: 'center',
                  color: isSelectedYear ? '#FFFFFF' : 'rgba(71, 85, 105, 0.9)',
                  border: `1px solid ${isSelectedYear ? ACCENT_TEAL_DARK : 'rgba(148, 163, 184, 0.45)'}`,
                  background: isSelectedYear
                    ? `linear-gradient(90deg, ${ACCENT_TEAL_DARK} 0%, ${ACCENT_TEAL_DARK} 100%)`
                    : '#FFFFFF',
                  boxShadow: isSelectedYear ? '0 4px 12px rgba(35, 133, 122, 0.28)' : 'none',
                  opacity: isDisabled ? 0.82 : 1,
                  transition: 'all 220ms ease',
                  '&:hover': {
                    borderColor: isSelectedYear ? ACCENT_TEAL_DARK_HOVER : 'rgba(148, 163, 184, 0.7)',
                    background: isSelectedYear
                      ? `linear-gradient(90deg, ${ACCENT_TEAL_DARK_HOVER} 0%, ${ACCENT_TEAL_DARK_HOVER} 100%)`
                      : '#F8FAFC'
                  }
                }}
              >
                {year}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
    );
  };

  if (isMobileScreen) {
    const showPillsOnTop = carouselIndicatorsPlacement === 'top';

    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        {showPillsOnTop ? renderMobileYearPills() : null}
        <CardCarousel
          items={availableYears}
          getItemKey={(year) => year}
          showTabs={false}
          showIndicators={false}
          initialIndex={mobileInitialIndex}
          containerPadding={0}
          indicatorsPlacement={carouselIndicatorsPlacement}
          renderItem={(year) => renderCardByYear(year)}
        />
        {!showPillsOnTop ? renderMobileYearPills() : null}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(5, 1fr)'
        },
        gap: { xs: 2, md: 2.5 },
        alignItems: 'start',
        fontFamily: FONT_FAMILY,
        overflow: 'visible',
        minWidth: 0
      }}
    >
      {availableYears.map((year) => (
        <React.Fragment key={year}>{renderCardByYear(year)}</React.Fragment>
      ))}
    </Box>
  );
}

export default YearCards;
