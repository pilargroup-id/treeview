import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, GlobalStyles } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LayersIcon from '@mui/icons-material/Layers';
import CategoryIcon from '@mui/icons-material/Category';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useDemoRouter } from '@toolpad/core/internal';
import ChartInvoice from './chart/ChartInvoice';
import ItemTes from './chart/TestItemCategory';
import ReportTableSales from './sales/ReportTableSales';
import ReportTableCustomers from './sales/ReportTableCustomers';
import ReportTableResult from './sales/ReportTableResult';
import { API_URL } from './config/api';

const DASHBOARD_BACKGROUND_LIGHT =
  'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)';

const NAVIGATION = [
  { kind: 'header', title: 'Main items' },
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    children: [
      { segment: 'RevenueInvoice', title: 'Revenue', icon: <BarChartIcon /> },
      { segment: 'CategoryItemTes', title: 'Category Item (Tes)', icon: <CategoryIcon /> },
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
      { segment: 'sales', title: 'Sales', icon: <PointOfSaleIcon /> },
      { segment: 'customers', title: 'Customers', icon: <PeopleAltIcon /> },
      { segment: 'result', title: 'Result', icon: <FactCheckIcon /> },
    ],
  },
  { segment: 'integrations', title: 'Integrations', icon: <LayersIcon /> },
];

const demoTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-toolpad-color-scheme' },
  colorSchemes: { 
    light: {
      palette: {
        primary: {
          main: '#6BA3D0', // Biru soft yang matching dengan tombol
          light: '#89B7DC',
          dark: '#5A9FD0',
          contrastText: '#FFFFFF',
        },
        background: {
          default: '#F5F7FA',
          paper: '#FFFFFF',
        },
      },
    }
  },
  breakpoints: { values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 } },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(107, 163, 208, 0.12) !important',
            color: '#6BA3D0 !important',
            '&:hover': {
              backgroundColor: 'rgba(107, 163, 208, 0.16) !important',
            },
            '& .MuiListItemIcon-root': {
              color: '#6BA3D0 !important',
            },
            '& svg': {
              color: '#6BA3D0 !important',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(107, 163, 208, 0.08)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#6BA3D0 !important',
          },
          '& svg': {
            '&.Mui-selected': {
              color: '#6BA3D0 !important',
            },
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#6BA3D0 !important',
            '& svg': {
              color: '#6BA3D0 !important',
            },
          },
        },
      },
    },
  },
});

function DemoPageContent({ pathname }) {
  const currentPathname = String(pathname ?? '');

  if (currentPathname.includes('RevenueInvoice')) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100%',
        overflow: 'hidden',
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
          overflow: 'hidden'
        }}>
          <ChartInvoice />
        </Box>
      </Box>
    );
  }

  if (currentPathname.includes('CategoryItemTes')) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}>
        <ItemTes />
      </Box>
    );
  }

  if (currentPathname.includes('reports/sales')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <ReportTableSales />
      </Box>
    );
  }

  if (currentPathname.includes('reports/customers')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <ReportTableCustomers />
      </Box>
    );
  }

  if (currentPathname.includes('reports/result')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <ReportTableResult />
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


function LastUpdateHeader() {
  const [lastUpdates, setLastUpdates] = React.useState([]);
  const [isError, setIsError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [show, setShow] = React.useState(true);
  const timeoutRef = React.useRef();

  React.useEffect(() => {
    setIsLoading(true);
    fetch(`${API_URL}/financial/last-update`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.data)) {
          setLastUpdates(data.data);
          setIsError(false);
        } else {
          setLastUpdates([]);
          setIsError(true);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setLastUpdates([]);
        setIsError(true);
        setIsLoading(false);
      });
  }, []);

  // Animasi: hanya satu data tampil, bergantian
  React.useEffect(() => {
    if (isLoading) return;
    let maxLength = isError ? 1 : lastUpdates.length;
    if (maxLength === 0) return;
    setCurrentIndex(0);
    setShow(true);
    clearTimeout(timeoutRef.current);
    function cycle() {
      setShow(false);
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIdx = (prev + 1) % maxLength;
          // Setelah index berubah, trigger animasi masuk
          setTimeout(() => setShow(true), 30); 
          return nextIdx;
        });
        timeoutRef.current = setTimeout(cycle, 1800);
      }, 400); 
    }
    timeoutRef.current = setTimeout(cycle, 1800);
    return () => clearTimeout(timeoutRef.current);
  }, [lastUpdates, isError, isLoading]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)',
        // backdropFilter: 'blur(10px)',
        minHeight: '32px',
      }}
    >
      {isLoading ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        >
          Loading...
        </Typography>
      ) : isError ? (
        <>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              transition: 'opacity 0.4s cubic-bezier(.4,0,.6,1)',
              opacity: show ? 1 : 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#90caf9" />
              <path d="M12 6v6l4 2" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <Typography
            variant="body2"
            color="error"
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
              transition: 'opacity 0.4s cubic-bezier(.4,0,.6,1)',
              opacity: show ? 1 : 0,
            }}
          >
            Last update: Gagal mengambil data
          </Typography>
        </>
      ) : (
        lastUpdates.length > 0 && (
          <Box key={lastUpdates[currentIndex].source_table + currentIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                transition: 'opacity 0.4s cubic-bezier(.4,0,.6,1)',
                opacity: show ? 1 : 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#90caf9" />
                <path d="M12 6v6l4 2" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.4s cubic-bezier(.4,0,.6,1)',
                opacity: show ? 1 : 0,
              }}
            >
              {lastUpdates[currentIndex].source_table}: {lastUpdates[currentIndex].last_date}
            </Typography>
          </Box>
        )
      )}
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
      <GlobalStyles
        styles={{
          '[data-toolpad-color-scheme] [role="menuitem"][aria-selected="true"]': {
            backgroundColor: 'rgba(107, 163, 208, 0.12) !important',
            color: '#6BA3D0 !important',
            '& svg': {
              color: '#6BA3D0 !important',
            },
            '&:hover': {
              backgroundColor: 'rgba(107, 163, 208, 0.16) !important',
            },
          },
          '[data-toolpad-color-scheme] [role="menuitem"]:hover': {
            backgroundColor: 'rgba(107, 163, 208, 0.08) !important',
          },

          '[data-toolpad-color-scheme] [role="menuitem"][aria-selected="true"] svg': {
            color: '#6BA3D0 !important',
          },
          '[data-toolpad-color-scheme] [role="menuitem"][aria-selected="true"] .MuiSvgIcon-root': {
            color: '#6BA3D0 !important',
          },

          '[data-toolpad-color-scheme] [role="menuitem"][aria-selected="true"] [role="menuitem"][aria-selected="true"]': {
            backgroundColor: 'rgba(107, 163, 208, 0.12) !important',
            color: '#6BA3D0 !important',
            '& svg': {
              color: '#6BA3D0 !important',
            },
          },
        }}
      />
      <DashboardLayout
        slots={{
          branding: () => null,
        }}
      >
        <LastUpdateHeader />
        <Box
          sx={(theme) => ({
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(24, 24, 24, 0.98) 50%, rgba(30, 30, 30, 1) 100%)'
                : DASHBOARD_BACKGROUND_LIGHT,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                theme.palette.mode === 'dark'
                  ? 'radial-gradient(circle at 1px 1px, rgba(107, 163, 208, 0.06) 1px, transparent 0)'
                  : 'radial-gradient(circle at 1px 1px, rgba(107, 163, 208, 0.03) 1px, transparent 0)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
              zIndex: 0,
            },
          })}
        >
          <Box sx={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden' }}>
            <DemoPageContent pathname={router.pathname} />
          </Box>
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}
