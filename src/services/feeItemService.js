import http from '@/services/http.js'

const FEE_ITEMS_PATH = '/fee-items'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_FEE_ITEM_ID_MESSAGE = 'A valid fee item id is required.'
const FIRST_FEE_ITEM_PAGE = 1
const SECOND_FEE_ITEM_PAGE = 2

function assertFeeItemId(feeItemId) {
  if (Number.isInteger(feeItemId) && feeItemId > 0) return
  throw new Error(INVALID_FEE_ITEM_ID_MESSAGE)
}

function buildFeeItemPath(feeItemId) {
  assertFeeItemId(feeItemId)
  return `${FEE_ITEMS_PATH}/${feeItemId}`
}

export async function fetchFeeItems(feeItemListParams) {
  const response = await http.get(FEE_ITEMS_PATH, { params: feeItemListParams })
  return response.data
}

export async function fetchAllFeeItems() {
  const firstPageResponse = await fetchFeeItems({ page: FIRST_FEE_ITEM_PAGE })
  const lastPage = firstPageResponse?.meta?.last_page
  const laterPageNumbers = Number.isInteger(lastPage)
    ? Array.from({ length: Math.max(lastPage - FIRST_FEE_ITEM_PAGE, 0) }, (_unused, index) => index + SECOND_FEE_ITEM_PAGE)
    : []
  const laterPageResponses = await Promise.all(laterPageNumbers.map((pageNumber) => fetchFeeItems({ page: pageNumber })))
  return { fee_items: [firstPageResponse, ...laterPageResponses].flatMap((feeItemPage) => feeItemPage?.fee_items ?? []) }
}

export async function createFeeItem(feeItemPayload) {
  const response = await http.post(FEE_ITEMS_PATH, feeItemPayload)
  return response.data
}

export async function updateFeeItem(feeItemId, feeItemPayload) {
  const response = await http.put(buildFeeItemPath(feeItemId), feeItemPayload)
  return response.data
}

export async function deactivateFeeItem(feeItemId) {
  const response = await http.put(buildFeeItemPath(feeItemId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateFeeItem(feeItemId) {
  const response = await http.put(buildFeeItemPath(feeItemId) + REACTIVATE_SEGMENT)
  return response.data
}
