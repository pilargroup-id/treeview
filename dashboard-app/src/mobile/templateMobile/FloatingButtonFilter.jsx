import React from 'react';
import { Box, CircularProgress, Fab } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

function FloatingButtonFilter({
  label = 'Muat Data',
  loadingLabel = 'Memuat...',
  onClick,
  isLoading = false,
  disabled = false,
  icon,
  mode = 'fixed',
  sx,
  containerSx
}) {
  const buttonIcon = icon ?? <CloudDownloadIcon sx={{ fontSize: '1rem' }} />;
  const isInlineMode = mode === 'inline';

  return (
    <Box
      sx={{
        position: isInlineMode ? 'relative' : 'fixed',
        left: isInlineMode ? 'auto' : 16,
        right: isInlineMode ? 'auto' : 16,
        bottom: isInlineMode ? 'auto' : 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        zIndex: isInlineMode ? 2 : 1300,
        pointerEvents: isInlineMode ? 'auto' : 'none',
        ...containerSx
      }}
    >
      <Fab
        variant="extended"
        onClick={onClick}
        disabled={disabled || isLoading}
        aria-label={isLoading ? loadingLabel : label}
        sx={{
          pointerEvents: 'auto',
          width: isInlineMode ? '100%' : 'min(100%, 360px)',
          maxWidth: 360,
          minHeight: 54,
          px: 2.5,
          borderRadius: '15px',
          border: '1px solid rgba(255, 255, 255, 0.38)',
          bgcolor: '#2F6FB2',
          background: 'linear-gradient(140deg, #5F98C6 0%, #2F6FB2 46%, #78ADD7 100%)',
          color: '#FFFFFF',
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          boxShadow: '0 14px 28px rgba(67, 115, 154, 0.34)',
          gap: 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: '#1F4E8C',
            background: 'linear-gradient(140deg, #568DB8 0%, #619ECA 48%, #6EA8D2 100%)',
            boxShadow: '0 16px 30px rgba(67, 115, 154, 0.38)',
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'scale(0.985)'
          },
          '&:disabled': {
            bgcolor: '#E5E7EB',
            color: '#9CA3AF',
            borderColor: 'transparent',
            boxShadow: 'none'
          },
          ...sx
        }}
      >
        {isLoading ? (
          <>
            <CircularProgress size={16} color="inherit" thickness={5} />
            {loadingLabel}
          </>
        ) : (
          <>
            {buttonIcon}
            {label}
          </>
        )}
      </Fab>
    </Box>
  );
}

export default FloatingButtonFilter;
