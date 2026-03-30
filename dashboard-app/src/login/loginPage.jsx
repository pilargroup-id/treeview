import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import DesktopLogin from './DesktopLogin';
import MobileLogin from './MobileLogin';
import { API_URL } from '../config/api';

const REMEMBERED_USERNAME_KEY = 'treeViewRememberedUsername';
const BRAND_COLOR = '#6BA3D0';
const BRAND_COLOR_DARK = '#4F89B8';
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
  const isMobileLayout = useMediaQuery('(max-width:900px)');
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

  const layoutProps = {
    username,
    password,
    rememberMe,
    showPassword,
    isLoading,
    errorMessage,
    successMessage,
    onSubmit: handleSubmit,
    onUsernameChange: (event) => setUsername(event.target.value),
    onPasswordChange: (event) => setPassword(event.target.value),
    onRememberMeChange: (event) => setRememberMe(event.target.checked),
    onTogglePasswordVisibility: () => setShowPassword((current) => !current),
    inputFieldSx,
    leadingIconSx,
    brandColor: BRAND_COLOR,
    brandColorDark: BRAND_COLOR_DARK,
  };

  return isMobileLayout ? <MobileLogin {...layoutProps} /> : <DesktopLogin {...layoutProps} />;
}
