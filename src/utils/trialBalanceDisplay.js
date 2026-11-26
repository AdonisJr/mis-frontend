import { GENERAL_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { ACCOUNT_TYPE_OPTIONS, getAccountTypeLabel } from '@/utils/accountDisplay.js'
import { buildCsvText, formatCsvAmount } from '@/utils/csvExport.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { buildYearStartIso, formatLedgerAmount, formatLedgerCell } from '@/utils/generalLedgerDisplay.js'
import { buildPrintItem, findAsOfError } from '@/utils/reportDisplay.js'

export const TRIAL_BALANCE_COLUMNS = Object.freeze(
  [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'type', label: 'Type' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
  ].map((column) => Object.freeze(column)),
)
export const ALL_TYPES_LABEL = 'All types'

const ZERO_SHOWN_TEXT = 'Shown'
const ZERO_HIDDEN_TEXT = 'Hidden'
const TOTAL_ROW_LABEL = 'Total'
const TYPE_VALUES = ACCOUNT_TYPE_OPTIONS.map((typeOption) => typeOption.value)

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function createTrialBalanceFilters(todayIso) {
  return { asOf: todayIso, type: '', isZeroIncluded: false }
}

export function buildTrialBalanceParams(trialBalanceFilters) {
  if (findAsOfError(trialBalanceFilters?.asOf) !== '') return null
  const trialBalanceParams = { as_of: trialBalanceFilters.asOf }
  if (TYPE_VALUES.includes(trialBalanceFilters.type)) trialBalanceParams.type = trialBalanceFilters.type
  if (trialBalanceFilters.isZeroIncluded === true) trialBalanceParams.include_zero = 1
  return trialBalanceParams
}

function buildRow(accountRow) {
  return {
    key: `account-${accountRow.id}`,
    accountId: accountRow.id,
    code: accountRow.code,
    name: accountRow.name,
    typeLabel: getAccountTypeLabel(accountRow.type),
    isInactive: accountRow.is_active === false,
    debit: formatLedgerCell(accountRow.debit),
    credit: formatLedgerCell(accountRow.credit),
  }
}

export function buildTrialBalanceRows(trialBalance) {
  if (!isRecordObject(trialBalance)) return []
  return (trialBalance.rows ?? []).map(buildRow)
}

export function buildTrialBalanceTotals(trialBalance) {
  return {
    debitText: formatLedgerAmount(trialBalance?.totals?.debit),
    creditText: formatLedgerAmount(trialBalance?.totals?.credit),
    isBalanced: trialBalance?.is_balanced === true,
  }
}

export function buildLedgerLinkTarget(accountId, asOfIso) {
  return {
    name: GENERAL_LEDGER_ROUTE_NAME,
    query: { account_id: String(accountId), from: buildYearStartIso(asOfIso), to: asOfIso },
  }
}

export function buildTrialBalancePrintItems(trialBalanceFilters) {
  return [
    buildPrintItem('As of', formatDisplayDate(trialBalanceFilters?.asOf)),
    buildPrintItem('Type', getAccountTypeLabel(trialBalanceFilters?.type)),
    buildPrintItem('Zero-balance accounts', trialBalanceFilters?.isZeroIncluded ? ZERO_SHOWN_TEXT : ZERO_HIDDEN_TEXT),
  ]
}

function buildCsvRow(accountRow) {
  return {
    code: accountRow.code,
    name: accountRow.name,
    type: getAccountTypeLabel(accountRow.type),
    debit: formatCsvAmount(accountRow.debit),
    credit: formatCsvAmount(accountRow.credit),
  }
}

export function buildTrialBalanceCsv(trialBalance) {
  const accountRows = isRecordObject(trialBalance) ? (trialBalance.rows ?? []) : []
  const totalRow = {
    name: TOTAL_ROW_LABEL,
    debit: formatCsvAmount(trialBalance?.totals?.debit),
    credit: formatCsvAmount(trialBalance?.totals?.credit),
  }
  return buildCsvText(TRIAL_BALANCE_COLUMNS, [...accountRows.map(buildCsvRow), totalRow])
}
