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

export default function LoginFormCard({
  username,
  password,
  rememberMe,
  showPassword,
  isLoading,
  errorMessage,
  successMessage,
  onSubmit,
  onUsernameChange,
  onPasswordChange,
  onRememberMeChange,
  onTogglePasswordVisibility,
  inputFieldSx,
  leadingIconSx,
  brandColor,
  brandColorDark,
  variant = 'default',
  sx,
}) {
  const isDesktopSplitVariant = variant === 'desktopSplit';

  return (
    <Box
      sx={[
        isDesktopSplitVariant
          ? {
              width: '100%',
              maxWidth: 450,
              p: { xs: 4, sm: 5.4 },
              borderRadius: '24px',
              border: 'none',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              zIndex: 1,
            }
          : {
              width: '100%',
              maxWidth: 420,
              p: { xs: 3, sm: 3.8 },
              borderRadius: '30px',
              border: '1px solid rgba(47, 111, 178, 0.14)',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(20, 45, 74, 0.16)',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              zIndex: 1,
            },
        sx,
      ]}
    >
      <Stack spacing={isDesktopSplitVariant ? 2 : 2.4} component="form" noValidate onSubmit={onSubmit}>
        <Box>
          <TreeViewWordmark
            fontSize={isDesktopSplitVariant ? { xs: '1.9rem', sm: '2rem' } : { xs: '1.72rem', sm: '1.9rem' }}
            minHeight={isDesktopSplitVariant ? 48 : 44}
            treeColor={isDesktopSplitVariant ? '#2F6FB2' : '#2F6FB2'}
            viewColor={isDesktopSplitVariant ? '#8C97A8' : '#7A8EA5'}
            treeWeight={700}
            viewWeight={700}
          />
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

        <TextField
          label={isDesktopSplitVariant ? undefined : 'Username'}
          placeholder={isDesktopSplitVariant ? 'Username' : 'Masukkan username'}
          value={username}
          onChange={onUsernameChange}
          autoComplete="username"
          required
          fullWidth
          disabled={isLoading}
          InputProps={{
            startAdornment: isDesktopSplitVariant ? null : (
              <InputAdornment position="start">
                <PersonRoundedIcon sx={leadingIconSx} />
              </InputAdornment>
            ),
          }}
          sx={[
            inputFieldSx,
            isDesktopSplitVariant
              ? {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      borderColor: '#D9E2EC',
                    },
                    '&:hover fieldset': {
                      borderColor: '#B4C5D8',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: brandColor,
                      boxShadow: '0 0 0 4px rgba(47, 111, 178, 0.1)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.7,
                    fontSize: '0.95rem',
                  },
                  '& .MuiInputLabel-root': {
                    display: 'none',
                  },
                }
              : {},
          ]}
        />

        <TextField
          label={isDesktopSplitVariant ? undefined : 'Password'}
          placeholder={isDesktopSplitVariant ? 'Password' : 'Masukkan password'}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={onPasswordChange}
          autoComplete="current-password"
          required
          fullWidth
          disabled={isLoading}
          InputProps={{
            startAdornment: isDesktopSplitVariant ? null : (
              <InputAdornment position="start">
                <LockRoundedIcon sx={leadingIconSx} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={onTogglePasswordVisibility}
                  onMouseDown={(event) => event.preventDefault()}
                  edge="end"
                  sx={{
                    color: '#7A8EA5',
                    '&:hover': {
                      backgroundColor: 'rgba(47, 111, 178, 0.12)',
                    },
                  }}
                >
                  {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={[
            inputFieldSx,
            isDesktopSplitVariant
              ? {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      borderColor: '#D9E2EC',
                    },
                    '&:hover fieldset': {
                      borderColor: '#B4C5D8',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: brandColor,
                      boxShadow: '0 0 0 4px rgba(47, 111, 178, 0.1)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.7,
                    fontSize: '0.95rem',
                  },
                  '& .MuiInputLabel-root': {
                    display: 'none',
                  },
                }
              : {},
          ]}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: isDesktopSplitVariant ? 'nowrap' : 'wrap',
            gap: 1.5,
            mt: isDesktopSplitVariant ? 0 : -0.15,
          }}
        >
          <FormControlLabel
            sx={{ m: 0, mr: isDesktopSplitVariant ? 0 : 0.5 }}
            control={
              <Checkbox
                checked={rememberMe}
                onChange={onRememberMeChange}
                sx={{
                  p: isDesktopSplitVariant ? 0.4 : 0.6,
                  color: 'rgba(47, 111, 178, 0.72)',
                  '&.Mui-checked': {
                    color: brandColor,
                  },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  color: isDesktopSplitVariant ? '#7A8CA3' : '#5D6F84',
                  fontSize: isDesktopSplitVariant ? '0.88rem' : '0.92rem',
                  fontWeight: 500,
                  userSelect: 'none',
                }}
              >
                {isDesktopSplitVariant ? 'Remember me' : 'Remember Me'}
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
            minHeight: isDesktopSplitVariant ? 54 : 56,
            borderRadius: isDesktopSplitVariant ? '16px' : '18px',
            fontWeight: 700,
            textTransform: 'none',
            letterSpacing: '0.01em',
            fontSize: isDesktopSplitVariant ? '1.05rem' : '1rem',
            background: isDesktopSplitVariant
              ? 'linear-gradient(135deg, #2F6FB2 0%, #1F4E8C 100%)'
              : `linear-gradient(135deg, ${brandColor} 0%, #2F6FB2 100%)`,
            boxShadow: isDesktopSplitVariant
              ? '0 18px 32px rgba(31, 78, 140, 0.24)'
              : '0 18px 30px rgba(47, 111, 178, 0.3)',
            transition: 'transform 180ms ease, box-shadow 220ms ease, background 220ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              background: isDesktopSplitVariant
                ? 'linear-gradient(135deg, #2F6FB2 0%, #1F4E8C 100%)'
                : `linear-gradient(135deg, ${brandColorDark} 0%, #1F4E8C 100%)`,
              boxShadow: isDesktopSplitVariant
                ? '0 20px 34px rgba(31, 78, 140, 0.3)'
                : '0 22px 34px rgba(47, 111, 178, 0.38)',
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
            <React.Fragment>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Memproses...
            </React.Fragment>
          ) : (
            'Login'
          )}
        </Button>
      </Stack>
    </Box>
  );
}
