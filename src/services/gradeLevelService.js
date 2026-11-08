import http from '@/services/http.js'

const GRADE_LEVELS_PATH = '/grade-levels'

export async function fetchGradeLevels() {
  const response = await http.get(GRADE_LEVELS_PATH)
  return response.data
}
