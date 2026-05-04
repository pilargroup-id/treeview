import {
  BarChartSquare02,
  Database01,
  Folder,
  LogOut01,
  Settings01,
  Tool02,
  UserEdit,
  Users01,
} from '@untitledui/icons'
import PriceChangeIcon from '@mui/icons-material/PriceChange'
import BarChartIcon from '@mui/icons-material/BarChart'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import LocationOnIcon from '@mui/icons-material/LocationOn'

export const defaultNavigationPath = '/dashboard'
export const implementedNavigationPaths = [
  '/dashboard',
  '/master-departments',
  '/users',
  '/master-project',
]

export const primaryNavigationItems = [
  {
    id: 'dashboard',
    label: 'Revenue',
    icon: PriceChangeIcon,
    children: [
      { id: 'MonthlyRevenue', label: 'BU Revenue', href: '/dashboard/MonthlyRevenue', icon: BarChartIcon },
      { id: 'GotoRevenue', label: 'Goto Revenue', href: '/dashboard/GotoRevenue', icon: BarChartIcon },
      { id: 'GosaveRevenue', label: 'Gosave Revenue', href: '/dashboard/GosaveRevenue', icon: BarChartIcon },
    ],
  },
  {
    id: 'reports',
    label: 'Touch Point',
    icon: LocationOnIcon,
    children: [
      { id: 'monthly-visit', label: 'Monthly Visit', href: '/reports/monthly-visit', icon: CalendarMonthIcon },
      { id: 'weekly-summary', label: 'Weekly Summary', href: '/reports/weekly-summary', icon: CalendarViewWeekIcon },
      { id: 'monitor-radius', label: 'Details', href: '/reports/monitor-radius', icon: ArticleOutlinedIcon },
    ],
  },
]

export const secondaryNavigationItems = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings01,
    children: [
      {
        id: 'change-profile',
        label: 'Change Profile',
        icon: UserEdit,
        action: 'change-profile',
      },
      {
        id: 'maintenance-info',
        label: 'Maintenance Info',
        icon: Tool02,
      },
    ],
  },
  {
    label: 'Logout',
    href: '/logout',
    icon: LogOut01,
    variant: 'danger',
  },
]

export const BASE_NAVIGATION = [
  {
    segment: 'dashboard',
    title: 'Revenue',
    icon: PriceChangeIcon,
    children: [
      { segment: 'MonthlyRevenue', title: 'BU Revenue', icon: BarChartIcon },
      { segment: 'GotoRevenue', title: 'Goto Revenue', icon: BarChartIcon },
      { segment: 'GosaveRevenue', title: 'Gosave Revenue', icon: BarChartIcon },
    ],
  },
  { kind: 'divider' },
  {
    segment: 'reports',
    title: 'Touch Point',
    icon: LocationOnIcon,
    children: [
      { segment: 'monthly-visit', title: 'Monthly Visit', icon: CalendarMonthIcon },
      { segment: 'weekly-summary', title: 'Weekly Summary', icon: CalendarViewWeekIcon },
      { segment: 'monitor-radius', title: 'Details', icon: ArticleOutlinedIcon },
    ],
  },
]
