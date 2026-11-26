import { getSubtypeLabel } from '@/utils/accountDisplay.js'
import { buildCsvText, formatCsvAmount } from '@/utils/csvExport.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatLedgerAmount } from '@/utils/generalLedgerDisplay.js'
import { buildPrintItem, findAsOfError, formatParenthesizedAmount } from '@/utils/reportDisplay.js'

export const BALANCE_SHEET_SECTIONS = Object.freeze(
  [
    { key: 'assets', title: 'Assets' },
    { key: 'liabilities', title: 'Liabilities' },
    { key: 'equity', title: 'Equity' },
  ].map((section) => Object.freeze(section)),
)
export const TOTAL_LIABILITIES_AND_EQUITY_LABEL = 'Total liabilities and equity'
export const BALANCE_SHEET_CSV_COLUMNS = Object.freeze(
  [
    { key: 'section', label: 'Section' },
    { key: 'group', label: 'Group' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'amount', label: 'Amount' },
  ].map((column) => Object.freeze(column)),
)

const EQUITY_KEY = 'equity'
const NO_TEXT = ''
const EQUITY_EXTRA_DEFS = Object.freeze([
  Object.freeze({ key: 'net_income_current_year', label: 'Net income — current year' }),
  Object.freeze({ key: 'net_income_prior_years', label: 'Net income — prior years' }),
])

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function buildTotalLabel(title) {
  return `Total ${title.toLowerCase()}`
}

function listFilledGroups(section) {
  return (section?.groups ?? []).filter((group) => Array.isArray(group?.rows) && group.rows.length > 0)
}

export function createBalanceSheetFilters(todayIso) {
  return { asOf: todayIso }
}

export function buildBalanceSheetParams(balanceSheetFilters) {
  if (findAsOfError(balanceSheetFilters?.asOf) !== '') return null
  return { as_of: balanceSheetFilters.asOf }
}

function buildRows(groupRows) {
  return groupRows.map((groupRow) => ({
    key: `account-${groupRow.id}`,
    code: groupRow.code,
    name: groupRow.name,
    amountText: formatLedgerAmount(groupRow.amount),
    isInactive: groupRow.is_active === false,
  }))
}

function buildGroup(group) {
  const title = getSubtypeLabel(group.subtype)
  return {
    key: group.subtype,
    title,
    rows: buildRows(group.rows),
    subtotalLabel: buildTotalLabel(title),
    subtotalText: formatLedgerAmount(group.subtotal),
  }
}

function buildExtraLine(section, extraDef) {
  return { key: extraDef.key, label: extraDef.label, ...formatParenthesizedAmount(section?.[extraDef.key]) }
}

function buildExtraLines(sectionDef, section) {
  if (sectionDef.key !== EQUITY_KEY) return []
  return EQUITY_EXTRA_DEFS.map((extraDef) => buildExtraLine(section, extraDef))
}

function buildSection(balanceSheet, sectionDef) {
  const section = balanceSheet[sectionDef.key]
  return {
    key: sectionDef.key,
    title: sectionDef.title,
    groups: listFilledGroups(section).map(buildGroup),
    extraLines: buildExtraLines(sectionDef, section),
    totalLabel: buildTotalLabel(sectionDef.title),
    totalText: formatLedgerAmount(section?.total),
  }
}

export function buildBalanceSheetSections(balanceSheet) {
  if (!isRecordObject(balanceSheet)) return []
  return BALANCE_SHEET_SECTIONS.map((sectionDef) => buildSection(balanceSheet, sectionDef))
}

export function buildBalanceSheetTotals(balanceSheet) {
  return {
    assetsText: formatLedgerAmount(balanceSheet?.assets?.total),
    liabilitiesAndEquityText: formatLedgerAmount(balanceSheet?.total_liabilities_and_equity),
    isBalanced: balanceSheet?.is_balanced === true,
  }
}

export function buildBalanceSheetPrintItems(balanceSheetFilters) {
  return [buildPrintItem('As of', formatDisplayDate(balanceSheetFilters?.asOf))]
}

function buildCsvGroupRows(sectionTitle, group) {
  const groupTitle = getSubtypeLabel(group.subtype)
  const accountRows = group.rows.map((groupRow) => ({
    section: sectionTitle,
    group: groupTitle,
    code: groupRow.code,
    name: groupRow.name,
    amount: formatCsvAmount(groupRow.amount),
  }))
  const subtotalRow = {
    section: sectionTitle,
    group: groupTitle,
    code: NO_TEXT,
    name: buildTotalLabel(groupTitle),
    amount: formatCsvAmount(group.subtotal),
  }
  return [...accountRows, subtotalRow]
}

function buildCsvSectionRows(balanceSheet, sectionDef) {
  const section = balanceSheet[sectionDef.key]
  const groupRows = listFilledGroups(section).flatMap((group) => buildCsvGroupRows(sectionDef.title, group))
  const extraDefs = sectionDef.key === EQUITY_KEY ? EQUITY_EXTRA_DEFS : []
  const extraRows = extraDefs.map((extraDef) => ({
    section: sectionDef.title,
    group: NO_TEXT,
    code: NO_TEXT,
    name: extraDef.label,
    amount: formatCsvAmount(section?.[extraDef.key]),
  }))
  const totalRow = {
    section: sectionDef.title,
    group: NO_TEXT,
    code: NO_TEXT,
    name: buildTotalLabel(sectionDef.title),
    amount: formatCsvAmount(section?.total),
  }
  return [...groupRows, ...extraRows, totalRow]
}

export function buildBalanceSheetCsv(balanceSheet) {
  const sheet = isRecordObject(balanceSheet) ? balanceSheet : {}
  const sectionRows = BALANCE_SHEET_SECTIONS.flatMap((sectionDef) => buildCsvSectionRows(sheet, sectionDef))
  const grandTotalRow = {
    section: TOTAL_LIABILITIES_AND_EQUITY_LABEL,
    group: NO_TEXT,
    code: NO_TEXT,
    name: TOTAL_LIABILITIES_AND_EQUITY_LABEL,
    amount: formatCsvAmount(sheet.total_liabilities_and_equity),
  }
  return buildCsvText(BALANCE_SHEET_CSV_COLUMNS, [...sectionRows, grandTotalRow])
}
