import { NOTE_STATUS_OPTIONS } from '@/utils/paymentHoldDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, normalizeSearchText } from '@/utils/studentSearch.js'

const STATUS_VALUES = Object.freeze(NOTE_STATUS_OPTIONS.map((statusOption) => statusOption.value))

function isValidPage(pageNumber) {
  return Number.isInteger(pageNumber) && pageNumber >= FIRST_PAGE
}

export function createHoldFilters() {
  return { noteStatus: '', schoolYearId: '', search: '', page: FIRST_PAGE }
}

function buildOptionalParams(holdFilters) {
  const optionalParams = {}
  const schoolYearId = toRecordId(holdFilters.schoolYearId)
  const normalizedSearch = normalizeSearchText(holdFilters.search)
  if (STATUS_VALUES.includes(holdFilters.noteStatus)) optionalParams.status = holdFilters.noteStatus
  if (schoolYearId !== null) optionalParams.school_year_id = schoolYearId
  if (normalizedSearch !== '') optionalParams.search = normalizedSearch
  return optionalParams
}

export function buildHoldListParams(holdFilters) {
  const listPage = isValidPage(holdFilters?.page) ? holdFilters.page : FIRST_PAGE
  return { page: listPage, ...buildOptionalParams(holdFilters ?? {}) }
}

export function applyHoldStatusChange(holdFilters, nextStatus) {
  return { ...holdFilters, noteStatus: String(nextStatus ?? ''), page: FIRST_PAGE }
}

export function applyHoldSchoolYearChange(holdFilters, nextSchoolYearId) {
  return { ...holdFilters, schoolYearId: String(nextSchoolYearId ?? ''), page: FIRST_PAGE }
}

export function buildHoldCheckParams(studentId, schoolYearId) {
  const studentRecordId = toRecordId(studentId)
  const yearRecordId = toRecordId(schoolYearId)
  if (studentRecordId === null || yearRecordId === null) return null
  return { student_id: studentRecordId, school_year_id: yearRecordId }
}
