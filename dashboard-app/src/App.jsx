import React from 'react';
import DashboardLayoutBasic from './DashboardLayoutBasic';
import LoginPage from './login/loginPage';
import { AUTH_STATE_CHANGE_EVENT } from './utils/fetchWithAuth';

function hasStoredToken() {
  if (typeof window === 'undefined') return false;
  const storedToken = localStorage.getItem('authToken');
  return Boolean(String(storedToken ?? '').trim());
}

function extractUserFromToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode JWT payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      internal_id: payload.internal_id,
      username: payload.username,
      name: payload.name,
      department: payload.department,
      job_position: payload.job_position,
      job_level: payload.job_level,
      apps: payload.apps,
    };
  } catch (e) {
    return null;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(hasStoredToken);

  // Handle token from URL parameter (central auth redirect)
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken && !localStorage.getItem('authToken')) {
      // Save token from URL to localStorage
      localStorage.setItem('authToken', urlToken);
      
      // Extract user data from JWT token and save it
      const userData = extractUserFromToken(urlToken);
      if (userData) {
        localStorage.setItem('authUser', JSON.stringify(userData));
      }
      
      // Update auth state
      setIsAuthenticated(true);
      
      // Clean URL (remove token parameter)
      window.history.replaceState({}, document.title, '/');
      
      // Notify auth state change
      window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
    }
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

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <DashboardLayoutBasic onLogout={() => setIsAuthenticated(false)} />;
}

export default App;
