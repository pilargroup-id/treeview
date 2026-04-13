import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { API_URL } from '../config/api';
import { AUTH_USER_STORAGE_KEY, getStoredAuthUser } from '../utils/accessControl';

const REMEMBERED_USERNAME_KEY = 'treeViewRememberedUsername';

function buildChangeProfileUrl() {
  const base = String(API_URL ?? '').replace(/\/+$/, '');
  if (!base) return '/api/tree-view/change-profile';
  if (/\/api$/i.test(base)) return `${base}/tree-view/change-profile`;
  return `${base}/api/tree-view/change-profile`;
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function getChangeProfileErrorMessage(errorBody) {
  const fieldNames = ['current_password', 'new_username', 'new_password'];
  for (const fieldName of fieldNames) {
    const fieldErrors = errorBody?.errors?.[fieldName];
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors[0];
    }
  }

  return errorBody?.message || 'Gagal mengubah profil.';
}

function updateStoredAuthUser(newUsername) {
  const nextUsername = String(newUsername ?? '').trim();
  if (!nextUsername || typeof window === 'undefined') return;

  try {
    const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      if (parsedUser && typeof parsedUser === 'object') {
        const previousUsername = pickFirstText(
          parsedUser?.username,
          parsedUser?.user_name,
          parsedUser?.name,
        );
        const nextUser = {
          ...parsedUser,
          username: nextUsername,
        };

        if ('user_name' in parsedUser || pickFirstText(parsedUser?.user_name)) {
          nextUser.user_name = nextUsername;
        }

        const hasDedicatedDisplayName = Boolean(
          pickFirstText(parsedUser?.full_name, parsedUser?.fullname),
        );
        const currentName = pickFirstText(parsedUser?.name);
        if (!hasDedicatedDisplayName && (!currentName || currentName === previousUsername)) {
          nextUser.name = nextUsername;
        }

        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
      }
    }
  } catch {
    // Ignore malformed local user data.
  }

  if (localStorage.getItem(REMEMBERED_USERNAME_KEY) !== null) {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, nextUsername);
  }
}

function resolveCurrentUsername(user) {
  const storedUser = getStoredAuthUser();
  return pickFirstText(
    user?.username,
    user?.user_name,
    storedUser?.username,
    storedUser?.user_name,
    user?.displayName,
    storedUser?.name,
    'User',
  );
}

// export default function ChangeProfileAction({
//   mini = false,
//   user = null,
//   onProfileUpdated,
//   variant = 'text',
//   fullWidth = true,
//   buttonSx,
//   label = 'Edit Profile',
//   tooltipTitle,
// }) {
//   const [open, setOpen] = React.useState(false);
//   const [currentPassword, setCurrentPassword] = React.useState('');
//   const [newUsername, setNewUsername] = React.useState('');
//   const [newPassword, setNewPassword] = React.useState('');
//   const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
//   const [showNewPassword, setShowNewPassword] = React.useState(false);
//   const [isSubmitting, setIsSubmitting] = React.useState(false);
//   const [errorMessage, setErrorMessage] = React.useState('');
//   const [successMessage, setSuccessMessage] = React.useState('');

//   const currentUsername = React.useMemo(() => resolveCurrentUsername(user), [user]);

//   const resetForm = React.useCallback(() => {
//     setCurrentPassword('');
//     setNewUsername('');
//     setNewPassword('');
//     setShowCurrentPassword(false);
//     setShowNewPassword(false);
//     setErrorMessage('');
//   }, []);

//   const handleOpen = React.useCallback(() => {
//     setOpen(true);
//     setNewUsername(currentUsername);
//     setErrorMessage('');
//   }, [currentUsername]);

//   const handleClose = React.useCallback(() => {
//     if (isSubmitting) return;
//     setOpen(false);
//     resetForm();
//   }, [isSubmitting, resetForm]);

//   const handleSubmit = React.useCallback(async (event) => {
//     event.preventDefault();
//     if (isSubmitting) return;

//     const trimmedNewUsername = newUsername.trim();
//     const trimmedCurrentUsername = currentUsername.trim();
//     const hasCurrentPassword = currentPassword.trim().length > 0;
//     const hasNewPassword = newPassword.trim().length > 0;
//     const hasUsernameChange = Boolean(trimmedNewUsername) && trimmedNewUsername !== trimmedCurrentUsername;

//     if (!hasCurrentPassword) {
//       setErrorMessage('Password saat ini wajib diisi.');
//       return;
//     }

//     if (!hasUsernameChange && !hasNewPassword) {
//       setErrorMessage('Isi minimal username baru atau password baru.');
//       return;
//     }

//     const token = localStorage.getItem('authToken');
//     if (!token) {
//       setErrorMessage('Sesi login tidak ditemukan. Silakan login ulang.');
//       return;
//     }

//     setIsSubmitting(true);
//     setErrorMessage('');

//     try {
//       const payload = {
//         current_password: currentPassword,
//         ...(hasUsernameChange ? { new_username: trimmedNewUsername } : {}),
//         ...(hasNewPassword ? { new_password: newPassword } : {}),
//       };

//       const response = await fetch(buildChangeProfileUrl(), {
//         method: 'PUT',
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       let responseBody = {};
//       try {
//         responseBody = await response.json();
//       } catch {
//         responseBody = {};
//       }

//       if (!response.ok || !responseBody?.success) {
//         throw new Error(getChangeProfileErrorMessage(responseBody));
//       }

//       if (hasUsernameChange) {
//         updateStoredAuthUser(trimmedNewUsername);
//       }

//       if (typeof onProfileUpdated === 'function') {
//         onProfileUpdated();
//       }

//       setSuccessMessage(responseBody?.message || 'Profil berhasil diperbarui.');
//       setOpen(false);
//       resetForm();
//     } catch (error) {
//       if (error instanceof TypeError && /Failed to fetch/i.test(error.message)) {
//         setErrorMessage('Tidak bisa terhubung ke API. Cek backend, VITE_API_URL, dan konfigurasi CORS.');
//       } else {
//         setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengubah profil.');
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [currentPassword, currentUsername, isSubmitting, newPassword, newUsername, onProfileUpdated, resetForm]);

//   const defaultButtonSx = {
//     minHeight: 40,
//     minWidth: 0,
//     justifyContent: mini ? 'center' : 'flex-start',
//     px: mini ? 0.5 : 1.5,
//     borderRadius: 1.5,
//     textTransform: 'none',
//     color: variant === 'text' ? 'text.secondary' : undefined,
//     '&:hover': {
//       bgcolor: variant === 'text' ? 'rgba(107, 163, 208, 0.08)' : undefined,
//       color: variant === 'text' ? '#2B6997' : undefined,
//     },
//   };

//   const triggerButton = (
//     <Button
//       variant={variant}
//       onClick={handleOpen}
//       fullWidth={fullWidth}
//       disabled={isSubmitting}
//       startIcon={!mini ? <ManageAccountsRoundedIcon fontSize="small" /> : null}
//       aria-label={label}
//       sx={[defaultButtonSx, buttonSx]}
//     >
//       {mini ? <ManageAccountsRoundedIcon fontSize="small" /> : label}
//     </Button>
//   );

//   return (
//     <React.Fragment>
//       {mini ? (
//         <Tooltip title={tooltipTitle || label}>
//           <Box>{triggerButton}</Box>
//         </Tooltip>
//       ) : (
//         triggerButton
//       )}

//       {/* <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
//         <Box component="form" onSubmit={handleSubmit}>
//           <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <ManageAccountsRoundedIcon fontSize="small" sx={{ color: '#6B7280' }} />
//             Edit Profile
//           </DialogTitle>
//           <DialogContent dividers>
//             <Stack spacing={2}>
//               {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

//               <TextField
//                 label="Username"
//                 value={newUsername}
//                 onChange={(event) => setNewUsername(event.target.value)}
//                 autoComplete="username"
//                 fullWidth
//               />

//               <TextField
//                 label="Current Password"
//                 type={showCurrentPassword ? 'text' : 'password'}
//                 value={currentPassword}
//                 onChange={(event) => setCurrentPassword(event.target.value)}
//                 autoComplete="current-password"
//                 required
//                 fullWidth
//                 InputProps={{
//                   endAdornment: (
//                     <InputAdornment position="end">
//                       <IconButton
//                         type="button"
//                         edge="end"
//                         aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
//                         onClick={() => setShowCurrentPassword((current) => !current)}
//                       >
//                         {showCurrentPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
//                       </IconButton>
//                     </InputAdornment>
//                   ),
//                 }}
//               />

//               <TextField
//                 label="New Password"
//                 type={showNewPassword ? 'text' : 'password'}
//                 value={newPassword}
//                 onChange={(event) => setNewPassword(event.target.value)}
//                 autoComplete="new-password"
//                 fullWidth
//                 helperText="Opsional. Kosongkan jika tidak ingin mengubah password."
//                 InputProps={{
//                   endAdornment: (
//                     <InputAdornment position="end">
//                       <IconButton
//                         type="button"
//                         edge="end"
//                         aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
//                         onClick={() => setShowNewPassword((current) => !current)}
//                       >
//                         {showNewPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
//                       </IconButton>
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Stack>
//           </DialogContent>
//           <DialogActions sx={{ px: 3, py: 2 }}>
//             <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
//               Batal
//             </Button>
//             <Button
//               type="submit"
//               variant="contained"
//               disabled={isSubmitting}
//               startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
//               sx={{
//                 minWidth: 160,
//                 textTransform: 'none',
//                 fontWeight: 700,
//                 bgcolor: '#6BA3D0',
//                 '&:hover': {
//                   bgcolor: '#5A9FD0',
//                 },
//               }}
//             >
//               {isSubmitting ? 'Menyimpan...' : 'Simpan perubahan'}
//             </Button>
//           </DialogActions>
//         </Box>
//       </Dialog> */}

//       <Snackbar
//         open={Boolean(successMessage)}
//         autoHideDuration={3000}
//         onClose={() => setSuccessMessage('')}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//       >
//         <Alert onClose={() => setSuccessMessage('')} severity="success" variant="filled" sx={{ width: '100%' }}>
//           {successMessage}
//         </Alert>
//       </Snackbar>
//     </React.Fragment>
//   );
// }
