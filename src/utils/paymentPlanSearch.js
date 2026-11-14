import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const STATUS_PARAM = 'status'
const SCHOOL_YEAR_PARAM = 'school_year_id'

// unknown values become '' so they never reach the API, which would answer 422
function pickStatusValue(candidateValue) {
  const isKnownValue = EMPLOYEE_STATUS_OPTIONS.some((statusOption) => statusOption.value === candidateValue)
  return isKnownValue ? candidateValue : ''
}

export function createPaymentPlanFilters() {
  return { schoolYearId: '', search: '', status: '', page: FIRST_PAGE }
}

export function buildPaymentPlanListParams(paymentPlanFilters) {
  const schoolYearId = toRecordId(paymentPlanFilters?.schoolYearId)
  // the API requires school_year_id, so no request is built without one
  if (schoolYearId === null) return null
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, paymentPlanFilters.page).page
  const listParams = { [SCHOOL_YEAR_PARAM]: schoolYearId, [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(paymentPlanFilters.search)
  const statusFilter = pickStatusValue(paymentPlanFilters.status)
  if (normalizedSearch !== '') listParams[SEARCH_PARAM] = normalizedSearch
  if (statusFilter !== '') listParams[STATUS_PARAM] = statusFilter
  return listParams
}

export function applyPaymentPlanSchoolYearChange(paymentPlanFilters, nextSchoolYearId) {
  return { ...paymentPlanFilters, schoolYearId: toIdText(nextSchoolYearId), page: FIRST_PAGE }
}
