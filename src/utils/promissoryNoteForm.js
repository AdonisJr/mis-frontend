import { toCents, formatCentsAsAmount, formatPesoFromCents } from '@/utils/moneyDisplay.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const NOTE_REMARKS_MAX_LENGTH = 500
export const CANCEL_REASON_MAX_LENGTH = 500

export const SCHOOL_YEAR_REQUIRED_MESSAGE = 'Choose the school year with the balance.'
export const PROMISED_AMOUNT_INVALID_MESSAGE = 'Enter an amount greater than zero with up to 2 decimals.'
export const PROMISE_DATE_INVALID_MESSAGE = 'Enter a valid date.'
export const PROMISE_DATE_PAST_MESSAGE = 'The promise date cannot be before today.'
export const NOTE_REMARKS_LENGTH_MESSAGE = `Remarks must be at most ${NOTE_REMARKS_MAX_LENGTH} characters.`
export const CANCEL_REASON_REQUIRED_MESSAGE = 'Enter the reason for cancelling.'
export const CANCEL_REASON_LENGTH_MESSAGE = `The reason must be at most ${CANCEL_REASON_MAX_LENGTH} characters.`

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function toNullableText(fieldValue) {
  const trimmedText = toTrimmedText(fieldValue)
  return trimmedText === '' ? null : trimmedText
}

function buildOverBalanceMessage(maxCents) {
  return `The promised amount cannot exceed the balance of ${formatPesoFromCents(maxCents)}.`
}

export function findBalanceYear(balanceYears, schoolYearId) {
  if (!Array.isArray(balanceYears)) return null
  const yearId = toRecordId(schoolYearId)
  if (yearId === null) return null
  return balanceYears.find((balanceYear) => balanceYear?.school_year?.id === yearId) ?? null
}

function buildBalanceAmountText(balanceYears, schoolYearId) {
  const balanceCents = toCents(findBalanceYear(balanceYears, schoolYearId)?.balance)
  return balanceCents === null ? '' : formatCentsAsAmount(balanceCents)
}

export function createNoteForm(balanceYears, schoolYearId) {
  return {
    school_year_id: toIdText(schoolYearId),
    promised_amount: buildBalanceAmountText(balanceYears, schoolYearId),
    promise_date: '',
    remarks: '',
  }
}

export function applyNoteYearChange(formValues, balanceYears) {
  return {
    ...formValues,
    promised_amount: buildBalanceAmountText(balanceYears, formValues?.school_year_id),
  }
}

export function buildNoteRules(balanceText, todayIso) {
  return { maxCents: toCents(balanceText), minDate: todayIso }
}

function findAmountError(amountText, maxCents) {
  const amountCents = toCents(amountText)
  if (amountCents === null || amountCents === 0) return PROMISED_AMOUNT_INVALID_MESSAGE
  if (maxCents !== null && amountCents > maxCents) return buildOverBalanceMessage(maxCents)
  return ''
}

function findDateError(dateText, minDate) {
  if (typeof dateText !== 'string' || !ISO_DATE_PATTERN.test(dateText)) return PROMISE_DATE_INVALID_MESSAGE
  if (dateText < minDate) return PROMISE_DATE_PAST_MESSAGE
  return ''
}

function findRemarksError(remarksValue) {
  if (toTrimmedText(remarksValue).length > NOTE_REMARKS_MAX_LENGTH) return NOTE_REMARKS_LENGTH_MESSAGE
  return ''
}

export function findNoteFormErrors(formValues, noteRules) {
  const fieldMessages = {
    school_year_id: toRecordId(formValues?.school_year_id) === null ? SCHOOL_YEAR_REQUIRED_MESSAGE : '',
    promised_amount: findAmountError(formValues?.promised_amount, noteRules?.maxCents ?? null),
    promise_date: findDateError(formValues?.promise_date, noteRules?.minDate ?? ''),
    remarks: findRemarksError(formValues?.remarks),
  }
  return Object.fromEntries(
    Object.entries(fieldMessages)
      .filter(([, fieldMessage]) => fieldMessage !== '')
      .map(([fieldKey, fieldMessage]) => [fieldKey, [fieldMessage]]),
  )
}

export function buildNotePayload(formValues, studentId) {
  return {
    student_id: Number(studentId),
    school_year_id: toRecordId(formValues?.school_year_id),
    promised_amount: formatCentsAsAmount(toCents(formValues?.promised_amount)),
    promise_date: formValues?.promise_date,
    remarks: toNullableText(formValues?.remarks),
  }
}

export function findCancelReasonError(reasonText) {
  const trimmedReason = toTrimmedText(reasonText)
  if (trimmedReason === '') return CANCEL_REASON_REQUIRED_MESSAGE
  if (trimmedReason.length > CANCEL_REASON_MAX_LENGTH) return CANCEL_REASON_LENGTH_MESSAGE
  return ''
}
