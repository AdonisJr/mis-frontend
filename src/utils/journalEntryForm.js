import { createEmptyJournalLine, createStartingLines, findJournalLinesErrors, JOURNAL_LINES_MIN } from '@/utils/journalLineGrid.js'
import { formatCentsAsAmount, toCents } from '@/utils/moneyDisplay.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const JOURNAL_DESCRIPTION_MAX_LENGTH = 500
export const JOURNAL_REFERENCE_MAX_LENGTH = 100

export const JOURNAL_FIELD_LABELS = Object.freeze({
  entry_date: 'Date',
  description: 'Description',
  reference: 'Reference',
})

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_INVALID_MESSAGE = 'Enter a valid date.'
const DATE_FUTURE_MESSAGE = 'The date cannot be in the future.'
const DESCRIPTION_REQUIRED_MESSAGE = 'Description is required.'
const DESCRIPTION_TOO_LONG_MESSAGE = `The description must be at most ${JOURNAL_DESCRIPTION_MAX_LENGTH} characters.`
const REFERENCE_TOO_LONG_MESSAGE = `The reference must be at most ${JOURNAL_REFERENCE_MAX_LENGTH} characters.`
const ZERO_AMOUNT = '0.00'

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function isRealIsoDate(dateText) {
  if (!ISO_DATE_PATTERN.test(dateText)) return false
  const parsedDate = new Date(`${dateText}T00:00:00Z`)
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(dateText)
}

export function createEmptyJournalEntryForm(todayIso) {
  return { entry_date: todayIso, description: '', reference: '', lines: createStartingLines() }
}

function buildSideText(amountText) {
  const amountCents = toCents(amountText)
  if (amountCents === null || amountCents === 0) return ''
  return String(amountText)
}

function buildFormLine(storedLine) {
  return {
    account_id: toIdText(storedLine?.account?.id),
    debit: buildSideText(storedLine?.debit),
    credit: buildSideText(storedLine?.credit),
    memo: storedLine?.memo ?? '',
  }
}

export function buildFormFromJournalEntry(journalEntry) {
  const formLines = (journalEntry?.lines ?? []).map(buildFormLine)
  while (formLines.length < JOURNAL_LINES_MIN) formLines.push(createEmptyJournalLine())
  return {
    entry_date: journalEntry?.entry_date ?? '',
    description: journalEntry?.description ?? '',
    reference: journalEntry?.reference ?? '',
    lines: formLines,
  }
}

function findDateError(dateValue, todayIso) {
  const dateText = toTrimmedText(dateValue)
  if (!isRealIsoDate(dateText)) return DATE_INVALID_MESSAGE
  return dateText > todayIso ? DATE_FUTURE_MESSAGE : ''
}

function findDescriptionError(descriptionValue) {
  const descriptionText = toTrimmedText(descriptionValue)
  if (descriptionText === '') return DESCRIPTION_REQUIRED_MESSAGE
  return descriptionText.length > JOURNAL_DESCRIPTION_MAX_LENGTH ? DESCRIPTION_TOO_LONG_MESSAGE : ''
}

function findReferenceError(referenceValue) {
  return toTrimmedText(referenceValue).length > JOURNAL_REFERENCE_MAX_LENGTH ? REFERENCE_TOO_LONG_MESSAGE : ''
}

export function findJournalEntryFormErrors(formValues, todayIso) {
  const headerMessages = {
    entry_date: findDateError(formValues?.entry_date, todayIso),
    description: findDescriptionError(formValues?.description),
    reference: findReferenceError(formValues?.reference),
  }
  const formErrors = {}
  for (const [fieldKey, message] of Object.entries(headerMessages)) {
    if (message !== '') formErrors[fieldKey] = [message]
  }
  return { ...formErrors, ...findJournalLinesErrors(formValues?.lines) }
}

function buildSideAmount(amountText) {
  return formatCentsAsAmount(toCents(amountText) ?? 0) || ZERO_AMOUNT
}

function buildPayloadLine(formLine) {
  const memoText = toTrimmedText(formLine.memo)
  return {
    account_id: toRecordId(formLine.account_id),
    debit: buildSideAmount(formLine.debit),
    credit: buildSideAmount(formLine.credit),
    memo: memoText === '' ? null : memoText,
  }
}

export function buildJournalEntryPayload(formValues) {
  const referenceText = toTrimmedText(formValues.reference)
  return {
    entry_date: toTrimmedText(formValues.entry_date),
    description: toTrimmedText(formValues.description),
    reference: referenceText === '' ? null : referenceText,
    lines: formValues.lines.map(buildPayloadLine),
  }
}
