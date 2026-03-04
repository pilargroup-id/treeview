import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Tab, Tabs, createTheme, GlobalStyles, useMediaQuery } from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BarChartIcon from '@mui/icons-material/BarChart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CategoryIcon from '@mui/icons-material/Category';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout, DashboardSidebarPageItem } from '@toolpad/core/DashboardLayout';
import { useDemoRouter } from '@toolpad/core/internal';
import ChartInvoice from './chart/ChartInvoice';
import ItemTes from './chart/TestItemCategory';
import ReportMonthlyVisit from './sales/ReportMonthlyVisit';
import ReportWeeklyVisit from './sales/ReportWeeklyVisit';
import ReportMonitorRadius from './sales/ReportMonitorRadius';
import MonthlyRevenue from './businessUnit/MonthlyRevenue';
import GotoRevenue from './businessUnit/GotoRevenue';
import GosaveRevenue from './businessUnit/GosaveRevenue';
import SidebarLogout from './login/logout';
import { API_URL } from './config/api';
import TreeViewWordmark from './components/TreeViewWordmark';
import NavBottom from './mobile/templateMobile/NavBottom';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

const DASHBOARD_BACKGROUND_LIGHT =
  'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)';

const USER_PROFILE_SEGMENT = '__sidebar_user_profile__';
const DEFAULT_SIDEBAR_USER = {
  displayName: 'User',
  role: 'Programmer',
  status: 'Online',
  initials: 'UN',
};

const BASE_NAVIGATION = [
  { kind: 'header', title: 'Main Items' },
  {
    segment: 'dashboard',
    title: 'Revenue',
    icon: <PriceChangeIcon />,
    children: [
      { segment: 'MonthlyRevenue', title: 'BU Revenue', icon: <BarChartIcon /> },
      { segment: 'GotoRevenue', title: 'Goto Revenue', icon: <BarChartIcon /> },
      { segment: 'GosaveRevenue', title: 'Gosave Revenue', icon: <BarChartIcon /> },
    ],
  },
  {
    segment: 'orders',
    title: 'Item',
    icon: <Inventory2Icon />,
    children: [
      { segment: 'CategoryItemTes', title: 'Category Item (Tes)', icon: <CategoryIcon /> },
    ],
  },
  { kind: 'divider' },
  { kind: 'header', title: 'Analytics' },
  {
    segment: 'reports',
    title: 'Reports',
    icon: <AssessmentIcon />,
    children: [
      { segment: 'monthly-visit', title: 'Monthly Visit', icon: <CalendarMonthIcon /> },
      { segment: 'weekly-summary', title: 'Weekly Summary', icon: <CalendarViewWeekIcon /> },
      { segment: 'monitor-radius', title: 'Monitor Radius', icon: <MyLocationIcon /> },
    ],
  },
  { segment: 'integrations', title: 'Integrations', icon: <SettingsIcon /> },
];

function a11yProps(index) {
  return {
    id: `mobile-tab-${index}`,
    'aria-controls': `mobile-tabpanel-${index}`,
  };
}

const MOBILE_CHILD_TABS_BY_GROUP = {
  revenue: [
    {
      label: 'BU Revenue',
      value: '/dashboard/MonthlyRevenue',
      matchers: ['MonthlyRevenue', 'RevenueInvoice'],
    },
    {
      label: 'Goto Revenue',
      value: '/dashboard/GotoRevenue',
      matchers: ['GotoRevenue'],
    },
    {
      label: 'Gosave Revenue',
      value: '/dashboard/GosaveRevenue',
      matchers: ['GosaveRevenue'],
    },
  ],
  item: [
    {
      label: 'Category Item (Tes)',
      value: '/orders/CategoryItemTes',
      matchers: ['CategoryItemTes'],
    },
  ],
  report: [
    {
      label: 'Monthly Visit',
      value: '/reports/monthly-visit',
      matchers: ['reports/monthly-visit', 'reports/sales'],
    },
    {
      label: 'Weekly Summary',
      value: '/reports/weekly-summary',
      matchers: ['reports/weekly-summary', 'reports/customers'],
    },
    {
      label: 'Monitor Radius',
      value: '/reports/monitor-radius',
      matchers: ['reports/monitor-radius', 'reports/result'],
    },
  ],
  user: [
    {
      label: 'Integrations',
      value: '/integrations',
      matchers: ['integrations'],
    },
  ],
};

function resolveMobileTabGroup(pathname) {
  const currentPathname = String(pathname ?? '');
  if (
    currentPathname.includes('MonthlyRevenue') ||
    currentPathname.includes('GotoRevenue') ||
    currentPathname.includes('GosaveRevenue') ||
    currentPathname.includes('RevenueInvoice')
  ) {
    return 'revenue';
  }
  if (currentPathname.includes('CategoryItemTes')) return 'item';
  if (currentPathname.includes('reports/')) return 'report';
  if (currentPathname.includes('integrations')) return 'user';
  return 'revenue';
}

function resolveMobileChildTabValue(pathname, tabs) {
  const currentPathname = String(pathname ?? '');
  const activeTab = tabs.find((tab) => tab.matchers.some((matcher) => currentPathname.includes(matcher)));
  return activeTab ? activeTab.value : tabs[0]?.value ?? false;
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function getInitials(name) {
  const text = String(name ?? '').trim();
  if (!text) return DEFAULT_SIDEBAR_USER.initials;

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getStoredSidebarUser() {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_USER;

  try {
    const rawUser = localStorage.getItem('authUser');
    if (!rawUser) return DEFAULT_SIDEBAR_USER;

    const parsedUser = JSON.parse(rawUser);
    const displayName = pickFirstText(
      parsedUser?.name,
      parsedUser?.full_name,
      parsedUser?.fullname,
      parsedUser?.username,
      parsedUser?.email,
    );
    const role = pickFirstText(
      parsedUser?.role,
      parsedUser?.job_position,
      parsedUser?.job_level,
      parsedUser?.department,
    );

    return {
      ...DEFAULT_SIDEBAR_USER,
      displayName: displayName || DEFAULT_SIDEBAR_USER.displayName,
      role: role || DEFAULT_SIDEBAR_USER.role,
      initials: getInitials(displayName),
    };
  } catch {
    return DEFAULT_SIDEBAR_USER;
  }
}

function buildNavigation(userDisplayName) {
  return [
    {
      segment: USER_PROFILE_SEGMENT,
      title: userDisplayName,
      icon: <AccountCircleRoundedIcon />,
    },
    { kind: 'divider' },
    ...BASE_NAVIGATION,
  ];
}

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

function TreeViewAppTitle() {
  return <TreeViewWordmark />;
}

function SidebarUserItem({ mini, user }) {
  const displayName = user?.displayName || DEFAULT_SIDEBAR_USER.displayName;
  const role = user?.role || DEFAULT_SIDEBAR_USER.role;
  const status = user?.status || DEFAULT_SIDEBAR_USER.status;
  const initials = user?.initials || DEFAULT_SIDEBAR_USER.initials;

  if (mini) {
    return (
      <Box component="li" sx={{ listStyle: 'none', px: 0.5, py: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: 52,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(107, 163, 208, 0.2)',
              border: '1px solid rgba(107, 163, 208, 0.28)',
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', letterSpacing: 0.35 }}>
              {initials}
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: 'calc(50% + 9px)',
              bottom: 3,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: '#22C55E',
              border: '1px solid rgba(255, 255, 255, 0.98)',
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box component="li" sx={{ listStyle: 'none', px: 1.25, py: 0.7 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.3,
          px: 0,
          py: 0,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(107, 163, 208, 0.2)',
            border: '1px solid rgba(107, 163, 208, 0.28)',
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', letterSpacing: 0.4 }}>
            {initials}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            title={displayName}
            sx={{
              color: '#0B1220',
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            title={role}
            sx={{
              mt: 0.1,
              color: '#6B7280',
              fontSize: '0.74rem',
              fontWeight: 500,
              lineHeight: 1.15,
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {role}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.35 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#22C55E',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#64748B',
                fontSize: '0.69rem',
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {status}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

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

  if (currentPathname.includes('MonthlyRevenue')) {
    return (
      <Box sx={{ p: 0, height: '100%', overflow: 'auto' }}>
        <MonthlyRevenue />
      </Box>
    );
  }

  if (currentPathname.includes('GotoRevenue')) {
    return (
      <Box sx={{ p: 0, height: '100%', overflow: 'auto' }}>
        <GotoRevenue />
      </Box>
    );
  }

  if (currentPathname.includes('GosaveRevenue')) {
    return (
      <Box sx={{ p: 0, height: '100%', overflow: 'auto' }}>
        <GosaveRevenue />
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

  if (currentPathname.includes('reports/monthly-visit') || currentPathname.includes('reports/sales')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <ReportMonthlyVisit />
      </Box>
    );
  }

  if (currentPathname.includes('reports/weekly-summary') || currentPathname.includes('reports/customers')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <ReportWeeklyVisit />
      </Box>
    );
  }

  if (currentPathname.includes('reports/monitor-radius') || currentPathname.includes('reports/result')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <ReportMonitorRadius />
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
    fetch(`${API_URL}/financial/last-update`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
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

export default function DashboardLayoutBasic({ onLogout }) {
  const router = useDemoRouter('/dashboard/MonthlyRevenue');
  const isMobileScreen = useMediaQuery('(max-width:600px)');
  const [sidebarUser, setSidebarUser] = React.useState(() => getStoredSidebarUser());
  const navigation = React.useMemo(
    () => buildNavigation(sidebarUser.displayName),
    [sidebarUser.displayName],
  );
  const activeMobileTabGroup = React.useMemo(
    () => resolveMobileTabGroup(router.pathname),
    [router.pathname],
  );
  const mobileChildTabs = React.useMemo(
    () => MOBILE_CHILD_TABS_BY_GROUP[activeMobileTabGroup] ?? [],
    [activeMobileTabGroup],
  );
  const activeMobileChildTab = React.useMemo(
    () => resolveMobileChildTabValue(router.pathname, mobileChildTabs),
    [router.pathname, mobileChildTabs],
  );

  const handleMobileChildTabChange = React.useCallback(
    (_event, nextPath) => {
      if (typeof nextPath !== 'string' || !nextPath || nextPath === router.pathname) return;
      router.navigate(nextPath);
    },
    [router],
  );

  React.useEffect(() => {
    setSidebarUser(getStoredSidebarUser());

    const handleStorageChange = () => {
      setSidebarUser(getStoredSidebarUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AppProvider
      navigation={navigation}
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
        hideNavigation={isMobileScreen}
        sidebarExpandedWidth={260}
        renderPageItem={(item, { mini }) =>
          item.segment === USER_PROFILE_SEGMENT ? (
            <SidebarUserItem mini={mini} user={sidebarUser} />
          ) : (
            <DashboardSidebarPageItem item={item} />
          )
        }
        sx={{
          '& .MuiAppBar-root': {
            boxShadow: 'none',
          },
          '& > .MuiBox-root:last-child > .MuiToolbar-root': {
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
              pointerEvents: 'none',
            },
          },
          '& .MuiDrawer-paper': {
            backgroundColor: '#FFFFFF',
            boxShadow: '4px 0 14px rgba(15, 23, 42, 0.08)',
            borderRight: '1px solid rgba(107, 163, 208, 0.18)',
          },
        }}
        slots={{
          appTitle: TreeViewAppTitle,
          sidebarFooter: ({ mini }) => <SidebarLogout mini={mini} onLogout={onLogout} />,
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
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {isMobileScreen ? (
              <Box
                sx={{
                  px: 1.05,
                  pt: 0.55,
                  bgcolor: 'rgba(255, 255, 255, 0.76)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {mobileChildTabs.length > 0 ? (
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                      value={activeMobileChildTab}
                      onChange={handleMobileChildTabChange}
                      aria-label="mobile tabs"
                    >
                      {mobileChildTabs.map((tab, index) => (
                        <Tab
                          key={tab.value}
                          value={tab.value}
                          label={tab.label}
                          {...a11yProps(index)}
                        />
                      ))}
                    </Tabs>
                  </Box>
                ) : null}
              </Box>
            ) : null}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                flex: 1,
                overflow: 'hidden',
                minHeight: 0,
                pb: isMobileScreen ? 'calc(env(safe-area-inset-bottom, 0px) + 78px)' : 0,
              }}
            >
              <DemoPageContent pathname={router.pathname} />
            </Box>
            {isMobileScreen ? (
              <NavBottom pathname={router.pathname} onNavigate={router.navigate} />
            ) : null}
          </Box>
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}
