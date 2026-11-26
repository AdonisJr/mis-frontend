import { describe, it, expect } from 'vitest'
import {
  JOURNAL_ENTRY_COLUMNS,
  JOURNAL_LINE_COLUMNS,
  buildDeleteDraftMessage,
  buildJournalLinks,
  buildPostConfirmMessage,
  buildServerTotals,
  buildSourceLinkTarget,
  canEditJournalDraft,
  canReverseJournalEntry,
  formatAccountLabel,
  formatJournalNumber,
  getJournalSourceChip,
  getJournalStatusChip,
  isBillingEntry,
  isJournalDraft,
  listAccountOptions,
} from '@/utils/journalEntryDisplay.js'

describe('formatJournalNumber', () => {
  it('shows the number or Draft #id', () => {
    expect(formatJournalNumber({ id: 4, number: 'JV-000012' })).toBe('JV-000012')
    expect(formatJournalNumber({ id: 4, number: null })).toBe('Draft #4')
    expect(formatJournalNumber({ id: 4, number: '' })).toBe('Draft #4')
  })
})

describe('getJournalStatusChip', () => {
  it('maps the four display statuses and drops unknown ones', () => {
    expect(getJournalStatusChip('draft')).toEqual({ label: 'Draft', colorClass: 'bg-slate-200 text-slate-700' })
    expect(getJournalStatusChip('posted').colorClass).toBe('bg-green-100 text-green-800')
    expect(getJournalStatusChip('reversed').colorClass).toBe('bg-red-100 text-red-800')
    expect(getJournalStatusChip('reversal').colorClass).toBe('bg-amber-100 text-amber-800')
    expect(getJournalStatusChip('other')).toBeNull()
    expect(getJournalStatusChip('toString')).toBeNull()
    expect(getJournalStatusChip(null)).toBeNull()
  })
})

describe('entry flags', () => {
  it('reads draft from status and reverse from can_reverse === true', () => {
    expect(isJournalDraft({ status: 'draft' })).toBe(true)
    expect(isJournalDraft({ status: 'posted' })).toBe(false)
    expect(canReverseJournalEntry({ can_reverse: true })).toBe(true)
    expect(canReverseJournalEntry({ can_reverse: 'yes' })).toBe(false)
    expect(canReverseJournalEntry(null)).toBe(false)
  })
})

describe('getJournalSourceChip', () => {
  it('maps the three sources and drops unknown or null ones', () => {
    expect(getJournalSourceChip('manual')).toEqual({ label: 'Manual', colorClass: 'bg-slate-200 text-slate-700' })
    expect(getJournalSourceChip('assessment')).toEqual({ label: 'Assessment', colorClass: 'bg-accent-soft text-accent' })
    expect(getJournalSourceChip('payment')).toEqual({ label: 'Payment', colorClass: 'bg-accent-soft text-accent' })
    expect(getJournalSourceChip('refund')).toBeNull()
    expect(getJournalSourceChip('toString')).toBeNull()
    expect(getJournalSourceChip(null)).toBeNull()
  })
})

describe('billing entry guards', () => {
  it('hides edit and reverse for billing entries even when the server allows them', () => {
    const billingDraft = { source: 'payment', status: 'draft', can_reverse: true }
    expect(isBillingEntry({ source: 'assessment' })).toBe(true)
    expect(isBillingEntry(billingDraft)).toBe(true)
    expect(isBillingEntry({ source: 'manual' })).toBe(false)
    expect(isBillingEntry({})).toBe(false)
    expect(canEditJournalDraft(billingDraft)).toBe(false)
    expect(canReverseJournalEntry(billingDraft)).toBe(false)
    expect(canEditJournalDraft({ source: 'manual', status: 'draft' })).toBe(true)
    expect(canReverseJournalEntry({ source: 'manual', can_reverse: true })).toBe(true)
  })
})

describe('buildSourceLinkTarget', () => {
  it('targets the statement of account or the receipt and drops missing or unknown links', () => {
    expect(buildSourceLinkTarget({ source: 'assessment', source_link: { type: 'assessment', id: 12 } })).toEqual({
      label: 'Open statement of account',
      to: { name: 'StatementOfAccount', params: { assessmentId: 12 } },
    })
    expect(buildSourceLinkTarget({ source: 'payment', source_link: { type: 'payment', id: 30 } })).toEqual({
      label: 'Open receipt',
      to: { name: 'PaymentReceipt', params: { paymentId: 30 } },
    })
    expect(buildSourceLinkTarget({ source: 'payment', source_link: null })).toBeNull()
    expect(buildSourceLinkTarget({ source: 'manual' })).toBeNull()
    expect(buildSourceLinkTarget({ source_link: { type: 'refund', id: 1 } })).toBeNull()
  })
})

describe('buildJournalLinks', () => {
  it('links both directions only when present', () => {
    expect(buildJournalLinks({ reversal_of: { id: 3, number: 'JV-000003' }, reversed_by: null })).toEqual([
      { label: 'Reversal of', entryId: 3, number: 'JV-000003' },
    ])
    expect(buildJournalLinks({ reversal_of: null, reversed_by: { id: 9, number: 'JV-000009' } })).toEqual([
      { label: 'Reversed by', entryId: 9, number: 'JV-000009' },
    ])
    expect(buildJournalLinks({ reversal_of: null, reversed_by: null })).toEqual([])
  })
})

describe('buildServerTotals', () => {
  it('reads the totals in cents with the difference', () => {
    expect(buildServerTotals({ debit_total: '100.00', credit_total: '99.50' })).toEqual({
      debitCents: 10000,
      creditCents: 9950,
      differenceCents: 50,
    })
  })
})

describe('account options', () => {
  it('labels, sorts by code and suffixes inactive accounts', () => {
    expect(formatAccountLabel({ code: '1010', name: 'Cash' })).toBe('1010 Cash')
    expect(
      listAccountOptions([
        { id: 2, code: '2010', name: 'Payables', is_active: false },
        { id: 1, code: '1010', name: 'Cash', is_active: true },
      ]),
    ).toEqual([
      { value: '1', label: '1010 Cash' },
      { value: '2', label: '2010 Payables (inactive)' },
    ])
    expect(listAccountOptions(null)).toEqual([])
  })
})

describe('columns', () => {
  it('lists the entry and line column keys', () => {
    expect(JOURNAL_ENTRY_COLUMNS.map((column) => column.key)).toEqual([
      'number',
      'entry_date',
      'description',
      'reference',
      'source',
      'debit_total',
      'display_status',
    ])
    expect(JOURNAL_LINE_COLUMNS.map((column) => column.key)).toEqual(['account', 'memo', 'debit', 'credit'])
  })
})

describe('dialog messages', () => {
  it('builds the delete text for a draft', () => {
    expect(buildDeleteDraftMessage({ id: 4, number: null })).toBe('Delete Draft #4? This cannot be undone.')
  })

  it('builds the post text with the total', () => {
    expect(buildPostConfirmMessage({ debitCents: 123450 })).toBe(
      'Post this entry for ₱1,234.50? Posted entries cannot be edited or deleted, only reversed.',
    )
  })
})
