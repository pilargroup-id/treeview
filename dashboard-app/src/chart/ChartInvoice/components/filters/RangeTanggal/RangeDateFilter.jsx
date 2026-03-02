import React from 'react';
import DateRangePickerWithPresets from './DateRangePickerWithPresets';

function RangeDateFilter({ 
  rangeDates = [], 
  onAddRange, 
  onRemoveRange, 
  availableYears = [], 
  selectedYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = [],
  openPickerSignal = 0,
  showTitle = true,
  showSummary = true,
  allowReplaceExistingRange = false
}) {
  return (
    <DateRangePickerWithPresets
      rangeDates={rangeDates}
      onAddRange={onAddRange}
      onRemoveRange={onRemoveRange}
      availableYears={availableYears}
      selectedYears={selectedYears}
      businessUnits={businessUnits}
      onBusinessUnitToggle={onBusinessUnitToggle}
      dataType={dataType}
      onDataTypeChange={onDataTypeChange}
      invoiceData={invoiceData}
      openPickerSignal={openPickerSignal}
      showTitle={showTitle}
      showSummary={showSummary}
      allowReplaceExistingRange={allowReplaceExistingRange}
    />
  );
}

export default RangeDateFilter;

