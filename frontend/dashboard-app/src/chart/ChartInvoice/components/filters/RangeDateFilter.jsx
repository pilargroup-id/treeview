import React from 'react';
import DateRangePickerWithPresets from './DateRangePickerWithPresets';

function RangeDateFilter({ rangeDates = [], onAddRange, onRemoveRange, selectedYear = null }) {
  return (
    <DateRangePickerWithPresets
      rangeDates={rangeDates}
      onAddRange={onAddRange}
      onRemoveRange={onRemoveRange}
      selectedYear={selectedYear}
    />
  );
}

export default RangeDateFilter;

