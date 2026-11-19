import { formatDiscountBase, formatDiscountValue, getSourceChip } from '@/utils/discountDisplay.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { FEE_ITEM_CATEGORIES, getCategoryLabel } from '@/utils/feeItemForm.js'
import { formatPeso, formatPesoFromCents, toCents } from '@/utils/moneyDisplay.js'
import { ADJUSTMENT_KIND_DISCOUNT, ADJUSTMENT_KIND_SURCHARGE } from '@/utils/paymentPlanForm.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const ASSESSMENT_COLUMNS = Object.freeze(
  [
    { key: 'student', label: 'Student' },
    { key: 'grade_level', label: 'Grade level' },
    { key: 'plan', label: 'Plan' },
    { key: 'net_total', label: 'Net total' },
    { key: 'created_at', label: 'Assessed' },
  ].map((column) => Object.freeze(column)),
)

export const MINUS_SIGN = '−'
export const PLUS_SIGN = '+'
export const SCHOOL_NAME_FALLBACK = 'MIS'
export const REASSESS_ASSIGN_PROMPT = 'Assign the discount and re-assess with the current payment plan?'
export const REASSESS_REMOVE_PROMPT = 'Remove the discount and re-assess with the current payment plan?'

const STATUS_CURRENT = 'current'
const REASSESS_ASSIGN_KIND = 'assign'
const GRADE_LEVEL_PROGRAM_SEPARATOR = ' · '
const ZERO_PESO_TEXT = '₱0.00'
const STATEMENT_DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function formatAssessmentGradeLevel(assessment) {
  const gradeLevelName = assessment?.grade_level?.name
  if (!gradeLevelName) return NO_VALUE_LABEL
  const programCode = assessment.program?.code
  if (!programCode) return gradeLevelName
  return `${gradeLevelName}${GRADE_LEVEL_PROGRAM_SEPARATOR}${programCode}`
}

export function formatAssessmentPlan(assessment) {
  return assessment?.plan_name ?? assessment?.plan?.name ?? NO_VALUE_LABEL
}

export function formatSignedPeso(amountText, sign) {
  const cents = toCents(amountText)
  if (cents === null) return NO_VALUE_LABEL
  if (cents === 0) return ZERO_PESO_TEXT
  return sign + formatPesoFromCents(cents)
}

export function buildCategoryTotalRows(assessment) {
  return FEE_ITEM_CATEGORIES.map((category) => ({
    key: category,
    label: getCategoryLabel(category),
    amountText: formatPeso(assessment?.subtotals?.[category]),
  }))
}

export function formatAdjustmentLabel(planAdjustment) {
  if (!isRecordObject(planAdjustment)) return ''
  const valueText = formatDiscountValue({ value_type: planAdjustment.type, value: planAdjustment.value })
  if (planAdjustment.kind === ADJUSTMENT_KIND_DISCOUNT) return `Plan discount (${valueText})`
  if (planAdjustment.kind === ADJUSTMENT_KIND_SURCHARGE) return `Plan surcharge (${valueText})`
  return ''
}

function buildAdjustmentRow(planAdjustment) {
  const sign = planAdjustment.kind === ADJUSTMENT_KIND_DISCOUNT ? MINUS_SIGN : PLUS_SIGN
  return {
    key: 'adjustment',
    label: formatAdjustmentLabel(planAdjustment),
    amountText: formatSignedPeso(planAdjustment.amount, sign),
  }
}

export function buildTotalsRows(assessment) {
  const planAdjustment = assessment?.plan?.adjustment
  const adjustmentRows = isRecordObject(planAdjustment) ? [buildAdjustmentRow(planAdjustment)] : []
  return [
    { key: 'gross', label: 'Gross total', amountText: formatPeso(assessment?.gross_total) },
    { key: 'discounts', label: 'Student discounts', amountText: formatSignedPeso(assessment?.discount_total, MINUS_SIGN) },
    ...adjustmentRows,
    { key: 'net', label: 'Net total', amountText: formatPeso(assessment?.net_total), isEmphasized: true },
  ]
}

function buildCategoryGroup(feeLines, category) {
  return {
    category,
    label: getCategoryLabel(category),
    lines: feeLines
      .filter((feeLine) => feeLine?.category === category)
      .map((feeLine, lineIndex) => ({
        key: `${category}-${lineIndex}`,
        itemName: feeLine.name,
        amountText: formatPeso(feeLine.amount),
      })),
  }
}

export function groupFeeLinesByCategory(feeLines, subtotals) {
  if (!Array.isArray(feeLines)) return []
  return FEE_ITEM_CATEGORIES.map((category) => buildCategoryGroup(feeLines, category))
    .filter((categoryGroup) => categoryGroup.lines.length > 0)
    .map((categoryGroup) => ({ ...categoryGroup, subtotalText: formatPeso(subtotals?.[categoryGroup.category]) }))
}

function buildCappedText(discount) {
  const appliedCents = toCents(discount.applied_amount)
  const computedCents = toCents(discount.computed_amount)
  if (appliedCents === null || computedCents === null || appliedCents >= computedCents) return ''
  return `Capped from ${formatPeso(discount.computed_amount)}`
}

function formatReferenceText(referenceNo) {
  if (typeof referenceNo !== 'string' || referenceNo.trim() === '') return NO_VALUE_LABEL
  return referenceNo.trim()
}

export function buildDiscountRows(discounts) {
  if (!Array.isArray(discounts)) return []
  return discounts.map((discount, discountIndex) => ({
    key: `${discountIndex}-${discount.name}`,
    typeName: discount.name,
    sourceChip: getSourceChip(discount.source),
    valueText: formatDiscountValue(discount),
    baseText: formatDiscountBase(discount.base),
    referenceText: formatReferenceText(discount.reference_no),
    amountText: formatSignedPeso(discount.applied_amount, MINUS_SIGN),
    cappedText: buildCappedText(discount),
  }))
}

export function buildScheduleRows(schedule) {
  if (!Array.isArray(schedule)) return []
  return schedule.map((installment) => ({
    key: installment.sequence,
    label: installment.label,
    dueDateText: formatDisplayDate(installment.due_date),
    amountText: formatPeso(installment.amount),
  }))
}

export function getAssessmentStatusChip(status) {
  if (status === STATUS_CURRENT) return { label: 'Current', colorClass: 'bg-accent-soft text-accent' }
  return { label: 'Superseded', colorClass: 'bg-slate-200 text-slate-700' }
}

export function formatStatementDate(dateValue) {
  const isValidDate = dateValue instanceof Date && !Number.isNaN(dateValue.getTime())
  return isValidDate ? STATEMENT_DATE_FORMAT.format(dateValue) : NO_VALUE_LABEL
}

export function formatTimestampDate(timestampText) {
  if (typeof timestampText !== 'string') return NO_VALUE_LABEL
  return formatStatementDate(new Date(timestampText))
}

export function formatSupersededText(assessment) {
  if (!assessment?.superseded_at) return ''
  const supersededText = `Superseded ${formatTimestampDate(assessment.superseded_at)}`
  const supersededByName = assessment.superseded_by?.name
  return supersededByName ? `${supersededText} by ${supersededByName}` : supersededText
}

export function buildReassessConfirmMessage(assessment, paymentPlan) {
  if (!isRecordObject(assessment) || !isRecordObject(paymentPlan)) return ''
  const studentName = formatEnrollmentStudentName(assessment.student)
  return `Re-assess ${studentName} with ${paymentPlan.name}? The current assessment becomes read-only history.`
}

export function buildReassessDiscountMessage(serverMessage, actionKind) {
  const prompt = actionKind === REASSESS_ASSIGN_KIND ? REASSESS_ASSIGN_PROMPT : REASSESS_REMOVE_PROMPT
  if (typeof serverMessage !== 'string' || serverMessage.trim() === '') return prompt
  return `${serverMessage} ${prompt}`
}

export function buildStatementSchoolName(envValue) {
  if (typeof envValue !== 'string' || envValue.trim() === '') return SCHOOL_NAME_FALLBACK
  return envValue.trim()
}
