import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'
import {
  ATTENDANCE_RECORDS_ROUTE_NAME,
  ATTENDANCE_TODAY_ROUTE_NAME,
  DASHBOARD_ROUTE_NAME,
  EMPLOYEES_ROUTE_NAME,
  LOGIN_ROUTE_NAME,
  NOT_FOUND_ROUTE_NAME,
  PROGRAMS_ROUTE_NAME,
  RFID_CARDS_ROUTE_NAME,
  ROOT_ROUTE_NAME,
  SCHOOL_YEARS_ROUTE_NAME,
  SECTIONS_ROUTE_NAME,
  STUDENTS_ROUTE_NAME,
} from '@/routeNames.js'
import { ROUTE_ROLES } from '@/routeRoles.js'

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
        meta: { roles: ROUTE_ROLES[ROOT_ROUTE_NAME] },
      },
      {
        path: 'dashboard',
        name: DASHBOARD_ROUTE_NAME,
        component: () => import('@/views/DashboardView.vue'),
        meta: { roles: ROUTE_ROLES[DASHBOARD_ROUTE_NAME], title: 'Dashboard' },
      },
      {
        path: 'students',
        name: STUDENTS_ROUTE_NAME,
        component: () => import('@/views/StudentsView.vue'),
        meta: { roles: ROUTE_ROLES[STUDENTS_ROUTE_NAME], title: 'Students' },
      },
      {
        path: 'employees',
        name: EMPLOYEES_ROUTE_NAME,
        component: () => import('@/views/EmployeesView.vue'),
        meta: { roles: ROUTE_ROLES[EMPLOYEES_ROUTE_NAME], title: 'Employees' },
      },
      {
        path: 'rfid-cards',
        name: RFID_CARDS_ROUTE_NAME,
        component: () => import('@/views/RfidCardsView.vue'),
        meta: { roles: ROUTE_ROLES[RFID_CARDS_ROUTE_NAME], title: 'RFID Cards' },
      },
      {
        path: 'attendance/today',
        name: ATTENDANCE_TODAY_ROUTE_NAME,
        component: () => import('@/views/AttendanceTodayView.vue'),
        meta: { roles: ROUTE_ROLES[ATTENDANCE_TODAY_ROUTE_NAME], title: 'Today' },
      },
      {
        path: 'attendance/records',
        name: ATTENDANCE_RECORDS_ROUTE_NAME,
        component: () => import('@/views/AttendanceRecordsView.vue'),
        meta: { roles: ROUTE_ROLES[ATTENDANCE_RECORDS_ROUTE_NAME], title: 'Records' },
      },
      {
        path: 'school-years',
        name: SCHOOL_YEARS_ROUTE_NAME,
        component: () => import('@/views/SchoolYearsView.vue'),
        meta: { roles: ROUTE_ROLES[SCHOOL_YEARS_ROUTE_NAME], title: 'School Years' },
      },
      {
        path: 'programs',
        name: PROGRAMS_ROUTE_NAME,
        component: () => import('@/views/ProgramsView.vue'),
        meta: { roles: ROUTE_ROLES[PROGRAMS_ROUTE_NAME], title: 'Programs' },
      },
      {
        path: 'sections',
        name: SECTIONS_ROUTE_NAME,
        component: () => import('@/views/SectionsView.vue'),
        meta: { roles: ROUTE_ROLES[SECTIONS_ROUTE_NAME], title: 'Sections' },
      },
      {
        path: ':pathMatch(.*)*',
        name: NOT_FOUND_ROUTE_NAME,
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: ROUTE_ROLES[NOT_FOUND_ROUTE_NAME], title: 'Page not found' },
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
