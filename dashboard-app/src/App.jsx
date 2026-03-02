import React from 'react';
import DashboardLayoutBasic from './DashboardLayoutBasic';
import LoginPage from './login/loginPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    const storedToken = localStorage.getItem('authToken');
    return Boolean(String(storedToken ?? '').trim());
  });

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <DashboardLayoutBasic onLogout={() => setIsAuthenticated(false)} />;
}

export default App;
