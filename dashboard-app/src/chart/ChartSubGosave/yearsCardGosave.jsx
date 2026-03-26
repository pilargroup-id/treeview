import React from 'react';
import YearsCardBU from '../ChartBU/YearsCardBU';

function YearsCardGosave(props) {
  return (
    <YearsCardBU
      {...props}
      salesLabel="Net Revenue"
    />
  );
}

export default YearsCardGosave;
