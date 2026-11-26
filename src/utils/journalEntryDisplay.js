import { PAYMENT_RECEIPT_ROUTE_NAME, STATEMENT_OF_ACCOUNT_ROUTE_NAME } from '@/routeNames.js'
import { compareAccountCodes } from '@/utils/accountDisplay.js'
import { formatPesoFromCents, toCents } from '@/utils/moneyDisplay.js'

export const JOURNAL_STATUS_DRAFT = 'draft'
export const INACTIVE_SUFFIX = ' (inactive)'
export const JOURNAL_SOURCE_MANUAL = 'manual'
export const JOURNAL_SOURCE_ASSESSMENT = 'assessment'
export const JOURNAL_SOURCE_PAYMENT = 'payment'

const BILLING_SOURCES = Object.freeze([JOURNAL_SOURCE_ASSESSMENT, JOURNAL_SOURCE_PAYMENT])

export const JOURNAL_ENTRY_COLUMNS = Object.freeze(
  [
    { key: 'number', label: 'Number' },
    { key: 'entry_date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'reference', label: 'Reference' },
    { key: 'source', label: 'Source' },
    { key: 'debit_total', label: 'Total' },
    { key: 'display_status', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

export const JOURNAL_LINE_COLUMNS = Object.freeze(
  [
    { key: 'account', label: 'Account' },
    { key: 'memo', label: 'Memo' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
  ].map((column) => Object.freeze(column)),
)

export const JOURNAL_STATUS_CHIPS = Object.freeze({
  draft: Object.freeze({ label: 'Draft', colorClass: 'bg-slate-200 text-slate-700' }),
  posted: Object.freeze({ label: 'Posted', colorClass: 'bg-green-100 text-green-800' }),
  reversed: Object.freeze({ label: 'Reversed', colorClass: 'bg-red-100 text-red-800' }),
  reversal: Object.freeze({ label: 'Reversal', colorClass: 'bg-amber-100 text-amber-800' }),
})

const ACCENT_CHIP_CLASS = 'bg-accent-soft text-accent'

export const JOURNAL_SOURCE_CHIPS = Object.freeze({
  [JOURNAL_SOURCE_MANUAL]: Object.freeze({ label: 'Manual', colorClass: 'bg-slate-200 text-slate-700' }),
  [JOURNAL_SOURCE_ASSESSMENT]: Object.freeze({ label: 'Assessment', colorClass: ACCENT_CHIP_CLASS }),
  [JOURNAL_SOURCE_PAYMENT]: Object.freeze({ label: 'Payment', colorClass: ACCENT_CHIP_CLASS }),
})

const SOURCE_LINK_TARGETS = Object.freeze({
  [JOURNAL_SOURCE_ASSESSMENT]: Object.freeze({
    label: 'Open statement of account',
    routeName: STATEMENT_OF_ACCOUNT_ROUTE_NAME,
    paramKey: 'assessmentId',
  }),
  [JOURNAL_SOURCE_PAYMENT]: Object.freeze({
    label: 'Open receipt',
    routeName: PAYMENT_RECEIPT_ROUTE_NAME,
    paramKey: 'paymentId',
  }),
})

const REVERSAL_OF_LABEL = 'Reversal of'
const REVERSED_BY_LABEL = 'Reversed by'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function formatJournalNumber(journalEntry) {
  const entryNumber = journalEntry?.number
  if (typeof entryNumber === 'string' && entryNumber !== '') return entryNumber
  return `Draft #${journalEntry?.id}`
}

export function getJournalStatusChip(displayStatus) {
  if (typeof displayStatus !== 'string') return null
  return Object.hasOwn(JOURNAL_STATUS_CHIPS, displayStatus) ? JOURNAL_STATUS_CHIPS[displayStatus] : null
}

export function getJournalSourceChip(source) {
  if (typeof source !== 'string') return null
  return Object.hasOwn(JOURNAL_SOURCE_CHIPS, source) ? JOURNAL_SOURCE_CHIPS[source] : null
}

export function isBillingEntry(journalEntry) {
  return BILLING_SOURCES.includes(journalEntry?.source)
}

export function isJournalDraft(journalEntry) {
  return journalEntry?.status === JOURNAL_STATUS_DRAFT
}

export function canEditJournalDraft(journalEntry) {
  return isJournalDraft(journalEntry) && !isBillingEntry(journalEntry)
}

export function canReverseJournalEntry(journalEntry) {
  return journalEntry?.can_reverse === true && !isBillingEntry(journalEntry)
}

export function buildSourceLinkTarget(journalEntry) {
  const sourceLink = journalEntry?.source_link
  if (!isRecordObject(sourceLink)) return null
  if (!Object.hasOwn(SOURCE_LINK_TARGETS, sourceLink.type)) return null
  const { label, routeName, paramKey } = SOURCE_LINK_TARGETS[sourceLink.type]
  return { label, to: { name: routeName, params: { [paramKey]: sourceLink.id } } }
}

function buildLink(linkLabel, linkedEntry) {
  return { label: linkLabel, entryId: linkedEntry.id, number: linkedEntry.number }
}

export function buildJournalLinks(journalEntry) {
  const journalLinks = []
  if (isRecordObject(journalEntry?.reversal_of)) journalLinks.push(buildLink(REVERSAL_OF_LABEL, journalEntry.reversal_of))
  if (isRecordObject(journalEntry?.reversed_by)) journalLinks.push(buildLink(REVERSED_BY_LABEL, journalEntry.reversed_by))
  return journalLinks
}

export function buildServerTotals(journalEntry) {
  const debitCents = toCents(journalEntry?.debit_total) ?? 0
  const creditCents = toCents(journalEntry?.credit_total) ?? 0
  return { debitCents, creditCents, differenceCents: debitCents - creditCents }
}

export function formatAccountLabel(account) {
  return `${account?.code ?? ''} ${account?.name ?? ''}`.trim()
}

export function listAccountOptions(accounts) {
  if (!Array.isArray(accounts)) return []
  return [...accounts].sort(compareAccountCodes).map((account) => ({
    value: String(account.id),
    label: formatAccountLabel(account) + (account.is_active === false ? INACTIVE_SUFFIX : ''),
  }))
}

export function buildDeleteDraftMessage(journalEntry) {
  return `Delete ${formatJournalNumber(journalEntry)}? This cannot be undone.`
}

export function buildPostConfirmMessage(lineTotals) {
  const totalText = formatPesoFromCents(lineTotals?.debitCents)
  return `Post this entry for ${totalText}? Posted entries cannot be edited or deleted, only reversed.`
}
