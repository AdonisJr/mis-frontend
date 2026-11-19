import { PAYMENT_METHODS } from '@/utils/paymentForm.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, normalizeSearchText } from '@/utils/studentSearch.js'

export const PAYMENT_STATUS_VALID = 'valid'
export const PAYMENT_STATUS_VOIDED = 'voided'
export const PAYMENT_STATUS_OPTIONS = Object.freeze(
  [
    { value: PAYMENT_STATUS_VALID, label: 'Valid' },
    { value: PAYMENT_STATUS_VOIDED, label: 'Voided' },
  ].map((statusOption) => Object.freeze(statusOption)),
)
export const DATE_RANGE_INVALID_MESSAGE = 'The start date must be on or before the end date.'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const STATUS_VALUES = Object.freeze(PAYMENT_STATUS_OPTIONS.map((statusOption) => statusOption.value))
const METHOD_VALUES = Object.freeze(PAYMENT_METHODS.map((methodOption) => methodOption.value))

function isValidPage(pageNumber) {
  return Number.isInteger(pageNumber) && pageNumber >= FIRST_PAGE
}

function isIsoDateText(dateText) {
  return typeof dateText === 'string' && ISO_DATE_PATTERN.test(dateText)
}

export function createPaymentFilters(todayIso) {
  return { dateFrom: todayIso, dateTo: todayIso, method: '', recordedBy: '', status: '', search: '', page: FIRST_PAGE }
}

export function findDateRangeError(paymentFilters) {
  const { dateFrom, dateTo } = paymentFilters ?? {}
  if (!isIsoDateText(dateFrom) || !isIsoDateText(dateTo)) return DATE_RANGE_INVALID_MESSAGE
  return dateFrom > dateTo ? DATE_RANGE_INVALID_MESSAGE : ''
}

function buildOptionalParams(paymentFilters) {
  const optionalParams = {}
  const recorderId = toRecordId(paymentFilters.recordedBy)
  const normalizedSearch = normalizeSearchText(paymentFilters.search)
  if (METHOD_VALUES.includes(paymentFilters.method)) optionalParams.method = paymentFilters.method
  if (recorderId !== null) optionalParams.recorded_by = recorderId
  if (STATUS_VALUES.includes(paymentFilters.status)) optionalParams.status = paymentFilters.status
  if (normalizedSearch !== '') optionalParams.search = normalizedSearch
  return optionalParams
}

export function buildPaymentListParams(paymentFilters) {
  if (findDateRangeError(paymentFilters) !== '') return null
  const listPage = isValidPage(paymentFilters.page) ? paymentFilters.page : FIRST_PAGE
  return {
    date_from: paymentFilters.dateFrom,
    date_to: paymentFilters.dateTo,
    page: listPage,
    ...buildOptionalParams(paymentFilters),
  }
}

export function applyDateFromChange(paymentFilters, nextDate) {
  return { ...paymentFilters, dateFrom: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyDateToChange(paymentFilters, nextDate) {
  return { ...paymentFilters, dateTo: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyMethodChange(paymentFilters, nextMethod) {
  return { ...paymentFilters, method: String(nextMethod ?? ''), page: FIRST_PAGE }
}

export function applyRecorderChange(paymentFilters, nextRecorderId) {
  return { ...paymentFilters, recordedBy: String(nextRecorderId ?? ''), page: FIRST_PAGE }
}

export function applyStatusChange(paymentFilters, nextStatus) {
  return { ...paymentFilters, status: String(nextStatus ?? ''), page: FIRST_PAGE }
}

export function buildLedgerSearchParams(schoolYearId, searchText) {
  const yearId = toRecordId(schoolYearId)
  const normalizedSearch = normalizeSearchText(searchText)
  if (yearId === null || normalizedSearch === '') return null
  return { school_year_id: yearId, search: normalizedSearch, page: FIRST_PAGE }
}
