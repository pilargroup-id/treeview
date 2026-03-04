import React from 'react';
import { Box } from '@mui/material';
import SpecificDateFilter from '../../chart/ChartInvoice/components/filters/TanggalTertentu/SpecificDateFilter';

function MultiRangeMobile({
  availableYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  invoiceData = [],
  onValidatedRangesChange,
  onApplyFilter,
  initialValidatedRanges = [],
  openPickerSignal = 0
}) {
  const handleValidatedRangesChange = React.useCallback((ranges) => {
    if (typeof onValidatedRangesChange === 'function') {
      onValidatedRangesChange(ranges);
    }

    if (
      Array.isArray(ranges) &&
      ranges.length > 0 &&
      typeof onApplyFilter === 'function'
    ) {
      // Tunggu update state range selesai dulu, lalu jalankan filter data.
      setTimeout(() => {
        onApplyFilter();
      }, 0);
    }
  }, [onApplyFilter, onValidatedRangesChange]);

  return (
    <Box sx={{ display: 'none' }}>
      <SpecificDateFilter
        specificDates={[]}
        onAddDate={() => {}}
        onRemoveDate={() => {}}
        availableYears={availableYears}
        businessUnits={businessUnits}
        onBusinessUnitToggle={onBusinessUnitToggle}
        dataType="both"
        onDataTypeChange={() => {}}
        invoiceData={invoiceData}
        onValidatedRangesChange={handleValidatedRangesChange}
        initialValidatedRanges={initialValidatedRanges}
        openPickerSignal={openPickerSignal}
        showTitle={false}
        mobileModal
        mobileFullPage
        previewPlacement="bottom"
      />
    </Box>
  );
}

export default MultiRangeMobile;
