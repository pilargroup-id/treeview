const DEFAULT_ALLOWED_PATH = '/reports/monthly-visit';
const RESTRICTED_MODULE_ALLOWED_VALUES = ['Board Of Director', 'IT'];
const FINANCIAL_PATH_MATCHERS = ['MonthlyRevenue', 'GotoRevenue', 'GosaveRevenue', 'RevenueInvoice'];
const ITEM_PATH_MATCHERS = ['CategoryItemTes'];

export const AUTH_USER_STORAGE_KEY = 'authUser';

function normalizeText(value) {
  return String(value ?? '').trim();
}

export function getStoredAuthUser() {
  if (typeof window === 'undefined') return null;

  try {
    const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!rawUser) return null;

    const parsedUser = JSON.parse(rawUser);
    return parsedUser && typeof parsedUser === 'object' ? parsedUser : null;
  } catch {
    return null;
  }
}

export function matchesPermission(user, allowedValues = []) {
  const department = normalizeText(user?.department);
  const jobLevel = normalizeText(user?.job_level);

  return allowedValues.some((allowedValue) => {
    const normalizedAllowedValue = normalizeText(allowedValue);
    if (!normalizedAllowedValue) return false;
    return department === normalizedAllowedValue || jobLevel === normalizedAllowedValue;
  });
}

export function resolveAccessState(user) {
  const canAccessFinancial = matchesPermission(user, RESTRICTED_MODULE_ALLOWED_VALUES);
  const canAccessItem = matchesPermission(user, RESTRICTED_MODULE_ALLOWED_VALUES);

  return {
    canAccessFinancial,
    canAccessItem,
    defaultPath: canAccessFinancial ? '/dashboard/MonthlyRevenue' : DEFAULT_ALLOWED_PATH,
  };
}

export function isFinancialPath(pathname) {
  const currentPathname = normalizeText(pathname);
  return FINANCIAL_PATH_MATCHERS.some((matcher) => currentPathname.includes(matcher));
}

export function isItemPath(pathname) {
  const currentPathname = normalizeText(pathname);
  return ITEM_PATH_MATCHERS.some((matcher) => currentPathname.includes(matcher));
}

export function isPathAllowed(pathname, accessState) {
  if (isFinancialPath(pathname)) {
    return Boolean(accessState?.canAccessFinancial);
  }

  if (isItemPath(pathname)) {
    return Boolean(accessState?.canAccessItem);
  }

  return true;
}

export function getFirstAllowedPath(accessState) {
  const nextPath = normalizeText(accessState?.defaultPath);
  return nextPath || DEFAULT_ALLOWED_PATH;
}
