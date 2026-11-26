import { describe, it, expect } from 'vitest'
import {
  ALL_FILTER_TEXT,
  AS_OF_INVALID_MESSAGE,
  buildPrintItem,
  createReportRange,
  findAsOfError,
  findOptionLabel,
  findReportRangeError,
  formatParenthesizedAmount,
  getBalancedChip,
  isNegativeAmount,
} from '@/utils/reportDisplay.js'
import { DATE_RANGE_INVALID_MESSAGE } from '@/utils/paymentSearch.js'

describe('findAsOfError', () => {
  it('accepts an ISO date', () => {
    expect(findAsOfError('2026-11-26')).toBe('')
  })

  it('rejects a blank date', () => {
    expect(findAsOfError('')).toBe(AS_OF_INVALID_MESSAGE)
  })

  it('rejects a malformed date', () => {
    expect(findAsOfError('2026-1-5')).toBe(AS_OF_INVALID_MESSAGE)
    expect(findAsOfError(null)).toBe(AS_OF_INVALID_MESSAGE)
  })
})

describe('createReportRange', () => {
  it('runs from 1 January to today, including when today is 1 January', () => {
    expect(createReportRange('2026-11-26')).toEqual({ from: '2026-01-01', to: '2026-11-26' })
    expect(createReportRange('2026-01-01')).toEqual({ from: '2026-01-01', to: '2026-01-01' })
  })
})

describe('findReportRangeError', () => {
  it('flags a reversed range', () => {
    expect(findReportRangeError({ from: '2026-05-02', to: '2026-05-01' })).toBe(DATE_RANGE_INVALID_MESSAGE)
  })

  it('accepts from equal to to', () => {
    expect(findReportRangeError({ from: '2026-05-01', to: '2026-05-01' })).toBe('')
  })
})

describe('isNegativeAmount', () => {
  it('is true for a negative amount', () => {
    expect(isNegativeAmount('-5.00')).toBe(true)
  })

  it('is false for zero, negative zero and non-strings', () => {
    expect(isNegativeAmount('0.00')).toBe(false)
    expect(isNegativeAmount('-0.00')).toBe(false)
    expect(isNegativeAmount(5)).toBe(false)
  })
})

describe('formatParenthesizedAmount', () => {
  it('shows a positive amount as pesos', () => {
    expect(formatParenthesizedAmount('1234.50')).toEqual({ text: '₱1,234.50', isNegative: false })
  })

  it('shows a negative amount in parentheses and flags it', () => {
    expect(formatParenthesizedAmount('-1234.50')).toEqual({ text: '(₱1,234.50)', isNegative: true })
  })

  it('shows zero as pesos', () => {
    expect(formatParenthesizedAmount('0.00')).toEqual({ text: '₱0.00', isNegative: false })
  })

  it('shows an invalid amount as a dash', () => {
    expect(formatParenthesizedAmount('abc')).toEqual({ text: '—', isNegative: false })
  })
})

describe('getBalancedChip', () => {
  it('returns the Balanced chip for true', () => {
    expect(getBalancedChip(true)).toEqual({ label: 'Balanced', colorClass: 'bg-green-100 text-green-800' })
  })

  it('returns the Out of balance chip for anything else', () => {
    expect(getBalancedChip(false)).toEqual({ label: 'Out of balance', colorClass: 'bg-red-100 text-red-800' })
    expect(getBalancedChip(undefined).label).toBe('Out of balance')
  })
})

describe('buildPrintItem', () => {
  it('keeps the text', () => {
    expect(buildPrintItem('As of', 'Nov 26, 2026')).toEqual({ key: 'As of', label: 'As of', text: 'Nov 26, 2026' })
  })

  it('shows All for an empty text', () => {
    expect(buildPrintItem('Grade level', '').text).toBe(ALL_FILTER_TEXT)
  })
})

describe('findOptionLabel', () => {
  const options = [
    { id: 3, name: 'Grade 7' },
    { id: 4, name: 'Grade 8' },
  ]

  it('matches a numeric id against a string selection', () => {
    expect(findOptionLabel(options, '4')).toBe('Grade 8')
  })

  it('returns an empty text on a miss or an empty selection', () => {
    expect(findOptionLabel(options, '9')).toBe('')
    expect(findOptionLabel(options, '')).toBe('')
  })

  it('returns an empty text for a non-array', () => {
    expect(findOptionLabel(null, '3')).toBe('')
  })
})
