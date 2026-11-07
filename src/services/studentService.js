import http from '@/services/http.js'

const STUDENTS_PATH = '/students'
const INVALID_STUDENT_ID_MESSAGE = 'A valid student id is required.'

function assertStudentId(studentId) {
  if (Number.isInteger(studentId) && studentId > 0) return
  throw new Error(INVALID_STUDENT_ID_MESSAGE)
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
