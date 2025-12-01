
import React from 'react';
import SingleDatePickerWithYear from './SingleDatePickerWithYear';


function SpecificDateFilter({ 
  specificDates,
  onAddDate,
  onRemoveDate,
  availableYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = [],
  onValidatedRangesChange = null
}) {
  return (
    <SingleDatePickerWithYear
      specificDates={specificDates}
      onAddDate={onAddDate}
      onRemoveDate={onRemoveDate}
      availableYears={availableYears}
      businessUnits={businessUnits}
      onBusinessUnitToggle={onBusinessUnitToggle}
      dataType={dataType}
      onDataTypeChange={onDataTypeChange}
      invoiceData={invoiceData}
      onValidatedRangesChange={onValidatedRangesChange}
    />
  );
}

export default SpecificDateFilter;

