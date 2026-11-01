import http from '@/services/http.js'

const LOGIN_PATH = '/login'
const CURRENT_USER_PATH = '/user'
const LOGOUT_PATH = '/logout'

export async function loginUser(credentials) {
  const response = await http.post(LOGIN_PATH, credentials, { skipAuthHandling: true })
  return response.data
}

export async function fetchCurrentUser(requestConfig = {}) {
  const response = await http.get(CURRENT_USER_PATH, requestConfig)
  return response.data
}

export async function logoutUser() {
  const response = await http.post(LOGOUT_PATH, null, { skipAuthHandling: true })
  return response.data
}
