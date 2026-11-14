import { describe, it, expect } from 'vitest'
import {
  PAYMENT_PLAN_COLUMNS,
  buildPaymentPlanDeactivateMessage,
  buildPaymentPlanDeleteMessage,
  buildPaymentPlanReactivateMessage,
  formatAdjustment,
  formatDownPayment,
  formatFirstDueDate,
  formatInstallmentCount,
  formatLastDueDate,
  formatPercent,
  normalizePaymentPlanCopyResult,
} from '@/utils/paymentPlanDisplay.js'

const PLAN_WITH_DATES = {
  installments: [
    { sequence: 1, due_date: '2026-08-01' },
    { sequence: 2, due_date: '2026-11-01' },
    { sequence: 3, due_date: '2027-02-01' },
  ],
}

describe('PAYMENT_PLAN_COLUMNS', () => {
  it('lists the seven columns in order with their labels', () => {
    expect(PAYMENT_PLAN_COLUMNS.map((column) => [column.key, column.label])).toEqual([
      ['name', 'Name'],
      ['down_payment', 'Down payment'],
      ['installments', 'Installments'],
      ['first_due_date', 'First due'],
      ['last_due_date', 'Last due'],
      ['adjustment', 'Adjustment'],
      ['is_active', 'Status'],
    ])
  })
})

describe('formatPercent', () => {
  it('trims trailing zeros and rejects non-numbers', () => {
    expect(formatPercent('20.00')).toBe('20%')
    expect(formatPercent('12.50')).toBe('12.5%')
    expect(formatPercent('0.05')).toBe('0.05%')
    expect(formatPercent('100')).toBe('100%')
    expect(formatPercent('abc')).toBe('—')
  })
})

describe('formatDownPayment', () => {
  it('formats fixed as pesos, percent as percent, anything else as a dash', () => {
    expect(formatDownPayment({ down_payment: { type: 'fixed', value: '1000.00' } })).toBe('₱1,000.00')
    expect(formatDownPayment({ down_payment: { type: 'percent', value: '20.00' } })).toBe('20%')
    expect(formatDownPayment({ down_payment: null })).toBe('—')
    expect(formatDownPayment({ down_payment: { type: 'weird', value: '5.00' } })).toBe('—')
  })
})

describe('formatInstallmentCount', () => {
  it('shows Cash for none, the count otherwise and a dash when missing', () => {
    expect(formatInstallmentCount({ installments: [] })).toBe('Cash')
    expect(formatInstallmentCount(PLAN_WITH_DATES)).toBe('3')
    expect(formatInstallmentCount({})).toBe('—')
  })
})

describe('formatFirstDueDate and formatLastDueDate', () => {
  it('format the first and last installment and show a dash for Cash', () => {
    expect(formatFirstDueDate(PLAN_WITH_DATES)).toBe('Aug 1, 2026')
    expect(formatLastDueDate(PLAN_WITH_DATES)).toBe('Feb 1, 2027')
    expect(formatFirstDueDate({ installments: [] })).toBe('—')
    expect(formatLastDueDate({ installments: [] })).toBe('—')
  })
})

describe('formatAdjustment', () => {
  it('signs discounts and surcharges and shows a dash for missing or invalid data', () => {
    expect(formatAdjustment({ adjustment: { kind: 'discount', type: 'percent', value: '5.00' } })).toBe('−5% tuition')
    expect(formatAdjustment({ adjustment: { kind: 'surcharge', type: 'fixed', value: '500.00' } })).toBe(
      '+₱500.00 tuition',
    )
    expect(formatAdjustment({ adjustment: null })).toBe('—')
    expect(formatAdjustment({ adjustment: { kind: 'bonus', type: 'percent', value: '5.00' } })).toBe('—')
    expect(formatAdjustment({ adjustment: { kind: 'discount', type: 'percent', value: 'abc' } })).toBe('—')
  })
})

describe('confirm messages', () => {
  it('name the plan and return an empty text for a non-object', () => {
    const paymentPlan = { name: 'Quarterly' }
    expect(buildPaymentPlanDeleteMessage(paymentPlan)).toBe(
      'Delete the Quarterly payment plan? Its installments are removed. This cannot be undone.',
    )
    expect(buildPaymentPlanDeactivateMessage(paymentPlan)).toBe(
      'Deactivate Quarterly? It stays in the list as Inactive until reactivated.',
    )
    expect(buildPaymentPlanReactivateMessage(paymentPlan)).toBe('Reactivate Quarterly? It becomes active again.')
    expect(buildPaymentPlanDeleteMessage(null)).toBe('')
    expect(buildPaymentPlanDeactivateMessage('x')).toBe('')
    expect(buildPaymentPlanReactivateMessage(undefined)).toBe('')
  })
})

describe('normalizePaymentPlanCopyResult copied text', () => {
  it('words zero, one and many copied plans', () => {
    expect(normalizePaymentPlanCopyResult({ copied_count: 0, skipped: [] }).copiedText).toBe('No plans were copied.')
    expect(normalizePaymentPlanCopyResult({ copied_count: 1, skipped: [] }).copiedText).toBe('1 plan copied.')
    expect(normalizePaymentPlanCopyResult({ copied_count: 3, skipped: [] }).copiedText).toBe('3 plans copied.')
  })
})

describe('normalizePaymentPlanCopyResult skipped rows', () => {
  it('keeps name and reason, falls back for bad values and survives a malformed response', () => {
    const copyResult = normalizePaymentPlanCopyResult({
      copied_count: 1,
      skipped: [{ name: 'Quarterly', reason: 'Already exists.' }, { reason: 5 }],
    })
    expect(copyResult.skipped).toEqual([
      { key: 0, label: 'Quarterly', reason: 'Already exists.' },
      { key: 1, label: '—', reason: '' },
    ])
    expect(normalizePaymentPlanCopyResult(null)).toEqual({ copiedText: 'No plans were copied.', skipped: [] })
  })
})
