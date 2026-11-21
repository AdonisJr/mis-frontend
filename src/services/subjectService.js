import http from '@/services/http.js'

const SUBJECTS_PATH = '/subjects'
const ACTIVE_SUBJECTS_PATH = '/subjects/active'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_SUBJECT_ID_MESSAGE = 'A valid subject id is required.'

function assertSubjectId(subjectId) {
  if (Number.isInteger(subjectId) && subjectId > 0) return
  throw new Error(INVALID_SUBJECT_ID_MESSAGE)
}

function buildSubjectPath(subjectId) {
  assertSubjectId(subjectId)
  return `${SUBJECTS_PATH}/${subjectId}`
}

export async function fetchSubjects(subjectListParams) {
  const response = await http.get(SUBJECTS_PATH, { params: subjectListParams })
  return response.data
}

export async function fetchActiveSubjects() {
  const response = await http.get(ACTIVE_SUBJECTS_PATH)
  return response.data
}

export async function createSubject(subjectPayload) {
  const response = await http.post(SUBJECTS_PATH, subjectPayload)
  return response.data
}

export async function updateSubject(subjectId, subjectPayload) {
  const response = await http.put(buildSubjectPath(subjectId), subjectPayload)
  return response.data
}

export async function deactivateSubject(subjectId) {
  const response = await http.put(buildSubjectPath(subjectId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateSubject(subjectId) {
  const response = await http.put(buildSubjectPath(subjectId) + REACTIVATE_SEGMENT)
  return response.data
}
