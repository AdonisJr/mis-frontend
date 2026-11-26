import { describe, it, expect } from 'vitest'
import {
  JOURNAL_LINES_MAX,
  appendJournalLine,
  applyLineCreditChange,
  applyLineDebitChange,
  buildLineAccountOptions,
  canAddJournalLine,
  canPostJournalEntry,
  canRemoveJournalLine,
  createEmptyJournalLine,
  createStartingLines,
  findJournalLineErrors,
  findJournalLinesErrors,
  formatDifferenceText,
  removeJournalLineAt,
  sumJournalLines,
} from '@/utils/journalLineGrid.js'

function buildLine(overrides) {
  return { account_id: '1', debit: '', credit: '', memo: '', ...overrides }
}

describe('one-side rule', () => {
  it('clears the credit when a debit is typed and the debit when a credit is typed', () => {
    expect(applyLineDebitChange(buildLine({ credit: '5.00' }), '10')).toMatchObject({ debit: '10', credit: '' })
    expect(applyLineCreditChange(buildLine({ debit: '5.00' }), '10')).toMatchObject({ debit: '', credit: '10' })
  })

  it('keeps the other side when a side is blanked', () => {
    expect(applyLineDebitChange(buildLine({ debit: '5', credit: '' }), '')).toMatchObject({ debit: '', credit: '' })
    expect(applyLineCreditChange(buildLine({ debit: '5' }), ' ')).toMatchObject({ debit: '5', credit: ' ' })
  })
})

describe('row limits', () => {
  it('starts with two empty rows and caps appending at 100', () => {
    expect(createStartingLines()).toEqual([createEmptyJournalLine(), createEmptyJournalLine()])
    const fullLines = Array.from({ length: JOURNAL_LINES_MAX }, createEmptyJournalLine)
    expect(canAddJournalLine(fullLines)).toBe(false)
    expect(appendJournalLine(fullLines)).toBe(fullLines)
    expect(appendJournalLine(createStartingLines())).toHaveLength(3)
  })

  it('keeps two rows and ignores a bad index when removing', () => {
    const twoLines = createStartingLines()
    expect(canRemoveJournalLine(twoLines)).toBe(false)
    expect(removeJournalLineAt(twoLines, 0)).toBe(twoLines)
    const threeLines = [buildLine({ memo: 'a' }), buildLine({ memo: 'b' }), buildLine({ memo: 'c' })]
    expect(removeJournalLineAt(threeLines, 1).map((line) => line.memo)).toEqual(['a', 'c'])
    expect(removeJournalLineAt(threeLines, 3)).toBe(threeLines)
    expect(removeJournalLineAt(threeLines, -1)).toBe(threeLines)
  })
})

describe('totals', () => {
  it('sums in cents and counts invalid or blank amounts as 0', () => {
    const lineTotals = sumJournalLines([
      buildLine({ debit: '100.10' }),
      buildLine({ debit: 'abc' }),
      buildLine({ credit: '60.05' }),
      buildLine({ credit: '-5' }),
      buildLine({ credit: '40.05' }),
    ])
    expect(lineTotals).toEqual({ debitCents: 10010, creditCents: 10010, differenceCents: 0 })
  })

  it('formats the difference with its sign dropped', () => {
    expect(formatDifferenceText({ debitCents: 10000, creditCents: 10000, differenceCents: 0 })).toBe('Balanced')
    expect(formatDifferenceText({ debitCents: 10000, creditCents: 7550, differenceCents: 2450 })).toBe('Out of balance by ₱24.50')
    expect(formatDifferenceText({ debitCents: 7550, creditCents: 10000, differenceCents: -2450 })).toBe('Out of balance by ₱24.50')
  })

  it('allows posting only a balanced entry above zero', () => {
    expect(canPostJournalEntry({ debitCents: 500, creditCents: 500, differenceCents: 0 })).toBe(true)
    expect(canPostJournalEntry({ debitCents: 0, creditCents: 0, differenceCents: 0 })).toBe(false)
    expect(canPostJournalEntry({ debitCents: 500, creditCents: 501, differenceCents: -1 })).toBe(false)
  })
})

describe('line errors', () => {
  it('accepts one side, refuses both or neither', () => {
    expect(findJournalLineErrors(buildLine({ debit: '5' }), 0)).toEqual({})
    expect(findJournalLineErrors(buildLine({ credit: '5' }), 0)).toEqual({})
    expect(findJournalLineErrors(buildLine({ debit: '5', credit: '5' }), 1)).toEqual({
      'lines.1.debit': ['Enter either a debit or a credit, not both.'],
    })
    expect(findJournalLineErrors(buildLine(), 2)).toEqual({ 'lines.2.debit': ['Enter a debit or a credit.'] })
  })

  it('checks decimals and the 999,999,999.99 edge', () => {
    expect(findJournalLineErrors(buildLine({ debit: '1.005' }), 0)['lines.0.debit']).toEqual([
      'Enter an amount with at most 2 decimals.',
    ])
    expect(findJournalLineErrors(buildLine({ credit: '-5' }), 0)['lines.0.credit']).toHaveLength(1)
    expect(findJournalLineErrors(buildLine({ debit: '999999999.99' }), 0)).toEqual({})
    expect(findJournalLineErrors(buildLine({ debit: '1000000000.00' }), 0)['lines.0.debit']).toEqual([
      'The amount must be at most 999,999,999.99.',
    ])
  })

  it('checks the account and memo, and the line count under lines', () => {
    const lineErrors = findJournalLineErrors(buildLine({ account_id: '', debit: '5', memo: 'x'.repeat(256) }), 3)
    expect(lineErrors).toEqual({
      'lines.3.account_id': ['Choose an account.'],
      'lines.3.memo': ['The memo must be at most 255 characters.'],
    })
    expect(findJournalLinesErrors([buildLine({ debit: '5' })]).lines).toEqual(['An entry needs 2 to 100 lines.'])
    expect(findJournalLinesErrors([buildLine({ debit: '5' }), buildLine({ credit: '5' })])).toEqual({})
  })
})

describe('buildLineAccountOptions', () => {
  it('keeps stored inactive accounts pickable, labelled and sorted by code', () => {
    const activeAccounts = [
      { id: 2, code: '2010', name: 'Payables' },
      { id: 1, code: '1010', name: 'Cash' },
    ]
    const storedLines = [
      { account: { id: 3, code: '1500', name: 'Old asset' } },
      { account: { id: 1, code: '1010', name: 'Cash' } },
      { account: { id: 3, code: '1500', name: 'Old asset' } },
    ]
    expect(buildLineAccountOptions(activeAccounts, storedLines)).toEqual([
      { value: '1', label: '1010 Cash' },
      { value: '3', label: '1500 Old asset (inactive)' },
      { value: '2', label: '2010 Payables' },
    ])
    expect(buildLineAccountOptions(null, null)).toEqual([])
  })
})
