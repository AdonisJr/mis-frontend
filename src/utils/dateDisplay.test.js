import { describe, it, expect } from 'vitest'
import { formatDisplayDate } from '@/utils/dateDisplay.js'

describe('formatDisplayDate', () => {
  it('formats a Y-m-d date as a short month, day and year', () => {
    expect(formatDisplayDate('2026-06-01')).toBe('Jun 1, 2026')
  })

  it('keeps the calendar day in every time zone', () => {
    expect(formatDisplayDate('2027-03-31')).toBe('Mar 31, 2027')
  })

  it('returns a value that is not a Y-m-d date unchanged', () => {
    expect(formatDisplayDate('31/03/2027')).toBe('31/03/2027')
    expect(formatDisplayDate(null)).toBe(null)
  })
})
