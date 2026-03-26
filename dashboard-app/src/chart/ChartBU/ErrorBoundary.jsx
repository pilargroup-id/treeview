import React from 'react';
import { Box, Typography, Button, Card } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            minHeight: 400
          }}
        >
          <Card
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              bgcolor: '#FFFFFF',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid #E5E7EB'
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 64,
                color: '#F44336',
                mb: 2
              }}
            />
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                fontWeight: 600,
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
              }}
            >
              Terjadi Kesalahan
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: '#757575',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
              }}
            >
              Maaf, terjadi kesalahan saat memuat dashboard. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: '#FAFAFA',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: '#D32F2F',
                    fontSize: '0.75rem'
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{
                bgcolor: '#6BA3D0',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#5A9FD0'
                }
              }}
            >
              Coba Lagi
            </Button>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

