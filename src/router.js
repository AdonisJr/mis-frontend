import { createRouter, createWebHistory } from 'vue-router'
import { ADMIN_ROLE, STAFF_ROLES, useAuthStore } from '@/stores/authStore.js'
import {
  ATTENDANCE_RECORDS_ROUTE_NAME,
  ATTENDANCE_TODAY_ROUTE_NAME,
  DASHBOARD_ROUTE_NAME,
  EMPLOYEES_ROUTE_NAME,
  LOGIN_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  RFID_CARDS_ROUTE_NAME,
  ROOT_ROUTE_NAME,
  SCHOOL_YEARS_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
} from '@/routeNames.js'

const ADMIN_ONLY_ROLES = [ADMIN_ROLE]

const routes = [
  { path: '/login', name: LOGIN_ROUTE_NAME, component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: () => import('@/layout/MainPanelLayout.vue'),
    children: [
      // the guard always redirects Root to the landing page; vue-router still requires a component on the record
      {
        path: '',
        name: ROOT_ROUTE_NAME,
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: STAFF_ROLES },
      },
      {
        path: 'dashboard',
        name: DASHBOARD_ROUTE_NAME,
        component: () => import('@/views/DashboardView.vue'),
        meta: { roles: ADMIN_ONLY_ROLES, title: 'Dashboard' },
      },
      {
        path: 'students',
        name: STUDENTS_ROUTE_NAME,
        component: () => import('@/views/StudentsView.vue'),
        meta: { roles: STAFF_ROLES, title: 'Students' },
      },
      {
        path: 'employees',
        name: EMPLOYEES_ROUTE_NAME,
        component: () => import('@/views/EmployeesView.vue'),
        meta: { roles: ADMIN_ONLY_ROLES, title: 'Employees' },
      },
      {
        path: 'rfid-cards',
        name: RFID_CARDS_ROUTE_NAME,
        component: () => import('@/views/RfidCardsView.vue'),
        meta: { roles: ADMIN_ONLY_ROLES, title: 'RFID Cards' },
      },
      {
        path: 'attendance/today',
        name: ATTENDANCE_TODAY_ROUTE_NAME,
        component: () => import('@/views/AttendanceTodayView.vue'),
        meta: { roles: ADMIN_ONLY_ROLES, title: 'Today' },
      },
      {
        path: 'attendance/records',
        name: ATTENDANCE_RECORDS_ROUTE_NAME,
        component: () => import('@/views/AttendanceRecordsView.vue'),
        meta: { roles: ADMIN_ONLY_ROLES, title: 'Records' },
      },
      {
        path: 'school-years',
        name: SCHOOL_YEARS_ROUTE_NAME,
        component: () => import('@/views/SchoolYearsView.vue'),
        meta: { roles: ADMIN_ONLY_ROLES, title: 'School Years' },
      },
      {
        path: ':pathMatch(.*)*',
        name: NOT_FOUND_ROUTE_NAME,
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: STAFF_ROLES, title: 'Page not found' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function endSessionAtLogin(authStore) {
  authStore.clearSession()
  return { name: LOGIN_ROUTE_NAME }
}

async function guardStaffRoutes(to) {
  const authStore = useAuthStore()
  if (!authStore.isSessionChecked) await authStore.restoreSession()
  if (!to.meta.roles) return true
  if (!authStore.isAuthenticated) return { name: LOGIN_ROUTE_NAME }
  const landingRouteName = authStore.landingRouteName
  if (!landingRouteName) return endSessionAtLogin(authStore)
  if (to.name === ROOT_ROUTE_NAME) return { name: landingRouteName }
  if (authStore.hasAnyRole(to.meta.roles)) return true
  if (to.name === landingRouteName) return endSessionAtLogin(authStore)
  return { name: landingRouteName }
}

router.beforeEach(guardStaffRoutes)

export default router
