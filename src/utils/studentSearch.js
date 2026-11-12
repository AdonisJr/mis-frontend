import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const FIRST_PAGE = 1

const WHITESPACE_RUN_PATTERN = /\s+/g
const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const GRADE_LEVEL_PARAM = 'grade_level_id'

function isValidPage(pageNumber) {
  return Number.isInteger(pageNumber) && pageNumber >= FIRST_PAGE
}

export function createStudentFilters() {
  return { search: '', gradeLevelId: '', page: FIRST_PAGE }
}

export function normalizeSearchText(searchText) {
  if (typeof searchText !== 'string') return ''
  return searchText.trim().replace(WHITESPACE_RUN_PATTERN, ' ')
}

export function buildStudentListParams(studentFilters) {
  const listPage = isValidPage(studentFilters?.page) ? studentFilters.page : FIRST_PAGE
  const studentListParams = { [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(studentFilters?.search)
  const gradeLevelId = toRecordId(studentFilters?.gradeLevelId)
  if (normalizedSearch !== '') studentListParams[SEARCH_PARAM] = normalizedSearch
  if (gradeLevelId !== null) studentListParams[GRADE_LEVEL_PARAM] = gradeLevelId
  return studentListParams
}

export function applySearchChange(studentFilters, nextSearch) {
  return { ...studentFilters, search: normalizeSearchText(nextSearch), page: FIRST_PAGE }
}

export function applyGradeLevelChange(studentFilters, nextGradeLevelId) {
  return { ...studentFilters, gradeLevelId: toIdText(nextGradeLevelId), page: FIRST_PAGE }
}

export function applyPageChange(studentFilters, nextPage) {
  if (!isValidPage(nextPage)) return studentFilters
  return { ...studentFilters, page: nextPage }
}

export function isPageBeyondLast(listMeta) {
  const currentPage = listMeta?.current_page
  const lastPage = listMeta?.last_page
  if (!Number.isInteger(currentPage) || !Number.isInteger(lastPage)) return false
  return currentPage > lastPage
}
