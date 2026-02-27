import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TreeViewWordmark from '../components/TreeViewWordmark';
import { API_URL } from '../config/api';

const REMEMBERED_USERNAME_KEY = 'treeViewRememberedUsername';

function buildLoginUrl() {
  const base = String(API_URL ?? '').replace(/\/+$/, '');
  if (!base) return '/api/tree-view/login';
  if (/\/api$/i.test(base)) return `${base}/tree-view/login`;
  return `${base}/api/tree-view/login`;
}

function getValidationMessage(errorBody) {
  const usernameErrors = errorBody?.errors?.username;
  const passwordErrors = errorBody?.errors?.password;
  if (Array.isArray(usernameErrors) && usernameErrors.length > 0) return usernameErrors[0];
  if (Array.isArray(passwordErrors) && passwordErrors.length > 0) return passwordErrors[0];
  return errorBody?.message || 'Input tidak valid.';
}

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      setSuccessMessage('');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(buildLoginUrl(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
        }),
      });

      let responseBody = {};
      try {
        responseBody = await response.json();
      } catch {
        responseBody = {};
      }

      if (!response.ok || !responseBody?.success) {
        if (response.status === 422) {
          throw new Error(getValidationMessage(responseBody));
        }
        throw new Error(responseBody?.message || 'Login gagal. Silakan coba lagi.');
      }

      const userData = responseBody?.data?.user ?? null;
      const token = responseBody?.data?.token ?? '';

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USERNAME_KEY, trimmedUsername);
      } else {
        localStorage.removeItem(REMEMBERED_USERNAME_KEY);
      }

      setSuccessMessage(responseBody?.message || 'Login berhasil.');
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({
          token,
          user: userData,
        });
      }
    } catch (error) {
      if (error instanceof TypeError && /Failed to fetch/i.test(error.message)) {
        setErrorMessage('Tidak bisa terhubung ke API. Cek backend, VITE_API_URL, dan konfigurasi CORS.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      backgroundColor: '#FFFFFF',
      transition: 'border-color 180ms ease, box-shadow 200ms ease, transform 180ms ease',
      '& fieldset': {
        borderColor: 'rgba(107, 163, 208, 0.28)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(90, 137, 180, 0.72)',
      },
      '&.Mui-focused': {
        transform: 'translateY(-1px)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#6BA3D0',
        boxShadow: '0 0 0 4px rgba(107, 163, 208, 0.14)',
      },
    },
    '& .MuiInputBase-input': {
      py: 1.45,
    },
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(140deg, #EAF2FA 0%, #F3F7FC 47%, #FFFFFF 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -220,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107, 163, 208, 0.24) 0%, rgba(107, 163, 208, 0) 70%)',
          filter: 'blur(4px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: -220,
          bottom: -260,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(122, 142, 165, 0.22) 0%, rgba(122, 142, 165, 0) 66%)',
          filter: 'blur(6px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(107, 163, 208, 0.1) 1px, transparent 0)',
          backgroundSize: '26px 26px',
          opacity: 0.35,
        }}
      />
      <Stack
        spacing={{ xs: 2.2, md: 2.8 }}
        sx={{
          width: '100%',
          maxWidth: 430,
          position: 'relative',
          zIndex: 1,
          alignItems: 'center',
          transform: { xs: 'translateY(-12px)', md: 'translateY(-22px)' },
        }}
      >
        <TreeViewWordmark fontSize={{ xs: '2.35rem', md: '2.8rem' }} minHeight={58} />

        <Box
          sx={{
            width: '100%',
            mt: { xs: -2, md: -3 },
            p: { xs: 3, sm: 3.8, md: 4.2 },
            borderRadius: '26px',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Stack spacing={2.45} component="form" noValidate onSubmit={handleSubmit}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  fontSize: { xs: '1.72rem', sm: '1.9rem' },
                  fontFamily: '"Poppins", "Segoe UI", sans-serif',
                }}
              >
                Login
              </Typography>
            </Box>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              fullWidth
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonRoundedIcon sx={{ color: '#6BA3D0' }} />
                  </InputAdornment>
                ),
              }}
              sx={inputFieldSx}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon sx={{ color: '#6BA3D0' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                      onMouseDown={(event) => event.preventDefault()}
                      edge="end"
                      sx={{ color: '#7A8EA5' }}
                    >
                      {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputFieldSx}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -0.25 }}>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    sx={{
                      p: 0.75,
                      color: 'rgba(107, 163, 208, 0.7)',
                      '&.Mui-checked': {
                        color: '#6BA3D0',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#5D6F84', fontSize: '0.91rem', userSelect: 'none' }}>
                    Remember Me
                  </Typography>
                }
              />
              <Link
                href="#"
                underline="hover"
                onClick={(event) => event.preventDefault()}
                sx={{
                  color: '#5A8BB8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Forgot Password
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              endIcon={isLoading ? null : <ArrowForwardRoundedIcon />}
              sx={{
                minHeight: 50,
                borderRadius: '14px',
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: '0.01em',
                background: 'linear-gradient(135deg, #6BA3D0 0%, #5A9FD0 100%)',
                boxShadow: '0 12px 26px rgba(90, 159, 208, 0.34)',
                transition: 'transform 180ms ease, box-shadow 220ms ease, background 220ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: 'linear-gradient(135deg, #5F97C4 0%, #4F8CB9 100%)',
                  boxShadow: '0 16px 30px rgba(90, 159, 208, 0.44)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.72)',
                  background: 'linear-gradient(135deg, #9ABFD9 0%, #8EB5D2 100%)',
                },
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Memproses...
                </>
              ) : (
                'Login ke Dashboard'
              )}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
