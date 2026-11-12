import { TERM_COUNT_BY_TYPE, buildTermLabel } from '@/utils/termDisplay.js'

export const TERM_FIELD_LABELS = Object.freeze({
  term_number: 'Term',
  start_date: 'Start date',
  end_date: 'End date',
})

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TERM_NUMBER_MESSAGE = 'Choose a term for this school year.'
const START_DATE_REQUIRED_MESSAGE = 'Start date is required.'
const END_DATE_REQUIRED_MESSAGE = 'End date is required.'
const END_BEFORE_START_MESSAGE = 'End date must be after the start date.'
const START_OUTSIDE_YEAR_MESSAGE = 'Start date must be within the school year.'
const END_OUTSIDE_YEAR_MESSAGE = 'End date must be within the school year.'
const TERM_NUMBER_USED_MESSAGE = 'This term already exists in this school year.'

function toTermNumber(fieldValue) {
  return Number.parseInt(String(fieldValue ?? ''), 10)
}

function toDateText(fieldValue) {
  if (typeof fieldValue !== 'string') return ''
  return fieldValue.trim()
}

function isIsoDate(dateText) {
  return ISO_DATE_PATTERN.test(dateText)
}

function isOverlapping(formValues, otherTerm) {
  const startDate = toDateText(formValues?.start_date)
  const endDate = toDateText(formValues?.end_date)
  return startDate <= otherTerm.end_date && otherTerm.start_date <= endDate
}

function buildEarlierConflictMessage(formValues, earlierTerm) {
  if (isOverlapping(formValues, earlierTerm)) return `The term overlaps the ${earlierTerm.label}.`
  return `The term must start after the ${earlierTerm.label} ends.`
}

function buildLaterConflictMessage(formValues, laterTerm) {
  if (isOverlapping(formValues, laterTerm)) return `The term overlaps the ${laterTerm.label}.`
  return `The term must end before the ${laterTerm.label} starts.`
}

export function getAllowedTermNumbers(termType) {
  if (!Object.hasOwn(TERM_COUNT_BY_TYPE, termType)) return []
  return Array.from({ length: TERM_COUNT_BY_TYPE[termType] }, (_unused, index) => index + 1)
}

export function getTermNumberOptions(termType) {
  return getAllowedTermNumbers(termType).map((termNumber) => ({
    value: termNumber,
    label: buildTermLabel(termType, termNumber),
  }))
}

export function createEmptyTermForm() {
  return { term_number: '', start_date: '', end_date: '' }
}

export function buildFormFromTerm(term) {
  if (term === null || typeof term !== 'object') return createEmptyTermForm()
  return {
    term_number: term.term_number ?? '',
    start_date: term.start_date ?? '',
    end_date: term.end_date ?? '',
  }
}

export function listOtherTerms(terms, editingTerm) {
  if (!Array.isArray(terms)) return []
  return terms.filter((term) => term.id !== editingTerm?.id)
}

export function findTermFormErrors(formValues, schoolYear) {
  const formErrors = {}
  const termNumber = toTermNumber(formValues?.term_number)
  const startDate = toDateText(formValues?.start_date)
  const endDate = toDateText(formValues?.end_date)
  if (!getAllowedTermNumbers(schoolYear?.term_type).includes(termNumber)) formErrors.term_number = [TERM_NUMBER_MESSAGE]
  if (!isIsoDate(startDate)) formErrors.start_date = [START_DATE_REQUIRED_MESSAGE]
  if (!isIsoDate(endDate)) formErrors.end_date = [END_DATE_REQUIRED_MESSAGE]
  if (formErrors.start_date || formErrors.end_date) return formErrors
  if (startDate < schoolYear?.start_date) formErrors.start_date = [START_OUTSIDE_YEAR_MESSAGE]
  if (endDate <= startDate) formErrors.end_date = [END_BEFORE_START_MESSAGE]
  if (!formErrors.end_date && endDate > schoolYear?.end_date) formErrors.end_date = [END_OUTSIDE_YEAR_MESSAGE]
  return formErrors
}

export function findTermConflictErrors(formValues, otherTerms) {
  if (!Array.isArray(otherTerms)) return {}
  const termNumber = toTermNumber(formValues?.term_number)
  const startDate = toDateText(formValues?.start_date)
  const endDate = toDateText(formValues?.end_date)
  // the backend checks the order rules only when term_number itself is valid
  if (otherTerms.some((otherTerm) => otherTerm.term_number === termNumber)) {
    return { term_number: [TERM_NUMBER_USED_MESSAGE] }
  }
  const conflictErrors = {}
  const earlierTerm = otherTerms.find(
    (otherTerm) => otherTerm.term_number < termNumber && startDate <= otherTerm.end_date,
  )
  const laterTerm = otherTerms.find((otherTerm) => otherTerm.term_number > termNumber && endDate >= otherTerm.start_date)
  if (earlierTerm) conflictErrors.start_date = [buildEarlierConflictMessage(formValues, earlierTerm)]
  if (laterTerm) conflictErrors.end_date = [buildLaterConflictMessage(formValues, laterTerm)]
  return conflictErrors
}

export function buildTermPayload(formValues) {
  return {
    term_number: toTermNumber(formValues?.term_number),
    start_date: toDateText(formValues?.start_date),
    end_date: toDateText(formValues?.end_date),
  }
}
