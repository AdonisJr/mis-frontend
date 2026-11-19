import { describe, it, expect } from 'vitest'
import {
  PAYMENT_COLUMNS,
  PAYMENT_HISTORY_COLUMNS,
  RECEIPT_DISCLAIMER,
  VALID_CHIP,
  VOIDED_CHIP,
  buildLedgerScheduleRows,
  buildLedgerSummaryRows,
  buildReceiptVoidText,
  buildStatementPaymentRows,
  buildVoidPromptText,
  canVoidPayment,
  formatPaymentReference,
  getMethodLabel,
  getPaymentStatusChip,
  getScheduleStatusChip,
  isFullyPaid,
  isPaymentVoided,
} from '@/utils/paymentDisplay.js'

const VOIDED_AT = '2026-11-19T08:00:00.000000Z'

describe('payment columns', () => {
  it('lists the payment and history column keys', () => {
    expect(PAYMENT_COLUMNS.map((column) => column.key)).toEqual([
      'ar_number',
      'payment_date',
      'student',
      'amount',
      'method',
      'reference_no',
      'recorded_by',
      'status',
    ])
    expect(PAYMENT_HISTORY_COLUMNS.map((column) => column.key)).not.toContain('student')
    expect(PAYMENT_HISTORY_COLUMNS).toHaveLength(7)
  })
})

describe('getMethodLabel', () => {
  it('labels all four methods and falls back to a dash', () => {
    expect(getMethodLabel('cash')).toBe('Cash')
    expect(getMethodLabel('e_wallet')).toBe('E-wallet (GCash/Maya)')
    expect(getMethodLabel('bank_transfer')).toBe('Bank transfer / deposit')
    expect(getMethodLabel('check')).toBe('Check')
    expect(getMethodLabel('bitcoin')).toBe('—')
  })
})

describe('payment status', () => {
  it('shows Valid or Voided from voided_at', () => {
    expect(isPaymentVoided({ voided_at: VOIDED_AT })).toBe(true)
    expect(isPaymentVoided({ voided_at: null })).toBe(false)
    expect(isPaymentVoided({ voided_at: '' })).toBe(false)
    expect(getPaymentStatusChip({ voided_at: null })).toBe(VALID_CHIP)
    expect(getPaymentStatusChip({ voided_at: VOIDED_AT })).toBe(VOIDED_CHIP)
  })
})

describe('canVoidPayment', () => {
  it('reads only the server can_void flag and never allows a voided payment', () => {
    expect(canVoidPayment({ can_void: true, voided_at: null })).toBe(true)
    expect(canVoidPayment({ can_void: false })).toBe(false)
    expect(canVoidPayment({})).toBe(false)
    expect(canVoidPayment({ can_void: 'true' })).toBe(false)
    expect(canVoidPayment({ can_void: true, voided_at: VOIDED_AT })).toBe(false)
    expect(canVoidPayment(null)).toBe(false)
  })
})

describe('getScheduleStatusChip', () => {
  it('maps paid, partial, unpaid and falls back to Unpaid', () => {
    expect(getScheduleStatusChip('paid').label).toBe('Paid')
    expect(getScheduleStatusChip('partial').label).toBe('Partial')
    expect(getScheduleStatusChip('unpaid').label).toBe('Unpaid')
    expect(getScheduleStatusChip('weird').label).toBe('Unpaid')
  })
})

describe('buildLedgerScheduleRows', () => {
  it('formats texts and flags overdue only for a true is_overdue', () => {
    const scheduleRows = buildLedgerScheduleRows([
      { sequence: 1, label: 'Downpayment', due_date: '2026-06-01', amount: '1000.00', paid: '0.00', status: 'unpaid', is_overdue: true },
      { sequence: 2, label: 'Monthly 1', due_date: '2026-07-01', amount: '500.00', paid: '500.00', status: 'paid', is_overdue: 'yes' },
    ])
    expect(scheduleRows[0]).toMatchObject({
      key: 1,
      label: 'Downpayment',
      dueDateText: 'Jun 1, 2026',
      amountText: '₱1,000.00',
      paidText: '₱0.00',
      isOverdue: true,
    })
    expect(scheduleRows[0].statusChip.label).toBe('Unpaid')
    expect(scheduleRows[1].isOverdue).toBe(false)
    expect(buildLedgerScheduleRows(null)).toEqual([])
  })
})

describe('buildLedgerSummaryRows', () => {
  it('returns net, paid and an emphasized balance; missing values show a dash', () => {
    const summaryRows = buildLedgerSummaryRows({ net_total: '5000.00', total_paid: '1500.00', balance: '3500.00' })
    expect(summaryRows.map((summaryRow) => summaryRow.amountText)).toEqual(['₱5,000.00', '₱1,500.00', '₱3,500.00'])
    expect(summaryRows.map((summaryRow) => summaryRow.isEmphasized)).toEqual([undefined, undefined, true])
    expect(buildLedgerSummaryRows({}).every((summaryRow) => summaryRow.amountText === '—')).toBe(true)
  })
})

describe('buildStatementPaymentRows', () => {
  it('shows total paid and balance, or dashes when missing', () => {
    expect(buildStatementPaymentRows({ total_paid: '100.00', balance: '900.00' })).toEqual([
      { key: 'paid', label: 'Total paid', amountText: '₱100.00' },
      { key: 'balance', label: 'Balance', amountText: '₱900.00', isEmphasized: true },
    ])
    expect(buildStatementPaymentRows({})[0].amountText).toBe('—')
  })
})

describe('formatPaymentReference', () => {
  it('trims and falls back to a dash for blank or null', () => {
    expect(formatPaymentReference('  GC-123 ')).toBe('GC-123')
    expect(formatPaymentReference('   ')).toBe('—')
    expect(formatPaymentReference(null)).toBe('—')
  })
})

describe('isFullyPaid', () => {
  it('is true only for a zero balance', () => {
    expect(isFullyPaid('0.00')).toBe(true)
    expect(isFullyPaid('0.01')).toBe(false)
    expect(isFullyPaid('abc')).toBe(false)
  })
})

describe('buildVoidPromptText', () => {
  it('names the AR number and amount, and is empty for a non-object', () => {
    expect(buildVoidPromptText({ ar_number: 'AR-000007', amount: '1500.00' })).toBe(
      'Void AR-000007 for ₱1,500.00? The payment stays on record as voided and its amount returns to the balance.',
    )
    expect(buildVoidPromptText(null)).toBe('')
  })
})

describe('buildReceiptVoidText', () => {
  it('names who voided and why, omits by without a user, and is empty when not voided', () => {
    const voidedReceipt = { voided_at: VOIDED_AT, voided_by: { id: 2, name: 'Cora Cash' }, void_reason: 'Wrong student' }
    expect(buildReceiptVoidText(voidedReceipt)).toBe('Voided Nov 19, 2026 by Cora Cash. Reason: Wrong student')
    expect(buildReceiptVoidText({ ...voidedReceipt, voided_by: null })).toBe('Voided Nov 19, 2026. Reason: Wrong student')
    expect(buildReceiptVoidText({ voided_at: null })).toBe('')
  })
})

describe('RECEIPT_DISCLAIMER', () => {
  it('states that it is not an official receipt', () => {
    expect(RECEIPT_DISCLAIMER).toBe('This is an acknowledgment receipt, not an official receipt.')
  })
})
