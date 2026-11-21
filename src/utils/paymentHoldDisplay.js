import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatTimestampDate } from '@/utils/assessmentDisplay.js'
import { formatPeso, toCents } from '@/utils/moneyDisplay.js'
import { isFullyPaid } from '@/utils/paymentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const NOTE_STATUS_NONE = 'none'
export const NOTE_STATUS_ACTIVE = 'active'
export const NOTE_STATUS_BROKEN = 'broken'
export const NOTE_STATUS_SETTLED = 'settled'
export const NOTE_STATUS_CANCELLED = 'cancelled'

export const NOTE_STATUS_OPTIONS = Object.freeze(
  [
    { value: NOTE_STATUS_NONE, label: 'None' },
    { value: NOTE_STATUS_ACTIVE, label: 'Active' },
    { value: NOTE_STATUS_BROKEN, label: 'Broken' },
    { value: NOTE_STATUS_SETTLED, label: 'Settled' },
    { value: NOTE_STATUS_CANCELLED, label: 'Cancelled' },
  ].map((statusOption) => Object.freeze(statusOption)),
)

const NEUTRAL_CHIP_CLASS = 'bg-slate-200 text-slate-700'
export const NOTE_STATUS_CHIPS = Object.freeze({
  [NOTE_STATUS_NONE]: Object.freeze({ label: 'None', colorClass: 'bg-amber-100 text-amber-800' }),
  [NOTE_STATUS_ACTIVE]: Object.freeze({ label: 'Active', colorClass: 'bg-green-100 text-green-800' }),
  [NOTE_STATUS_BROKEN]: Object.freeze({ label: 'Broken', colorClass: 'bg-red-100 text-red-800' }),
  [NOTE_STATUS_SETTLED]: Object.freeze({ label: 'Settled', colorClass: NEUTRAL_CHIP_CLASS }),
  [NOTE_STATUS_CANCELLED]: Object.freeze({ label: 'Cancelled', colorClass: NEUTRAL_CHIP_CLASS }),
})

export const HOLD_NOTICE_TITLE = 'Payment hold'
export const REGISTRAR_HOLD_TEXT = 'Ask the cashier or admin for a promissory note.'
export const ALLOWED_SUMMARY_TEXT = 'Earlier balances do not block this enrollment.'

export const HOLD_COLUMNS = Object.freeze(
  [
    { key: 'student', label: 'Student' },
    { key: 'lrn', label: 'LRN' },
    { key: 'school_year', label: 'School year' },
    { key: 'balance', label: 'Balance' },
    { key: 'note_status', label: 'Note status' },
    { key: 'promise_date', label: 'Promise date' },
    { key: 'promised_amount', label: 'Promised amount' },
    { key: 'granted_by', label: 'Granted by' },
  ].map((column) => Object.freeze(column)),
)

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function isNoteCancelled(note) {
  return typeof note?.cancelled_at === 'string' && note.cancelled_at !== ''
}

export function buildNoteStatusRule(balanceText, todayIso) {
  return { isYearPaid: toCents(balanceText) === 0, todayIso }
}

export function derivePromissoryNoteStatus(note, statusRule) {
  if (!isRecordObject(note)) return NOTE_STATUS_NONE
  if (isNoteCancelled(note)) return NOTE_STATUS_CANCELLED
  if (statusRule?.isYearPaid === true) return NOTE_STATUS_SETTLED
  if (note.promise_date >= statusRule?.todayIso) return NOTE_STATUS_ACTIVE
  return NOTE_STATUS_BROKEN
}

export function getNoteStatusChip(status) {
  return NOTE_STATUS_CHIPS[status] ?? NOTE_STATUS_CHIPS[NOTE_STATUS_NONE]
}

function buildCoverText(activeNote) {
  if (!isRecordObject(activeNote)) return ''
  return `Covered by a promissory note until ${formatDisplayDate(activeNote.promise_date)}.`
}

function buildHoldNoticeRow(unpaidYear) {
  return {
    key: unpaidYear?.school_year?.id,
    schoolYearId: unpaidYear?.school_year?.id,
    schoolYearText: unpaidYear?.school_year?.name ?? NO_VALUE_LABEL,
    balance: unpaidYear?.balance,
    balanceText: formatPeso(unpaidYear?.balance),
    isCovered: isRecordObject(unpaidYear?.active_note),
    coverText: buildCoverText(unpaidYear?.active_note),
  }
}

export function buildHoldNoticeRows(unpaidYears) {
  if (!Array.isArray(unpaidYears)) return []
  return unpaidYears.map(buildHoldNoticeRow)
}

export function buildHoldNoticeSummary(noticeRows, isOnHold) {
  if (!Array.isArray(noticeRows) || noticeRows.length === 0) return ''
  if (!isOnHold) return ALLOWED_SUMMARY_TEXT
  const uncoveredCount = noticeRows.filter((noticeRow) => !noticeRow.isCovered).length
  if (uncoveredCount > 1) {
    return `This student has unpaid balances from ${uncoveredCount} earlier school years and cannot be enrolled.`
  }
  return 'This student has an unpaid balance from an earlier school year and cannot be enrolled.'
}

export function listGrantableYears(unpaidYears) {
  if (!Array.isArray(unpaidYears)) return []
  return unpaidYears
    .filter((unpaidYear) => !isRecordObject(unpaidYear?.active_note))
    .map((unpaidYear) => ({ school_year: unpaidYear.school_year, balance: unpaidYear.balance }))
}

export function buildLedgerHoldBannerText(balanceText, activeNote) {
  if (toCents(balanceText) === null || isFullyPaid(balanceText)) return ''
  const balancePeso = formatPeso(balanceText)
  if (!isRecordObject(activeNote)) return `Balance ${balancePeso} holds enrollment into later school years.`
  const untilText = formatDisplayDate(activeNote.promise_date)
  return `Balance ${balancePeso} is covered by a promissory note until ${untilText}. The hold returns after that date.`
}

function buildCancelText(note) {
  if (!isNoteCancelled(note)) return ''
  return `Cancelled by ${note.cancelled_by?.name ?? NO_VALUE_LABEL}: ${note.cancel_reason}`
}

function buildNoteRow(noteEntry, statusRule) {
  const status = derivePromissoryNoteStatus(noteEntry, statusRule)
  const remarksText = typeof noteEntry?.remarks === 'string' ? noteEntry.remarks.trim() : ''
  return {
    key: noteEntry?.id,
    note: noteEntry,
    status,
    statusChip: getNoteStatusChip(status),
    promisedText: formatPeso(noteEntry?.promised_amount),
    promiseDateText: formatDisplayDate(noteEntry?.promise_date),
    remarksText: remarksText === '' ? NO_VALUE_LABEL : remarksText,
    grantedText: `${noteEntry?.granted_by?.name ?? NO_VALUE_LABEL} · ${formatTimestampDate(noteEntry?.granted_at)}`,
    cancelText: buildCancelText(noteEntry),
  }
}

export function buildNoteRows(notes, statusRule) {
  if (!Array.isArray(notes)) return []
  return notes.map((noteEntry) => buildNoteRow(noteEntry, statusRule))
}

export function findActiveNote(noteRows) {
  if (!Array.isArray(noteRows)) return null
  return noteRows.find((noteRow) => noteRow.status === NOTE_STATUS_ACTIVE)?.note ?? null
}

export function isNoteCancellable(note) {
  return isRecordObject(note) && !isNoteCancelled(note)
}

export function buildCancelPromptText(note) {
  if (!isRecordObject(note)) return ''
  const promisedPeso = formatPeso(note.promised_amount)
  return `Cancel the promissory note for ${promisedPeso} due ${formatDisplayDate(note.promise_date)}? The note stays on record as cancelled.`
}
