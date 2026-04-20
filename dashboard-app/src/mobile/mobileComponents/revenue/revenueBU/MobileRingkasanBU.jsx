import React from 'react';
import { Box, Typography, Card, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MobileFilterBU from './MobileFilterBU';

function MobileRingkasanBU({
  filterType = 'monthly',
  dateRangeLabel = 'Belum dipilih',
  onFilterTypeChange,
  onOpenCalendarModal,
  availableBusinessUnits = [],
  businessUnits = [],
  onBusinessUnitToggle,
  onClearRangeData,
  onLoadData,
  onRefreshData,
  isLoading = false
}) {
  const refreshHandler = onRefreshData || onLoadData;

  return (
    <Card
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.58)',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E5E7EB',
        p: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          width: '100%'
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}
        >
          Filter
        </Typography>
        {typeof refreshHandler === 'function' ? (
          <IconButton
            onClick={refreshHandler}
            disabled={isLoading}
            size="small"
            sx={{
              color: '#9E9E9E',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#2F6FB2',
                bgcolor: '#FAFAFA'
              },
              '&:disabled': {
                color: '#E0E0E0'
              },
              '&:focus-visible': {
                outline: '2px solid #2F6FB2',
                outlineOffset: '2px'
              }
            }}
            title="Refresh Data"
            aria-label="Refresh data"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Box>

      <MobileFilterBU
        filterType={filterType}
        dateRangeLabel={dateRangeLabel}
        onFilterTypeChange={onFilterTypeChange}
        onOpenCalendarModal={onOpenCalendarModal}
        availableBusinessUnits={availableBusinessUnits}
        businessUnits={businessUnits}
        onBusinessUnitToggle={onBusinessUnitToggle}
        onClearRangeData={onClearRangeData}
        onLoadData={onLoadData}
        isLoading={isLoading}
      />
    </Card>
  );
}

export default React.memo(MobileRingkasanBU);
