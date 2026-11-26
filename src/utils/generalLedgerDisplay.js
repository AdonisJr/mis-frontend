import { MINUS_SIGN } from '@/utils/assessmentDisplay.js'
import { formatPeso, formatPesoFromCents, toCents } from '@/utils/moneyDisplay.js'
import { findDateRangeError } from '@/utils/paymentSearch.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const LEDGER_COLUMNS = Object.freeze(
  [
    { key: 'entry_date', label: 'Date' },
    { key: 'number', label: 'JV no.' },
    { key: 'description', label: 'Description' },
    { key: 'memo', label: 'Memo' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
    { key: 'running_balance', label: 'Balance' },
  ].map((column) => Object.freeze(column)),
)
export const OPENING_ROW_TEXT = 'Opening balance'

const NEGATIVE_PREFIX = '-'
const YEAR_LENGTH = 4
const YEAR_START_SUFFIX = '-01-01'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function buildYearStartIso(todayIso) {
  return String(todayIso).slice(0, YEAR_LENGTH) + YEAR_START_SUFFIX
}

export function createLedgerFilters(todayIso) {
  return { accountId: '', from: buildYearStartIso(todayIso), to: todayIso }
}

export function findLedgerRangeError(ledgerFilters) {
  return findDateRangeError({ dateFrom: ledgerFilters?.from, dateTo: ledgerFilters?.to })
}

export function buildLedgerParams(ledgerFilters) {
  const accountId = toRecordId(ledgerFilters?.accountId)
  if (accountId === null || findLedgerRangeError(ledgerFilters) !== '') return null
  return { account_id: accountId, from: ledgerFilters.from, to: ledgerFilters.to }
}

export function applyLedgerAccountChange(ledgerFilters, nextAccountId) {
  return { ...ledgerFilters, accountId: toIdText(nextAccountId) }
}

export function formatLedgerAmount(amountText) {
  if (typeof amountText !== 'string') return formatPeso(amountText)
  if (!amountText.startsWith(NEGATIVE_PREFIX)) return formatPeso(amountText)
  const absoluteCents = toCents(amountText.slice(NEGATIVE_PREFIX.length))
  if (absoluteCents === null) return NO_VALUE_LABEL
  return MINUS_SIGN + formatPesoFromCents(absoluteCents)
}

export function formatLedgerCell(amountText) {
  if (toCents(amountText) === 0) return ''
  return formatLedgerAmount(amountText)
}

function buildLineRow(ledgerLine) {
  return {
    key: `line-${ledgerLine.id}`,
    entryId: ledgerLine.journal_entry_id,
    number: ledgerLine.number,
    entry_date: ledgerLine.entry_date,
    description: ledgerLine.description,
    memo: ledgerLine.memo,
    debit: formatLedgerCell(ledgerLine.debit),
    credit: formatLedgerCell(ledgerLine.credit),
    running_balance: formatLedgerAmount(ledgerLine.running_balance),
  }
}

export function buildLedgerRows(ledger) {
  if (!isRecordObject(ledger)) return []
  const openingRow = {
    key: 'opening',
    isOpening: true,
    description: OPENING_ROW_TEXT,
    running_balance: formatLedgerAmount(ledger.opening_balance),
  }
  return [openingRow, ...(ledger.lines ?? []).map(buildLineRow)]
}

export function buildLedgerSummary(ledger) {
  return [
    { label: 'Period debits', text: formatLedgerAmount(ledger?.period_debit_total) },
    { label: 'Period credits', text: formatLedgerAmount(ledger?.period_credit_total) },
    { label: 'Closing balance', text: formatLedgerAmount(ledger?.closing_balance) },
  ]
}

export function hasLedgerLines(ledger) {
  return Array.isArray(ledger?.lines) && ledger.lines.length > 0
}
