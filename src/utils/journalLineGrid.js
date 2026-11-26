import { compareAccountCodes } from '@/utils/accountDisplay.js'
import { INACTIVE_SUFFIX, formatAccountLabel } from '@/utils/journalEntryDisplay.js'
import { formatPesoFromCents, toCents } from '@/utils/moneyDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

export { INACTIVE_SUFFIX }
export const JOURNAL_LINES_MIN = 2
export const JOURNAL_LINES_MAX = 100
export const JOURNAL_MEMO_MAX_LENGTH = 255
export const JOURNAL_AMOUNT_MAX_CENTS = 99999999999

const LINES_COUNT_MESSAGE = 'An entry needs 2 to 100 lines.'
const ACCOUNT_REQUIRED_MESSAGE = 'Choose an account.'
const AMOUNT_MISSING_MESSAGE = 'Enter a debit or a credit.'
const AMOUNT_BOTH_MESSAGE = 'Enter either a debit or a credit, not both.'
const AMOUNT_DECIMALS_MESSAGE = 'Enter an amount with at most 2 decimals.'
const AMOUNT_MAX_MESSAGE = 'The amount must be at most 999,999,999.99.'
const MEMO_TOO_LONG_MESSAGE = `The memo must be at most ${JOURNAL_MEMO_MAX_LENGTH} characters.`
const BALANCED_TEXT = 'Balanced'
const LINES_ERROR_KEY = 'lines'

function isBlankText(fieldValue) {
  return fieldValue === null || fieldValue === undefined || String(fieldValue).trim() === ''
}

function toSideCents(amountText) {
  if (isBlankText(amountText)) return 0
  return toCents(amountText) ?? 0
}

export function createEmptyJournalLine() {
  return { account_id: '', debit: '', credit: '', memo: '' }
}

export function createStartingLines() {
  return Array.from({ length: JOURNAL_LINES_MIN }, createEmptyJournalLine)
}

export function applyLineDebitChange(line, nextDebit) {
  const nextLine = { ...line, debit: nextDebit }
  if (!isBlankText(nextDebit)) nextLine.credit = ''
  return nextLine
}

export function applyLineCreditChange(line, nextCredit) {
  const nextLine = { ...line, credit: nextCredit }
  if (!isBlankText(nextCredit)) nextLine.debit = ''
  return nextLine
}

export function canAddJournalLine(lines) {
  return Array.isArray(lines) && lines.length < JOURNAL_LINES_MAX
}

export function canRemoveJournalLine(lines) {
  return Array.isArray(lines) && lines.length > JOURNAL_LINES_MIN
}

export function appendJournalLine(lines) {
  if (!canAddJournalLine(lines)) return lines
  return [...lines, createEmptyJournalLine()]
}

export function removeJournalLineAt(lines, lineIndex) {
  if (!canRemoveJournalLine(lines)) return lines
  if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lines.length) return lines
  return lines.filter((_line, index) => index !== lineIndex)
}

export function sumJournalLines(lines) {
  const lineList = Array.isArray(lines) ? lines : []
  const debitCents = lineList.reduce((runningCents, line) => runningCents + toSideCents(line?.debit), 0)
  const creditCents = lineList.reduce((runningCents, line) => runningCents + toSideCents(line?.credit), 0)
  return { debitCents, creditCents, differenceCents: debitCents - creditCents }
}

export function canPostJournalEntry(lineTotals) {
  return lineTotals.debitCents === lineTotals.creditCents && lineTotals.debitCents > 0
}

export function formatDifferenceText(lineTotals) {
  if (lineTotals.differenceCents === 0) return BALANCED_TEXT
  return `Out of balance by ${formatPesoFromCents(Math.abs(lineTotals.differenceCents))}`
}

function findAmountError(amountText) {
  if (isBlankText(amountText)) return ''
  const amountCents = toCents(amountText)
  if (amountCents === null) return AMOUNT_DECIMALS_MESSAGE
  return amountCents > JOURNAL_AMOUNT_MAX_CENTS ? AMOUNT_MAX_MESSAGE : ''
}

function findSidesError(line) {
  const hasDebit = toSideCents(line.debit) > 0
  const hasCredit = toSideCents(line.credit) > 0
  if (hasDebit && hasCredit) return AMOUNT_BOTH_MESSAGE
  return hasDebit || hasCredit ? '' : AMOUNT_MISSING_MESSAGE
}

function findDebitError(line) {
  const debitError = findAmountError(line.debit)
  if (debitError !== '' || findAmountError(line.credit) !== '') return debitError
  return findSidesError(line)
}

function collectLineMessages(line) {
  const memoLength = String(line.memo ?? '').trim().length
  return {
    account_id: toRecordId(line.account_id) === null ? ACCOUNT_REQUIRED_MESSAGE : '',
    debit: findDebitError(line),
    credit: findAmountError(line.credit),
    memo: memoLength > JOURNAL_MEMO_MAX_LENGTH ? MEMO_TOO_LONG_MESSAGE : '',
  }
}

export function findJournalLineErrors(line, lineIndex) {
  const lineErrors = {}
  const lineMessages = collectLineMessages(line ?? {})
  for (const [fieldKey, message] of Object.entries(lineMessages)) {
    if (message !== '') lineErrors[`lines.${lineIndex}.${fieldKey}`] = [message]
  }
  return lineErrors
}

export function findJournalLinesErrors(lines) {
  const lineList = Array.isArray(lines) ? lines : []
  const linesErrors = {}
  if (lineList.length < JOURNAL_LINES_MIN || lineList.length > JOURNAL_LINES_MAX) {
    linesErrors[LINES_ERROR_KEY] = [LINES_COUNT_MESSAGE]
  }
  lineList.forEach((line, lineIndex) => Object.assign(linesErrors, findJournalLineErrors(line, lineIndex)))
  return linesErrors
}

function buildStaleAccounts(activeAccounts, storedLines) {
  const knownIds = new Set(activeAccounts.map((account) => String(account.id)))
  const staleAccounts = []
  for (const storedLine of storedLines) {
    const storedAccount = storedLine?.account
    if (!storedAccount || knownIds.has(String(storedAccount.id))) continue
    knownIds.add(String(storedAccount.id))
    staleAccounts.push(storedAccount)
  }
  return staleAccounts
}

export function buildLineAccountOptions(activeAccounts, storedLines) {
  const activeList = Array.isArray(activeAccounts) ? activeAccounts : []
  const staleAccounts = buildStaleAccounts(activeList, Array.isArray(storedLines) ? storedLines : [])
  const activeOptions = activeList.map((account) => ({ account, suffix: '' }))
  const staleOptions = staleAccounts.map((account) => ({ account, suffix: INACTIVE_SUFFIX }))
  return [...activeOptions, ...staleOptions]
    .sort((firstOption, secondOption) => compareAccountCodes(firstOption.account, secondOption.account))
    .map(({ account, suffix }) => ({ value: String(account.id), label: formatAccountLabel(account) + suffix }))
}
