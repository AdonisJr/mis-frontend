export const REVERSAL_REASON_MAX_LENGTH = 500

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const REASON_REQUIRED_MESSAGE = 'Enter the reason for reversing.'
const REASON_TOO_LONG_MESSAGE = `The reason must be at most ${REVERSAL_REASON_MAX_LENGTH} characters.`
const DATE_INVALID_MESSAGE = 'Enter a valid date.'
const DATE_BEFORE_ENTRY_MESSAGE = 'The reversal date cannot be before the entry date.'
const DATE_FUTURE_MESSAGE = 'The reversal date cannot be in the future.'

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function isRealIsoDate(dateText) {
  if (!ISO_DATE_PATTERN.test(dateText)) return false
  const parsedDate = new Date(`${dateText}T00:00:00Z`)
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(dateText)
}

export function createReverseForm(todayIso) {
  return { reason: '', date: todayIso }
}

export function buildReverseRules(entryDate, todayIso) {
  return { minDate: entryDate, maxDate: todayIso }
}

function findReasonError(reasonValue) {
  const reasonText = toTrimmedText(reasonValue)
  if (reasonText === '') return REASON_REQUIRED_MESSAGE
  return reasonText.length > REVERSAL_REASON_MAX_LENGTH ? REASON_TOO_LONG_MESSAGE : ''
}

function findDateError(dateValue, reverseRules) {
  const dateText = toTrimmedText(dateValue)
  if (!isRealIsoDate(dateText)) return DATE_INVALID_MESSAGE
  if (dateText < reverseRules.minDate) return DATE_BEFORE_ENTRY_MESSAGE
  return dateText > reverseRules.maxDate ? DATE_FUTURE_MESSAGE : ''
}

export function findReverseFormErrors(formValues, reverseRules) {
  const reverseErrors = {}
  const reasonError = findReasonError(formValues?.reason)
  const dateError = findDateError(formValues?.date, reverseRules)
  if (reasonError !== '') reverseErrors.reason = [reasonError]
  if (dateError !== '') reverseErrors.date = [dateError]
  return reverseErrors
}

export function buildReversePayload(formValues) {
  return { reason: toTrimmedText(formValues.reason), date: toTrimmedText(formValues.date) }
}
