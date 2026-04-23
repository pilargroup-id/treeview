import * as React from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';

export const DEFAULT_MOBILE_BOTTOM_NAV_ITEMS = [
  {
    label: 'Revenue',
    value: '/dashboard/MonthlyRevenue',
    matchers: ['MonthlyRevenue', 'GotoRevenue', 'GosaveRevenue', 'RevenueInvoice'],
    icon: <PriceChangeIcon />,
  },
  {
    label: 'Item',
    value: '/orders/CategoryItemTes',
    matchers: ['CategoryItemTes'],
    icon: <Inventory2Icon />,
  },
  {
    label: 'Report',
    value: '/reports/monthly-visit',
    matchers: ['reports/monthly-visit', 'reports/weekly-summary', 'reports/monitor-radius'],
    icon: <AssessmentIcon />,
  },
  {
    label: 'User',
    value: '/user/profile',
    matchers: ['user/profile'],
    icon: <AccountCircleRoundedIcon />,
  },
];

function resolveBottomNavValue(pathname, items) {
  const currentPathname = String(pathname ?? '');
  const activeItem = items.find((item) =>
    item.matchers.some((matcher) => currentPathname.includes(matcher))
  );
  return activeItem ? activeItem.value : false;
}

export default function NavBottom({ pathname, onNavigate, items = DEFAULT_MOBILE_BOTTOM_NAV_ITEMS }) {
  const activeValue = React.useMemo(
    () => resolveBottomNavValue(pathname, items),
    [items, pathname],
  );

  const handleNavigate = React.useCallback(
    (nextValue) => {
      if (typeof nextValue !== 'string' || !nextValue || nextValue === pathname) return;
      if (typeof onNavigate === 'function') onNavigate(nextValue);
    },
    [onNavigate, pathname],
  );

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        bgcolor: 'transparent',
        px: 1.15,
        pb: 'env(safe-area-inset-bottom, 0px)',
        pt: 0.65,
      }}
    >
      <BottomNavigation
        showLabels
        value={activeValue}
        sx={{
          minHeight: 70,
          borderRadius: '20px',
          border: '1px solid rgba(148, 163, 184, 0.34)',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 250, 252, 0.9) 100%)',
          boxShadow: '0 14px 34px rgba(15, 23, 42, 0.15)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          px: 0.6,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            maxWidth: 'none',
            px: 0.45,
            py: 0.7,
            my: 0.5,
            borderRadius: '12px',
            color: '#64748B',
            transition: 'all 0.2s ease',
            '& .MuiSvgIcon-root': {
              fontSize: '1.28rem',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.67rem',
              fontWeight: 600,
              mt: 0.2,
              transition: 'all 0.2s ease',
            },
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: '#2B6997',
            bgcolor: 'rgba(47, 111, 178, 0.15)',
            boxShadow: '0 5px 12px rgba(47, 111, 178, 0.22)',
            transform: 'translateY(-1px)',
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.67rem',
              fontWeight: 700,
            },
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            onClick={() => handleNavigate(item.value)}
          />
        ))}
      </BottomNavigation>
    </Box>
  );
}
