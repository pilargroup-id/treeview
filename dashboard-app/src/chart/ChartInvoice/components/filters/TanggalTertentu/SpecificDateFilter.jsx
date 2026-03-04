
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
  onValidatedRangesChange = null,
  initialValidatedRanges = null,
  openPickerSignal = 0,
  showTitle = true,
  mobileModal = false,
  mobileFullPage = false,
  previewPlacement = 'side'
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
      initialValidatedRanges={initialValidatedRanges}
      openPickerSignal={openPickerSignal}
      showTitle={showTitle}
      mobileModal={mobileModal}
      mobileFullPage={mobileFullPage}
      previewPlacement={previewPlacement}
    />
  );
}

export default SpecificDateFilter;

