import http from '@/services/http.js'

const STUDENTS_PATH = '/students'
const STUDENT_RFID_PATH = '/students/rfid'
const INVALID_STUDENT_ID_MESSAGE = 'A valid student id is required.'
const INVALID_RFID_MESSAGE = 'A scanned card UID is required.'

function assertStudentId(studentId) {
  if (Number.isInteger(studentId) && studentId > 0) return
  throw new Error(INVALID_STUDENT_ID_MESSAGE)
}

function assertCardUid(rfid) {
  if (typeof rfid === 'string' && rfid.trim() !== '') return
  throw new Error(INVALID_RFID_MESSAGE)
}

export async function fetchStudents(studentListParams) {
  const response = await http.get(STUDENTS_PATH, { params: studentListParams })
  return response.data
}

export async function createStudent(studentPayload) {
  const response = await http.post(STUDENTS_PATH, studentPayload)
  return response.data
}

export async function updateStudent(studentId, studentPayload) {
  assertStudentId(studentId)
  const response = await http.put(`${STUDENTS_PATH}/${studentId}`, studentPayload)
  return response.data
}

export async function deleteStudent(studentId) {
  assertStudentId(studentId)
  const response = await http.delete(`${STUDENTS_PATH}/${studentId}`)
  return response.data
}

export async function updateStudentRfid(studentId, rfid) {
  assertStudentId(studentId)
  assertCardUid(rfid)
  const response = await http.put(`${STUDENT_RFID_PATH}/${studentId}`, { rfid })
  return response.data
}

export async function deleteStudentRfid(studentId) {
  assertStudentId(studentId)
  const response = await http.delete(`${STUDENT_RFID_PATH}/${studentId}`)
  return response.data
}
