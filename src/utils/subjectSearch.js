import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'
import { SUBJECT_TYPE_OPTIONS } from '@/utils/subjectDisplay.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const TYPE_PARAM = 'type'
const STATUS_PARAM = 'status'

// unknown values become '' so they never reach the API, which would answer 422
function pickOptionValue(filterOptions, candidateValue) {
  const isKnownValue = filterOptions.some((filterOption) => filterOption.value === candidateValue)
  return isKnownValue ? candidateValue : ''
}

export function createSubjectFilters() {
  return { search: '', type: '', status: '', page: FIRST_PAGE }
}

export function buildSubjectListParams(subjectFilters) {
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, subjectFilters?.page).page
  const subjectListParams = { [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(subjectFilters?.search)
  const typeFilter = pickOptionValue(SUBJECT_TYPE_OPTIONS, subjectFilters?.type)
  const statusFilter = pickOptionValue(EMPLOYEE_STATUS_OPTIONS, subjectFilters?.status)
  if (normalizedSearch !== '') subjectListParams[SEARCH_PARAM] = normalizedSearch
  if (typeFilter !== '') subjectListParams[TYPE_PARAM] = typeFilter
  if (statusFilter !== '') subjectListParams[STATUS_PARAM] = statusFilter
  return subjectListParams
}

export function applySubjectTypeChange(subjectFilters, nextType) {
  return { ...subjectFilters, type: pickOptionValue(SUBJECT_TYPE_OPTIONS, nextType), page: FIRST_PAGE }
}
