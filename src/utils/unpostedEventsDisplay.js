import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'

export const UNPOSTED_EVENT_COLUMNS = Object.freeze(
  [
    { key: 'type', label: 'Event' },
    { key: 'date', label: 'Date' },
    { key: 'student', label: 'Student' },
    { key: 'amount', label: 'Amount' },
    { key: 'reason', label: 'Reason' },
  ].map((column) => Object.freeze(column)),
)

export const UNPOSTED_TYPE_LABELS = Object.freeze({
  assessment: 'Assessment',
  assessment_reversal: 'Re-assessment reversal',
  payment: 'Payment',
  payment_void: 'Payment void',
})

export const UNPOSTED_REASON_LABELS = Object.freeze({
  mapping_missing: 'Account mapping missing',
  account_inactive: 'Mapped account inactive',
  not_posted: 'Not posted yet',
  amount_over_limit: 'Amount above limit',
  posting_refused: 'Refused by the journal',
  unexpected_error: 'Unexpected error',
})

export const ALL_POSTED_TEXT = 'Everything is posted. No billing events are waiting.'
export const POST_PENDING_TITLE = 'Post pending events'
export const POST_PENDING_CONFIRM_MESSAGE =
  'Post all pending billing events to the journal? Each posts with its own historical date.'
export const NOTHING_TO_POST_TEXT = 'Nothing to post.'

export const TOAST_KIND_SUCCESS = 'success'
export const TOAST_KIND_WARNING = 'warning'
export const TOAST_KIND_ERROR = 'error'
export const TOAST_KIND_INFO = 'info'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function formatUnpostedType(eventType) {
  if (typeof eventType !== 'string') return ''
  return UNPOSTED_TYPE_LABELS[eventType] ?? eventType
}

export function formatUnpostedReason(unpostedEvent) {
  const reasonCode = unpostedEvent?.reason
  if (Object.hasOwn(UNPOSTED_REASON_LABELS, reasonCode)) return UNPOSTED_REASON_LABELS[reasonCode]
  return unpostedEvent?.reason_message || reasonCode || ''
}

export function buildUnpostedRows(unpostedEvents) {
  if (!Array.isArray(unpostedEvents)) return []
  return unpostedEvents.map((unpostedEvent) => ({
    key: `${unpostedEvent.type}-${unpostedEvent.source_id}`,
    type: formatUnpostedType(unpostedEvent.type),
    date: formatDisplayDate(unpostedEvent.date),
    student: formatEnrollmentStudentName(unpostedEvent.student),
    amount: formatPeso(unpostedEvent.amount),
    reason: formatUnpostedReason(unpostedEvent),
  }))
}

function readFailures(postPendingResponse) {
  const failures = isRecordObject(postPendingResponse) ? postPendingResponse.failures : null
  return Array.isArray(failures) ? failures : []
}

function readCount(postPendingResponse, countKey) {
  const count = isRecordObject(postPendingResponse) ? postPendingResponse[countKey] : 0
  return Number.isInteger(count) && count > 0 ? count : 0
}

function readFailedCount(postPendingResponse) {
  return Math.max(readCount(postPendingResponse, 'failed_count'), readFailures(postPendingResponse).length)
}

function buildPostedText(postedCount, failedCount) {
  if (postedCount === 0 && failedCount === 0) return NOTHING_TO_POST_TEXT
  if (postedCount === 0) return ''
  return postedCount === 1 ? 'Posted 1 event.' : `Posted ${postedCount} events.`
}

function buildFailedLine(failedRow) {
  return { key: failedRow.key, text: `${failedRow.type} · ${failedRow.date} · ${failedRow.student} — ${failedRow.reason}` }
}

export function buildPostPendingSummary(postPendingResponse) {
  const postedCount = readCount(postPendingResponse, 'posted_count')
  const failedCount = readFailedCount(postPendingResponse)
  const failedLines = buildUnpostedRows(readFailures(postPendingResponse)).map(buildFailedLine)
  return {
    postedText: buildPostedText(postedCount, failedCount),
    failedText: failedCount === 0 ? '' : `${failedCount} could not be posted:`,
    failedLines,
  }
}

export function pickPostPendingToastKind(postPendingResponse) {
  const postedCount = readCount(postPendingResponse, 'posted_count')
  const hasFailures = readFailedCount(postPendingResponse) > 0
  if (postedCount > 0) return hasFailures ? TOAST_KIND_WARNING : TOAST_KIND_SUCCESS
  return hasFailures ? TOAST_KIND_ERROR : TOAST_KIND_INFO
}
