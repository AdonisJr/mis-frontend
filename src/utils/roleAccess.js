import {
  DASHBOARD_ROUTE_NAME,
  MY_CLASSES_ROUTE_NAME,
  PAYMENTS_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
} from '@/routeNames.js'

export const ADMIN_ROLE = 'admin'
export const REGISTRAR_ROLE = 'registrar'
export const CASHIER_ROLE = 'cashier'
export const TEACHER_ROLE = 'teacher'
export const STAFF_ROLES = [ADMIN_ROLE, REGISTRAR_ROLE, CASHIER_ROLE]
export const EMPLOYEE_ROLES = [...STAFF_ROLES, TEACHER_ROLE]

// order is precedence: admin wins for a user holding both roles, and teacher lands last
const LANDING_ROUTES = [
  { role: ADMIN_ROLE, routeName: DASHBOARD_ROUTE_NAME },
  { role: REGISTRAR_ROLE, routeName: STUDENTS_ROUTE_NAME },
  { role: CASHIER_ROLE, routeName: PAYMENTS_ROUTE_NAME },
  { role: TEACHER_ROLE, routeName: MY_CLASSES_ROUTE_NAME },
]

export function findLandingRouteName(userRoles) {
  if (!Array.isArray(userRoles)) return null
  return LANDING_ROUTES.find((landingRoute) => userRoles.includes(landingRoute.role))?.routeName ?? null
}

export function hasAnyAllowedRole(userRoles, allowedRoles) {
  if (!Array.isArray(userRoles)) return false
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return false
  return userRoles.some((role) => allowedRoles.includes(role))
}
