import http from '@/services/http.js'

const SCHOOL_YEARS_PATH = '/school-years'
const TERMS_SEGMENT = '/terms'
const TERMS_PATH = '/terms'
const ACTIVE_TERM_PATH = '/terms/get-active'
const SET_ACTIVE_PATH = '/terms/set-active'
const INVALID_SCHOOL_YEAR_ID_MESSAGE = 'A valid school year id is required.'
const INVALID_TERM_ID_MESSAGE = 'A valid term id is required.'

function isPositiveId(recordId) {
  return Number.isInteger(recordId) && recordId > 0
}

function buildSchoolYearTermsPath(schoolYearId) {
  if (!isPositiveId(schoolYearId)) throw new Error(INVALID_SCHOOL_YEAR_ID_MESSAGE)
  return `${SCHOOL_YEARS_PATH}/${schoolYearId}${TERMS_SEGMENT}`
}

function assertTermId(termId) {
  if (isPositiveId(termId)) return
  throw new Error(INVALID_TERM_ID_MESSAGE)
}

export async function fetchTerms(schoolYearId) {
  const response = await http.get(buildSchoolYearTermsPath(schoolYearId))
  return response.data
}

export async function createTerm(schoolYearId, termPayload) {
  const response = await http.post(buildSchoolYearTermsPath(schoolYearId), termPayload)
  return response.data
}

export async function updateTerm(termId, termPayload) {
  assertTermId(termId)
  const response = await http.put(`${TERMS_PATH}/${termId}`, termPayload)
  return response.data
}

export async function deleteTerm(termId) {
  assertTermId(termId)
  const response = await http.delete(`${TERMS_PATH}/${termId}`)
  return response.data
}

export async function activateTerm(termId) {
  assertTermId(termId)
  const response = await http.put(`${SET_ACTIVE_PATH}/${termId}`, null)
  return response.data
}

export async function fetchActiveTerm() {
  const response = await http.get(ACTIVE_TERM_PATH)
  return response.data
}
