import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { ENROLLMENT_STATUSES } from '@/utils/enrollmentStatus.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const SCHOOL_YEAR_PARAM = 'school_year_id'
const TERM_PARAM = 'term_id'
const SECTION_PARAM = 'section_id'
const GRADE_LEVEL_PARAM = 'grade_level_id'
const STATUS_PARAM = 'status'

export function createEnrollmentFilters() {
  return { schoolYearId: '', termId: '', sectionId: '', gradeLevelId: '', status: '', search: '', page: FIRST_PAGE }
}

export function buildEnrollmentListParams(enrollmentFilters) {
  const schoolYearId = toRecordId(enrollmentFilters?.schoolYearId)
  // the API requires school_year_id, so no request is built without one
  if (schoolYearId === null) return null
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, enrollmentFilters.page).page
  const listParams = { [SCHOOL_YEAR_PARAM]: schoolYearId, [PAGE_PARAM]: listPage }
  const optionalIds = {
    [TERM_PARAM]: toRecordId(enrollmentFilters.termId),
    [SECTION_PARAM]: toRecordId(enrollmentFilters.sectionId),
    [GRADE_LEVEL_PARAM]: toRecordId(enrollmentFilters.gradeLevelId),
  }
  for (const [paramName, recordId] of Object.entries(optionalIds)) {
    if (recordId !== null) listParams[paramName] = recordId
  }
  const normalizedSearch = normalizeSearchText(enrollmentFilters.search)
  if (ENROLLMENT_STATUSES.includes(enrollmentFilters.status)) listParams[STATUS_PARAM] = enrollmentFilters.status
  if (normalizedSearch !== '') listParams[SEARCH_PARAM] = normalizedSearch
  return listParams
}

export function applyEnrollmentSchoolYearChange(enrollmentFilters, nextSchoolYearId) {
  return {
    ...enrollmentFilters,
    schoolYearId: toIdText(nextSchoolYearId),
    termId: '',
    sectionId: '',
    page: FIRST_PAGE,
  }
}

export function applyEnrollmentTermChange(enrollmentFilters, nextTermId) {
  return { ...enrollmentFilters, termId: toIdText(nextTermId), page: FIRST_PAGE }
}

export function applyEnrollmentSectionChange(enrollmentFilters, nextSectionId) {
  return { ...enrollmentFilters, sectionId: toIdText(nextSectionId), page: FIRST_PAGE }
}

export function applyEnrollmentGradeLevelChange(enrollmentFilters, nextGradeLevelId) {
  return { ...enrollmentFilters, gradeLevelId: toIdText(nextGradeLevelId), page: FIRST_PAGE }
}

export function applyEnrollmentStatusChange(enrollmentFilters, nextStatus) {
  const status = ENROLLMENT_STATUSES.includes(nextStatus) ? nextStatus : ''
  return { ...enrollmentFilters, status, page: FIRST_PAGE }
}

export function clearUnfitSectionFilter(enrollmentFilters, sectionOptions) {
  if (enrollmentFilters.sectionId === '') return enrollmentFilters
  const sectionId = toRecordId(enrollmentFilters.sectionId)
  const availableSections = Array.isArray(sectionOptions) ? sectionOptions : []
  if (availableSections.some((section) => section.id === sectionId)) return enrollmentFilters
  return { ...enrollmentFilters, sectionId: '', page: FIRST_PAGE }
}

export function listGradeLevelSections(sections, gradeLevelId) {
  if (!Array.isArray(sections)) return []
  const recordId = toRecordId(gradeLevelId)
  if (recordId === null) return sections
  return sections.filter((section) => section.grade_level_id === recordId)
}

export function pickDefaultTermId(terms, activeTerm) {
  const activeTermId = toRecordId(activeTerm?.id)
  if (!Array.isArray(terms) || activeTermId === null) return ''
  return terms.some((term) => term.id === activeTermId) ? String(activeTermId) : ''
}
