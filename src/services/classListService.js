import http from '@/services/http.js'

const MY_CLASSES_PATH = '/my-classes'
const ADVISORY_SECTION_PATH = '/my-advisory-section'
const CLASSES_PATH = '/classes'
const ROSTER_SEGMENT = '/roster'
const INVALID_CLASS_ID_MESSAGE = 'A valid class id is required.'

function buildClassRosterPath(classId) {
  if (!Number.isInteger(classId) || classId <= 0) throw new Error(INVALID_CLASS_ID_MESSAGE)
  return `${CLASSES_PATH}/${classId}${ROSTER_SEGMENT}`
}

export async function fetchMyClasses(classListParams) {
  const response = await http.get(MY_CLASSES_PATH, { params: classListParams })
  return response.data
}

export async function fetchAdvisorySection(classListParams) {
  const response = await http.get(ADVISORY_SECTION_PATH, { params: classListParams })
  return response.data
}

export async function fetchClassRoster(classId) {
  const response = await http.get(buildClassRosterPath(classId))
  return response.data
}
