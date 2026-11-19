import { describe, it, expect } from 'vitest'
import {
  AMOUNT_INVALID_MESSAGE,
  DATE_FUTURE_MESSAGE,
  DATE_INVALID_MESSAGE,
  METHOD_CASH,
  METHOD_REQUIRED_MESSAGE,
  PAYMENT_METHODS,
  REFERENCE_LENGTH_MESSAGE,
  REFERENCE_REQUIRED_MESSAGE,
  REMARKS_LENGTH_MESSAGE,
  VOID_REASON_LENGTH_MESSAGE,
  VOID_REASON_REQUIRED_MESSAGE,
  buildPaymentPayload,
  buildPaymentRules,
  createPaymentForm,
  findPaymentFormErrors,
  findVoidReasonError,
  isReferenceRequired,
} from '@/utils/paymentForm.js'

const TODAY = '2026-11-19'
const VALID_FORM = { amount: '500.00', payment_date: TODAY, method: 'cash', reference_no: '', remarks: '' }
const RULES = { maxCents: 100000, maxDate: TODAY }

describe('payment methods', () => {
  it('lists four methods and requires a reference for every non-cash known method', () => {
    expect(PAYMENT_METHODS.map((methodOption) => methodOption.value)).toEqual([
      'cash',
      'e_wallet',
      'bank_transfer',
      'check',
    ])
    expect(METHOD_CASH).toBe('cash')
    expect(isReferenceRequired('cash')).toBe(false)
    expect(isReferenceRequired('e_wallet')).toBe(true)
    expect(isReferenceRequired('bank_transfer')).toBe(true)
    expect(isReferenceRequired('check')).toBe(true)
    expect(isReferenceRequired('bitcoin')).toBe(false)
  })
})

describe('createPaymentForm', () => {
  it('prefills the next amount due, today and cash; blank when nothing is due', () => {
    expect(createPaymentForm('1500.5', TODAY)).toEqual({
      amount: '1500.50',
      payment_date: TODAY,
      method: 'cash',
      reference_no: '',
      remarks: '',
    })
    expect(createPaymentForm(null, TODAY).amount).toBe('')
    expect(createPaymentForm('0.00', TODAY).amount).toBe('')
  })
})

describe('findPaymentFormErrors amount', () => {
  it('rejects blank, zero, text and more than two decimals', () => {
    for (const badAmount of ['', '0', 'abc', '1.234']) {
      const formErrors = findPaymentFormErrors({ ...VALID_FORM, amount: badAmount }, RULES)
      expect(formErrors.amount).toEqual([AMOUNT_INVALID_MESSAGE])
    }
  })

  it('rejects an amount over the balance but allows the exact balance', () => {
    expect(findPaymentFormErrors({ ...VALID_FORM, amount: '1000.01' }, RULES).amount).toEqual([
      'Amount cannot exceed the balance of ₱1,000.00.',
    ])
    expect(findPaymentFormErrors({ ...VALID_FORM, amount: '1000.00' }, RULES)).toEqual({})
  })
})

describe('findPaymentFormErrors reference', () => {
  it('requires a reference for non-cash methods, including whitespace, but not for cash', () => {
    for (const method of ['e_wallet', 'bank_transfer', 'check']) {
      expect(findPaymentFormErrors({ ...VALID_FORM, method }, RULES).reference_no).toEqual([REFERENCE_REQUIRED_MESSAGE])
    }
    const whitespaceForm = { ...VALID_FORM, method: 'check', reference_no: '   ' }
    expect(findPaymentFormErrors(whitespaceForm, RULES).reference_no).toEqual([REFERENCE_REQUIRED_MESSAGE])
    expect(findPaymentFormErrors({ ...VALID_FORM, method: 'cash', reference_no: '' }, RULES)).toEqual({})
  })
})

describe('findPaymentFormErrors date', () => {
  it('rejects a future date, allows today and the past, rejects a malformed date', () => {
    expect(findPaymentFormErrors({ ...VALID_FORM, payment_date: '2026-11-20' }, RULES).payment_date).toEqual([
      DATE_FUTURE_MESSAGE,
    ])
    expect(findPaymentFormErrors({ ...VALID_FORM, payment_date: '2026-11-19' }, RULES)).toEqual({})
    expect(findPaymentFormErrors({ ...VALID_FORM, payment_date: '2026-11-18' }, RULES)).toEqual({})
    expect(findPaymentFormErrors({ ...VALID_FORM, payment_date: '19/11/2026' }, RULES).payment_date).toEqual([
      DATE_INVALID_MESSAGE,
    ])
  })
})

describe('findPaymentFormErrors method', () => {
  it('requires a known method', () => {
    for (const method of ['', 'bitcoin']) {
      expect(findPaymentFormErrors({ ...VALID_FORM, method }, RULES).method).toEqual([METHOD_REQUIRED_MESSAGE])
    }
  })
})

describe('findPaymentFormErrors lengths', () => {
  it('limits the reference to 50 and the remarks to 500 characters', () => {
    const longForm = { ...VALID_FORM, reference_no: 'r'.repeat(51), remarks: 'x'.repeat(501) }
    const formErrors = findPaymentFormErrors(longForm, RULES)
    expect(formErrors.reference_no).toEqual([REFERENCE_LENGTH_MESSAGE])
    expect(formErrors.remarks).toEqual([REMARKS_LENGTH_MESSAGE])
    const edgeForm = { ...VALID_FORM, reference_no: 'r'.repeat(50), remarks: 'x'.repeat(500) }
    expect(findPaymentFormErrors(edgeForm, RULES)).toEqual({})
  })
})

describe('findPaymentFormErrors valid form', () => {
  it('returns no errors for a complete valid form', () => {
    expect(findPaymentFormErrors(VALID_FORM, RULES)).toEqual({})
  })
})

describe('buildPaymentRules', () => {
  it('converts the balance to cents and skips the balance check when it is not a number', () => {
    expect(buildPaymentRules('1000.00', TODAY)).toEqual({ maxCents: 100000, maxDate: TODAY })
    expect(buildPaymentRules('abc', TODAY).maxCents).toBeNull()
    expect(findPaymentFormErrors({ ...VALID_FORM, amount: '999999.00' }, buildPaymentRules('abc', TODAY))).toEqual({})
  })
})

describe('buildPaymentPayload', () => {
  it('builds six keys with a numeric assessment id, normalized amount and nullable text', () => {
    const paymentPayload = buildPaymentPayload(
      { ...VALID_FORM, amount: '1500', method: 'check', reference_no: ' CHK-1 ', remarks: '   ' },
      '12',
    )
    expect(paymentPayload).toEqual({
      assessment_id: 12,
      amount: '1500.00',
      payment_date: TODAY,
      method: 'check',
      reference_no: 'CHK-1',
      remarks: null,
    })
    expect(Object.keys(paymentPayload)).toHaveLength(6)
    expect(buildPaymentPayload(VALID_FORM, 3).reference_no).toBeNull()
  })
})

describe('findVoidReasonError', () => {
  it('requires a reason up to 500 characters', () => {
    expect(findVoidReasonError('')).toBe(VOID_REASON_REQUIRED_MESSAGE)
    expect(findVoidReasonError('   ')).toBe(VOID_REASON_REQUIRED_MESSAGE)
    expect(findVoidReasonError('x'.repeat(501))).toBe(VOID_REASON_LENGTH_MESSAGE)
    expect(findVoidReasonError('x'.repeat(500))).toBe('')
  })
})
