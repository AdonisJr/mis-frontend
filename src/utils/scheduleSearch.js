import { isShsGradeLevel } from '@/utils/curriculumForm.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const SCHEDULE_MODE_SECTION = 'section'
export const SCHEDULE_MODE_TEACHER = 'teacher'
export const SCHEDULE_MODE_ROOM = 'room'

export const SCHEDULE_MODE_TABS = Object.freeze(
  [
    { key: SCHEDULE_MODE_SECTION, label: 'Section' },
    { key: SCHEDULE_MODE_TEACHER, label: 'Teacher' },
    { key: SCHEDULE_MODE_ROOM, label: 'Room' },
  ].map((tab) => Object.freeze(tab)),
)

const SCHEDULE_MODES = SCHEDULE_MODE_TABS.map((tab) => tab.key)

export function createScheduleFilters() {
  return {
    mode: SCHEDULE_MODE_SECTION,
    schoolYearId: '',
    sectionId: '',
    teacherId: '',
    roomId: '',
    termNumber: '',
  }
}

export function applyScheduleModeChange(scheduleFilters, nextMode) {
  const mode = SCHEDULE_MODES.includes(nextMode) ? nextMode : SCHEDULE_MODE_SECTION
  return { ...scheduleFilters, mode }
}

// sections and term counts belong to one school year
export function applyScheduleSchoolYearChange(scheduleFilters, nextSchoolYearId) {
  return { ...scheduleFilters, schoolYearId: toIdText(nextSchoolYearId), sectionId: '', termNumber: '' }
}

export function applyScheduleSectionChange(scheduleFilters, nextSectionId) {
  return { ...scheduleFilters, sectionId: toIdText(nextSectionId) }
}

export function applyScheduleTeacherChange(scheduleFilters, nextTeacherId) {
  return { ...scheduleFilters, teacherId: toIdText(nextTeacherId) }
}

export function applyScheduleRoomChange(scheduleFilters, nextRoomId) {
  return { ...scheduleFilters, roomId: toIdText(nextRoomId) }
}

export function applyScheduleTermChange(scheduleFilters, nextTermNumber) {
  return { ...scheduleFilters, termNumber: toIdText(nextTermNumber) }
}

export function isScheduleTermVisible(scheduleFilters, selectedSection) {
  if (scheduleFilters.mode !== SCHEDULE_MODE_SECTION) return true
  return isShsGradeLevel(selectedSection?.grade_level)
}

function buildSectionRequest(scheduleFilters, selectedSection) {
  const sectionId = toRecordId(selectedSection?.id)
  if (sectionId === null) return null
  if (!isShsGradeLevel(selectedSection.grade_level)) {
    return { mode: SCHEDULE_MODE_SECTION, recordId: sectionId, params: {} }
  }
  const termNumber = toRecordId(scheduleFilters.termNumber)
  if (termNumber === null) return null
  return { mode: SCHEDULE_MODE_SECTION, recordId: sectionId, params: { term_number: termNumber } }
}

function buildWeekRequest(scheduleFilters) {
  const isTeacherMode = scheduleFilters.mode === SCHEDULE_MODE_TEACHER
  const recordId = toRecordId(isTeacherMode ? scheduleFilters.teacherId : scheduleFilters.roomId)
  const schoolYearId = toRecordId(scheduleFilters.schoolYearId)
  if (recordId === null || schoolYearId === null) return null
  const termNumber = toRecordId(scheduleFilters.termNumber)
  const timetableParams = { school_year_id: schoolYearId }
  if (termNumber !== null) timetableParams.term_number = termNumber
  return { mode: scheduleFilters.mode, recordId, params: timetableParams }
}

export function buildTimetableRequest(scheduleFilters, selectedSection) {
  if (scheduleFilters.mode === SCHEDULE_MODE_SECTION) return buildSectionRequest(scheduleFilters, selectedSection)
  return buildWeekRequest(scheduleFilters)
}
