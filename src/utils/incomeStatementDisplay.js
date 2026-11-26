import { buildCsvText, formatCsvAmount } from '@/utils/csvExport.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatLedgerAmount } from '@/utils/generalLedgerDisplay.js'
import { buildPrintItem, findReportRangeError, formatParenthesizedAmount } from '@/utils/reportDisplay.js'

const BLOCK_KIND_SECTION = 'section'
const BLOCK_KIND_LINE = 'line'
const NET_REVENUE_KEY = 'net_revenue'
const NET_REVENUE_LABEL = 'Net revenue'
const NET_INCOME_LABEL = 'Net income'
const NET_LOSS_LABEL = 'Net loss'
const PERIOD_SEPARATOR = ' – '
const NO_CODE_TEXT = ''

const INCOME_BLOCK_DEFS = Object.freeze(
  [
    { kind: BLOCK_KIND_SECTION, key: 'revenue', title: 'Revenue', subtotalLabel: 'Total revenue' },
    { kind: BLOCK_KIND_SECTION, key: 'contra_revenue', title: 'Less: contra revenue', subtotalLabel: 'Total contra revenue' },
    { kind: BLOCK_KIND_LINE, key: NET_REVENUE_KEY, title: NET_REVENUE_LABEL, subtotalLabel: NET_REVENUE_LABEL },
    { kind: BLOCK_KIND_SECTION, key: 'other_income', title: 'Other income', subtotalLabel: 'Total other income' },
    { kind: BLOCK_KIND_SECTION, key: 'operating_expenses', title: 'Operating expenses', subtotalLabel: 'Total operating expenses' },
    { kind: BLOCK_KIND_SECTION, key: 'other_expenses', title: 'Other expenses', subtotalLabel: 'Total other expenses' },
  ].map((blockDef) => Object.freeze(blockDef)),
)

export const INCOME_SECTIONS = Object.freeze(
  INCOME_BLOCK_DEFS.filter((blockDef) => blockDef.kind === BLOCK_KIND_SECTION).map(
    ({ key, title, subtotalLabel }) => Object.freeze({ key, title, subtotalLabel }),
  ),
)

export const INCOME_STATEMENT_CSV_COLUMNS = Object.freeze(
  [
    { key: 'section', label: 'Section' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'amount', label: 'Amount' },
  ].map((column) => Object.freeze(column)),
)

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function buildIncomeStatementParams(reportRange) {
  if (findReportRangeError(reportRange) !== '') return null
  return { from: reportRange.from, to: reportRange.to }
}

function buildSectionRows(sectionRows) {
  return (sectionRows ?? []).map((sectionRow) => ({
    key: `account-${sectionRow.id}`,
    code: sectionRow.code,
    name: sectionRow.name,
    amountText: formatLedgerAmount(sectionRow.amount),
    isInactive: sectionRow.is_active === false,
  }))
}

function buildBlock(incomeStatement, blockDef) {
  if (blockDef.kind === BLOCK_KIND_LINE) {
    return { kind: BLOCK_KIND_LINE, key: blockDef.key, label: blockDef.title, text: formatLedgerAmount(incomeStatement[blockDef.key]) }
  }
  const section = incomeStatement[blockDef.key]
  return {
    kind: BLOCK_KIND_SECTION,
    key: blockDef.key,
    title: blockDef.title,
    rows: buildSectionRows(section?.rows),
    subtotalLabel: blockDef.subtotalLabel,
    subtotalText: formatLedgerAmount(section?.subtotal),
  }
}

export function buildIncomeStatementBlocks(incomeStatement) {
  if (!isRecordObject(incomeStatement)) return []
  return INCOME_BLOCK_DEFS.map((blockDef) => buildBlock(incomeStatement, blockDef))
}

export function buildNetIncomeLine(netIncomeText) {
  const netIncomeAmount = formatParenthesizedAmount(netIncomeText)
  return { label: netIncomeAmount.isNegative ? NET_LOSS_LABEL : NET_INCOME_LABEL, ...netIncomeAmount }
}

export function buildIncomeStatementPrintItems(reportRange) {
  const periodText = [reportRange?.from, reportRange?.to].map(formatDisplayDate).join(PERIOD_SEPARATOR)
  return [buildPrintItem('Period', periodText)]
}

function buildAccountCsvRow(sectionTitle, sectionRow) {
  return {
    section: sectionTitle,
    code: sectionRow.code,
    name: sectionRow.name,
    amount: formatCsvAmount(sectionRow.amount),
  }
}

function buildSectionCsvRows(incomeStatement, blockDef) {
  if (blockDef.kind === BLOCK_KIND_LINE) {
    const netRevenueRow = { section: NET_REVENUE_LABEL, code: NO_CODE_TEXT, name: NET_REVENUE_LABEL }
    return [{ ...netRevenueRow, amount: formatCsvAmount(incomeStatement[blockDef.key]) }]
  }
  const section = incomeStatement[blockDef.key]
  const accountRows = (section?.rows ?? []).map((sectionRow) => buildAccountCsvRow(blockDef.title, sectionRow))
  const subtotalRow = {
    section: blockDef.title,
    code: NO_CODE_TEXT,
    name: blockDef.subtotalLabel,
    amount: formatCsvAmount(section?.subtotal),
  }
  return [...accountRows, subtotalRow]
}

export function buildIncomeStatementCsv(incomeStatement) {
  const statement = isRecordObject(incomeStatement) ? incomeStatement : {}
  const blockRows = INCOME_BLOCK_DEFS.flatMap((blockDef) => buildSectionCsvRows(statement, blockDef))
  const netIncomeLabel = buildNetIncomeLine(statement.net_income).label
  const netIncomeRow = {
    section: netIncomeLabel,
    code: NO_CODE_TEXT,
    name: netIncomeLabel,
    amount: formatCsvAmount(statement.net_income),
  }
  return buildCsvText(INCOME_STATEMENT_CSV_COLUMNS, [...blockRows, netIncomeRow])
}
