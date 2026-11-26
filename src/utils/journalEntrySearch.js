import {
  JOURNAL_SOURCE_ASSESSMENT,
  JOURNAL_SOURCE_MANUAL,
  JOURNAL_SOURCE_PAYMENT,
} from '@/utils/journalEntryDisplay.js'
import { findDateRangeError } from '@/utils/paymentSearch.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, normalizeSearchText } from '@/utils/studentSearch.js'
import { pickOptionValue } from '@/utils/subjectSearch.js'

export const JOURNAL_STATUS_OPTIONS = Object.freeze(
  [
    { value: 'draft', label: 'Draft' },
    { value: 'posted', label: 'Posted' },
    { value: 'reversed', label: 'Reversed' },
    { value: 'reversal', label: 'Reversal' },
  ].map((statusOption) => Object.freeze(statusOption)),
)

export const JOURNAL_SOURCE_OPTIONS = Object.freeze(
  [
    { value: JOURNAL_SOURCE_MANUAL, label: 'Manual' },
    { value: JOURNAL_SOURCE_ASSESSMENT, label: 'Assessment' },
    { value: JOURNAL_SOURCE_PAYMENT, label: 'Payment' },
  ].map((sourceOption) => Object.freeze(sourceOption)),
)

export function createJournalEntryFilters() {
  return { status: '', source: '', dateFrom: '', dateTo: '', accountId: '', search: '', page: FIRST_PAGE }
}

export function findJournalDateRangeError(journalFilters) {
  if (!journalFilters?.dateFrom || !journalFilters?.dateTo) return ''
  return findDateRangeError(journalFilters)
}

function isValidPage(pageNumber) {
  return Number.isInteger(pageNumber) && pageNumber >= FIRST_PAGE
}

function buildOptionalParams(journalFilters) {
  const optionalParams = {}
  const statusFilter = pickOptionValue(JOURNAL_STATUS_OPTIONS, journalFilters.status)
  const sourceFilter = pickOptionValue(JOURNAL_SOURCE_OPTIONS, journalFilters.source)
  const accountId = toRecordId(journalFilters.accountId)
  const normalizedSearch = normalizeSearchText(journalFilters.search)
  if (statusFilter !== '') optionalParams.status = statusFilter
  if (sourceFilter !== '') optionalParams.source = sourceFilter
  if (journalFilters.dateFrom) optionalParams.from = journalFilters.dateFrom
  if (journalFilters.dateTo) optionalParams.to = journalFilters.dateTo
  if (accountId !== null) optionalParams.account_id = accountId
  if (normalizedSearch !== '') optionalParams.search = normalizedSearch
  return optionalParams
}

export function buildJournalEntryListParams(journalFilters) {
  if (findJournalDateRangeError(journalFilters) !== '') return null
  const listPage = isValidPage(journalFilters.page) ? journalFilters.page : FIRST_PAGE
  return { page: listPage, ...buildOptionalParams(journalFilters) }
}

export function applyJournalStatusChange(journalFilters, nextStatus) {
  return { ...journalFilters, status: String(nextStatus ?? ''), page: FIRST_PAGE }
}

export function applyJournalSourceChange(journalFilters, nextSource) {
  return { ...journalFilters, source: String(nextSource ?? ''), page: FIRST_PAGE }
}

export function applyJournalDateFromChange(journalFilters, nextDate) {
  return { ...journalFilters, dateFrom: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyJournalDateToChange(journalFilters, nextDate) {
  return { ...journalFilters, dateTo: String(nextDate ?? ''), page: FIRST_PAGE }
}

export function applyJournalAccountChange(journalFilters, nextAccountId) {
  return { ...journalFilters, accountId: toIdText(nextAccountId), page: FIRST_PAGE }
}
