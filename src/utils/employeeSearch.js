import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const ROLE_PARAM = 'role'
const STATUS_PARAM = 'status'

export const EMPLOYEE_STATUS_OPTIONS = Object.freeze([
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
])

function toFilterValue(filterValue) {
  if (typeof filterValue !== 'string') return ''
  return filterValue
}

export function createEmployeeFilters() {
  return { search: '', role: '', status: '', page: FIRST_PAGE }
}

export function buildEmployeeListParams(employeeFilters) {
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, employeeFilters?.page).page
  const employeeListParams = { [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(employeeFilters?.search)
  const roleFilter = toFilterValue(employeeFilters?.role)
  const statusFilter = toFilterValue(employeeFilters?.status)
  if (normalizedSearch !== '') employeeListParams[SEARCH_PARAM] = normalizedSearch
  if (roleFilter !== '') employeeListParams[ROLE_PARAM] = roleFilter
  if (statusFilter !== '') employeeListParams[STATUS_PARAM] = statusFilter
  return employeeListParams
}

export function applyRoleChange(employeeFilters, nextRole) {
  return { ...employeeFilters, role: toFilterValue(nextRole), page: FIRST_PAGE }
}

export function applyStatusChange(employeeFilters, nextStatus) {
  return { ...employeeFilters, status: toFilterValue(nextStatus), page: FIRST_PAGE }
}
