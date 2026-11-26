import { STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { buildCsvText, formatCsvAmount } from '@/utils/csvExport.js'
import { formatLedgerAmount, formatLedgerCell } from '@/utils/generalLedgerDisplay.js'
import { toCents } from '@/utils/moneyDisplay.js'
import { findAsOfError } from '@/utils/reportDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { normalizeSearchText } from '@/utils/studentSearch.js'

export const AGING_BUCKET_KEYS = Object.freeze(['current', 'days_1_30', 'days_31_60', 'days_61_90', 'over_90'])

const BUCKET_COLUMNS = [
  { key: 'current', label: 'Current' },
  { key: 'days_1_30', label: '1–30' },
  { key: 'days_31_60', label: '31–60' },
  { key: 'days_61_90', label: '61–90' },
  { key: 'over_90', label: 'Over 90' },
]

export const AR_AGING_COLUMNS = Object.freeze(
  [
    { key: 'student', label: 'Student' },
    { key: 'school_year_name', label: 'School year' },
    { key: 'grade_level_name', label: 'Grade level' },
    ...BUCKET_COLUMNS,
    { key: 'total', label: 'Total' },
  ].map((column) => Object.freeze(column)),
)

export const AR_AGING_CSV_COLUMNS = Object.freeze(
  [
    { key: 'student', label: 'Student' },
    { key: 'lrn', label: 'LRN' },
    { key: 'school_year_name', label: 'School year' },
    { key: 'grade_level_name', label: 'Grade level' },
    ...BUCKET_COLUMNS,
    { key: 'total', label: 'Total' },
  ].map((column) => Object.freeze(column)),
)

export const TIE_OUT_CHIPS = Object.freeze({
  tied: Object.freeze({ label: 'Tied out', colorClass: 'bg-green-100 text-green-800' }),
  difference: Object.freeze({ label: 'Difference', colorClass: 'bg-red-100 text-red-800' }),
  notMapped: Object.freeze({ label: 'Not mapped', colorClass: 'bg-slate-200 text-slate-700' }),
})
export const AGING_TOTAL_LABEL = 'Aging total (all students)'
export const NOT_MAPPED_MESSAGE = 'AR – Students is not mapped, so the GL balance cannot be compared.'

const NEGATIVE_PREFIX = '-'
const TOTAL_ROW_LABEL = 'Total'
const NAME_SEPARATOR = ', '

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function createArAgingFilters(todayIso) {
  return { asOf: todayIso, schoolYearId: '', gradeLevelId: '', search: '' }
}

export function buildArAgingParams(arAgingFilters) {
  if (findAsOfError(arAgingFilters?.asOf) !== '') return null
  const arAgingParams = { as_of: arAgingFilters.asOf }
  const schoolYearId = toRecordId(arAgingFilters.schoolYearId)
  const gradeLevelId = toRecordId(arAgingFilters.gradeLevelId)
  const searchText = normalizeSearchText(arAgingFilters.search)
  if (schoolYearId !== null) arAgingParams.school_year_id = schoolYearId
  if (gradeLevelId !== null) arAgingParams.grade_level_id = gradeLevelId
  if (searchText !== '') arAgingParams.search = searchText
  return arAgingParams
}

function buildStudentName(student) {
  const givenName = [student?.first_name, student?.middle_name].filter(Boolean).join(' ')
  return [student?.last_name, givenName].filter(Boolean).join(NAME_SEPARATOR)
}

function buildRow(agingRow) {
  const bucketCells = {}
  for (const bucketKey of AGING_BUCKET_KEYS) bucketCells[bucketKey] = formatLedgerCell(agingRow[bucketKey])
  return {
    key: String(agingRow.assessment_id),
    studentId: agingRow.student?.id,
    schoolYearId: agingRow.school_year?.id,
    student_name: buildStudentName(agingRow.student),
    lrn: agingRow.student?.lrn ?? '',
    school_year_name: agingRow.school_year?.name,
    grade_level_name: agingRow.grade_level?.name,
    ...bucketCells,
    total: formatLedgerAmount(agingRow.total),
  }
}

export function buildArAgingRows(arAging) {
  if (!isRecordObject(arAging)) return []
  return (arAging.rows ?? []).map(buildRow)
}

export function buildArAgingFooter(arAging) {
  const footer = { total: formatLedgerAmount(arAging?.totals?.total) }
  for (const bucketKey of AGING_BUCKET_KEYS) footer[bucketKey] = formatLedgerAmount(arAging?.totals?.[bucketKey])
  return footer
}

export function buildStudentLedgerLink(arAgingRow) {
  return {
    name: STUDENT_LEDGER_ROUTE_NAME,
    params: { schoolYearId: String(arAgingRow.schoolYearId), studentId: String(arAgingRow.studentId) },
  }
}

function hasNonZeroAmount(amountText) {
  if (typeof amountText !== 'string') return true
  const absoluteText = amountText.startsWith(NEGATIVE_PREFIX) ? amountText.slice(NEGATIVE_PREFIX.length) : amountText
  return toCents(absoluteText) !== 0
}

function pickTieOutChip(tieOut) {
  if (tieOut.is_mapped !== true) return TIE_OUT_CHIPS.notMapped
  return hasNonZeroAmount(tieOut.difference) ? TIE_OUT_CHIPS.difference : TIE_OUT_CHIPS.tied
}

export function buildTieOutPanel(tieOut) {
  if (!isRecordObject(tieOut)) return null
  const isMapped = tieOut.is_mapped === true
  return {
    agingTotalLabel: AGING_TOTAL_LABEL,
    agingTotalText: formatLedgerAmount(tieOut.aging_total),
    glBalanceText: isMapped ? formatLedgerAmount(tieOut.gl_balance) : NO_VALUE_LABEL,
    differenceText: isMapped ? formatLedgerAmount(tieOut.difference) : NO_VALUE_LABEL,
    isMapped,
    hasDifference: isMapped && hasNonZeroAmount(tieOut.difference),
    chip: pickTieOutChip(tieOut),
    message: isMapped ? '' : NOT_MAPPED_MESSAGE,
  }
}

function buildCsvRow(agingRow) {
  const csvRow = {
    student: buildStudentName(agingRow.student),
    lrn: agingRow.student?.lrn ?? '',
    school_year_name: agingRow.school_year?.name,
    grade_level_name: agingRow.grade_level?.name,
    total: formatCsvAmount(agingRow.total),
  }
  for (const bucketKey of AGING_BUCKET_KEYS) csvRow[bucketKey] = formatCsvAmount(agingRow[bucketKey])
  return csvRow
}

function buildCsvTotalRow(totals) {
  const totalRow = { student: TOTAL_ROW_LABEL, total: formatCsvAmount(totals?.total) }
  for (const bucketKey of AGING_BUCKET_KEYS) totalRow[bucketKey] = formatCsvAmount(totals?.[bucketKey])
  return totalRow
}

export function buildArAgingCsv(arAging) {
  const agingRows = isRecordObject(arAging) ? (arAging.rows ?? []) : []
  return buildCsvText(AR_AGING_CSV_COLUMNS, [...agingRows.map(buildCsvRow), buildCsvTotalRow(arAging?.totals)])
}
