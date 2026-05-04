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
    if (import.meta.env.VITE_MOCK_AUTH === 'true') return;

    const token = getStoredToken();
    if (!token) return;

    const check = async () => {
      try {
        const res = await fetch(STATUS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          handleExpired();
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        if (!data.valid) {
          handleExpired();
          return;
        }

        const storedCv = getStoredCv();
        if (data.token_version !== undefined) {
          if (storedCv === null || Number(storedCv) !== Number(data.token_version)) {
            handleExpired();
          }
        }

      } catch {
        // network error sementara, skip
      }
    };

    // Cek saat mount
    check();

    // Polling tiap 30 detik
    intervalRef.current = setInterval(check, 5_000);

    // Tambah ini — cek langsung saat tab kembali aktif
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