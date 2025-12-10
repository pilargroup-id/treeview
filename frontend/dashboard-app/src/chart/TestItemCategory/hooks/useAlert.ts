import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    open: false,
    title: null as string | null,
    message: '',
    severity: 'info' as 'info' | 'error' | 'warning' | 'success'
  });

  const showAlert = useCallback((message: string, options: {
    title?: string | null;
    severity?: 'info' | 'error' | 'warning' | 'success';
  } = {}) => {
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

  const showError = useCallback((message: string, title: string = 'Error') => {
    showAlert(message, { title, severity: 'error' });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title: string = 'Peringatan') => {
    showAlert(message, { title, severity: 'warning' });
  }, [showAlert]);

  const showSuccess = useCallback((message: string, title: string = 'Berhasil') => {
    showAlert(message, { title, severity: 'success' });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title: string = 'Informasi') => {
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

