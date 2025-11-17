import React from 'react';
import DateRangePickerWithPresets from './DateRangePickerWithPresets';

function RangeDateFilter({ rangeStart, rangeEnd, onRangeStartChange, onRangeEndChange, selectedYear = null }) {
  return (
    <DateRangePickerWithPresets
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      onRangeStartChange={onRangeStartChange}
      onRangeEndChange={onRangeEndChange}
      selectedYear={selectedYear}
    />
  );
}

export default RangeDateFilter;

