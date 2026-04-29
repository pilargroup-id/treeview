// src/utils/mockAuth.js
import { API_URL } from '../config/api';

function buildMockLoginUrl() {
  const explicitUrl = String(import.meta.env.VITE_MOCK_LOGIN_URL ?? '').trim();
  if (explicitUrl) return explicitUrl;

  const base = String(API_URL ?? '').replace(/\/+$/, '');
  if (!base) return '/api/tree-view/login';
  if (/\/api$/i.test(base)) return `${base}/tree-view/login`;
  return `${base}/api/tree-view/login`;
}

function clearMockAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

export async function injectMockAuth() {
  try {
    const url = buildMockLoginUrl();
    console.log('[mockAuth] hitting:', url);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: import.meta.env.VITE_MOCK_USERNAME,
        password: import.meta.env.VITE_MOCK_PASSWORD,
      }),
    });

    console.log('[mockAuth] status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('[mockAuth] response:', data);

    if (!res.ok) {
      console.error('[mockAuth] Login gagal');
      clearMockAuth();
      return false;
    }

    const token = data?.data?.token ?? data?.token ?? '';
    const user = data?.data?.user ?? data?.user ?? null;

    if (!token) {
      console.error('[mockAuth] Token tidak ditemukan di response login');
      clearMockAuth();
      return false;
    }

    // treeview pakai 'authToken' bukan 'token'
    localStorage.setItem('authToken', token);
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
    return true;

  } catch (e) {
    console.error('[mockAuth] Error:', e.message);
    clearMockAuth();
    return false;
  }
}
