import { ACCOUNT_TYPE_OPTIONS } from '@/utils/accountDisplay.js'
import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { normalizeSearchText } from '@/utils/studentSearch.js'
import { pickOptionValue } from '@/utils/subjectSearch.js'

const SEARCH_PARAM = 'search'
const TYPE_PARAM = 'type'
const STATUS_PARAM = 'status'

export function createAccountFilters() {
  return { search: '', type: '', status: '' }
}

// no page param: fetchAllAccounts adds it
export function buildAccountListParams(accountFilters) {
  const accountListParams = {}
  const normalizedSearch = normalizeSearchText(accountFilters?.search)
  const typeFilter = pickOptionValue(ACCOUNT_TYPE_OPTIONS, accountFilters?.type)
  const statusFilter = pickOptionValue(EMPLOYEE_STATUS_OPTIONS, accountFilters?.status)
  if (normalizedSearch !== '') accountListParams[SEARCH_PARAM] = normalizedSearch
  if (typeFilter !== '') accountListParams[TYPE_PARAM] = typeFilter
  if (statusFilter !== '') accountListParams[STATUS_PARAM] = statusFilter
  return accountListParams
}

export function applyAccountSearchChange(accountFilters, nextSearch) {
  return { ...accountFilters, search: normalizeSearchText(nextSearch) }
}

export function applyAccountTypeChange(accountFilters, nextType) {
  return { ...accountFilters, type: pickOptionValue(ACCOUNT_TYPE_OPTIONS, nextType) }
}

export function applyAccountStatusChange(accountFilters, nextStatus) {
  return { ...accountFilters, status: pickOptionValue(EMPLOYEE_STATUS_OPTIONS, nextStatus) }
}
