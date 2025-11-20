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

// Updated Footer component to always stay visible
function Footer() {
  const [lastUpdate, setLastUpdate] = React.useState('Loading...');

  React.useEffect(() => {
    const API_URL = 'http://localhost:8000/api'; 
    fetch(`${API_URL}/financial/last-update`)
      .then(response => response.json())
      .then(data => setLastUpdate(data.lastUpdate))
      .catch(() => setLastUpdate('Error fetching update'));
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        py: 2,
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        backgroundColor: '#f9f9f9',
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Last update: {lastUpdate}
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