import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TreeViewWordmark from '../components/TreeViewWordmark';
import HeaderBackground from './HeaderBackground';
import { API_URL } from '../config/api';

const REMEMBERED_USERNAME_KEY = 'treeViewRememberedUsername';
const BRAND_COLOR = '#6BA3D0';
const BRAND_COLOR_DARK = '#4F89B8';
const PAGE_BACKGROUND = '#F4F8FC';
const INPUT_BACKGROUND = '#F8FBFE';

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
    '& .MuiInputLabel-root': {
      color: '#70839A',
      fontWeight: 500,
      '&.Mui-focused': {
        color: BRAND_COLOR_DARK,
      },
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '18px',
      backgroundColor: INPUT_BACKGROUND,
      transition: 'border-color 180ms ease, box-shadow 200ms ease, transform 180ms ease',
      '& fieldset': {
        borderColor: 'rgba(107, 163, 208, 0.18)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(79, 137, 184, 0.56)',
      },
      '&.Mui-focused': {
        transform: 'translateY(-1px)',
      },
      '&.Mui-focused fieldset': {
        borderColor: BRAND_COLOR,
        boxShadow: '0 0 0 4px rgba(107, 163, 208, 0.12)',
      },
    },
    '& .MuiInputBase-input': {
      py: 1.55,
      fontSize: '0.98rem',
    },
  };

  const leadingIconSx = {
    width: 36,
    height: 36,
    p: 0.9,
    borderRadius: '12px',
    color: BRAND_COLOR,
    backgroundColor: 'rgba(107, 163, 208, 0.14)',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${PAGE_BACKGROUND} 0%, #EEF5FB 100%)`,
        width: '100%',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: -120,
          bottom: -160,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107, 163, 208, 0.16) 0%, rgba(107, 163, 208, 0) 70%)',
          filter: 'blur(18px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
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
              color: '#FFFFFF',
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
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: { xs: '0.95rem', sm: '1rem' },
              lineHeight: 1.55,
              maxWidth: 240,
              fontWeight: 400,
            }}
          >
            Masuk untuk melanjutkan ke dashboard treeView.
          </Typography>
        </Box>

        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 3.8 },
            borderRadius: '30px',
            border: '1px solid rgba(107, 163, 208, 0.14)',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 24px 60px rgba(20, 45, 74, 0.16)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Stack spacing={2.4} component="form" noValidate onSubmit={handleSubmit}>
            <Box>
              <TreeViewWordmark fontSize={{ xs: '1.72rem', sm: '1.9rem' }} minHeight={44} />
            </Box>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

            <TextField
              label="Username"
              placeholder="Masukkan username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              fullWidth
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonRoundedIcon sx={leadingIconSx} />
                  </InputAdornment>
                ),
              }}
              sx={inputFieldSx}
            />

            <TextField
              label="Password"
              placeholder="Masukkan password"
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
                    <LockRoundedIcon sx={leadingIconSx} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                      onMouseDown={(event) => event.preventDefault()}
                      edge="end"
                      sx={{
                        color: '#7A8EA5',
                        '&:hover': {
                          backgroundColor: 'rgba(107, 163, 208, 0.12)',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputFieldSx}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 1.5,
                mt: -0.15,
              }}
            >
              <FormControlLabel
                sx={{ m: 0, mr: 0.5 }}
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    sx={{
                      p: 0.6,
                      color: 'rgba(107, 163, 208, 0.72)',
                      '&.Mui-checked': {
                        color: BRAND_COLOR,
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#5D6F84', fontSize: '0.92rem', fontWeight: 500, userSelect: 'none' }}>
                    Remember Me
                  </Typography>
                }
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                minHeight: 56,
                borderRadius: '18px',
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: '0.01em',
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #78AFD8 100%)`,
                boxShadow: '0 18px 30px rgba(107, 163, 208, 0.3)',
                transition: 'transform 180ms ease, box-shadow 220ms ease, background 220ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: `linear-gradient(135deg, ${BRAND_COLOR_DARK} 0%, #679FCA 100%)`,
                  boxShadow: '0 22px 34px rgba(107, 163, 208, 0.38)',
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
                'Login'
              )}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
