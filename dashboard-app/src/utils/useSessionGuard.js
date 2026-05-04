import { useEffect, useRef } from 'react';
import {
  clearClientAuth,
  notifyAuthStateChange,
  redirectToCentralPortal,
} from './authSession';

const POLL_INTERVAL = 30_000;
const STATUS_URL = `${import.meta.env.VITE_CENTRAL_PORTAL_URL || 'https://pilargroup.id'}/api/auth/status`;

function getStoredToken() {
  return localStorage.getItem('authToken') || null;
}

function getStoredCv() {
  try {
    const raw = localStorage.getItem('authUser');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.cv ?? null;
  } catch {
    return null;
  }
}

function handleExpired() {
  clearClientAuth();
  notifyAuthStateChange();
  if (import.meta.env.VITE_MOCK_AUTH !== 'true') {
    redirectToCentralPortal();
  }
}

export function useSessionGuard() {
  const intervalRef = useRef(null);

  useEffect(() => {
    console.log('[SessionGuard] mounted, MOCK_AUTH:', import.meta.env.VITE_MOCK_AUTH)
    
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      console.log('[SessionGuard] skipped - mock auth')
      return
    }

    const token = getStoredToken();
    console.log('[SessionGuard] token exists:', Boolean(token))
    
    if (!token) return;

    const check = async () => {
      console.log('[SessionGuard] checking...')
      try {
        const res = await fetch(STATUS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('[SessionGuard] response status:', res.status)

        if (res.status === 401) {
          console.log('[SessionGuard] 401 → handleExpired')
          handleExpired();
          return;
        }

        if (!res.ok) return;

        const data = await res.json();
        console.log('[SessionGuard] data:', data)

        if (!data.valid) {
          console.log('[SessionGuard] invalid → handleExpired')
          handleExpired();
          return;
        }

        const storedCv = getStoredCv();
        if (data.token_version !== undefined) {
          if (storedCv === null || Number(storedCv) !== Number(data.token_version)) {
            console.log('[SessionGuard] cv mismatch → handleExpired', storedCv, data.token_version)
            handleExpired();
          }
        }

      } catch(e) {
        console.log('[SessionGuard] error:', e)
      }
    };

    check();
    intervalRef.current = setInterval(check, 5_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}