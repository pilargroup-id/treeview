import React from 'react';
import { Box, Typography } from '@mui/material';

function HeaderMobile({
  sectionLabel = 'TreeView Dashboard',
  pageTitle = 'Dashboard',
  pageDescription = '',
  sx,
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '18px',
        border: '1px solid rgba(148, 163, 184, 0.32)',
        bgcolor: 'rgba(255, 255, 255, 0.86)',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overflow: 'hidden',
        px: 1.5,
        py: 1.35,
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: -28,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(47, 111, 178, 0.26) 0%, rgba(47, 111, 178, 0.03) 68%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 0.55 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#2F6FB2',
              boxShadow: '0 0 0 3px rgba(47, 111, 178, 0.16)',
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: '0.66rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#4B6178',
              lineHeight: 1.2,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {sectionLabel}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {pageTitle}
        </Typography>

        {pageDescription ? (
          <Typography
            sx={{
              fontSize: '0.76rem',
              fontWeight: 500,
              color: '#5B7088',
              lineHeight: 1.35,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {pageDescription}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export default HeaderMobile;
