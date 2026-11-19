import { toCents, formatCentsAsAmount, formatPesoFromCents } from '@/utils/moneyDisplay.js'

export const METHOD_CASH = 'cash'
export const PAYMENT_METHODS = Object.freeze(
  [
    { value: METHOD_CASH, label: 'Cash' },
    { value: 'e_wallet', label: 'E-wallet (GCash/Maya)' },
    { value: 'bank_transfer', label: 'Bank transfer / deposit' },
    { value: 'check', label: 'Check' },
  ].map((methodOption) => Object.freeze(methodOption)),
)

export const PAYMENT_REFERENCE_MAX_LENGTH = 50
export const PAYMENT_REMARKS_MAX_LENGTH = 500
export const VOID_REASON_MAX_LENGTH = 500

export const AMOUNT_INVALID_MESSAGE = 'Enter an amount greater than zero with up to 2 decimals.'
export const DATE_INVALID_MESSAGE = 'Enter a valid date.'
export const DATE_FUTURE_MESSAGE = 'The payment date cannot be in the future.'
export const METHOD_REQUIRED_MESSAGE = 'Choose a payment method.'
export const REFERENCE_REQUIRED_MESSAGE = 'Reference no. is required unless the payment is cash.'
export const REFERENCE_LENGTH_MESSAGE = `Reference no. must be at most ${PAYMENT_REFERENCE_MAX_LENGTH} characters.`
export const REMARKS_LENGTH_MESSAGE = `Remarks must be at most ${PAYMENT_REMARKS_MAX_LENGTH} characters.`
export const VOID_REASON_REQUIRED_MESSAGE = 'Enter the reason for voiding.'
export const VOID_REASON_LENGTH_MESSAGE = `The reason must be at most ${VOID_REASON_MAX_LENGTH} characters.`

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const METHOD_VALUES = Object.freeze(PAYMENT_METHODS.map((methodOption) => methodOption.value))

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function toNullableText(fieldValue) {
  const trimmedText = toTrimmedText(fieldValue)
  return trimmedText === '' ? null : trimmedText
}

function buildOverBalanceMessage(maxCents) {
  return `Amount cannot exceed the balance of ${formatPesoFromCents(maxCents)}.`
}

export function isReferenceRequired(method) {
  return METHOD_VALUES.includes(method) && method !== METHOD_CASH
}

export function createPaymentForm(nextAmountDue, todayIso) {
  const nextCents = toCents(nextAmountDue)
  const amountText = nextCents === null || nextCents === 0 ? '' : formatCentsAsAmount(nextCents)
  return { amount: amountText, payment_date: todayIso, method: METHOD_CASH, reference_no: '', remarks: '' }
}

export function buildPaymentRules(balanceText, todayIso) {
  return { maxCents: toCents(balanceText), maxDate: todayIso }
}

function findAmountError(amountText, maxCents) {
  const amountCents = toCents(amountText)
  if (amountCents === null || amountCents === 0) return AMOUNT_INVALID_MESSAGE
  if (maxCents !== null && amountCents > maxCents) return buildOverBalanceMessage(maxCents)
  return ''
}

function findDateError(dateText, maxDate) {
  if (typeof dateText !== 'string' || !ISO_DATE_PATTERN.test(dateText)) return DATE_INVALID_MESSAGE
  if (dateText > maxDate) return DATE_FUTURE_MESSAGE
  return ''
}

function findReferenceError(formValues) {
  const referenceText = toTrimmedText(formValues?.reference_no)
  if (referenceText === '' && isReferenceRequired(formValues?.method)) return REFERENCE_REQUIRED_MESSAGE
  if (referenceText.length > PAYMENT_REFERENCE_MAX_LENGTH) return REFERENCE_LENGTH_MESSAGE
  return ''
}

function findRemarksError(remarksValue) {
  if (toTrimmedText(remarksValue).length > PAYMENT_REMARKS_MAX_LENGTH) return REMARKS_LENGTH_MESSAGE
  return ''
}

export function findPaymentFormErrors(formValues, paymentRules) {
  const fieldMessages = {
    amount: findAmountError(formValues?.amount, paymentRules?.maxCents ?? null),
    payment_date: findDateError(formValues?.payment_date, paymentRules?.maxDate ?? ''),
    method: METHOD_VALUES.includes(formValues?.method) ? '' : METHOD_REQUIRED_MESSAGE,
    reference_no: findReferenceError(formValues),
    remarks: findRemarksError(formValues?.remarks),
  }
  return Object.fromEntries(
    Object.entries(fieldMessages)
      .filter(([, fieldMessage]) => fieldMessage !== '')
      .map(([fieldKey, fieldMessage]) => [fieldKey, [fieldMessage]]),
  )
}

export function buildPaymentPayload(formValues, assessmentId) {
  return {
    assessment_id: Number(assessmentId),
    amount: formatCentsAsAmount(toCents(formValues?.amount)),
    payment_date: formValues?.payment_date,
    method: formValues?.method,
    reference_no: toNullableText(formValues?.reference_no),
    remarks: toNullableText(formValues?.remarks),
  }
}

export function findVoidReasonError(reasonText) {
  const trimmedReason = toTrimmedText(reasonText)
  if (trimmedReason === '') return VOID_REASON_REQUIRED_MESSAGE
  if (trimmedReason.length > VOID_REASON_MAX_LENGTH) return VOID_REASON_LENGTH_MESSAGE
  return ''
}
