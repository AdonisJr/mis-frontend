import http from '@/services/http.js'

const ENROLLMENTS_PATH = '/enrollments'
const MOVE_SEGMENT = '/move'
const DROP_SEGMENT = '/drop'
const TRANSFER_SEGMENT = '/transfer'
const COMPLETE_SEGMENT = '/complete'
const INVALID_ENROLLMENT_ID_MESSAGE = 'A valid enrollment id is required.'

function buildEnrollmentActionPath(enrollmentId, actionSegment) {
  if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) throw new Error(INVALID_ENROLLMENT_ID_MESSAGE)
  return `${ENROLLMENTS_PATH}/${enrollmentId}${actionSegment}`
}

export async function fetchEnrollments(enrollmentListParams) {
  const response = await http.get(ENROLLMENTS_PATH, { params: enrollmentListParams })
  return response.data
}

export async function enrollStudent(enrollPayload) {
  const response = await http.post(ENROLLMENTS_PATH, enrollPayload)
  return response.data
}

export async function moveEnrollment(enrollmentId, movePayload) {
  const response = await http.put(buildEnrollmentActionPath(enrollmentId, MOVE_SEGMENT), movePayload)
  return response.data
}

export async function dropEnrollment(enrollmentId) {
  const response = await http.put(buildEnrollmentActionPath(enrollmentId, DROP_SEGMENT), null)
  return response.data
}

export async function transferEnrollment(enrollmentId) {
  const response = await http.put(buildEnrollmentActionPath(enrollmentId, TRANSFER_SEGMENT), null)
  return response.data
}

export async function completeEnrollment(enrollmentId) {
  const response = await http.put(buildEnrollmentActionPath(enrollmentId, COMPLETE_SEGMENT), null)
  return response.data
}
