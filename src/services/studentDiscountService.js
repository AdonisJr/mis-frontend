import http from '@/services/http.js'

const STUDENT_DISCOUNTS_PATH = '/student-discounts'
const INVALID_STUDENT_DISCOUNT_ID_MESSAGE = 'A valid student discount id is required.'
const FIRST_STUDENT_DISCOUNT_PAGE = 1
const SECOND_STUDENT_DISCOUNT_PAGE = 2

function buildStudentDiscountPath(studentDiscountId) {
  if (!Number.isInteger(studentDiscountId) || studentDiscountId <= 0) {
    throw new Error(INVALID_STUDENT_DISCOUNT_ID_MESSAGE)
  }
  return `${STUDENT_DISCOUNTS_PATH}/${studentDiscountId}`
}

export async function fetchStudentDiscounts(studentDiscountListParams) {
  const response = await http.get(STUDENT_DISCOUNTS_PATH, { params: studentDiscountListParams })
  return response.data
}

export async function fetchAllStudentDiscounts(studentDiscountListParams) {
  const firstPageResponse = await fetchStudentDiscounts({
    ...studentDiscountListParams,
    page: FIRST_STUDENT_DISCOUNT_PAGE,
  })
  const lastPage = firstPageResponse?.meta?.last_page
  const laterPageNumbers = Number.isInteger(lastPage)
    ? Array.from(
        { length: Math.max(lastPage - FIRST_STUDENT_DISCOUNT_PAGE, 0) },
        (_unused, index) => index + SECOND_STUDENT_DISCOUNT_PAGE,
      )
    : []
  const laterPageResponses = await Promise.all(
    laterPageNumbers.map((pageNumber) => fetchStudentDiscounts({ ...studentDiscountListParams, page: pageNumber })),
  )
  const pageResponses = [firstPageResponse, ...laterPageResponses]
  return { student_discounts: pageResponses.flatMap((discountPage) => discountPage?.student_discounts ?? []) }
}

export async function createStudentDiscount(studentDiscountPayload) {
  const response = await http.post(STUDENT_DISCOUNTS_PATH, studentDiscountPayload)
  return response.data
}

export async function updateStudentDiscount(studentDiscountId, notePayload) {
  const response = await http.put(buildStudentDiscountPath(studentDiscountId), notePayload)
  return response.data
}

export async function deleteStudentDiscount(studentDiscountId) {
  const response = await http.delete(buildStudentDiscountPath(studentDiscountId))
  return response.data
}
