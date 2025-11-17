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

const NAVIGATION = [
  { kind: 'header', title: 'Main items' },
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    children: [
      { segment: 'Revenue', title: 'Revenue', icon: <BarChartIcon /> },
      { segment: 'RevenueCategory', title: 'RevenueCategory', icon: <BarChartIcon /> },
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

  if (pathname.includes('Revenue')) {
    return (
      <Box sx={{ p: 3 }}>
        <ChartBulanan />
      </Box>
    );
  }

  // Default content untuk halaman lain
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
        <DemoPageContent pathname={router.pathname} />
      </DashboardLayout>
    </AppProvider>
  );
}