import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { FEE_ITEM_CATEGORY_OPTIONS } from '@/utils/feeItemForm.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const CATEGORY_PARAM = 'category'
const STATUS_PARAM = 'status'

// unknown values become '' so they never reach the API, which would answer 422
function pickOptionValue(filterOptions, candidateValue) {
  const isKnownValue = filterOptions.some((filterOption) => filterOption.value === candidateValue)
  return isKnownValue ? candidateValue : ''
}

export function createFeeItemFilters() {
  return { search: '', category: '', status: '', page: FIRST_PAGE }
}

export function buildFeeItemListParams(feeItemFilters) {
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, feeItemFilters?.page).page
  const feeItemListParams = { [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(feeItemFilters?.search)
  const categoryFilter = pickOptionValue(FEE_ITEM_CATEGORY_OPTIONS, feeItemFilters?.category)
  const statusFilter = pickOptionValue(EMPLOYEE_STATUS_OPTIONS, feeItemFilters?.status)
  if (normalizedSearch !== '') feeItemListParams[SEARCH_PARAM] = normalizedSearch
  if (categoryFilter !== '') feeItemListParams[CATEGORY_PARAM] = categoryFilter
  if (statusFilter !== '') feeItemListParams[STATUS_PARAM] = statusFilter
  return feeItemListParams
}

export function applyFeeItemCategoryChange(feeItemFilters, nextCategory) {
  return { ...feeItemFilters, category: pickOptionValue(FEE_ITEM_CATEGORY_OPTIONS, nextCategory), page: FIRST_PAGE }
}
