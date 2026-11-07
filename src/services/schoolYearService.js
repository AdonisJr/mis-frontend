import http from '@/services/http.js'

const SCHOOL_YEARS_PATH = '/school-years'
const ACTIVE_SCHOOL_YEAR_PATH = '/school-years/get-active'
const SET_ACTIVE_PATH = '/school-years/set-active'
const INVALID_SCHOOL_YEAR_ID_MESSAGE = 'A valid school year id is required.'

function assertSchoolYearId(schoolYearId) {
  if (Number.isInteger(schoolYearId) && schoolYearId > 0) return
  throw new Error(INVALID_SCHOOL_YEAR_ID_MESSAGE)
}

export async function fetchSchoolYears() {
  const response = await http.get(SCHOOL_YEARS_PATH)
  return response.data
}

export async function createSchoolYear(schoolYearPayload) {
  const response = await http.post(SCHOOL_YEARS_PATH, schoolYearPayload)
  return response.data
}

export async function updateSchoolYear(schoolYearId, schoolYearPayload) {
  assertSchoolYearId(schoolYearId)
  const response = await http.put(`${SCHOOL_YEARS_PATH}/${schoolYearId}`, schoolYearPayload)
  return response.data
}

export async function deleteSchoolYear(schoolYearId) {
  assertSchoolYearId(schoolYearId)
  const response = await http.delete(`${SCHOOL_YEARS_PATH}/${schoolYearId}`)
  return response.data
}

export async function activateSchoolYear(schoolYearId) {
  assertSchoolYearId(schoolYearId)
  const response = await http.put(`${SET_ACTIVE_PATH}/${schoolYearId}`, null)
  return response.data
}

export async function fetchActiveSchoolYear() {
  const response = await http.get(ACTIVE_SCHOOL_YEAR_PATH)
  return response.data
}
