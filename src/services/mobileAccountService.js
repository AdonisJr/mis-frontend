import http from '@/services/http.js'

const STUDENTS_PATH = '/students'
const SECTIONS_PATH = '/sections'
const MOBILE_ACCOUNT_SEGMENT = '/mobile-account'
const SECTION_MOBILE_ACCOUNTS_SEGMENT = '/mobile-accounts'
const INVALID_STUDENT_ID_MESSAGE = 'A valid student id is required.'
const INVALID_SECTION_ID_MESSAGE = 'A valid section id is required.'

function assertStudentId(studentId) {
  if (Number.isInteger(studentId) && studentId > 0) return
  throw new Error(INVALID_STUDENT_ID_MESSAGE)
}

function assertSectionId(sectionId) {
  if (Number.isInteger(sectionId) && sectionId > 0) return
  throw new Error(INVALID_SECTION_ID_MESSAGE)
}

function buildAccountPath(studentId) {
  assertStudentId(studentId)
  return `${STUDENTS_PATH}/${studentId}${MOBILE_ACCOUNT_SEGMENT}`
}

export async function fetchStudentMobileAccount(studentId) {
  const response = await http.get(buildAccountPath(studentId))
  return response.data
}

export async function createStudentMobileAccount(studentId) {
  const response = await http.post(buildAccountPath(studentId))
  return response.data
}

export async function resetStudentMobilePassword(studentId) {
  const response = await http.put(`${buildAccountPath(studentId)}/password`)
  return response.data
}

export async function deactivateStudentMobileAccount(studentId) {
  const response = await http.put(`${buildAccountPath(studentId)}/deactivate`)
  return response.data
}

export async function reactivateStudentMobileAccount(studentId) {
  const response = await http.put(`${buildAccountPath(studentId)}/reactivate`)
  return response.data
}

export async function generateSectionMobileAccounts(sectionId) {
  assertSectionId(sectionId)
  const response = await http.post(`${SECTIONS_PATH}/${sectionId}${SECTION_MOBILE_ACCOUNTS_SEGMENT}`)
  return response.data
}
