import { describe, it, expect } from 'vitest'
import {
  buildReversePayload,
  buildReverseRules,
  createReverseForm,
  findReverseFormErrors,
} from '@/utils/journalReverseForm.js'

const RULES = buildReverseRules('2026-11-10', '2026-11-26')

describe('findReverseFormErrors', () => {
  it('requires a reason, blank and spaces alike', () => {
    expect(findReverseFormErrors({ reason: '', date: '2026-11-20' }, RULES).reason).toEqual(['Enter the reason for reversing.'])
    expect(findReverseFormErrors({ reason: '   ', date: '2026-11-20' }, RULES).reason).toEqual(['Enter the reason for reversing.'])
  })

  it('caps the reason at 500', () => {
    expect(findReverseFormErrors({ reason: 'x'.repeat(500), date: '2026-11-20' }, RULES)).toEqual({})
    expect(findReverseFormErrors({ reason: 'x'.repeat(501), date: '2026-11-20' }, RULES).reason).toEqual([
      'The reason must be at most 500 characters.',
    ])
  })

  it('refuses a date before the entry date and allows the entry date itself', () => {
    expect(findReverseFormErrors({ reason: 'r', date: '2026-11-09' }, RULES).date).toEqual([
      'The reversal date cannot be before the entry date.',
    ])
    expect(findReverseFormErrors({ reason: 'r', date: '2026-11-10' }, RULES)).toEqual({})
  })

  it('refuses a date after today and allows today', () => {
    expect(findReverseFormErrors({ reason: 'r', date: '2026-11-27' }, RULES).date).toEqual([
      'The reversal date cannot be in the future.',
    ])
    expect(findReverseFormErrors({ reason: 'r', date: '2026-11-26' }, RULES)).toEqual({})
  })

  it('refuses an invalid date', () => {
    expect(findReverseFormErrors({ reason: 'r', date: '' }, RULES).date).toEqual(['Enter a valid date.'])
    expect(findReverseFormErrors({ reason: 'r', date: '2026-13-01' }, RULES).date).toEqual(['Enter a valid date.'])
  })
})

describe('form helpers', () => {
  it('starts today with a blank reason and builds a trimmed payload', () => {
    expect(createReverseForm('2026-11-26')).toEqual({ reason: '', date: '2026-11-26' })
    expect(buildReversePayload({ reason: '  Wrong account ', date: '2026-11-20' })).toEqual({
      reason: 'Wrong account',
      date: '2026-11-20',
    })
  })
})
