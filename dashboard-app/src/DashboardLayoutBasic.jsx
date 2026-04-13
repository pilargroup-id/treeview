import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Tab, Tabs, createTheme, GlobalStyles, useMediaQuery } from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
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
import { fetchWithAuth } from './utils/fetchWithAuth';
import {
  getFirstAllowedPath,
  getStoredAuthUser,
  isPathAllowed,
  resolveAccessState,
} from './utils/accessControl';
import TreeViewWordmark from './components/TreeViewWordmark';
import NavBottom, { DEFAULT_MOBILE_BOTTOM_NAV_ITEMS } from './mobile/templateMobile/NavBottom';
import MobileMonthlyVisit from './mobile/mobileComponents/salesReport/MobileMonthlyVisit';
import MobileWeekly from './mobile/mobileComponents/salesReport/MobileWeekly';
import MobileMonitorRadius from './mobile/mobileComponents/salesReport/MobileMonitorRadius';
import MobileUserProfile from './mobile/mobileComponents/user/MobileUserProfile';

const DASHBOARD_BACKGROUND_LIGHT =
  'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)';

const LOGOUT_ACTION_LABEL = 'Kembali ke Pilar Group';
const USER_PROFILE_SEGMENT = '__sidebar_user_profile__';
const DEFAULT_SIDEBAR_USER = {
  displayName: 'User',
  role: 'Programmer',
  status: 'Online',
  initials: 'UN',
  username: 'User',
  email: '-',
};

const BASE_NAVIGATION = [
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
  { kind: 'divider' },
  {
    segment: 'reports',
    title: 'Touch Point',
    icon: <LocationOnIcon />,
    children: [
      { segment: 'monthly-visit', title: 'Monthly Visit', icon: <CalendarMonthIcon /> },
      { segment: 'weekly-summary', title: 'Weekly Summary', icon: <CalendarViewWeekIcon /> },
      { segment: 'monitor-radius', title: 'Monitor Radius', icon: <MyLocationIcon /> },
    ],
  },
];

function a11yProps(index) {
  return {
    id: `mobile-tab-${index}`,
    'aria-controls': `mobile-tabpanel-${index}`,
  };
}

const BASE_MOBILE_CHILD_TABS_BY_GROUP = {
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
  user: [],
};

function buildMobileChildTabsByGroup(accessState) {
  return {
    ...BASE_MOBILE_CHILD_TABS_BY_GROUP,
    revenue: accessState?.canAccessFinancial ? BASE_MOBILE_CHILD_TABS_BY_GROUP.revenue : [],
  };
}

function buildMobileBottomNavItems(accessState) {
  return DEFAULT_MOBILE_BOTTOM_NAV_ITEMS.filter((item) => {
    if (item.value === '/orders/CategoryItemTes') {
      return false;
    }

    if (item.value === '/reports/monthly-visit') {
      return false;
    }

    if (item.value === '/dashboard/MonthlyRevenue') {
      return Boolean(accessState?.canAccessFinancial);
    }

    return true;
  });
}

function resolveMobileTabGroup(pathname, accessState) {
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
  if (currentPathname.includes('user/')) return 'user';
  return accessState?.canAccessFinancial ? 'revenue' : 'report';
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

function getStoredSidebarUser(parsedUser = getStoredAuthUser()) {
  if (!parsedUser) return DEFAULT_SIDEBAR_USER;

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
  const username = pickFirstText(
    parsedUser?.username,
    parsedUser?.user_name,
    parsedUser?.name,
  );
  const email = pickFirstText(
    parsedUser?.email,
    parsedUser?.email_address,
    parsedUser?.mail,
  );

  return {
    ...DEFAULT_SIDEBAR_USER,
    displayName: displayName || DEFAULT_SIDEBAR_USER.displayName,
    role: role || DEFAULT_SIDEBAR_USER.role,
    initials: getInitials(displayName),
    username: username || displayName || DEFAULT_SIDEBAR_USER.displayName,
    email: email || '-',
  };
}

function buildNavigation(userDisplayName, accessState) {
  const canShowMainItems = Boolean(accessState?.canAccessFinancial);

  const filteredNavigation = BASE_NAVIGATION.filter((item) => {
    if (item?.kind === 'divider') {
      return canShowMainItems;
    }

    if (item?.segment === 'dashboard') {
      return Boolean(accessState?.canAccessFinancial);
    }

    return true;
  });

  return [
    {
      segment: USER_PROFILE_SEGMENT,
      title: userDisplayName,
      icon: <AccountCircleRoundedIcon />,
    },
    { kind: 'divider' },
    ...filteredNavigation,
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

function AccessRestrictedView({ fallbackPath, onNavigate }) {
  return (
    <Box
      sx={{
        height: '100%',
        px: 3,
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 700 }}>
        Akses dibatasi
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        Role Anda tidak memiliki izin untuk membuka halaman ini. Silakan lanjut ke halaman yang tersedia.
      </Typography>
      <Button
        variant="contained"
        onClick={() => onNavigate(fallbackPath)}
        sx={{
          mt: 1,
          textTransform: 'none',
          borderRadius: '12px',
          px: 2.5,
          bgcolor: '#6BA3D0',
          '&:hover': {
            bgcolor: '#5A9FD0',
          },
        }}
      >
        Buka halaman yang diizinkan
      </Button>
    </Box>
  );
}

function DemoPageContent({
  pathname,
  isMobileScreen,
  sidebarUser,
  logoutLabel,
  onLogout,
  accessState,
  onNavigate,
  onProfileUpdated,
}) {
  const currentPathname = String(pathname ?? '');
  const fallbackPath = getFirstAllowedPath(accessState);

  if (!isPathAllowed(currentPathname, accessState)) {
    return <AccessRestrictedView fallbackPath={fallbackPath} onNavigate={onNavigate} />;
  }

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
        {isMobileScreen ? <MobileMonthlyVisit /> : <ReportMonthlyVisit />}
      </Box>
    );
  }

  if (currentPathname.includes('reports/weekly-summary') || currentPathname.includes('reports/customers')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        {isMobileScreen ? <MobileWeekly /> : <ReportWeeklyVisit />}
      </Box>
    );
  }

  if (currentPathname.includes('reports/monitor-radius') || currentPathname.includes('reports/result')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        {isMobileScreen ? <MobileMonitorRadius /> : <ReportMonitorRadius />}
      </Box>
    );
  }

  if (currentPathname.includes('user/profile')) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <MobileUserProfile
          user={sidebarUser}
          logoutLabel={logoutLabel}
          onLogout={onLogout}
          onProfileUpdated={onProfileUpdated}
        />
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
    fetchWithAuth(`${API_URL}/financial/last-update`, {
      method: 'GET',
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
  const initialAuthUser = getStoredAuthUser();
  const initialAccessState = resolveAccessState(initialAuthUser);
  const router = useDemoRouter(getFirstAllowedPath(initialAccessState));
  const isMobileScreen = useMediaQuery('(max-width:600px)');
  const [sidebarUser, setSidebarUser] = React.useState(() => getStoredSidebarUser(initialAuthUser));
  const [accessState, setAccessState] = React.useState(initialAccessState);
  const navigation = React.useMemo(
    () => buildNavigation(sidebarUser.displayName, accessState),
    [accessState, sidebarUser.displayName],
  );
  const mobileChildTabsByGroup = React.useMemo(
    () => buildMobileChildTabsByGroup(accessState),
    [accessState],
  );
  const mobileBottomNavItems = React.useMemo(
    () => buildMobileBottomNavItems(accessState),
    [accessState],
  );
  const activeMobileTabGroup = React.useMemo(
    () => resolveMobileTabGroup(router.pathname, accessState),
    [accessState, router.pathname],
  );
  const mobileChildTabs = React.useMemo(
    () => mobileChildTabsByGroup[activeMobileTabGroup] ?? [],
    [activeMobileTabGroup, mobileChildTabsByGroup],
  );
  const activeMobileChildTab = React.useMemo(
    () => resolveMobileChildTabValue(router.pathname, mobileChildTabs),
    [router.pathname, mobileChildTabs],
  );

  const handleMobileChildTabChange = React.useCallback(
    (_event, nextPath) => {
      if (typeof nextPath !== 'string' || !nextPath || nextPath === router.pathname) return;
      if (!isPathAllowed(nextPath, accessState)) return;
      router.navigate(nextPath);
    },
    [accessState, router],
  );

  const syncStoredUserState = React.useCallback(() => {
    const storedAuthUser = getStoredAuthUser();
    setSidebarUser(getStoredSidebarUser(storedAuthUser));
    setAccessState(resolveAccessState(storedAuthUser));
  }, []);

  React.useEffect(() => {
    syncStoredUserState();

    const handleStorageChange = () => {
      syncStoredUserState();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncStoredUserState]);

  React.useEffect(() => {
    if (isPathAllowed(router.pathname, accessState)) return;

    const fallbackPath = getFirstAllowedPath(accessState);
    if (fallbackPath && fallbackPath !== router.pathname) {
      router.navigate(fallbackPath);
    }
  }, [accessState, router]);

  return (
    <AppProvider
      navigation={navigation}
      router={router}
      theme={demoTheme}
      branding={{
        logo: <></>,
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
          sidebarFooter: ({ mini }) => (
            <SidebarLogout
              mini={mini}
              label={LOGOUT_ACTION_LABEL}
              onLogout={onLogout}
            />
          ),
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
            background: isMobileScreen
              ? '#F7FAFC'
              : theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(24, 24, 24, 0.98) 50%, rgba(30, 30, 30, 1) 100%)'
                : DASHBOARD_BACKGROUND_LIGHT,
            '&::before': {
              content: isMobileScreen ? 'none' : '""',
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
              <DemoPageContent
                pathname={router.pathname}
                isMobileScreen={isMobileScreen}
                sidebarUser={sidebarUser}
                logoutLabel={LOGOUT_ACTION_LABEL}
                onLogout={onLogout}
                accessState={accessState}
                onNavigate={router.navigate}
                onProfileUpdated={syncStoredUserState}
              />
            </Box>
            {isMobileScreen ? (
              <NavBottom
                pathname={router.pathname}
                onNavigate={router.navigate}
                items={mobileBottomNavItems}
              />
            ) : null}
          </Box>
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}
