import React from 'react';
import DashboardLayoutBasic from './DashboardLayoutBasic';

import LoginPage from './login/loginPage';
import { AUTH_STATE_CHANGE_EVENT } from './utils/fetchWithAuth';
import BackgroundMain from './Template/BackgroundMain';
import { getUrlToken, storeAuthSession, clearTokenFromUrl, redirectToCentralPortal } from './utils/authSession';

function hasStoredToken() {
  if (typeof window === 'undefined') return false;
  const storedToken = localStorage.getItem('authToken');
  return Boolean(String(storedToken ?? '').trim());
}


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


  return (
    !isAuthenticated ? (
      <>
        <BackgroundMain />
        <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
      </>
    ) : (
      <DashboardLayoutBasic onLogout={() => setIsAuthenticated(false)} />
    )
  );

}

export default App;
