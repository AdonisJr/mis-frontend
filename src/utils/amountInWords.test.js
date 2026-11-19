import { describe, it, expect } from 'vitest'
import { formatAmountInWords } from '@/utils/amountInWords.js'

describe('formatAmountInWords', () => {
  it('uses the singular peso for exactly one and says only for zero cents', () => {
    expect(formatAmountInWords('1.00')).toBe('One peso only')
    expect(formatAmountInWords('0.00')).toBe('Zero pesos only')
  })

  it('writes teens and tens with a hyphen', () => {
    expect(formatAmountInWords('15.00')).toBe('Fifteen pesos only')
    expect(formatAmountInWords('21.00')).toBe('Twenty-one pesos only')
  })

  it('writes hundreds', () => {
    expect(formatAmountInWords('100.00')).toBe('One hundred pesos only')
    expect(formatAmountInWords('999.00')).toBe('Nine hundred ninety-nine pesos only')
  })

  it('writes thousands with cents as a fraction of 100', () => {
    expect(formatAmountInWords('1500.50')).toBe('One thousand five hundred pesos and 50/100')
  })

  it('pads single-digit cents and keeps zero pesos', () => {
    expect(formatAmountInWords('1001.05')).toBe('One thousand one pesos and 05/100')
    expect(formatAmountInWords('0.75')).toBe('Zero pesos and 75/100')
  })

  it('writes millions', () => {
    expect(formatAmountInWords('1000000.00')).toBe('One million pesos only')
  })

  it('writes the maximum amount in billions', () => {
    expect(formatAmountInWords('9999999999.99')).toBe(
      'Nine billion nine hundred ninety-nine million nine hundred ninety-nine thousand nine hundred ninety-nine pesos and 99/100',
    )
  })

  it('returns an empty string for invalid input', () => {
    expect(formatAmountInWords('abc')).toBe('')
    expect(formatAmountInWords('-5')).toBe('')
    expect(formatAmountInWords('1.234')).toBe('')
    expect(formatAmountInWords(null)).toBe('')
  })
})
