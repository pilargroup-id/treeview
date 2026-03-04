import React from 'react';
import YearsCardMonthly from '../ChartMonthly/YearsCardMonthly';

function YearsCardGosave(props) {
  return (
    <YearsCardMonthly
      {...props}
      salesLabel="Net Revenue"
    />
  );
}

export default YearsCardGosave;
