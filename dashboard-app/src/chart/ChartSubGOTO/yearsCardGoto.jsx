import React from 'react';
import YearsCardBU from '../ChartBU/YearsCardBU';

function YearsCardGoto(props) {
  return (
    <YearsCardBU
      {...props}
      salesLabel="Net Revenue"
    />
  );
}

export default YearsCardGoto;
