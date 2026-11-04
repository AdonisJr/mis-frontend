import {
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Users,
} from '@lucide/vue'
import { ADMIN_ROLE, STAFF_ROLES } from '@/stores/authStore.js'
import {
  ATTENDANCE_RECORDS_ROUTE_NAME,
  ATTENDANCE_TODAY_ROUTE_NAME,
  DASHBOARD_ROUTE_NAME,
  EMPLOYEES_ROUTE_NAME,
  RFID_CARDS_ROUTE_NAME,
  SCHOOL_YEARS_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
} from '@/routeNames.js'

const PEOPLE_GROUP = 'People'
const ATTENDANCE_GROUP = 'Attendance'
const SETUP_GROUP = 'Setup'
const ADMIN_ONLY_ROLES = [ADMIN_ROLE]

export const NAV_ROW_HEADING = 'heading'
export const NAV_ROW_ITEM = 'item'

export const NAV_ITEMS = [
  { label: 'Dashboard', group: null, icon: LayoutDashboard, routeName: DASHBOARD_ROUTE_NAME, roles: ADMIN_ONLY_ROLES },
  { label: 'Students', group: PEOPLE_GROUP, icon: GraduationCap, routeName: STUDENTS_ROUTE_NAME, roles: STAFF_ROLES },
  { label: 'Employees', group: PEOPLE_GROUP, icon: Users, routeName: EMPLOYEES_ROUTE_NAME, roles: ADMIN_ONLY_ROLES },
  { label: 'RFID Cards', group: PEOPLE_GROUP, icon: IdCard, routeName: RFID_CARDS_ROUTE_NAME, roles: ADMIN_ONLY_ROLES },
  { label: 'Today', group: ATTENDANCE_GROUP, icon: CalendarCheck, routeName: ATTENDANCE_TODAY_ROUTE_NAME, roles: ADMIN_ONLY_ROLES },
  { label: 'Records', group: ATTENDANCE_GROUP, icon: ClipboardList, routeName: ATTENDANCE_RECORDS_ROUTE_NAME, roles: ADMIN_ONLY_ROLES },
  { label: 'School Years', group: SETUP_GROUP, icon: CalendarRange, routeName: SCHOOL_YEARS_ROUTE_NAME, roles: ADMIN_ONLY_ROLES },
]

export function buildNavRows(navItems) {
  if (!Array.isArray(navItems)) return []
  const navRows = []
  let previousGroup = null
  for (const navItem of navItems) {
    if (navItem.group && navItem.group !== previousGroup) {
      navRows.push({ kind: NAV_ROW_HEADING, key: `heading-${navItem.group}`, label: navItem.group })
    }
    previousGroup = navItem.group
    navRows.push({ kind: NAV_ROW_ITEM, key: navItem.routeName, item: navItem })
  }
  return navRows
}

export function findNavGroupLabel(routeName) {
  return NAV_ITEMS.find((navItem) => navItem.routeName === routeName)?.group ?? null
}
