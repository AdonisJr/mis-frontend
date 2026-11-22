import http from '@/services/http.js'

const CLASSES_PATH = '/classes'
const SECTIONS_PATH = '/sections'
const TEACHERS_PATH = '/teachers'
const ROOMS_PATH = '/rooms'
const TIMETABLE_SEGMENT = '/timetable'
const INVALID_CLASS_ID_MESSAGE = 'A valid class id is required.'
const INVALID_SECTION_ID_MESSAGE = 'A valid section id is required.'
const INVALID_TEACHER_ID_MESSAGE = 'A valid teacher id is required.'
const INVALID_ROOM_ID_MESSAGE = 'A valid room id is required.'

function assertRecordId(recordId, invalidMessage) {
  if (Number.isInteger(recordId) && recordId > 0) return
  throw new Error(invalidMessage)
}

function buildClassPath(classId) {
  assertRecordId(classId, INVALID_CLASS_ID_MESSAGE)
  return `${CLASSES_PATH}/${classId}`
}

function buildSectionTimetablePath(sectionId) {
  assertRecordId(sectionId, INVALID_SECTION_ID_MESSAGE)
  return `${SECTIONS_PATH}/${sectionId}${TIMETABLE_SEGMENT}`
}

function buildTeacherTimetablePath(teacherId) {
  assertRecordId(teacherId, INVALID_TEACHER_ID_MESSAGE)
  return `${TEACHERS_PATH}/${teacherId}${TIMETABLE_SEGMENT}`
}

function buildRoomTimetablePath(roomId) {
  assertRecordId(roomId, INVALID_ROOM_ID_MESSAGE)
  return `${ROOMS_PATH}/${roomId}${TIMETABLE_SEGMENT}`
}

export async function createClass(classPayload) {
  const response = await http.post(CLASSES_PATH, classPayload)
  return response.data
}

export async function updateClass(classId, classPayload) {
  const response = await http.put(buildClassPath(classId), classPayload)
  return response.data
}

export async function deleteClass(classId) {
  const response = await http.delete(buildClassPath(classId))
  return response.data
}

export async function fetchSectionTimetable(sectionId, timetableParams) {
  const response = await http.get(buildSectionTimetablePath(sectionId), { params: timetableParams })
  return response.data
}

export async function fetchTeacherTimetable(teacherId, timetableParams) {
  const response = await http.get(buildTeacherTimetablePath(teacherId), { params: timetableParams })
  return response.data
}

export async function fetchRoomTimetable(roomId, timetableParams) {
  const response = await http.get(buildRoomTimetablePath(roomId), { params: timetableParams })
  return response.data
}
