import { describe, it, expect } from 'vitest'
import {
  CANCEL_REASON_LENGTH_MESSAGE,
  CANCEL_REASON_MAX_LENGTH,
  CANCEL_REASON_REQUIRED_MESSAGE,
  NOTE_REMARKS_LENGTH_MESSAGE,
  NOTE_REMARKS_MAX_LENGTH,
  PROMISED_AMOUNT_INVALID_MESSAGE,
  PROMISE_DATE_INVALID_MESSAGE,
  PROMISE_DATE_PAST_MESSAGE,
  SCHOOL_YEAR_REQUIRED_MESSAGE,
  applyNoteYearChange,
  buildNotePayload,
  buildNoteRules,
  createNoteForm,
  findBalanceYear,
  findCancelReasonError,
  findNoteFormErrors,
} from '@/utils/promissoryNoteForm.js'

const TODAY = '2026-11-19'
const YEARS = [{ school_year: { id: 3, name: '2025-2026' }, balance: '1500.5' }]
const VALID_FORM = { school_year_id: '3', promised_amount: '1000.00', promise_date: '2026-12-01', remarks: '' }
const RULES = buildNoteRules('1000.00', TODAY)

describe('limits and messages', () => {
  it('exposes the 500 character limits and message texts', () => {
    expect(NOTE_REMARKS_MAX_LENGTH).toBe(500)
    expect(CANCEL_REASON_MAX_LENGTH).toBe(500)
    expect(SCHOOL_YEAR_REQUIRED_MESSAGE).toBe('Choose the school year with the balance.')
    expect(PROMISE_DATE_PAST_MESSAGE).toBe('The promise date cannot be before today.')
    expect(NOTE_REMARKS_LENGTH_MESSAGE).toBe('Remarks must be at most 500 characters.')
  })
})

describe('createNoteForm / findBalanceYear', () => {
  it('fills the amount with the matching year balance', () => {
    expect(createNoteForm(YEARS, '3')).toEqual({
      school_year_id: '3',
      promised_amount: '1500.50',
      promise_date: '',
      remarks: '',
    })
  })

  it('leaves the amount blank for an unknown year', () => {
    expect(createNoteForm(YEARS, '9').promised_amount).toBe('')
    expect(findBalanceYear(YEARS, '9')).toBeNull()
    expect(findBalanceYear(null, '3')).toBeNull()
    expect(findBalanceYear(YEARS, '3')).toBe(YEARS[0])
  })
})

describe('applyNoteYearChange', () => {
  it('refills the amount from the new year without mutating', () => {
    const formValues = { ...VALID_FORM, promised_amount: '5.00' }
    const nextForm = applyNoteYearChange(formValues, YEARS)
    expect(nextForm.promised_amount).toBe('1500.50')
    expect(formValues.promised_amount).toBe('5.00')
  })

  it('blanks the amount for an unknown year', () => {
    expect(applyNoteYearChange({ ...VALID_FORM, school_year_id: '' }, YEARS).promised_amount).toBe('')
  })
})

describe('promised amount', () => {
  it.each(['', '0', 'abc', '1.234'])('rejects %j as invalid', (amountText) => {
    const errors = findNoteFormErrors({ ...VALID_FORM, promised_amount: amountText }, RULES)
    expect(errors.promised_amount).toEqual([PROMISED_AMOUNT_INVALID_MESSAGE])
  })

  it('rejects an amount over the balance and names the balance', () => {
    const errors = findNoteFormErrors({ ...VALID_FORM, promised_amount: '1000.01' }, RULES)
    expect(errors.promised_amount[0]).toContain('₱1,000.00')
  })

  it('allows an amount equal to the balance', () => {
    expect(findNoteFormErrors(VALID_FORM, RULES)).toEqual({})
  })

  it('skips the over-balance check when the balance is unreadable', () => {
    const noteRules = buildNoteRules('abc', TODAY)
    expect(noteRules.maxCents).toBeNull()
    expect(findNoteFormErrors({ ...VALID_FORM, promised_amount: '99999.00' }, noteRules)).toEqual({})
  })
})

describe('promise date', () => {
  it('rejects yesterday as past', () => {
    const errors = findNoteFormErrors({ ...VALID_FORM, promise_date: '2026-11-18' }, RULES)
    expect(errors.promise_date).toEqual([PROMISE_DATE_PAST_MESSAGE])
  })

  it.each(['2026-11-19', '2026-12-01'])('allows %s', (dateText) => {
    expect(findNoteFormErrors({ ...VALID_FORM, promise_date: dateText }, RULES)).toEqual({})
  })

  it.each(['19/11/2026', ''])('rejects %j as invalid', (dateText) => {
    const errors = findNoteFormErrors({ ...VALID_FORM, promise_date: dateText }, RULES)
    expect(errors.promise_date).toEqual([PROMISE_DATE_INVALID_MESSAGE])
  })
})

describe('remarks', () => {
  it('accepts 500 characters and whitespace only', () => {
    expect(findNoteFormErrors({ ...VALID_FORM, remarks: 'a'.repeat(500) }, RULES)).toEqual({})
    expect(findNoteFormErrors({ ...VALID_FORM, remarks: '   ' }, RULES)).toEqual({})
  })

  it('rejects 501 characters', () => {
    const errors = findNoteFormErrors({ ...VALID_FORM, remarks: 'a'.repeat(501) }, RULES)
    expect(errors.remarks).toEqual([NOTE_REMARKS_LENGTH_MESSAGE])
  })
})

describe('school year and complete form', () => {
  it.each(['', 'abc'])('requires a school year for %j', (yearText) => {
    const errors = findNoteFormErrors({ ...VALID_FORM, school_year_id: yearText }, RULES)
    expect(errors.school_year_id).toEqual([SCHOOL_YEAR_REQUIRED_MESSAGE])
  })

  it('returns no errors for a complete valid form', () => {
    expect(findNoteFormErrors(VALID_FORM, RULES)).toEqual({})
  })
})

describe('buildNotePayload', () => {
  it('sends five keys with numeric ids and a normalized amount', () => {
    const payload = buildNotePayload({ ...VALID_FORM, promised_amount: '1500', remarks: '  later  ' }, '7')
    expect(payload).toEqual({
      student_id: 7,
      school_year_id: 3,
      promised_amount: '1500.00',
      promise_date: '2026-12-01',
      remarks: 'later',
    })
    expect(Object.keys(payload)).toHaveLength(5)
  })

  it('sends null for blank remarks', () => {
    expect(buildNotePayload({ ...VALID_FORM, remarks: '  ' }, 7).remarks).toBeNull()
  })
})

describe('findCancelReasonError', () => {
  it('requires a reason', () => {
    expect(findCancelReasonError('')).toBe(CANCEL_REASON_REQUIRED_MESSAGE)
    expect(findCancelReasonError('   ')).toBe(CANCEL_REASON_REQUIRED_MESSAGE)
  })

  it('limits the length to 500', () => {
    expect(findCancelReasonError('a'.repeat(501))).toBe(CANCEL_REASON_LENGTH_MESSAGE)
    expect(findCancelReasonError('a'.repeat(500))).toBe('')
  })
})
