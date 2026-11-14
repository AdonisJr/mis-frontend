import { DISCOUNT_SOURCE_OPTIONS } from '@/utils/discountTypeForm.js'
import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { ENROLLMENT_STATUS_COMPLETED, ENROLLMENT_STATUS_ENROLLED } from '@/utils/enrollmentStatus.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const STATUS_PARAM = 'status'
const SOURCE_PARAM = 'source'
const SCHOOL_YEAR_PARAM = 'school_year_id'
const DISCOUNT_TYPE_PARAM = 'discount_type_id'
const CANDIDATE_STATUSES = Object.freeze([ENROLLMENT_STATUS_ENROLLED, ENROLLMENT_STATUS_COMPLETED])

// unknown values become '' so they never reach the API, which would answer 422
function pickKnownValue(options, candidateValue) {
  return options.some((option) => option.value === candidateValue) ? candidateValue : ''
}

function pickPage(filters) {
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  return applyPageChange({ page: FIRST_PAGE }, filters?.page).page
}

export function createDiscountTypeFilters() {
  return { search: '', source: '', status: '', page: FIRST_PAGE }
}

export function buildDiscountTypeListParams(discountTypeFilters) {
  const listParams = { [PAGE_PARAM]: pickPage(discountTypeFilters) }
  const normalizedSearch = normalizeSearchText(discountTypeFilters?.search)
  const sourceFilter = pickKnownValue(DISCOUNT_SOURCE_OPTIONS, discountTypeFilters?.source)
  const statusFilter = pickKnownValue(EMPLOYEE_STATUS_OPTIONS, discountTypeFilters?.status)
  if (normalizedSearch !== '') listParams[SEARCH_PARAM] = normalizedSearch
  if (sourceFilter !== '') listParams[SOURCE_PARAM] = sourceFilter
  if (statusFilter !== '') listParams[STATUS_PARAM] = statusFilter
  return listParams
}

export function applyDiscountSourceChange(filters, nextSource) {
  return { ...filters, source: pickKnownValue(DISCOUNT_SOURCE_OPTIONS, nextSource), page: FIRST_PAGE }
}

export function createStudentDiscountFilters() {
  return { schoolYearId: '', search: '', discountTypeId: '', source: '', page: FIRST_PAGE }
}

export function buildStudentDiscountListParams(studentDiscountFilters) {
  const schoolYearId = toRecordId(studentDiscountFilters?.schoolYearId)
  // the API requires school_year_id, so no request is built without one
  if (schoolYearId === null) return null
  const listParams = { [SCHOOL_YEAR_PARAM]: schoolYearId, [PAGE_PARAM]: pickPage(studentDiscountFilters) }
  const normalizedSearch = normalizeSearchText(studentDiscountFilters.search)
  const discountTypeId = toRecordId(studentDiscountFilters.discountTypeId)
  const sourceFilter = pickKnownValue(DISCOUNT_SOURCE_OPTIONS, studentDiscountFilters.source)
  if (normalizedSearch !== '') listParams[SEARCH_PARAM] = normalizedSearch
  if (discountTypeId !== null) listParams[DISCOUNT_TYPE_PARAM] = discountTypeId
  if (sourceFilter !== '') listParams[SOURCE_PARAM] = sourceFilter
  return listParams
}

export function applyStudentDiscountSchoolYearChange(filters, nextSchoolYearId) {
  return { ...filters, schoolYearId: toIdText(nextSchoolYearId), page: FIRST_PAGE }
}

export function applyDiscountTypeFilterChange(filters, nextDiscountTypeId) {
  return { ...filters, discountTypeId: toIdText(nextDiscountTypeId), page: FIRST_PAGE }
}

export function buildEnrollmentCandidateParams(schoolYearId, searchText) {
  const recordId = toRecordId(schoolYearId)
  const normalizedSearch = normalizeSearchText(searchText)
  if (recordId === null || normalizedSearch === '') return []
  return CANDIDATE_STATUSES.map((status) => ({
    [SCHOOL_YEAR_PARAM]: recordId,
    [STATUS_PARAM]: status,
    [SEARCH_PARAM]: normalizedSearch,
    [PAGE_PARAM]: FIRST_PAGE,
  }))
}
