import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoginFormCard from './LoginFormCard';

export default function DesktopLogin(props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <Box
        sx={{
          flex: '1 1 56%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          color: '#1F4E8C', // Changed to dark blue since BackgroundMain is light
          background: 'transparent',
          px: { md: 7, lg: 9 },
          py: 8,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 520,
          }}
        >
          <Typography
            component="h1"
            sx={{
              mb: 2.5,
              fontSize: { md: '4.2rem', lg: '4.8rem', xl: '5.2rem' },
              fontWeight: 700,
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
              fontFamily: '"Poppins", "Segoe UI", sans-serif',
            }}
          >
            Login
          </Typography>
          <Typography
            sx={{
              maxWidth: 420,
              fontSize: { md: '1.2rem', lg: '1.35rem' },
              lineHeight: 1.75,
              color: '#2F6FB2', // Adjusted color for light background
              fontWeight: 400,
            }}
          >
            Masuk untuk melanjutkan ke dashboard treeView.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: '1 1 44%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'transparent',
          px: { md: 4, lg: 6 },
          py: 8,
        }}
      >
        <LoginFormCard
          {...props}
          variant="desktopSplit"
          sx={{
            width: '100%',
            maxWidth: 450,
          }}
        />
      </Box>
    </Box>
  );
}
