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
  invoiceData = []
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
    />
  );
}

export default RangeDateFilter;

