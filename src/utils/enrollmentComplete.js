import { buildSectionOptionLabel, isTermRequired } from '@/utils/enrollmentForm.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

const SECTION_REQUIRED_MESSAGE = 'Section is required.'
const TERM_REQUIRED_MESSAGE = 'Term is required for SHS and college sections.'
const NO_RECORDS_TEXT = 'No enrolled records to close.'
const ONE_RECORD_TEXT = '1 enrolled record'
const CONFIRM_TITLE = 'Complete section'
const CONFIRM_LABEL = 'Complete'
const WHOLE_YEAR_PERIOD = 'the whole school year'

export function createCompleteForm(sectionId, termId) {
  return { section_id: toIdText(sectionId), term_id: toIdText(termId) }
}

export function findCompleteFormErrors(formValues, section) {
  const formErrors = {}
  if (toRecordId(formValues?.section_id) === null) formErrors.section_id = [SECTION_REQUIRED_MESSAGE]
  if (isTermRequired(section) && toRecordId(formValues?.term_id) === null) formErrors.term_id = [TERM_REQUIRED_MESSAGE]
  return formErrors
}

export function buildCompletePayload(formValues, section) {
  if (!isTermRequired(section)) return {}
  return { term_id: toRecordId(formValues?.term_id) }
}

export function getCompleteCount(section, termId) {
  if (!Number.isInteger(section?.enrolled_count)) return null
  if (isTermRequired(section) && toRecordId(termId) === null) return null
  return section.enrolled_count
}

function buildRecordText(recordCount) {
  if (recordCount === 1) return ONE_RECORD_TEXT
  return `${recordCount} enrolled records`
}

export function buildCompleteCountText(recordCount) {
  if (recordCount === null) return ''
  if (recordCount === 0) return NO_RECORDS_TEXT
  return `${buildRecordText(recordCount)} will be closed.`
}

export function buildCompleteConfirm(section, term) {
  if (section === null || typeof section !== 'object') return null
  const sectionLabel = buildSectionOptionLabel({ ...section, enrolled_count: null }, '')
  const hasTerm = isTermRequired(section) && term !== null && typeof term === 'object'
  const periodText = hasTerm ? `the ${term.label}` : WHOLE_YEAR_PERIOD
  const recordText = buildRecordText(section.enrolled_count)
  return {
    title: CONFIRM_TITLE,
    confirmLabel: CONFIRM_LABEL,
    message: `Close ${recordText} of ${sectionLabel} for ${periodText} as completed? Closed records cannot be changed.`,
  }
}

export function buildClosedCountText(completeResponse) {
  const completedCount = completeResponse?.completed_count
  const countValue = Number.isInteger(completedCount) ? completedCount : 0
  if (countValue === 1) return 'Closed 1 enrollment record.'
  return `Closed ${countValue} enrollment records.`
}
