import React from 'react';
import YearsCardMonthly from '../ChartMonthly/YearsCardMonthly';

function YearsCardGoto(props) {
  return (
    <YearsCardMonthly
      {...props}
      salesLabel="Net Revenue"
    />
  );
}

export default YearsCardGoto;
