import React from 'react';
import SingleDatePickerWithYear from './SingleDatePickerWithYear';

function SpecificDateFilter({ 
  specificDates,
  onAddDate,
  onRemoveDate,
  availableYears = []
}) {
  return (
    <SingleDatePickerWithYear
      specificDates={specificDates}
      onAddDate={onAddDate}
      onRemoveDate={onRemoveDate}
      availableYears={availableYears}
    />
  );
}

export default SpecificDateFilter;

