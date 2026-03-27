import * as React from 'react';
import Box from '@mui/material/Box';

export default function HeaderBackground() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '50vh',
        minHeight: { xs: '380px', sm: '420px' },
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6BA3D0, #5A92BF)',
          height: '100%',
          width: '100%',
        }}
      />

      <Box
        component="svg"
        viewBox="0 0 500 100"
        preserveAspectRatio="none"
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: { xs: '120px', sm: '135px' },
          display: 'block',
        }}
      >
        <path d="M0,40 C150,100 350,0 500,40 L500,100 L0,100 Z" fill="#ffffff" />
      </Box>
    </Box>
  );
}
