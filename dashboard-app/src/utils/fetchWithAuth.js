export const AUTH_STATE_CHANGE_EVENT = 'tree-view-auth-state-change';

export function clearClientAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

function notifyAuthStateChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

function redirectToLogin() {
  clearClientAuth();
  notifyAuthStateChange();

  if (typeof window === 'undefined') return;

  if (window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/');
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
