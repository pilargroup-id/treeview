import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    open: false,
    title: null,
    message: '',
    severity: 'info' 
  });

  const showAlert = useCallback((message, options = {}) => {
    const {
      title = null,
      severity = 'info'
    } = options;

    setAlertState({
      open: true,
      title,
      message,
      severity
    });
  }, []);

  const showError = useCallback((message, title = 'Error') => {
    showAlert(message, { title, severity: 'error' });
  }, [showAlert]);

  const showWarning = useCallback((message, title = 'Peringatan') => {
    showAlert(message, { title, severity: 'warning' });
  }, [showAlert]);

  const showSuccess = useCallback((message, title = 'Berhasil') => {
    showAlert(message, { title, severity: 'success' });
  }, [showAlert]);

  const showInfo = useCallback((message, title = 'Informasi') => {
    showAlert(message, { title, severity: 'info' });
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  return {
    alertState,
    showAlert,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    closeAlert
  };
};

