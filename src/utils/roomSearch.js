import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { ROOM_TYPE_OPTIONS } from '@/utils/roomDisplay.js'
import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'
import { pickOptionValue } from '@/utils/subjectSearch.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const TYPE_PARAM = 'type'
const STATUS_PARAM = 'status'

export function createRoomFilters() {
  return { search: '', type: '', status: '', page: FIRST_PAGE }
}

export function buildRoomListParams(roomFilters) {
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, roomFilters?.page).page
  const roomListParams = { [PAGE_PARAM]: listPage }
  const normalizedSearch = normalizeSearchText(roomFilters?.search)
  const typeFilter = pickOptionValue(ROOM_TYPE_OPTIONS, roomFilters?.type)
  const statusFilter = pickOptionValue(EMPLOYEE_STATUS_OPTIONS, roomFilters?.status)
  if (normalizedSearch !== '') roomListParams[SEARCH_PARAM] = normalizedSearch
  if (typeFilter !== '') roomListParams[TYPE_PARAM] = typeFilter
  if (statusFilter !== '') roomListParams[STATUS_PARAM] = statusFilter
  return roomListParams
}

export function applyRoomTypeChange(roomFilters, nextType) {
  return { ...roomFilters, type: pickOptionValue(ROOM_TYPE_OPTIONS, nextType), page: FIRST_PAGE }
}
