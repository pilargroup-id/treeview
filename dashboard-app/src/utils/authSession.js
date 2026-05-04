export const AUTH_STATE_CHANGE_EVENT = 'tree-view-auth-state-change';
export const DEFAULT_CENTRAL_PORTAL_URL =
  import.meta.env.VITE_CENTRAL_PORTAL_URL || 'https://pilargroup.id/';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';
const AUTH_USER_STORAGE_KEY = 'authUser';
const CENTRAL_PORTAL_RETURN_PARAM = import.meta.env.VITE_CENTRAL_PORTAL_RETURN_PARAM || '';
const APP_PUBLIC_URL = import.meta.env.VITE_APP_PUBLIC_URL || '';

export function hasStoredToken() {
  if (typeof window === 'undefined') return false;
  const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return Boolean(String(storedToken ?? '').trim());
}

export function clearClientAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function notifyAuthStateChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

function decodeBase64Url(value) {
  const normalized = String(value ?? '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;

  return atob(padded);
}

export function extractUserFromToken(token) {
  try {
    const parts = String(token ?? '').split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return {
      id: payload.sub,
      internal_id: payload.internal_id,
      username: payload.username,
      name: payload.name,
      department: payload.department,
      job_position: payload.job_position,
      job_level: payload.job_level,
      apps: payload.apps,
      cv: payload.cv ?? null,
    };
  } catch {
    return null;
  }
}

export function getUrlToken() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return String(params.get('token') ?? '').trim();
}

export function storeAuthSession(token) {
  const normalizedToken = String(token ?? '').trim();
  if (!normalizedToken || typeof window === 'undefined') return false;

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalizedToken);

  const userData = extractUserFromToken(normalizedToken);
  if (userData) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  notifyAuthStateChange();
  return true;
}

export function clearTokenFromUrl() {
  if (typeof window === 'undefined') return;

  const currentUrl = new URL(window.location.href);
  if (!currentUrl.searchParams.has('token')) return;

  currentUrl.searchParams.delete('token');
  const nextPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}` || '/';
  window.history.replaceState({}, document.title, nextPath);
}

function resolveReturnUrl() {
  if (APP_PUBLIC_URL) return APP_PUBLIC_URL;
  if (typeof window === 'undefined') return '';

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('token');
  return currentUrl.toString();
}

export function buildCentralPortalUrl() {
  const baseUrl = String(DEFAULT_CENTRAL_PORTAL_URL ?? '').trim() || 'https://pilargroup.id/';
  if (!CENTRAL_PORTAL_RETURN_PARAM) return baseUrl;

  try {
    const targetUrl = new URL(baseUrl);
    const returnUrl = resolveReturnUrl();
    if (returnUrl) {
      targetUrl.searchParams.set(CENTRAL_PORTAL_RETURN_PARAM, returnUrl);
    }
    return targetUrl.toString();
  } catch {
    return baseUrl;
  }
}

export function redirectToCentralPortal() {
  if (typeof window === 'undefined') return;
  window.location.replace(buildCentralPortalUrl());
}
