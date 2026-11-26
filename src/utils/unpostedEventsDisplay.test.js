import { describe, it, expect } from 'vitest'
import {
  UNPOSTED_EVENT_COLUMNS,
  buildPostPendingSummary,
  buildUnpostedRows,
  formatUnpostedReason,
  formatUnpostedType,
  pickPostPendingToastKind,
} from '@/utils/unpostedEventsDisplay.js'

const STUDENT = { id: 1, lrn: '123', first_name: 'Ana', middle_name: 'Lopez', last_name: 'Cruz' }
const EVENT = {
  type: 'payment',
  source_id: 7,
  date: '2026-11-20',
  student: STUDENT,
  amount: '1500.00',
  reason: 'mapping_missing',
  reason_message: 'No account is mapped.',
}

describe('columns and labels', () => {
  it('lists the column keys', () => {
    expect(UNPOSTED_EVENT_COLUMNS.map((column) => column.key)).toEqual(['type', 'date', 'student', 'amount', 'reason'])
  })

  it('labels the four event types and falls back to the raw value', () => {
    expect(formatUnpostedType('assessment')).toBe('Assessment')
    expect(formatUnpostedType('assessment_reversal')).toBe('Re-assessment reversal')
    expect(formatUnpostedType('payment')).toBe('Payment')
    expect(formatUnpostedType('payment_void')).toBe('Payment void')
    expect(formatUnpostedType('refund')).toBe('refund')
  })

  it('labels reasons, then reason_message, then the code', () => {
    expect(formatUnpostedReason({ reason: 'mapping_missing' })).toBe('Account mapping missing')
    expect(formatUnpostedReason({ reason: 'account_inactive' })).toBe('Mapped account inactive')
    expect(formatUnpostedReason({ reason: 'not_posted' })).toBe('Not posted yet')
    expect(formatUnpostedReason({ reason: 'amount_over_limit' })).toBe('Amount above limit')
    expect(formatUnpostedReason({ reason: 'posting_refused' })).toBe('Refused by the journal')
    expect(formatUnpostedReason({ reason: 'unexpected_error' })).toBe('Unexpected error')
    expect(formatUnpostedReason({ reason: 'new_code', reason_message: 'Something new.' })).toBe('Something new.')
    expect(formatUnpostedReason({ reason: 'new_code' })).toBe('new_code')
  })
})

describe('buildUnpostedRows', () => {
  it('builds display rows and tolerates a non-array and a missing student', () => {
    expect(buildUnpostedRows([EVENT])).toEqual([
      {
        key: 'payment-7',
        type: 'Payment',
        date: 'Nov 20, 2026',
        student: 'Cruz, Ana L.',
        amount: '₱1,500.00',
        reason: 'Account mapping missing',
      },
    ])
    expect(buildUnpostedRows([{ ...EVENT, student: null }])[0].student).toBe('—')
    expect(buildUnpostedRows(null)).toEqual([])
  })
})

describe('buildPostPendingSummary', () => {
  it('words the posted count in singular and plural', () => {
    expect(buildPostPendingSummary({ posted_count: 1, failed_count: 0, failures: [] })).toEqual({
      postedText: 'Posted 1 event.',
      failedText: '',
      failedLines: [],
    })
    expect(buildPostPendingSummary({ posted_count: 3, failed_count: 0, failures: [] }).postedText).toBe('Posted 3 events.')
  })

  it('lists the failures with their reasons', () => {
    const failures = [EVENT, { ...EVENT, type: 'assessment', source_id: 9, reason: 'account_inactive' }]
    const summary = buildPostPendingSummary({ posted_count: 2, failed_count: 2, failures })
    expect(summary.postedText).toBe('Posted 2 events.')
    expect(summary.failedText).toBe('2 could not be posted:')
    expect(summary.failedLines).toEqual([
      { key: 'payment-7', text: 'Payment · Nov 20, 2026 · Cruz, Ana L. — Account mapping missing' },
      { key: 'assessment-9', text: 'Assessment · Nov 20, 2026 · Cruz, Ana L. — Mapped account inactive' },
    ])
  })

  it('says nothing to post for zero, empty and non-object responses', () => {
    const empty = { postedText: 'Nothing to post.', failedText: '', failedLines: [] }
    expect(buildPostPendingSummary({ posted_count: 0, failed_count: 0, failures: [] })).toEqual(empty)
    expect(buildPostPendingSummary(null)).toEqual(empty)
    expect(buildPostPendingSummary('x')).toEqual(empty)
  })
})

describe('pickPostPendingToastKind', () => {
  it('picks success, warning, error and info', () => {
    expect(pickPostPendingToastKind({ posted_count: 2, failed_count: 0, failures: [] })).toBe('success')
    expect(pickPostPendingToastKind({ posted_count: 2, failed_count: 1, failures: [EVENT] })).toBe('warning')
    expect(pickPostPendingToastKind({ posted_count: 0, failed_count: 1, failures: [EVENT] })).toBe('error')
    expect(pickPostPendingToastKind({ posted_count: 0, failed_count: 0, failures: [] })).toBe('info')
    expect(pickPostPendingToastKind(null)).toBe('info')
  })
})
