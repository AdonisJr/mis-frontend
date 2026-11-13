import {
  BookOpen,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  ClipboardPen,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  LayoutGrid,
  Users,
  Wallet,
} from '@lucide/vue'
import {
  ATTENDANCE_RECORDS_ROUTE_NAME,
  ATTENDANCE_TODAY_ROUTE_NAME,
  DASHBOARD_ROUTE_NAME,
  EMPLOYEES_ROUTE_NAME,
  ENROLLMENT_ROUTE_NAME,
  FEE_SCHEDULES_ROUTE_NAME,
  PROGRAMS_ROUTE_NAME,
  RFID_CARDS_ROUTE_NAME,
  SCHOOL_YEARS_ROUTE_NAME,
  SECTIONS_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
} from '@/routeNames.js'
import { ROUTE_ROLES } from '@/routeRoles.js'

const PEOPLE_GROUP = 'People'
const ATTENDANCE_GROUP = 'Attendance'
const SETUP_GROUP = 'Setup'
const BILLING_GROUP = 'Billing'

export const NAV_ROW_HEADING = 'heading'
export const NAV_ROW_ITEM = 'item'

export const NAV_ITEMS = [
  { label: 'Dashboard', group: null, icon: LayoutDashboard, routeName: DASHBOARD_ROUTE_NAME, roles: ROUTE_ROLES[DASHBOARD_ROUTE_NAME] },
  { label: 'Students', group: PEOPLE_GROUP, icon: GraduationCap, routeName: STUDENTS_ROUTE_NAME, roles: ROUTE_ROLES[STUDENTS_ROUTE_NAME] },
  { label: 'Enrollment', group: PEOPLE_GROUP, icon: ClipboardPen, routeName: ENROLLMENT_ROUTE_NAME, roles: ROUTE_ROLES[ENROLLMENT_ROUTE_NAME] },
  { label: 'Employees', group: PEOPLE_GROUP, icon: Users, routeName: EMPLOYEES_ROUTE_NAME, roles: ROUTE_ROLES[EMPLOYEES_ROUTE_NAME] },
  { label: 'RFID Cards', group: PEOPLE_GROUP, icon: IdCard, routeName: RFID_CARDS_ROUTE_NAME, roles: ROUTE_ROLES[RFID_CARDS_ROUTE_NAME] },
  { label: 'Today', group: ATTENDANCE_GROUP, icon: CalendarCheck, routeName: ATTENDANCE_TODAY_ROUTE_NAME, roles: ROUTE_ROLES[ATTENDANCE_TODAY_ROUTE_NAME] },
  { label: 'Records', group: ATTENDANCE_GROUP, icon: ClipboardList, routeName: ATTENDANCE_RECORDS_ROUTE_NAME, roles: ROUTE_ROLES[ATTENDANCE_RECORDS_ROUTE_NAME] },
  { label: 'School Years', group: SETUP_GROUP, icon: CalendarRange, routeName: SCHOOL_YEARS_ROUTE_NAME, roles: ROUTE_ROLES[SCHOOL_YEARS_ROUTE_NAME] },
  { label: 'Programs', group: SETUP_GROUP, icon: BookOpen, routeName: PROGRAMS_ROUTE_NAME, roles: ROUTE_ROLES[PROGRAMS_ROUTE_NAME] },
  { label: 'Sections', group: SETUP_GROUP, icon: LayoutGrid, routeName: SECTIONS_ROUTE_NAME, roles: ROUTE_ROLES[SECTIONS_ROUTE_NAME] },
  { label: 'Fee schedules', group: BILLING_GROUP, icon: Wallet, routeName: FEE_SCHEDULES_ROUTE_NAME, roles: ROUTE_ROLES[FEE_SCHEDULES_ROUTE_NAME] },
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
