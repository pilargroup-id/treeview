import React from 'react'
import DateRangePickerWithPresets from '../chart/ChartInvoice/components/filters/RangeTanggal/DateRangePickerWithPresets'

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
  allowReplaceExistingRange = false,
  calendarMonths = 2,
  calendarDirection = 'horizontal',
  hidePresetPanel = false,
  hideTrigger = false,
  mobileModal = false,
  mobileFullPage = false
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
      calendarMonths={calendarMonths}
      calendarDirection={calendarDirection}
      hidePresetPanel={hidePresetPanel}
      hideTrigger={hideTrigger}
      mobileModal={mobileModal}
      mobileFullPage={mobileFullPage}
    />
  )
}

export default RangeDateFilter

