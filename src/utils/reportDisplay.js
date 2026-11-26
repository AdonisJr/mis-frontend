import { buildYearStartIso, formatLedgerAmount } from '@/utils/generalLedgerDisplay.js'
import { formatPesoFromCents, toCents } from '@/utils/moneyDisplay.js'
import { findDateRangeError } from '@/utils/paymentSearch.js'

export const AS_OF_INVALID_MESSAGE = 'Enter a valid as-of date.'
export const ALL_FILTER_TEXT = 'All'
export const BALANCED_CHIPS = Object.freeze({
  balanced: Object.freeze({ label: 'Balanced', colorClass: 'bg-green-100 text-green-800' }),
  outOfBalance: Object.freeze({ label: 'Out of balance', colorClass: 'bg-red-100 text-red-800' }),
})

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const NEGATIVE_PREFIX = '-'

export function findAsOfError(asOfText) {
  if (typeof asOfText === 'string' && ISO_DATE_PATTERN.test(asOfText)) return ''
  return AS_OF_INVALID_MESSAGE
}

export function createReportRange(todayIso) {
  return { from: buildYearStartIso(todayIso), to: todayIso }
}

export function findReportRangeError(reportRange) {
  return findDateRangeError({ dateFrom: reportRange?.from, dateTo: reportRange?.to })
}

export function isNegativeAmount(amountText) {
  if (typeof amountText !== 'string' || !amountText.startsWith(NEGATIVE_PREFIX)) return false
  const absoluteCents = toCents(amountText.slice(NEGATIVE_PREFIX.length))
  return absoluteCents !== null && absoluteCents > 0
}

export function formatParenthesizedAmount(amountText) {
  if (!isNegativeAmount(amountText)) return { text: formatLedgerAmount(amountText), isNegative: false }
  const absoluteCents = toCents(amountText.slice(NEGATIVE_PREFIX.length))
  return { text: `(${formatPesoFromCents(absoluteCents)})`, isNegative: true }
}

export function getBalancedChip(isBalanced) {
  return BALANCED_CHIPS[isBalanced === true ? 'balanced' : 'outOfBalance']
}

export function buildPrintItem(label, text) {
  return { key: label, label, text: text || ALL_FILTER_TEXT }
}

export function findOptionLabel(options, selectedId) {
  if (!Array.isArray(options) || selectedId === null || selectedId === undefined || selectedId === '') return ''
  const matchedOption = options.find((option) => String(option?.id) === String(selectedId))
  return matchedOption?.name ?? ''
}
