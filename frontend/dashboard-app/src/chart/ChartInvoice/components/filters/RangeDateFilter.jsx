import React from 'react';
import DateRangePickerWithPresets from './DateRangePickerWithPresets';

function RangeDateFilter({ rangeDates = [], onAddRange, onRemoveRange, availableYears = [], selectedYear = null }) {
  return (
    <DateRangePickerWithPresets
      rangeDates={rangeDates}
      onAddRange={onAddRange}
      onRemoveRange={onRemoveRange}
      availableYears={availableYears}
      selectedYear={selectedYear}
    />
  );
}

export default RangeDateFilter;

