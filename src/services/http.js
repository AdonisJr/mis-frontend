import axios from 'axios'
import { useToast } from 'vue-toastification'
import router from '@/router.js'
import { useAuthStore } from '@/stores/authStore.js'

const AUTHORIZATION_HEADER = 'Authorization'
const BEARER_PREFIX = 'Bearer '
const SESSION_EXPIRED_MESSAGE = 'Your session has ended. Please log in again.'
const FORBIDDEN_MESSAGE = 'You are not allowed to do that.'

export const HTTP_UNAUTHORIZED = 401
export const HTTP_FORBIDDEN = 403

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

function attachAuthToken(requestConfig) {
  const token = useAuthStore().token
  if (!token) return requestConfig
  requestConfig.headers[AUTHORIZATION_HEADER] = BEARER_PREFIX + token
  return requestConfig
}

function expireSession() {
  useAuthStore().clearSession()
  useToast().error(SESSION_EXPIRED_MESSAGE)
  router.push({ name: 'Login' })
}

function reportForbidden(error) {
  useToast().error(error.response.data?.message ?? FORBIDDEN_MESSAGE)
}

function rejectWithAuthHandling(error) {
  const status = error.response?.status
  if (error.config?.skipAuthHandling) return Promise.reject(error)
  if (status === HTTP_UNAUTHORIZED) expireSession()
  if (status === HTTP_FORBIDDEN) reportForbidden(error)
  return Promise.reject(error)
}

http.interceptors.request.use(attachAuthToken)
http.interceptors.response.use((response) => response, rejectWithAuthHandling)

export default http
