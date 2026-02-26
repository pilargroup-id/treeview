import * as React from 'react';
import Box from '@mui/material/Box';
import ChartGosave from '../chart/ChartSubGosave';

export default function GosaveRevenue() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <ChartGosave initialBusinessUnits={['Gosave']} />
    </Box>
  );
}
