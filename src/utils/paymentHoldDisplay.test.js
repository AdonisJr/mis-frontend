import { describe, it, expect } from 'vitest'
import {
  ALLOWED_SUMMARY_TEXT,
  HOLD_COLUMNS,
  NOTE_STATUS_OPTIONS,
  buildCancelPromptText,
  buildHoldNoticeRows,
  buildHoldNoticeSummary,
  buildLedgerHoldBannerText,
  buildNoteRows,
  buildNoteStatusRule,
  derivePromissoryNoteStatus,
  findActiveNote,
  getNoteStatusChip,
  isNoteCancellable,
  listGrantableYears,
} from '@/utils/paymentHoldDisplay.js'

const TODAY = '2026-11-19'
const OPEN_RULE = buildNoteStatusRule('500.00', TODAY)
const PAID_RULE = buildNoteStatusRule('0.00', TODAY)
const NOTE = { id: 1, promise_date: '2026-11-19', promised_amount: '500.00', cancelled_at: null }
const YEAR_UNCOVERED = { school_year: { id: 3, name: '2025-2026' }, balance: '12345.6', active_note: null }
const YEAR_COVERED = {
  school_year: { id: 2, name: '2024-2025' },
  balance: '100.00',
  active_note: { id: 9, promise_date: '2026-12-01', promised_amount: '100.00' },
}

describe('statuses', () => {
  it('lists the five status values in order', () => {
    expect(NOTE_STATUS_OPTIONS.map((statusOption) => statusOption.value)).toEqual([
      'none',
      'active',
      'broken',
      'settled',
      'cancelled',
    ])
  })
})

describe('derivePromissoryNoteStatus', () => {
  it('lets cancelled win over paid and a future date', () => {
    const cancelledNote = { ...NOTE, promise_date: '2027-01-01', cancelled_at: '2026-11-10T01:00:00Z' }
    expect(derivePromissoryNoteStatus(cancelledNote, PAID_RULE)).toBe('cancelled')
  })

  it('is settled when the year is paid even before the promise date', () => {
    expect(derivePromissoryNoteStatus({ ...NOTE, promise_date: '2027-01-01' }, PAID_RULE)).toBe('settled')
  })

  it('is active on the promise date and before it', () => {
    expect(derivePromissoryNoteStatus(NOTE, OPEN_RULE)).toBe('active')
    expect(derivePromissoryNoteStatus({ ...NOTE, promise_date: '2026-12-01' }, OPEN_RULE)).toBe('active')
  })

  it('is broken the day after the promise date with a balance', () => {
    expect(derivePromissoryNoteStatus({ ...NOTE, promise_date: '2026-11-18' }, OPEN_RULE)).toBe('broken')
  })

  it('treats a bad balance as unpaid and a missing note as none', () => {
    expect(buildNoteStatusRule('abc', TODAY).isYearPaid).toBe(false)
    expect(derivePromissoryNoteStatus(null, OPEN_RULE)).toBe('none')
  })
})

describe('getNoteStatusChip', () => {
  it('returns a labelled chip for each status and None for unknown', () => {
    const statuses = ['none', 'active', 'broken', 'settled', 'cancelled']
    expect(statuses.map((status) => getNoteStatusChip(status).label)).toEqual([
      'None',
      'Active',
      'Broken',
      'Settled',
      'Cancelled',
    ])
    expect(getNoteStatusChip('x').label).toBe('None')
    expect(getNoteStatusChip('active').colorClass).toBe('bg-green-100 text-green-800')
  })
})

describe('buildHoldNoticeRows', () => {
  it('formats names, balances and cover text', () => {
    const [uncoveredRow, coveredRow] = buildHoldNoticeRows([YEAR_UNCOVERED, YEAR_COVERED])
    expect(uncoveredRow).toMatchObject({
      key: 3,
      schoolYearText: '2025-2026',
      balanceText: '₱12,345.60',
      isCovered: false,
    })
    expect(uncoveredRow.coverText).toBe('')
    expect(coveredRow.isCovered).toBe(true)
    expect(coveredRow.coverText).toContain('Dec 1, 2026')
  })

  it('returns an empty list for a non-array', () => {
    expect(buildHoldNoticeRows(undefined)).toEqual([])
  })
})

describe('buildHoldNoticeSummary', () => {
  it('words one uncovered year', () => {
    const noticeRows = buildHoldNoticeRows([YEAR_UNCOVERED])
    expect(buildHoldNoticeSummary(noticeRows, true)).toContain('an unpaid balance from an earlier school year')
  })

  it('counts only uncovered years', () => {
    const secondYear = { ...YEAR_UNCOVERED, school_year: { id: 4, name: '2023-2024' } }
    const noticeRows = buildHoldNoticeRows([YEAR_UNCOVERED, secondYear, YEAR_COVERED])
    expect(buildHoldNoticeSummary(noticeRows, true)).toContain('from 2 earlier school years')
  })

  it('says earlier balances do not block when the student is not on hold', () => {
    const noticeRows = buildHoldNoticeRows([YEAR_UNCOVERED])
    expect(buildHoldNoticeSummary(noticeRows, false)).toBe(ALLOWED_SUMMARY_TEXT)
  })

  it('is blank without rows', () => {
    expect(buildHoldNoticeSummary([], true)).toBe('')
  })
})

describe('listGrantableYears', () => {
  it('keeps uncovered years only', () => {
    expect(listGrantableYears([YEAR_UNCOVERED, YEAR_COVERED])).toEqual([
      { school_year: YEAR_UNCOVERED.school_year, balance: '12345.6' },
    ])
  })
})

describe('buildLedgerHoldBannerText', () => {
  it('words the covered, uncovered and paid cases', () => {
    expect(buildLedgerHoldBannerText('500.00', NOTE)).toBe(
      'Balance ₱500.00 is covered by a promissory note until Nov 19, 2026. The hold returns after that date.',
    )
    expect(buildLedgerHoldBannerText('500.00', null)).toBe('Balance ₱500.00 holds enrollment into later school years.')
    expect(buildLedgerHoldBannerText('0.00', null)).toBe('')
    expect(buildLedgerHoldBannerText('abc', null)).toBe('')
  })
})

describe('buildNoteRows / findActiveNote', () => {
  const cancelledNote = {
    id: 2,
    promise_date: '2026-10-01',
    promised_amount: '50.00',
    remarks: '  ',
    granted_by: { id: 1, name: 'Ana' },
    granted_at: '2026-10-01T02:00:00Z',
    cancelled_at: '2026-10-02T02:00:00Z',
    cancelled_by: { id: 1, name: 'Ben' },
    cancel_reason: 'Paid in cash',
  }

  it('builds display texts per note', () => {
    const [activeRow, cancelledRow] = buildNoteRows([NOTE, cancelledNote], OPEN_RULE)
    expect(activeRow).toMatchObject({ key: 1, status: 'active', promisedText: '₱500.00', remarksText: '—' })
    expect(cancelledRow.cancelText).toBe('Cancelled by Ben: Paid in cash')
    expect(cancelledRow.grantedText).toContain('Ana')
    expect(activeRow.cancelText).toBe('')
  })

  it('finds the first active note', () => {
    const noteRows = buildNoteRows([cancelledNote, NOTE], OPEN_RULE)
    expect(findActiveNote(noteRows)).toBe(NOTE)
    expect(findActiveNote(buildNoteRows([cancelledNote], OPEN_RULE))).toBeNull()
    expect(buildNoteRows(null, OPEN_RULE)).toEqual([])
  })
})

describe('isNoteCancellable / buildCancelPromptText', () => {
  it('allows cancelling only notes that are not cancelled', () => {
    expect(isNoteCancellable(NOTE)).toBe(true)
    expect(isNoteCancellable({ ...NOTE, cancelled_at: '2026-11-01T00:00:00Z' })).toBe(false)
    expect(isNoteCancellable(null)).toBe(false)
  })

  it('words the cancel prompt', () => {
    expect(buildCancelPromptText(NOTE)).toBe(
      'Cancel the promissory note for ₱500.00 due Nov 19, 2026? The note stays on record as cancelled.',
    )
    expect(buildCancelPromptText(null)).toBe('')
  })
})

describe('HOLD_COLUMNS', () => {
  it('lists the eight columns in order', () => {
    expect(HOLD_COLUMNS.map((column) => column.key)).toEqual([
      'student',
      'lrn',
      'school_year',
      'balance',
      'note_status',
      'promise_date',
      'promised_amount',
      'granted_by',
    ])
  })
})
