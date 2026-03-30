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
          color: '#FFFFFF',
          background: 'linear-gradient(135deg, #6FA8DC 0%, #4A90C2 100%)',
          px: { md: 7, lg: 9 },
          py: 8,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -120,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            left: -90,
            bottom: -120,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.07)',
          },
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
              color: 'rgba(255, 255, 255, 0.9)',
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
          backgroundColor: '#F4F7FB',
          px: { md: 4, lg: 6 },
          py: 8,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(111, 168, 220, 0.18) 0%, rgba(111, 168, 220, 0) 34%)',
          },
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
