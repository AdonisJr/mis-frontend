import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatTimestampDate } from '@/utils/assessmentDisplay.js'
import { formatPeso, toCents } from '@/utils/moneyDisplay.js'
import { PAYMENT_METHODS } from '@/utils/paymentForm.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

const HISTORY_EXCLUDED_KEY = 'student'

export const PAYMENT_COLUMNS = Object.freeze(
  [
    { key: 'ar_number', label: 'AR no.' },
    { key: 'payment_date', label: 'Date' },
    { key: 'student', label: 'Student' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'reference_no', label: 'Reference' },
    { key: 'recorded_by', label: 'Recorded by' },
    { key: 'status', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

export const PAYMENT_HISTORY_COLUMNS = Object.freeze(
  PAYMENT_COLUMNS.filter((column) => column.key !== HISTORY_EXCLUDED_KEY),
)

export const VALID_CHIP = Object.freeze({ label: 'Valid', colorClass: 'bg-green-100 text-green-800' })
export const VOIDED_CHIP = Object.freeze({ label: 'Voided', colorClass: 'bg-red-100 text-red-800' })
export const OVERDUE_CHIP = Object.freeze({ label: 'Overdue', colorClass: 'bg-red-100 text-red-800' })
export const SCHEDULE_STATUS_CHIPS = Object.freeze({
  paid: Object.freeze({ label: 'Paid', colorClass: 'bg-green-100 text-green-800' }),
  partial: Object.freeze({ label: 'Partial', colorClass: 'bg-amber-100 text-amber-800' }),
  unpaid: Object.freeze({ label: 'Unpaid', colorClass: 'bg-slate-200 text-slate-700' }),
})
export const RECEIPT_DISCLAIMER = 'This is an acknowledgment receipt, not an official receipt.'

const UNPAID_STATUS = 'unpaid'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function isPaymentVoided(payment) {
  return typeof payment?.voided_at === 'string' && payment.voided_at !== ''
}

export function getPaymentStatusChip(payment) {
  return isPaymentVoided(payment) ? VOIDED_CHIP : VALID_CHIP
}

export function canVoidPayment(payment) {
  return payment?.can_void === true && !isPaymentVoided(payment)
}

export function getMethodLabel(method) {
  const methodOption = PAYMENT_METHODS.find((paymentMethod) => paymentMethod.value === method)
  return methodOption?.label ?? NO_VALUE_LABEL
}

export function formatPaymentReference(referenceNo) {
  if (typeof referenceNo !== 'string' || referenceNo.trim() === '') return NO_VALUE_LABEL
  return referenceNo.trim()
}

export function getScheduleStatusChip(status) {
  return SCHEDULE_STATUS_CHIPS[status] ?? SCHEDULE_STATUS_CHIPS[UNPAID_STATUS]
}

export function buildLedgerScheduleRows(schedule) {
  if (!Array.isArray(schedule)) return []
  return schedule.map((installment) => ({
    key: installment.sequence,
    label: installment.label,
    dueDateText: formatDisplayDate(installment.due_date),
    amountText: formatPeso(installment.amount),
    paidText: formatPeso(installment.paid),
    statusChip: getScheduleStatusChip(installment.status),
    isOverdue: installment.is_overdue === true,
  }))
}

export function buildLedgerSummaryRows(ledger) {
  return [
    { key: 'net', label: 'Net total', amountText: formatPeso(ledger?.net_total) },
    { key: 'paid', label: 'Total paid', amountText: formatPeso(ledger?.total_paid) },
    { key: 'balance', label: 'Balance', amountText: formatPeso(ledger?.balance), isEmphasized: true },
  ]
}

export function buildStatementPaymentRows(assessment) {
  return [
    { key: 'paid', label: 'Total paid', amountText: formatPeso(assessment?.total_paid) },
    { key: 'balance', label: 'Balance', amountText: formatPeso(assessment?.balance), isEmphasized: true },
  ]
}

export function isFullyPaid(balanceText) {
  return toCents(balanceText) === 0
}

export function buildVoidPromptText(payment) {
  if (!isRecordObject(payment)) return ''
  return `Void ${payment.ar_number} for ${formatPeso(payment.amount)}? The payment stays on record as voided and its amount returns to the balance.`
}

export function buildReceiptVoidText(receipt) {
  if (!isPaymentVoided(receipt)) return ''
  const voidedText = `Voided ${formatTimestampDate(receipt.voided_at)}`
  const voidedByName = receipt.voided_by?.name
  const attributedText = voidedByName ? `${voidedText} by ${voidedByName}` : voidedText
  return `${attributedText}. Reason: ${receipt.void_reason}`
}
