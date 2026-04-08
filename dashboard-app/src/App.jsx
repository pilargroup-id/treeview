import React from 'react';
import DashboardLayoutBasic from './DashboardLayoutBasic';
import {
  AUTH_STATE_CHANGE_EVENT,
  clearTokenFromUrl,
  getUrlToken,
  hasStoredToken,
  redirectToCentralPortal,
  storeAuthSession,
} from './utils/authSession';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(hasStoredToken);
  const [isAuthResolved, setIsAuthResolved] = React.useState(hasStoredToken);

  const handleLogout = React.useCallback(() => {
    setIsAuthenticated(false);
    setIsAuthResolved(true);
    redirectToCentralPortal();
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

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
      setIsAuthResolved(true);
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    };
  }, []);

  React.useEffect(() => {
    if (!isAuthResolved || isAuthenticated) return;
    redirectToCentralPortal();
  }, [isAuthenticated, isAuthResolved]);

  if (!isAuthResolved || !isAuthenticated) return null;

  return <DashboardLayoutBasic onLogout={handleLogout} />;
}

export default App;
