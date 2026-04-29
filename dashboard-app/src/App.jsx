console.log('MOCK_AUTH:', import.meta.env.VITE_MOCK_AUTH);
import React from 'react';
import DashboardLayoutBasic from './DashboardLayoutBasic';
import { AUTH_STATE_CHANGE_EVENT } from './utils/fetchWithAuth';
import { getUrlToken, storeAuthSession, clearTokenFromUrl, redirectToCentralPortal } from './utils/authSession';
import { useSessionGuard } from './utils/useSessionGuard';
import { injectMockAuth } from './utils/mockAuth'

function hasStoredToken() {
  if (typeof window === 'undefined') return false;
  const storedToken = localStorage.getItem('authToken');
  return Boolean(String(storedToken ?? '').trim());
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(hasStoredToken);
  const [isAuthResolved, setIsAuthResolved] = React.useState(false);

  useSessionGuard();
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const isMockAuth = import.meta.env.VITE_MOCK_AUTH === 'true';

    if (isMockAuth) {
      injectMockAuth().then(() => {
        setIsAuthenticated(hasStoredToken());
        setIsAuthResolved(true);
      });
      return undefined;
    }

    const urlToken = getUrlToken();
    if (urlToken) {
      storeAuthSession(urlToken);
      clearTokenFromUrl();
      setIsAuthenticated(true);
      setIsAuthResolved(true);
      return undefined;
    }

    setIsAuthenticated(hasStoredToken());
    setIsAuthResolved(true);

    return undefined;
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncAuthState = () => {
      setIsAuthenticated(hasStoredToken());
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    };
  }, []);

  React.useEffect(() => {
    if (isAuthResolved && !isAuthenticated) {
      redirectToCentralPortal();
    }
  }, [isAuthResolved, isAuthenticated]);

  if (!isAuthResolved) return null;

  return isAuthenticated ? (
    <DashboardLayoutBasic onLogout={() => {
      setIsAuthenticated(false);
      setIsAuthResolved(true);
    }} />
  ) : null;
}

export default App;