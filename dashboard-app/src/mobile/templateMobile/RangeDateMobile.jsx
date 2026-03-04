import React from 'react';
import { Box } from '@mui/material';
import RangeDateFilter from '../../chart/ChartInvoice/components/filters/RangeTanggal/RangeDateFilter';

function RangeDateMobile({
  rangeDates = [],
  onAddRange,
  onRemoveRange,
  availableYears = [],
  selectedYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  invoiceData = [],
  openPickerSignal = 0
}) {
  return (
    <Box sx={{ display: 'none' }}>
      <RangeDateFilter
        rangeDates={rangeDates}
        onAddRange={onAddRange}
        onRemoveRange={onRemoveRange}
        availableYears={availableYears}
        selectedYears={selectedYears}
        businessUnits={businessUnits}
        onBusinessUnitToggle={onBusinessUnitToggle}
        dataType="both"
        onDataTypeChange={() => {}}
        invoiceData={invoiceData}
        openPickerSignal={openPickerSignal}
        showTitle={false}
        showSummary={false}
        allowReplaceExistingRange
        calendarMonths={1}
        calendarDirection="vertical"
        hidePresetPanel
        mobileModal
        mobileFullPage
      />
    </Box>
  );
}

export default RangeDateMobile;
