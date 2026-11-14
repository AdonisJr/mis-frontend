import { describe, it, expect } from 'vitest'
import { formatCentsAsAmount, formatPeso, formatPesoFromCents, toCents } from '@/utils/moneyDisplay.js'

describe('toCents', () => {
  it('converts whole, one-decimal, two-decimal and padded strings', () => {
    expect(toCents('1500')).toBe(150000)
    expect(toCents('12.5')).toBe(1250)
    expect(toCents('1500.05')).toBe(150005)
    expect(toCents('  0.10 ')).toBe(10)
  })

  it('accepts finite numbers', () => {
    expect(toCents(1500)).toBe(150000)
    expect(toCents(12.5)).toBe(1250)
  })

  it('rejects text that is not a non-negative amount with at most two decimals', () => {
    for (const badValue of ['', 'abc', '1.234', '-5', '1,500', null, undefined, NaN, '99999999999999999999']) {
      expect(toCents(badValue)).toBeNull()
    }
  })
})

describe('format helpers', () => {
  it('formatCentsAsAmount gives two decimals or an empty string', () => {
    expect(formatCentsAsAmount(150050)).toBe('1500.50')
    expect(formatCentsAsAmount(5)).toBe('0.05')
    expect(formatCentsAsAmount(0)).toBe('0.00')
    expect(formatCentsAsAmount(1.5)).toBe('')
  })

  it('formatPesoFromCents groups thousands', () => {
    expect(formatPesoFromCents(123456789)).toBe('₱1,234,567.89')
    expect(formatPesoFromCents(0)).toBe('₱0.00')
    expect(formatPesoFromCents(null)).toBe('')
  })

  it('formatPeso formats an amount and shows a dash for an invalid one', () => {
    expect(formatPeso('1500.5')).toBe('₱1,500.50')
    expect(formatPeso('abc')).toBe('—')
  })
})
