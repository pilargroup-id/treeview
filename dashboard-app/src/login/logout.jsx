import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { API_URL } from '../config/api';

function buildLogoutUrl() {
  const base = String(API_URL ?? '').replace(/\/+$/, '');
  if (!base) return '/api/tree-view/logout';
  if (/\/api$/i.test(base)) return `${base}/tree-view/logout`;
  return `${base}/api/tree-view/logout`;
}

function clearClientSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

async function requestServerLogout() {
  try {
    await fetch(buildLogoutUrl(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    // Ignore network error; local session cleanup still handles logout flow.
  }
}

export async function performLogout(onLogout) {
  await requestServerLogout();
  clearClientSession();

  if (typeof onLogout === 'function') {
    onLogout();
    return;
  }

  window.location.reload();
}

export default function Logout({ mini = false, onLogout, beforeAction = null }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await performLogout(onLogout);
  };

  const button = (
    <Button
      variant="text"
      color="inherit"
      onClick={handleLogout}
      fullWidth
      disabled={isLoading}
      startIcon={!mini && !isLoading ? <LogoutRoundedIcon fontSize="small" /> : null}
      aria-label="Logout"
      sx={{
        minHeight: 40,
        minWidth: 0,
        justifyContent: mini ? 'center' : 'flex-start',
        px: mini ? 0.5 : 1.5,
        borderRadius: 1.5,
        color: 'text.secondary',
        '&:hover': {
          bgcolor: 'rgba(239, 68, 68, 0.08)',
          color: 'error.main',
        },
      }}
    >
      {isLoading ? (
        <CircularProgress size={18} color="inherit" />
      ) : mini ? (
        <LogoutRoundedIcon fontSize="small" />
      ) : (
        'Logout'
      )}
    </Button>
  );

  return (
    <Box
      sx={{
        mt: 1,
        px: mini ? 0.5 : 1,
        py: 1,
        borderTop: '1px solid rgba(47, 111, 178, 0.18)',
      }}
    >
      {beforeAction ? <Box sx={{ mb: 0.5 }}>{beforeAction}</Box> : null}
      {mini ? <Tooltip title="Logout">{button}</Tooltip> : button}
    </Box>
  );
}
