import React from 'react';
import YearsCardMonthly from '../../../../chart/ChartMonthly/YearsCardMonthly';

function MobileYearsCardBU(props) {
  return <YearsCardMonthly {...props} carouselIndicatorsPlacement="top" />;
}

export default React.memo(MobileYearsCardBU);
