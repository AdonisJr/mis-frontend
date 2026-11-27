import {
  ATTENDANCE_STATUS_ABSENT,
  ATTENDANCE_STATUS_LATE,
  ATTENDANCE_STATUS_PRESENT,
} from '@/utils/attendanceDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { buildSectionOptionLabel } from '@/utils/enrollmentForm.js'
import { listGradeLevelSections } from '@/utils/enrollmentSearch.js'
import { findDateRangeError } from '@/utils/paymentSearch.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, normalizeSearchText } from '@/utils/studentSearch.js'
import { pickOptionValue } from '@/utils/subjectSearch.js'

const PRESENT_OPTION = { value: ATTENDANCE_STATUS_PRESENT, label: 'Present' }
const LATE_OPTION = { value: ATTENDANCE_STATUS_LATE, label: 'Late' }
const ABSENT_OPTION = { value: ATTENDANCE_STATUS_ABSENT, label: 'Absent' }

function freezeOptions(statusOptions) {
  return Object.freeze(statusOptions.map((statusOption) => Object.freeze({ ...statusOption })))
}

export const ATTENDANCE_TODAY_STATUS_OPTIONS = freezeOptions([PRESENT_OPTION, LATE_OPTION, ABSENT_OPTION])
export const ATTENDANCE_RECORD_STATUS_OPTIONS = freezeOptions([PRESENT_OPTION, LATE_OPTION])
export const RECORD_RANGE_MAX_DAYS = 31
export const TODAY_DATE_INVALID_MESSAGE = 'Pick a valid date.'
export const TODAY_DATE_FUTURE_MESSAGE = 'The date cannot be in the future.'
export const RECORD_RANGE_TOO_LONG_MESSAGE = 'Pick a range of 31 days or fewer.'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_DAY = 86400000

export function createTodayFilters(todayIso) {
  return { date: todayIso, gradeLevelId: '', sectionId: '', status: '', search: '', page: FIRST_PAGE }
}

export function createRecordFilters(todayIso) {
  return {
    dateFrom: todayIso,
    dateTo: todayIso,
    studentId: '',
    studentLabel: '',
    gradeLevelId: '',
    sectionId: '',
    status: '',
    search: '',
    page: FIRST_PAGE,
  }
}

export function findTodayDateError(dateText, todayIso) {
  if (typeof dateText !== 'string' || !ISO_DATE_PATTERN.test(dateText)) return TODAY_DATE_INVALID_MESSAGE
  return dateText > todayIso ? TODAY_DATE_FUTURE_MESSAGE : ''
}

function countRangeDays(dateFrom, dateTo) {
  // ISO date-only strings parse as UTC, so there is no DST drift
  return (Date.parse(dateTo) - Date.parse(dateFrom)) / MS_PER_DAY + 1
}

export function findRecordRangeError(recordFilters) {
  const orderError = findDateRangeError(recordFilters)
  if (orderError !== '') return orderError
  const isTooLong = countRangeDays(recordFilters.dateFrom, recordFilters.dateTo) > RECORD_RANGE_MAX_DAYS
  return isTooLong ? RECORD_RANGE_TOO_LONG_MESSAGE : ''
}

function pickPage(pageNumber) {
  return Number.isInteger(pageNumber) && pageNumber >= FIRST_PAGE ? pageNumber : FIRST_PAGE
}

function buildRosterParams(attendanceFilters, statusOptions) {
  const rosterParams = {}
  const gradeLevelId = toRecordId(attendanceFilters.gradeLevelId)
  const sectionId = toRecordId(attendanceFilters.sectionId)
  const status = pickOptionValue(statusOptions, attendanceFilters.status)
  const searchText = normalizeSearchText(attendanceFilters.search)
  if (gradeLevelId !== null) rosterParams.grade_level_id = gradeLevelId
  if (sectionId !== null) rosterParams.section_id = sectionId
  if (status !== '') rosterParams.status = status
  if (searchText !== '') rosterParams.search = searchText
  return rosterParams
}

export function buildTodayParams(todayFilters, todayIso) {
  if (findTodayDateError(todayFilters.date, todayIso) !== '') return null
  return {
    date: todayFilters.date,
    page: pickPage(todayFilters.page),
    ...buildRosterParams(todayFilters, ATTENDANCE_TODAY_STATUS_OPTIONS),
  }
}

export function buildRecordParams(recordFilters) {
  if (findRecordRangeError(recordFilters) !== '') return null
  const studentId = toRecordId(recordFilters.studentId)
  return {
    date_from: recordFilters.dateFrom,
    date_to: recordFilters.dateTo,
    page: pickPage(recordFilters.page),
    ...(studentId !== null ? { student_id: studentId } : {}),
    ...buildRosterParams(recordFilters, ATTENDANCE_RECORD_STATUS_OPTIONS),
  }
}

export function applyTodayDateChange(attendanceFilters, nextDate) {
  return { ...attendanceFilters, date: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyRecordDateFromChange(attendanceFilters, nextDate) {
  return { ...attendanceFilters, dateFrom: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyRecordDateToChange(attendanceFilters, nextDate) {
  return { ...attendanceFilters, dateTo: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyAttendanceGradeLevelChange(attendanceFilters, nextId) {
  return { ...attendanceFilters, gradeLevelId: toIdText(nextId), sectionId: '', page: FIRST_PAGE }
}

export function applyAttendanceSectionChange(attendanceFilters, nextId) {
  return { ...attendanceFilters, sectionId: toIdText(nextId), page: FIRST_PAGE }
}

export function applyAttendanceStatusChange(attendanceFilters, nextStatus) {
  return { ...attendanceFilters, status: String(nextStatus ?? ''), page: FIRST_PAGE }
}

export function applyRecordStudentChange(recordFilters, student) {
  const studentId = toRecordId(student?.id)
  if (studentId === null) return recordFilters
  return {
    ...recordFilters,
    studentId: String(studentId),
    studentLabel: formatEnrollmentStudentName(student),
    page: FIRST_PAGE,
  }
}

export function clearRecordStudent(recordFilters) {
  return { ...recordFilters, studentId: '', studentLabel: '', page: FIRST_PAGE }
}

export function buildAttendanceSectionOptions(sections, gradeLevelId) {
  return listGradeLevelSections(sections, gradeLevelId).map((section) => ({
    id: section.id,
    // seat counts are not loaded for the filter list, so the label carries no seats suffix
    label: buildSectionOptionLabel({ ...section, enrolled_count: null }, ''),
  }))
}
