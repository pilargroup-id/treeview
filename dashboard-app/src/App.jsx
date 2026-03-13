import React from 'react';
import DashboardLayoutBasic from './DashboardLayoutBasic';
import LoginPage from './login/loginPage';
import { AUTH_STATE_CHANGE_EVENT } from './utils/fetchWithAuth';

function hasStoredToken() {
  if (typeof window === 'undefined') return false;
  const storedToken = localStorage.getItem('authToken');
  return Boolean(String(storedToken ?? '').trim());
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(hasStoredToken);

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

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <DashboardLayoutBasic onLogout={() => setIsAuthenticated(false)} />;
}

export default App;
