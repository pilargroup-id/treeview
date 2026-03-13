import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { performLogout } from '../../../login/logout';

function getText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function ProfileInfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(107, 163, 208, 0.14)',
          color: '#2B6997',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography
          title={value}
          sx={{
            fontSize: '0.9rem',
            color: '#0F172A',
            fontWeight: 600,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function MobileUserProfile({ user, onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const displayName = getText(user?.displayName, 'User');
  const role = getText(user?.role, 'Programmer');
  const status = getText(user?.status, 'Online');
  const initials = getText(user?.initials, 'UN').slice(0, 2).toUpperCase();
  const email = getText(user?.email);
  const username = getText(user?.username, displayName);

  const handleLogout = React.useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await performLogout(onLogout);
  }, [isLoggingOut, onLogout]);

  return (
    <Box
      sx={{
        px: 0.6,
        pt: 1,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(148, 163, 184, 0.32)',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.95) 100%)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, pb: 1.7 }}>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, letterSpacing: 0.25 }}>
            USER ACCOUNT
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.35, alignItems: 'center', mt: 1.2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(107, 163, 208, 0.3)',
                bgcolor: 'rgba(107, 163, 208, 0.17)',
                color: '#0F172A',
                fontSize: '1.06rem',
                fontWeight: 700,
                letterSpacing: 0.5,
                flexShrink: 0,
              }}
            >
              {initials}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                title={displayName}
                sx={{
                  fontSize: '1.06rem',
                  lineHeight: 1.25,
                  color: '#0B1220',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </Typography>
              <Typography
                title={role}
                sx={{
                  mt: 0.2,
                  fontSize: '0.82rem',
                  color: '#64748B',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {role}
              </Typography>
              <Chip
                label={status}
                size="small"
                sx={{
                  mt: 0.8,
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(34, 197, 94, 0.14)',
                  color: '#15803D',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ px: 2, pt: 0.3, pb: 1.35 }}>
          <ProfileInfoRow
            icon={<PersonRoundedIcon sx={{ fontSize: '1.06rem' }} />}
            label="Username"
            value={username}
          />
          <Divider />
          <ProfileInfoRow
            icon={<EmailRoundedIcon sx={{ fontSize: '1.06rem' }} />}
            label="Email"
            value={email}
          />
          <Divider />
          <ProfileInfoRow
            icon={<BadgeRoundedIcon sx={{ fontSize: '1.06rem' }} />}
            label="Role"
            value={role}
          />
        </Box>
      </Paper>

      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant="contained"
        fullWidth
        startIcon={
          isLoggingOut ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <LogoutRoundedIcon sx={{ fontSize: '1rem' }} />
          )
        }
        sx={(theme) => ({
          mt: 'auto',
          minHeight: 46,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: '0 12px 20px rgba(43, 105, 151, 0.24)',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            boxShadow: '0 12px 20px rgba(43, 105, 151, 0.3)',
          },
          '&.Mui-disabled': {
            bgcolor: 'rgba(107, 163, 208, 0.55)',
            color: 'rgba(255, 255, 255, 0.92)',
          },
        })}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </Button>
    </Box>
  );
}
