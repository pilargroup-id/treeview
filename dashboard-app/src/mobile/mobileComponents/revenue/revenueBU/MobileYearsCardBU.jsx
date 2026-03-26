import React from 'react';
import YearsCardBU from '../../../../chart/ChartBU/YearsCardBU';

function MobileYearsCardBU(props) {
  return <YearsCardBU {...props} carouselIndicatorsPlacement="top" />;
}

export default React.memo(MobileYearsCardBU);
