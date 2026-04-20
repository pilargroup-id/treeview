import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HeaderBackground from './HeaderBackground';
import LoginFormCard from './LoginFormCard';

const PAGE_BACKGROUND = '#F4F8FC';

export default function MobileLogin(props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
        width: '100%',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
          display: 'none', // Hide the original header background
        }}
      >
        <HeaderBackground />
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 448,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          px: { xs: 2, sm: 2.5 },
          py: { xs: 4, sm: 5.5 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 28, sm: 42 },
            left: { xs: 24, sm: 28 },
            right: { xs: 24, sm: 28 },
            zIndex: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 1.2,
              minHeight: 60,
              display: 'inline-flex',
              alignItems: 'center',
              color: '#1F4E8C', // Changed from white to dark blue since background is light
              fontWeight: 700,
              fontSize: { xs: '2.2rem', sm: '2.6rem' },
              lineHeight: 1,
              fontFamily: '"Poppins", "Segoe UI", sans-serif',
            }}
          >
            Login
          </Typography>
          <Typography
            sx={{
              color: '#2F6FB2', // Adjusted color for light background
              fontSize: { xs: '0.95rem', sm: '1rem' },
              lineHeight: 1.55,
              maxWidth: 240,
              fontWeight: 400,
            }}
          >
            Masuk untuk melanjutkan ke dashboard treeView.
          </Typography>
        </Box>

        <LoginFormCard {...props} />
      </Box>
    </Box>
  );
}
