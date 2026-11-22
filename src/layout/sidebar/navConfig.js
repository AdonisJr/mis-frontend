import {
  BadgePercent,
  Banknote,
  BookOpen,
  BookText,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  ClipboardPen,
  DoorOpen,
  GraduationCap,
  HandCoins,
  IdCard,
  LayoutDashboard,
  LayoutGrid,
  LibraryBig,
  Receipt,
  ShieldAlert,
  Users,
  Wallet,
} from '@lucide/vue'
import {
  ASSESSMENTS_ROUTE_NAME,
  ATTENDANCE_RECORDS_ROUTE_NAME,
  ATTENDANCE_TODAY_ROUTE_NAME,
  CURRICULUM_ROUTE_NAME,
  DASHBOARD_ROUTE_NAME,
  DISCOUNT_TYPES_ROUTE_NAME,
  EMPLOYEES_ROUTE_NAME,
  ENROLLMENT_ROUTE_NAME,
  FEE_SCHEDULES_ROUTE_NAME,
  PAYMENTS_ROUTE_NAME,
  PAYMENT_HOLDS_ROUTE_NAME,
  PAYMENT_PLANS_ROUTE_NAME,
  PROGRAMS_ROUTE_NAME,
  RFID_CARDS_ROUTE_NAME,
  ROOMS_ROUTE_NAME,
  SCHOOL_YEARS_ROUTE_NAME,
  SECTIONS_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
  STUDENT_DISCOUNTS_ROUTE_NAME,
  SUBJECTS_ROUTE_NAME,
} from '@/routeNames.js'
import { ROUTE_ROLES } from '@/routeRoles.js'
import { hasAnyAllowedRole } from '@/utils/roleAccess.js'

const PEOPLE_GROUP = 'People'
const ATTENDANCE_GROUP = 'Attendance'
const SETUP_GROUP = 'Setup'
const ACADEMICS_GROUP = 'Academics'
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
  { label: 'Rooms', group: SETUP_GROUP, icon: DoorOpen, routeName: ROOMS_ROUTE_NAME, roles: ROUTE_ROLES[ROOMS_ROUTE_NAME] },
  { label: 'Subjects', group: ACADEMICS_GROUP, icon: BookText, routeName: SUBJECTS_ROUTE_NAME, roles: ROUTE_ROLES[SUBJECTS_ROUTE_NAME] },
  { label: 'Curriculum', group: ACADEMICS_GROUP, icon: LibraryBig, routeName: CURRICULUM_ROUTE_NAME, roles: ROUTE_ROLES[CURRICULUM_ROUTE_NAME] },
  { label: 'Fee schedules', group: BILLING_GROUP, icon: Wallet, routeName: FEE_SCHEDULES_ROUTE_NAME, roles: ROUTE_ROLES[FEE_SCHEDULES_ROUTE_NAME] },
  { label: 'Payment plans', group: BILLING_GROUP, icon: CalendarClock, routeName: PAYMENT_PLANS_ROUTE_NAME, roles: ROUTE_ROLES[PAYMENT_PLANS_ROUTE_NAME] },
  { label: 'Discount types', group: BILLING_GROUP, icon: BadgePercent, routeName: DISCOUNT_TYPES_ROUTE_NAME, roles: ROUTE_ROLES[DISCOUNT_TYPES_ROUTE_NAME] },
  { label: 'Student discounts', group: BILLING_GROUP, icon: HandCoins, routeName: STUDENT_DISCOUNTS_ROUTE_NAME, roles: ROUTE_ROLES[STUDENT_DISCOUNTS_ROUTE_NAME] },
  { label: 'Assessments', group: BILLING_GROUP, icon: Receipt, routeName: ASSESSMENTS_ROUTE_NAME, roles: ROUTE_ROLES[ASSESSMENTS_ROUTE_NAME] },
  { label: 'Payments', group: BILLING_GROUP, icon: Banknote, routeName: PAYMENTS_ROUTE_NAME, roles: ROUTE_ROLES[PAYMENTS_ROUTE_NAME] },
  { label: 'Payment holds', group: BILLING_GROUP, icon: ShieldAlert, routeName: PAYMENT_HOLDS_ROUTE_NAME, roles: ROUTE_ROLES[PAYMENT_HOLDS_ROUTE_NAME] },
]

export function listVisibleNavItems(navItems, userRoles) {
  if (!Array.isArray(navItems)) return []
  return navItems.filter((navItem) => hasAnyAllowedRole(userRoles, navItem.roles))
}

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
