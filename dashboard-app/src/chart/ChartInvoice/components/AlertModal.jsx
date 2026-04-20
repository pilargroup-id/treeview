import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Fade
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  CheckCircleOutline as SuccessIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const AlertModal = ({ open, onClose, title, message, severity = 'info' }) => {
  const BLUE_PRIMARY = '#2F6FB2'; 
  const BLUE_DARK = '#1F4E8C';    
  const BLUE_MEDIUM = '#4A8FD0';  
  const BLUE_LIGHT = '#7BB3E0';   

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <ErrorIcon sx={{ fontSize: 48, color: BLUE_DARK }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 48, color: BLUE_MEDIUM }} />;
      case 'success':
        return <SuccessIcon sx={{ fontSize: 48, color: BLUE_LIGHT }} />;
      default:
        return <InfoIcon sx={{ fontSize: 48, color: BLUE_PRIMARY }} />;
    }
  };

  const getColor = () => {
    switch (severity) {
      case 'error':
        return BLUE_DARK;
      case 'warning':
        return BLUE_MEDIUM;
      case 'success':
        return BLUE_LIGHT;
      default:
        return BLUE_PRIMARY;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 200 }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
        }
      }}
    >
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${getColor()}15 0%, ${getColor()}08 100%)`,
          pt: 3,
          pb: 2,
          px: 3
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#757575',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mt: 1
          }}
        >
          {getIcon()}
          {title && (
            <DialogTitle
              sx={{
                textAlign: 'center',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#212121',
                p: 0,
                pb: 0.5,
                letterSpacing: '-0.01em',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
              }}
            >
              {title}
            </DialogTitle>
          )}
        </Box>
      </Box>

      <DialogContent
        sx={{
          px: 3,
          py: 3,
          textAlign: 'center'
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9375rem',
            color: '#424242',
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            whiteSpace: 'pre-line',
            wordBreak: 'break-word'
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 0,
          justifyContent: 'center',
          gap: 1.5
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: getColor(),
            color: '#ffffff',
            textTransform: 'none',
            fontSize: '0.9375rem',
            fontWeight: 500,
            borderRadius: '12px',
            px: 4,
            py: 1,
            minWidth: 120,
            boxShadow: `0 2px 8px ${getColor()}40`,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            '&:hover': {
              backgroundColor: getColor(),
              boxShadow: `0 4px 12px ${getColor()}60`,
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertModal;

