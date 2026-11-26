import { formatCentsAsAmount, toCents } from '@/utils/moneyDisplay.js'

export const CSV_LINE_BREAK = '\r\n'
export const CSV_MIME_TYPE = 'text/csv;charset=utf-8'
export const CSV_BOM = '\uFEFF'

const CSV_SEPARATOR = ','
const CSV_QUOTE = '"'
const FORMULA_GUARD = "'"
const NEGATIVE_PREFIX = '-'
const FORMULA_START_PATTERN = /^[=+\-@\t\r]/
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/
const QUOTE_TRIGGER_PATTERN = /[,"\r\n]/
const QUOTE_PATTERN = /"/g

function guardFormulaCell(cellText) {
  if (NUMBER_PATTERN.test(cellText)) return cellText
  return FORMULA_START_PATTERN.test(cellText) ? FORMULA_GUARD + cellText : cellText
}

function escapeCsvCell(cellValue) {
  if (cellValue === null || cellValue === undefined) return ''
  const guardedText = guardFormulaCell(String(cellValue))
  if (!QUOTE_TRIGGER_PATTERN.test(guardedText)) return guardedText
  return CSV_QUOTE + guardedText.replace(QUOTE_PATTERN, CSV_QUOTE + CSV_QUOTE) + CSV_QUOTE
}

function buildCsvLine(columns, csvRow) {
  return columns.map((column) => escapeCsvCell(csvRow[column.key])).join(CSV_SEPARATOR)
}

export function buildCsvText(columns, csvRows) {
  const headerLine = columns.map((column) => escapeCsvCell(column.label)).join(CSV_SEPARATOR)
  return [headerLine, ...csvRows.map((csvRow) => buildCsvLine(columns, csvRow))].join(CSV_LINE_BREAK)
}

export function formatCsvAmount(amountText) {
  if (typeof amountText !== 'string') return ''
  const isNegative = amountText.startsWith(NEGATIVE_PREFIX)
  const absoluteCents = toCents(isNegative ? amountText.slice(NEGATIVE_PREFIX.length) : amountText)
  if (absoluteCents === null) return ''
  const amountDigits = formatCentsAsAmount(absoluteCents)
  return isNegative && absoluteCents > 0 ? NEGATIVE_PREFIX + amountDigits : amountDigits
}

export function buildCsvFileName(reportSlug, dateLabel) {
  return `${reportSlug}-${dateLabel}.csv`
}

export function downloadCsvFile(fileName, csvText) {
  if (typeof fileName !== 'string' || fileName === '' || typeof csvText !== 'string' || csvText === '') return
  const csvBlob = new Blob([CSV_BOM, csvText], { type: CSV_MIME_TYPE })
  const downloadUrl = URL.createObjectURL(csvBlob)
  const downloadLink = document.createElement('a')
  downloadLink.href = downloadUrl
  downloadLink.download = fileName
  document.body.appendChild(downloadLink)
  downloadLink.click()
  downloadLink.remove()
  URL.revokeObjectURL(downloadUrl)
}
