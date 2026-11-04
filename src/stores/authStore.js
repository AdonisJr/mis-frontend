import { defineStore } from 'pinia'
import { fetchCurrentUser, loginUser, logoutUser } from '@/services/authService.js'
import { HTTP_UNAUTHORIZED } from '@/services/http.js'
import { DASHBOARD_ROUTE_NAME, STUDENTS_ROUTE_NAME } from '@/routeNames.js'

export const ADMIN_ROLE = 'admin'
export const REGISTRAR_ROLE = 'registrar'
export const STAFF_ROLES = [ADMIN_ROLE, REGISTRAR_ROLE]

// order is precedence: admin wins for a user holding both roles
const LANDING_ROUTES = [
  { role: ADMIN_ROLE, routeName: DASHBOARD_ROUTE_NAME },
  { role: REGISTRAR_ROLE, routeName: STUDENTS_ROUTE_NAME },
]

const TOKEN_STORAGE_KEY = 'mis_auth_token'
const USER_STORAGE_KEY = 'mis_auth_user'
const MISSING_TOKEN_MESSAGE = 'Login response did not include a token.'
const MISSING_USER_MESSAGE = 'User response did not include a user.'

function extractUser(currentUserResponse) {
  const user = currentUserResponse?.user
  if (!user || typeof user !== 'object') throw new Error(MISSING_USER_MESSAGE)
  return user
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isSessionChecked: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    userRoles: (state) => state.user?.roles ?? [],
    landingRouteName() {
      return LANDING_ROUTES.find((landingRoute) => this.userRoles.includes(landingRoute.role))?.routeName ?? null
    },
  },

  actions: {
    hasAnyRole(allowedRoles) {
      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return false
      return this.userRoles.some((role) => allowedRoles.includes(role))
    },

    async login(credentials) {
      try {
        const loginResponse = await loginUser(credentials)
        if (!loginResponse?.token) throw new Error(MISSING_TOKEN_MESSAGE)
        this.persistToken(loginResponse.token)
        const currentUserResponse = await fetchCurrentUser({ skipAuthHandling: true })
        this.persistUser(extractUser(currentUserResponse))
        this.isSessionChecked = true
      } catch (error) {
        this.clearSession()
        throw error
      }
    },

    async restoreSession() {
      this.isSessionChecked = true
      this.hydrateFromStorage()
      if (!this.token) return
      try {
        const currentUserResponse = await fetchCurrentUser({ skipAuthHandling: true })
        this.persistUser(extractUser(currentUserResponse))
      } catch (error) {
        // only a rejected token ends the session; an unreachable server keeps the cached user
        if (error.response?.status === HTTP_UNAUTHORIZED) this.clearSession()
      }
    },

    async logout() {
      try {
        await logoutUser()
      } finally {
        this.clearSession()
      }
    },

    clearSession() {
      this.token = null
      this.user = null
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)
      } catch {
        // state is already cleared; a blocked storage cannot keep the session alive
      }
    },

    hydrateFromStorage() {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
        const storedUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY))
        if (!storedToken) return
        if (!storedUser || typeof storedUser !== 'object') throw new Error(MISSING_USER_MESSAGE)
        this.token = storedToken
        this.user = storedUser
      } catch {
        this.clearSession()
      }
    },

    persistToken(token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      this.token = token
    },

    persistUser(user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      this.user = user
    },
  },
})
