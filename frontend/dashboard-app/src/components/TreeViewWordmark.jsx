import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function TreeViewWordmark({
  fontSize = { xs: '1.05rem', sm: '1.22rem' },
  treeColor = '#6BA3D0',
  viewColor = '#7A8EA5',
  treeWeight = 700,
  viewWeight = 600,
  letterSpacing = '0.01em',
  lineHeight = 1,
  minHeight = 40,
  sx,
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight,
        lineHeight,
        userSelect: 'none',
        ...sx,
      }}
    >
      <Typography
        component="span"
        sx={{
          color: treeColor,
          fontWeight: treeWeight,
          fontSize,
          letterSpacing,
          lineHeight,
          fontFamily: '"Poppins", "Segoe UI", sans-serif',
        }}
      >
        tree
      </Typography>
      <Typography
        component="span"
        sx={{
          color: viewColor,
          fontWeight: viewWeight,
          fontSize,
          letterSpacing,
          lineHeight,
          fontFamily: '"Poppins", "Segoe UI", sans-serif',
        }}
      >
        View
      </Typography>
    </Box>
  );
}
