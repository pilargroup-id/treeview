import * as React from 'react';
import Box from '@mui/material/Box';
import ChartSubGoto from '../chart/ChartSubGOTO';

const SUB_BUSINESS_UNIT_OPTIONS = ['GOTO E-Com', 'GOTO GT', 'Store'];

export default function GotoRevenue() {
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
      <ChartSubGoto
        subBusinessUnitOptions={SUB_BUSINESS_UNIT_OPTIONS}
        initialSubBusinessUnit={SUB_BUSINESS_UNIT_OPTIONS[0]}
      />
    </Box>
  );
}
