import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatPeso, toCents } from '@/utils/moneyDisplay.js'
import { ADJUSTMENT_KIND_DISCOUNT, ADJUSTMENT_KIND_SURCHARGE, VALUE_TYPE_FIXED, VALUE_TYPE_PERCENT } from '@/utils/paymentPlanForm.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const CASH_LABEL = 'Cash'

export const PAYMENT_PLAN_COLUMNS = Object.freeze(
  [
    { key: 'name', label: 'Name' },
    { key: 'down_payment', label: 'Down payment' },
    { key: 'installments', label: 'Installments' },
    { key: 'first_due_date', label: 'First due' },
    { key: 'last_due_date', label: 'Last due' },
    { key: 'adjustment', label: 'Adjustment' },
    { key: 'is_active', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

const MINUS_SIGN = '−'
const PLUS_SIGN = '+'
const HUNDREDTHS_PER_UNIT = 100
const TRAILING_ZEROS_PATTERN = /0+$/

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function formatPercent(percentValue) {
  const hundredths = toCents(percentValue)
  if (hundredths === null) return NO_VALUE_LABEL
  const wholeText = String(Math.floor(hundredths / HUNDREDTHS_PER_UNIT))
  const fractionText = String(hundredths % HUNDREDTHS_PER_UNIT)
    .padStart(2, '0')
    .replace(TRAILING_ZEROS_PATTERN, '')
  return `${fractionText === '' ? wholeText : `${wholeText}.${fractionText}`}%`
}

function formatTypedValue(valueType, valueText) {
  if (valueType === VALUE_TYPE_FIXED) return formatPeso(valueText)
  if (valueType === VALUE_TYPE_PERCENT) return formatPercent(valueText)
  return NO_VALUE_LABEL
}

export function formatDownPayment(paymentPlan) {
  const downPayment = paymentPlan?.down_payment
  if (!isRecordObject(downPayment)) return NO_VALUE_LABEL
  return formatTypedValue(downPayment.type, downPayment.value)
}

export function formatInstallmentCount(paymentPlan) {
  const installments = paymentPlan?.installments
  if (!Array.isArray(installments)) return NO_VALUE_LABEL
  return installments.length === 0 ? CASH_LABEL : String(installments.length)
}

function formatInstallmentDate(installment) {
  if (!isRecordObject(installment)) return NO_VALUE_LABEL
  return formatDisplayDate(installment.due_date) ?? NO_VALUE_LABEL
}

export function formatFirstDueDate(paymentPlan) {
  const installments = paymentPlan?.installments
  if (!Array.isArray(installments)) return NO_VALUE_LABEL
  return formatInstallmentDate(installments[0])
}

export function formatLastDueDate(paymentPlan) {
  const installments = paymentPlan?.installments
  if (!Array.isArray(installments)) return NO_VALUE_LABEL
  return formatInstallmentDate(installments[installments.length - 1])
}

function pickAdjustmentSign(adjustmentKind) {
  if (adjustmentKind === ADJUSTMENT_KIND_DISCOUNT) return MINUS_SIGN
  if (adjustmentKind === ADJUSTMENT_KIND_SURCHARGE) return PLUS_SIGN
  return ''
}

export function formatAdjustment(paymentPlan) {
  const adjustment = paymentPlan?.adjustment
  if (!isRecordObject(adjustment)) return NO_VALUE_LABEL
  const sign = pickAdjustmentSign(adjustment.kind)
  const amountText = formatTypedValue(adjustment.type, adjustment.value)
  if (sign === '' || amountText === NO_VALUE_LABEL) return NO_VALUE_LABEL
  return `${sign}${amountText} tuition`
}

export function buildPaymentPlanDeleteMessage(paymentPlan) {
  if (!isRecordObject(paymentPlan)) return ''
  return `Delete the ${paymentPlan.name} payment plan? Its installments are removed. This cannot be undone.`
}

export function buildPaymentPlanDeactivateMessage(paymentPlan) {
  if (!isRecordObject(paymentPlan)) return ''
  return `Deactivate ${paymentPlan.name}? It stays in the list as Inactive until reactivated.`
}

export function buildPaymentPlanReactivateMessage(paymentPlan) {
  if (!isRecordObject(paymentPlan)) return ''
  return `Reactivate ${paymentPlan.name}? It becomes active again.`
}

function buildCopiedText(copiedCount) {
  if (copiedCount === 0) return 'No plans were copied.'
  if (copiedCount === 1) return '1 plan copied.'
  return `${copiedCount} plans copied.`
}

function toSkippedRow(skippedRow, rowIndex) {
  const name = skippedRow?.name
  const reason = skippedRow?.reason
  return {
    key: rowIndex,
    label: typeof name === 'string' && name !== '' ? name : NO_VALUE_LABEL,
    reason: typeof reason === 'string' ? reason : '',
  }
}

export function normalizePaymentPlanCopyResult(copyResponse) {
  const copiedCount = copyResponse?.copied_count
  const skippedRows = copyResponse?.skipped
  return {
    copiedText: buildCopiedText(Number.isInteger(copiedCount) ? copiedCount : 0),
    skipped: Array.isArray(skippedRows) ? skippedRows.map(toSkippedRow) : [],
  }
}
