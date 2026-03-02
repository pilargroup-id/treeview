import { useMediaQuery, useTheme } from '@mui/material';

/**
 * @returns {boolean} 
 */
export function useMobile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return isMobile;
}

/**
 * @returns {boolean} 
 */
export function useTablet() {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  return isTablet;
}

/**
 * @returns {boolean} 
 */
export function useDesktop() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  return isDesktop;
}

