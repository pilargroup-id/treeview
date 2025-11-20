import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useDemoRouter } from '@toolpad/core/internal';
import ChartBulanan from './chart/ChartBulanan';
import ChartInvoice from './chart/ChartInvoice';

const NAVIGATION = [
  { kind: 'header', title: 'Main items' },
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    children: [
      { segment: 'Revenue', title: 'Revenue', icon: <BarChartIcon /> },
      { segment: 'RevenueInvoice', title: 'RevenueInvoice', icon: <BarChartIcon /> },
    ],
  },
  { segment: 'orders', title: 'Orders', icon: <ShoppingCartIcon /> },
  { kind: 'divider' },
  { kind: 'header', title: 'Analytics' },
  {
    segment: 'reports',
    title: 'Reports',
    icon: <BarChartIcon />,
    children: [
      { segment: 'sales', title: 'Sales', icon: <DescriptionIcon /> },
      { segment: 'traffic', title: 'Traffic', icon: <DescriptionIcon /> },
    ],
  },
  { segment: 'integrations', title: 'Integrations', icon: <LayersIcon /> },
];

const demoTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-toolpad-color-scheme' },
  colorSchemes: { light: true, dark: true },
  breakpoints: { values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 } },
});

function DemoPageContent({ pathname }) {

  if (pathname.includes('RevenueInvoice')) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative'
      }}>
        <Box sx={{
          transform: 'scale(0.67)',
          transformOrigin: 'top left',
          width: '149.25%', 
          height: '149.25%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'auto'
        }}>
          <ChartInvoice />
        </Box>
      </Box>
    );
  }

  if (pathname.includes('Revenue')) {
    return (
      <Box sx={{ p: 3 }}>
        <ChartBulanan />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Dashboard content for {pathname}
      </Typography>
      <Typography color="text.secondary">
        Silakan tambahkan komponen dashboard kamu di sini.
      </Typography>
    </Box>
  );
}

function Footer() {
  const [lastUpdate, setLastUpdate] = React.useState('Loading...');
  const [isError, setIsError] = React.useState(false);
  const [animate, setAnimate] = React.useState(true);
  const [slideIn, setSlideIn] = React.useState(true);

  React.useEffect(() => {
    const API_URL = 'http://localhost:8000/api';
    fetch(`${API_URL}/financial/last-update`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.data)) {
          const last = data.data.find(i => i.source_table === 'financial_gl')?.last_date;
          if (last) {
            setLastUpdate(last);
            setIsError(false);
          } else {
            setLastUpdate('-');
            setIsError(true);
          }
        } else {
          setLastUpdate('-');
          setIsError(true);
        }
      })
      .catch(() => {
        setLastUpdate('-');
        setIsError(true);
      });
  }, []);

  React.useEffect(() => {
    setSlideIn(true);
    const interval = setInterval(() => {
      setSlideIn(false);
      setTimeout(() => setSlideIn(true), 500); 
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        py: 2,
        textAlign: 'center',
        borderTop: '1px solid #e0e0e0',
        background: 'linear-gradient(90deg, #f9f9f9 0%, #e3f2fd 100%)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: '0 -2px 8px rgba(33,150,243,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#90caf9" />
          <path d="M12 6v6l4 2" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <Typography
        variant="body2"
        color={isError ? 'error' : 'text.secondary'}
        sx={{
          fontWeight: 500,
          letterSpacing: 0.2,
          display: 'inline-block',
          transition: 'transform 0.4s cubic-bezier(.4,0,.6,1), opacity 0.4s cubic-bezier(.4,0,.6,1)',
          transform: slideIn ? 'translateY(0)' : 'translateY(40px)',
          opacity: slideIn ? 1 : 0,
        }}
      >
        {isError
          ? 'Last update: Gagal mengambil data'
          : `Last update: ${lastUpdate}`}
      </Typography>
    </Box>
  );
}

// Updated layout to account for fixed footer
export default function DashboardLayoutBasic() {
  const router = useDemoRouter('/dashboard');

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={demoTheme}
      branding={{
        logo: () => null,   
        title: '',        
      }}
    >
      <DashboardLayout
        slots={{
          branding: () => null,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '64px' }}> {/* Add padding to avoid content overlap */}
          <Box sx={{ flex: 1 }}>
            <DemoPageContent pathname={router.pathname} />
          </Box>
          {/* Last update logic moved to Footer component */}
          <Footer />
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}