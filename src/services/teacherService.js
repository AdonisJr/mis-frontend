import http from '@/services/http.js'

const ACTIVE_TEACHERS_PATH = '/teachers/active'

export async function fetchActiveTeachers() {
  const response = await http.get(ACTIVE_TEACHERS_PATH)
  return response.data
}
