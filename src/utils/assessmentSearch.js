import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const SCHOOL_YEAR_PARAM = 'school_year_id'
const GRADE_LEVEL_PARAM = 'grade_level_id'
const PAYMENT_PLAN_PARAM = 'payment_plan_id'

export function createAssessmentFilters() {
  return { schoolYearId: '', search: '', gradeLevelId: '', paymentPlanId: '', page: FIRST_PAGE }
}

export function buildAssessmentListParams(assessmentFilters) {
  const schoolYearId = toRecordId(assessmentFilters?.schoolYearId)
  // the API requires school_year_id, so no request is built without one
  if (schoolYearId === null) return null
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, assessmentFilters.page).page
  const listParams = { [SCHOOL_YEAR_PARAM]: schoolYearId, [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(assessmentFilters.search)
  const gradeLevelId = toRecordId(assessmentFilters.gradeLevelId)
  const paymentPlanId = toRecordId(assessmentFilters.paymentPlanId)
  if (normalizedSearch !== '') listParams[SEARCH_PARAM] = normalizedSearch
  if (gradeLevelId !== null) listParams[GRADE_LEVEL_PARAM] = gradeLevelId
  if (paymentPlanId !== null) listParams[PAYMENT_PLAN_PARAM] = paymentPlanId
  return listParams
}

export function applyAssessmentSchoolYearChange(assessmentFilters, nextSchoolYearId) {
  // payment plans belong to a school year, so the plan filter cannot survive a year change
  return { ...assessmentFilters, schoolYearId: toIdText(nextSchoolYearId), paymentPlanId: '', page: FIRST_PAGE }
}

export function applyAssessmentGradeLevelChange(assessmentFilters, nextGradeLevelId) {
  return { ...assessmentFilters, gradeLevelId: toIdText(nextGradeLevelId), page: FIRST_PAGE }
}

export function applyAssessmentPlanChange(assessmentFilters, nextPaymentPlanId) {
  return { ...assessmentFilters, paymentPlanId: toIdText(nextPaymentPlanId), page: FIRST_PAGE }
}

export function buildCandidateParams(schoolYearId, searchText) {
  const recordId = toRecordId(schoolYearId)
  if (recordId === null) return null
  const candidateParams = { [SCHOOL_YEAR_PARAM]: recordId, [PAGE_PARAM]: FIRST_PAGE }
  const normalizedSearch = normalizeSearchText(searchText)
  if (normalizedSearch !== '') candidateParams[SEARCH_PARAM] = normalizedSearch
  return candidateParams
}

export function hasMoreCandidatePages(listMeta) {
  const currentPage = listMeta?.current_page
  const lastPage = listMeta?.last_page
  if (!Number.isInteger(currentPage) || !Number.isInteger(lastPage)) return false
  return lastPage > currentPage
}
