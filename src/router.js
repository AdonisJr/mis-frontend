import { createRouter, createWebHistory } from 'vue-router'
import { STAFF_ROLES, useAuthStore } from '@/stores/authStore.js'

const LOGIN_ROUTE_NAME = 'Login'
const HOME_ROUTE_NAME = 'Home'

const routes = [
  { path: '/login', name: LOGIN_ROUTE_NAME, component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: () => import('@/layout/MainPanelLayout.vue'),
    meta: { roles: STAFF_ROLES },
    children: [{ path: '', name: HOME_ROUTE_NAME, component: () => import('@/views/HomeView.vue') }],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: HOME_ROUTE_NAME } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

async function guardStaffRoutes(to) {
  const authStore = useAuthStore()
  if (!authStore.isSessionChecked) await authStore.restoreSession()
  if (!to.meta.roles) return true
  if (!authStore.isAuthenticated) return { name: LOGIN_ROUTE_NAME }
  if (authStore.hasAnyRole(to.meta.roles)) return true
  authStore.clearSession()
  return { name: LOGIN_ROUTE_NAME }
}

router.beforeEach(guardStaffRoutes)

export default router
