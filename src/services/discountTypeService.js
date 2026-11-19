import http from '@/services/http.js'

const DISCOUNT_TYPES_PATH = '/discount-types'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_DISCOUNT_TYPE_ID_MESSAGE = 'A valid discount type id is required.'
const FIRST_DISCOUNT_TYPE_PAGE = 1
const SECOND_DISCOUNT_TYPE_PAGE = 2

function assertDiscountTypeId(discountTypeId) {
  if (Number.isInteger(discountTypeId) && discountTypeId > 0) return
  throw new Error(INVALID_DISCOUNT_TYPE_ID_MESSAGE)
}

function buildDiscountTypePath(discountTypeId) {
  assertDiscountTypeId(discountTypeId)
  return `${DISCOUNT_TYPES_PATH}/${discountTypeId}`
}

export async function fetchDiscountTypes(discountTypeListParams) {
  const response = await http.get(DISCOUNT_TYPES_PATH, { params: discountTypeListParams })
  return response.data
}

export async function fetchAllDiscountTypes(discountTypeListParams) {
  const firstPageResponse = await fetchDiscountTypes({ ...discountTypeListParams, page: FIRST_DISCOUNT_TYPE_PAGE })
  const lastPage = firstPageResponse?.meta?.last_page
  const laterPageNumbers = Number.isInteger(lastPage)
    ? Array.from(
        { length: Math.max(lastPage - FIRST_DISCOUNT_TYPE_PAGE, 0) },
        (_unused, index) => index + SECOND_DISCOUNT_TYPE_PAGE,
      )
    : []
  const laterPageResponses = await Promise.all(
    laterPageNumbers.map((pageNumber) => fetchDiscountTypes({ ...discountTypeListParams, page: pageNumber })),
  )
  const pageResponses = [firstPageResponse, ...laterPageResponses]
  return { discount_types: pageResponses.flatMap((discountTypePage) => discountTypePage?.discount_types ?? []) }
}

export async function fetchDiscountType(discountTypeId) {
  const response = await http.get(buildDiscountTypePath(discountTypeId))
  return response.data
}

export async function createDiscountType(discountTypePayload) {
  const response = await http.post(DISCOUNT_TYPES_PATH, discountTypePayload)
  return response.data
}

export async function updateDiscountType(discountTypeId, discountTypePayload) {
  const response = await http.put(buildDiscountTypePath(discountTypeId), discountTypePayload)
  return response.data
}

export async function deactivateDiscountType(discountTypeId) {
  const response = await http.put(buildDiscountTypePath(discountTypeId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateDiscountType(discountTypeId) {
  const response = await http.put(buildDiscountTypePath(discountTypeId) + REACTIVATE_SEGMENT)
  return response.data
}

export async function deleteDiscountType(discountTypeId) {
  const response = await http.delete(buildDiscountTypePath(discountTypeId))
  return response.data
}
