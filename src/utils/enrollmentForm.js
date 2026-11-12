import { STAGE_JHS } from '@/utils/programDisplay.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const ENROLLMENT_REMARKS_MAX_LENGTH = 1000

export const ENROLLMENT_FIELD_LABELS = Object.freeze({
  student_id: 'Student',
  section_id: 'Section',
  term_id: 'Term',
  enrolled_at: 'Enrolled date',
  ended_at: 'End date',
  remarks: 'Remarks',
})

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_PART_WIDTH = 2
const MONTH_OFFSET = 1
const SEAT_LEFT_SINGULAR = ' — 1 seat left'
const FULL_SUFFIX = ' — Full'
const LABEL_SEPARATOR = ' · '

const STUDENT_REQUIRED_MESSAGE = 'Choose a student.'
const SECTION_REQUIRED_MESSAGE = 'Section is required.'
const TERM_REQUIRED_MESSAGE = 'Term is required for SHS and college sections.'
const DATE_INVALID_MESSAGE = 'Enter a valid date.'
const REMARKS_TOO_LONG_MESSAGE = `Remarks must be at most ${ENROLLMENT_REMARKS_MAX_LENGTH} characters.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function padDatePart(datePart) {
  return String(datePart).padStart(DATE_PART_WIDTH, '0')
}

export function toIsoDate(dateValue) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) return ''
  const monthText = padDatePart(dateValue.getMonth() + MONTH_OFFSET)
  return `${dateValue.getFullYear()}-${monthText}-${padDatePart(dateValue.getDate())}`
}

export function createEmptyEnrollForm(termId, todayIso) {
  return { student_id: '', section_id: '', term_id: toIdText(termId), enrolled_at: todayIso, remarks: '' }
}

export function createEmptyMoveForm(todayIso) {
  return { section_id: '', ended_at: todayIso, remarks: '' }
}

export function findSection(sections, sectionId) {
  const recordId = toRecordId(sectionId)
  if (!Array.isArray(sections) || recordId === null) return null
  return sections.find((section) => section.id === recordId) ?? null
}

export function isTermRequired(section) {
  const stage = section?.grade_level?.stage
  return typeof stage === 'string' && stage !== STAGE_JHS
}

export function clearTermForSection(formValues, section) {
  if (isTermRequired(section)) return formValues
  return { ...formValues, term_id: '' }
}

function findRemarksError(remarksValue) {
  return toTrimmedText(remarksValue).length > ENROLLMENT_REMARKS_MAX_LENGTH ? REMARKS_TOO_LONG_MESSAGE : ''
}

function findDateError(dateValue) {
  const dateText = toTrimmedText(dateValue)
  return dateText !== '' && !ISO_DATE_PATTERN.test(dateText) ? DATE_INVALID_MESSAGE : ''
}

export function findEnrollFormErrors(formValues, section) {
  const formErrors = {}
  const dateError = findDateError(formValues?.enrolled_at)
  const remarksError = findRemarksError(formValues?.remarks)
  if (toRecordId(formValues?.student_id) === null) formErrors.student_id = [STUDENT_REQUIRED_MESSAGE]
  if (toRecordId(formValues?.section_id) === null) formErrors.section_id = [SECTION_REQUIRED_MESSAGE]
  if (isTermRequired(section) && toRecordId(formValues?.term_id) === null) formErrors.term_id = [TERM_REQUIRED_MESSAGE]
  if (dateError !== '') formErrors.enrolled_at = [dateError]
  if (remarksError !== '') formErrors.remarks = [remarksError]
  return formErrors
}

export function findMoveFormErrors(formValues) {
  const formErrors = {}
  const dateError = findDateError(formValues?.ended_at)
  const remarksError = findRemarksError(formValues?.remarks)
  if (toRecordId(formValues?.section_id) === null) formErrors.section_id = [SECTION_REQUIRED_MESSAGE]
  if (dateError !== '') formErrors.ended_at = [dateError]
  if (remarksError !== '') formErrors.remarks = [remarksError]
  return formErrors
}

function buildRemarksValue(remarksValue) {
  const trimmedRemarks = toTrimmedText(remarksValue)
  return trimmedRemarks === '' ? null : trimmedRemarks
}

export function buildEnrollPayload(formValues, section) {
  const enrollPayload = {
    student_id: toRecordId(formValues?.student_id),
    section_id: toRecordId(formValues?.section_id),
  }
  const enrolledAt = toTrimmedText(formValues?.enrolled_at)
  if (isTermRequired(section)) enrollPayload.term_id = toRecordId(formValues?.term_id)
  if (enrolledAt !== '') enrollPayload.enrolled_at = enrolledAt
  enrollPayload.remarks = buildRemarksValue(formValues?.remarks)
  return enrollPayload
}

export function buildMovePayload(formValues) {
  const movePayload = { section_id: toRecordId(formValues?.section_id) }
  const endedAt = toTrimmedText(formValues?.ended_at)
  if (endedAt !== '') movePayload.ended_at = endedAt
  movePayload.remarks = buildRemarksValue(formValues?.remarks)
  return movePayload
}

export function getSeatsLeft(section) {
  if (!Number.isInteger(section?.capacity) || !Number.isInteger(section?.enrolled_count)) return null
  return Math.max(section.capacity - section.enrolled_count, 0)
}

export function isSeatCountKnown(section, termId) {
  if (getSeatsLeft(section) === null) return false
  return !isTermRequired(section) || toRecordId(termId) !== null
}

export function isSectionFull(section, termId) {
  return isSeatCountKnown(section, termId) && getSeatsLeft(section) === 0
}

function buildSeatsSuffix(section, termId) {
  if (!isSeatCountKnown(section, termId)) return ''
  const seatsLeft = getSeatsLeft(section)
  if (seatsLeft === 0) return FULL_SUFFIX
  if (seatsLeft === 1) return SEAT_LEFT_SINGULAR
  return ` — ${seatsLeft} seats left`
}

export function buildSectionOptionLabel(section, termId) {
  const programSuffix = section.program ? ` (${section.program.code})` : ''
  const baseLabel = `${section.grade_level.name}${LABEL_SEPARATOR}${section.name}${programSuffix}`
  return baseLabel + buildSeatsSuffix(section, termId)
}

export function listMoveTargets(sections, currentSectionId) {
  const currentSection = findSection(sections, currentSectionId)
  if (currentSection === null) return []
  return sections.filter(
    (section) => section.grade_level_id === currentSection.grade_level_id && section.id !== currentSection.id,
  )
}
