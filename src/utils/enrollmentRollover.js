import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { isTermRequired } from '@/utils/enrollmentForm.js'
import { toRecordId } from '@/utils/sectionForm.js'

export const NO_NEXT_TERM_MESSAGE =
  'No next term: this is the last term of the school year, or its next term has not been added yet.'
export const NOTHING_TICKED_MESSAGE = 'Tick at least one student to roll over.'
export const ALREADY_ENROLLED_FALLBACK = 'Already enrolled in the next term.'

const FULL_TEXT = 'Full'
const SEAT_LEFT_TEXT = '1 seat left'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function listRolloverSections(sections) {
  if (!Array.isArray(sections)) return []
  return sections.filter((section) => isTermRequired(section))
}

export function pickListedRecordId(records, recordId) {
  const listedId = toRecordId(recordId)
  if (!Array.isArray(records) || listedId === null) return ''
  return records.some((record) => record.id === listedId) ? String(listedId) : ''
}

function buildPreviewRow(enrollment) {
  const isLocked = enrollment.is_enrolled_in_target === true
  return {
    id: enrollment.id,
    studentName: formatEnrollmentStudentName(enrollment.student),
    lrn: enrollment.student?.lrn ?? '',
    isLocked,
    lockReason: isLocked ? (enrollment.skip_reason ?? ALREADY_ENROLLED_FALLBACK) : '',
  }
}

export function normalizeRolloverPreview(previewResponse) {
  const enrollments = previewResponse?.enrollments
  const seatsLeft = previewResponse?.seats_left
  return {
    targetTerm: isRecordObject(previewResponse?.target_term) ? previewResponse.target_term : null,
    seatsLeft: Number.isInteger(seatsLeft) ? seatsLeft : null,
    rows: Array.isArray(enrollments) ? enrollments.map(buildPreviewRow) : [],
  }
}

export function createRolloverSelection(rows) {
  return rows.filter((row) => !row.isLocked).map((row) => row.id)
}

export function toggleRolloverSelection(selectedIds, row) {
  if (row.isLocked) return selectedIds
  if (selectedIds.includes(row.id)) return selectedIds.filter((selectedId) => selectedId !== row.id)
  return [...selectedIds, row.id]
}

export function findRolloverBlockReason(preview, selectedIds) {
  if (preview === null) return ''
  if (preview.targetTerm === null) return NO_NEXT_TERM_MESSAGE
  if (selectedIds.length === 0) return NOTHING_TICKED_MESSAGE
  if (Number.isInteger(preview.seatsLeft) && selectedIds.length > preview.seatsLeft) {
    return `Too many students ticked: ${selectedIds.length} ticked, ${preview.seatsLeft} seats left. Untick students to continue.`
  }
  return ''
}

export function buildRolloverPayload(termId, selectedIds) {
  return { term_id: toRecordId(termId), enrollment_ids: [...selectedIds] }
}

function buildSkippedRow(skippedEnrollment) {
  return {
    id: skippedEnrollment.student?.id,
    studentName: formatEnrollmentStudentName(skippedEnrollment.student),
    reason: skippedEnrollment.skip_reason ?? ALREADY_ENROLLED_FALLBACK,
  }
}

function buildCopiedText(copiedCount) {
  const countValue = Number.isInteger(copiedCount) ? copiedCount : 0
  if (countValue === 1) return '1 student rolled over.'
  return `${countValue} students rolled over.`
}

export function normalizeRolloverResult(rolloverResponse) {
  const skipped = rolloverResponse?.skipped
  return {
    copiedText: buildCopiedText(rolloverResponse?.copied_count),
    skipped: Array.isArray(skipped) ? skipped.map(buildSkippedRow) : [],
  }
}

export function buildSeatsLeftText(seatsLeft) {
  if (!Number.isInteger(seatsLeft)) return ''
  if (seatsLeft === 0) return FULL_TEXT
  if (seatsLeft === 1) return SEAT_LEFT_TEXT
  return `${seatsLeft} seats left`
}
