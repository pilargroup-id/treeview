import {
  AUTH_STATE_CHANGE_EVENT,
  clearClientAuth,
  notifyAuthStateChange,
  redirectToCentralPortal,
} from './authSession';

export { AUTH_STATE_CHANGE_EVENT } from './authSession';

function redirectToLogin() {
  clearClientAuth();
  notifyAuthStateChange();
  if (import.meta.env.VITE_MOCK_AUTH !== 'true') {
    redirectToCentralPortal();
  }
}

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('authToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  return response;
}
