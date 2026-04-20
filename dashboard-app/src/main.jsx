import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import './style/app.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CssBaseline />
    <GlobalStyles
      styles={{
        html: {
          width: '100%',
          minHeight: '100%',
        },
        body: {
          width: '100%',
          minHeight: '100vh',
          margin: 0,
        },
        '#root': {
          width: '100%',
          minHeight: '100vh',
        },
      }}
    />
    <App />
  </React.StrictMode>
);
