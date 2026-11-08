import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { PROGRAM_STAGE_OPTIONS } from '@/utils/programForm.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const STAGE_PARAM = 'stage'
const STATUS_PARAM = 'status'

// unknown values (e.g. jhs) become '' so they never reach the API, which would answer 422
function pickOptionValue(filterOptions, candidateValue) {
  const isKnownValue = filterOptions.some((filterOption) => filterOption.value === candidateValue)
  return isKnownValue ? candidateValue : ''
}

export function createProgramFilters() {
  return { search: '', stage: '', status: '', page: FIRST_PAGE }
}

export function buildProgramListParams(programFilters) {
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, programFilters?.page).page
  const programListParams = { [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(programFilters?.search)
  const stageFilter = pickOptionValue(PROGRAM_STAGE_OPTIONS, programFilters?.stage)
  const statusFilter = pickOptionValue(EMPLOYEE_STATUS_OPTIONS, programFilters?.status)
  if (normalizedSearch !== '') programListParams[SEARCH_PARAM] = normalizedSearch
  if (stageFilter !== '') programListParams[STAGE_PARAM] = stageFilter
  if (statusFilter !== '') programListParams[STATUS_PARAM] = statusFilter
  return programListParams
}

export function applyStageChange(programFilters, nextStage) {
  return { ...programFilters, stage: pickOptionValue(PROGRAM_STAGE_OPTIONS, nextStage), page: FIRST_PAGE }
}
