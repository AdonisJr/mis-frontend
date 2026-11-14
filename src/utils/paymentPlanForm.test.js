import { describe, it, expect } from 'vitest'
import {
  ADJUSTMENT_PERCENT_MESSAGE,
  DOWN_PAYMENT_PERCENT_MESSAGE,
  DUE_DATE_DUPLICATE_MESSAGE,
  DUE_DATE_INVALID_MESSAGE,
  DUE_DATE_ORDER_MESSAGE,
  DUE_DATE_OUTSIDE_MESSAGE,
  PAYMENT_PLAN_MAX_INSTALLMENTS,
  PERCENT_REQUIRED_MESSAGE,
  VALUE_TYPE_OPTIONS,
  appendDueDate,
  buildFormFromPaymentPlan,
  buildPaymentPlanPayload,
  clearUnfitPlanFields,
  createEmptyPaymentPlanForm,
  findPaymentPlanFormErrors,
  listAdjustmentKindOptions,
  removeDueDateAt,
} from '@/utils/paymentPlanForm.js'
import { AMOUNT_INVALID, AMOUNT_REQUIRED, AMOUNT_TOO_LARGE } from '@/utils/feeScheduleForm.js'

const SCHOOL_YEAR = { id: 5, name: '2026-2027', start_date: '2026-06-01', end_date: '2027-03-31' }
const THREE_DATES = ['2026-08-01', '2026-11-01', '2027-02-01']

function buildForm(formChanges) {
  return { ...createEmptyPaymentPlanForm('5'), name: 'Quarterly', ...formChanges }
}

function buildInstallmentForm(formChanges) {
  return buildForm({ due_dates: THREE_DATES, down_payment_type: 'fixed', down_payment_value: '1000', ...formChanges })
}

function buildDatesOnly(dueDates) {
  return buildForm({ due_dates: dueDates, down_payment_type: 'fixed', down_payment_value: '10' })
}

function listDates(dateCount) {
  return Array.from({ length: dateCount }, (_unused, index) => `2026-${String(index + 7).padStart(2, '0')}-01`)
}

describe('constants', () => {
  it('allows 12 installments and offers fixed then percent', () => {
    expect(PAYMENT_PLAN_MAX_INSTALLMENTS).toBe(12)
    expect(VALUE_TYPE_OPTIONS.map((option) => option.value)).toEqual(['fixed', 'percent'])
  })
})

describe('createEmptyPaymentPlanForm', () => {
  it('builds an all-string form from a string or numeric school year id', () => {
    const expectedForm = {
      school_year_id: '3',
      name: '',
      description: '',
      due_dates: [],
      down_payment_type: '',
      down_payment_value: '',
      adjustment_kind: '',
      adjustment_type: '',
      adjustment_value: '',
    }
    expect(createEmptyPaymentPlanForm('3')).toEqual(expectedForm)
    expect(createEmptyPaymentPlanForm(5).school_year_id).toBe('5')
  })
})

describe('buildFormFromPaymentPlan', () => {
  it('sorts the installments and maps down payment and surcharge', () => {
    const paymentPlan = {
      school_year_id: 5,
      name: 'Quarterly',
      description: null,
      installments: [
        { sequence: 2, due_date: '2026-11-01' },
        { sequence: 1, due_date: '2026-08-01' },
      ],
      down_payment: { type: 'percent', value: '20.00' },
      adjustment: { kind: 'surcharge', type: 'fixed', value: '500.00', category: 'tuition' },
    }
    expect(buildFormFromPaymentPlan(paymentPlan)).toEqual({
      school_year_id: '5',
      name: 'Quarterly',
      description: '',
      due_dates: ['2026-08-01', '2026-11-01'],
      down_payment_type: 'percent',
      down_payment_value: '20.00',
      adjustment_kind: 'surcharge',
      adjustment_type: 'fixed',
      adjustment_value: '500.00',
    })
  })

  it('maps a Cash plan with a discount and turns a non-object into the empty form', () => {
    const cashPlan = {
      school_year_id: 5,
      name: 'Cash',
      description: 'Pay once',
      installments: [],
      down_payment: null,
      adjustment: { kind: 'discount', type: 'percent', value: '5.00', category: 'tuition' },
    }
    const cashForm = buildFormFromPaymentPlan(cashPlan)
    expect(cashForm.due_dates).toEqual([])
    expect(cashForm.down_payment_type).toBe('')
    expect(cashForm.adjustment_kind).toBe('discount')
    expect(buildFormFromPaymentPlan(null)).toEqual(createEmptyPaymentPlanForm(''))
  })
})

describe('appendDueDate', () => {
  it('adds a blank date without mutating and stops at 12', () => {
    const formValues = buildForm({ due_dates: ['2026-08-01'] })
    expect(appendDueDate(formValues).due_dates).toEqual(['2026-08-01', ''])
    expect(formValues.due_dates).toEqual(['2026-08-01'])
    const fullForm = buildForm({ due_dates: listDates(12) })
    expect(appendDueDate(fullForm)).toBe(fullForm)
  })
})

describe('removeDueDateAt', () => {
  it('removes the date and ignores bad indexes', () => {
    const formValues = buildForm({ due_dates: THREE_DATES })
    expect(removeDueDateAt(formValues, 1).due_dates).toEqual(['2026-08-01', '2027-02-01'])
    expect(removeDueDateAt(formValues, -1)).toBe(formValues)
    expect(removeDueDateAt(formValues, 5)).toBe(formValues)
    expect(removeDueDateAt(formValues, '1')).toBe(formValues)
  })
})

describe('listAdjustmentKindOptions', () => {
  it('offers the discount for Cash, the surcharge for installments and nothing for bad counts', () => {
    expect(listAdjustmentKindOptions(0).map((option) => option.value)).toEqual(['discount'])
    expect(listAdjustmentKindOptions(1).map((option) => option.value)).toEqual(['surcharge'])
    expect(listAdjustmentKindOptions(12).map((option) => option.value)).toEqual(['surcharge'])
    expect(listAdjustmentKindOptions('2')).toEqual([])
    expect(listAdjustmentKindOptions(null)).toEqual([])
  })
})

describe('clearUnfitPlanFields', () => {
  it('clears the down payment and a surcharge from a Cash plan but keeps a discount', () => {
    const surchargeForm = buildForm({
      down_payment_type: 'percent',
      down_payment_value: '20',
      adjustment_kind: 'surcharge',
      adjustment_type: 'fixed',
      adjustment_value: '500',
    })
    const clearedForm = clearUnfitPlanFields(surchargeForm)
    expect(clearedForm.down_payment_type).toBe('')
    expect(clearedForm.down_payment_value).toBe('')
    expect(clearedForm.adjustment_kind).toBe('')
    expect(clearedForm.adjustment_value).toBe('')
    const discountForm = buildForm({ adjustment_kind: 'discount', adjustment_type: 'percent', adjustment_value: '5' })
    expect(clearUnfitPlanFields(discountForm)).toBe(discountForm)
  })

  it('clears a discount once a date exists, keeps the rest and returns the same object when unchanged', () => {
    const discountForm = buildInstallmentForm({ adjustment_kind: 'discount', adjustment_type: 'percent', adjustment_value: '5' })
    const clearedForm = clearUnfitPlanFields(discountForm)
    expect(clearedForm.adjustment_kind).toBe('')
    expect(clearedForm.adjustment_type).toBe('')
    expect(clearedForm.down_payment_type).toBe('fixed')
    const surchargeForm = buildInstallmentForm({ adjustment_kind: 'surcharge', adjustment_type: 'fixed', adjustment_value: '5' })
    expect(clearUnfitPlanFields(surchargeForm)).toBe(surchargeForm)
  })
})

describe('findPaymentPlanFormErrors due dates', () => {
  it('accepts a valid Cash plan', () => {
    expect(findPaymentPlanFormErrors(buildForm({}), SCHOOL_YEAR)).toEqual({})
  })

  it('accepts 12 valid dates and rejects 13 under due_dates', () => {
    expect(findPaymentPlanFormErrors(buildDatesOnly(listDates(12)), null)).toEqual({})
    const thirteenErrors = findPaymentPlanFormErrors(buildDatesOnly(listDates(13)), null)
    expect(Object.keys(thirteenErrors)).toEqual(['due_dates'])
  })

  it('flags a blank and a malformed date on their rows', () => {
    const dueDateErrors = findPaymentPlanFormErrors(buildDatesOnly(['2026-08-01', '', 'abc']), SCHOOL_YEAR)
    expect(dueDateErrors['due_dates.1']).toEqual([DUE_DATE_INVALID_MESSAGE])
    expect(dueDateErrors['due_dates.2']).toEqual([DUE_DATE_INVALID_MESSAGE])
  })

  it('flags only the duplicate row', () => {
    const dueDateErrors = findPaymentPlanFormErrors(buildDatesOnly(['2026-08-01', '2026-08-01']), SCHOOL_YEAR)
    expect(dueDateErrors).toEqual({ 'due_dates.1': [DUE_DATE_DUPLICATE_MESSAGE] })
  })

  it('flags a decreasing date on its row', () => {
    const dueDateErrors = findPaymentPlanFormErrors(buildDatesOnly(['2026-08-01', '2026-09-01', '2026-08-15']), SCHOOL_YEAR)
    expect(dueDateErrors).toEqual({ 'due_dates.2': [DUE_DATE_ORDER_MESSAGE] })
  })

  it('accepts both school year edges, rejects a day outside and skips the range without a school year', () => {
    expect(findPaymentPlanFormErrors(buildDatesOnly(['2026-06-01', '2027-03-31']), SCHOOL_YEAR)).toEqual({})
    const outsideErrors = findPaymentPlanFormErrors(buildDatesOnly(['2026-05-31', '2027-04-01']), SCHOOL_YEAR)
    expect(outsideErrors).toEqual({
      'due_dates.0': [DUE_DATE_OUTSIDE_MESSAGE],
      'due_dates.1': [DUE_DATE_OUTSIDE_MESSAGE],
    })
    expect(findPaymentPlanFormErrors(buildDatesOnly(['2026-05-31', '2027-04-01']), null)).toEqual({})
  })
})

describe('findPaymentPlanFormErrors keys', () => {
  it('requires a school year id', () => {
    const keyErrors = findPaymentPlanFormErrors(buildForm({ school_year_id: '' }), SCHOOL_YEAR)
    expect(keyErrors.school_year_id).toEqual(['School year is required.'])
  })

  it('requires a name of at most 100 characters', () => {
    expect(findPaymentPlanFormErrors(buildForm({ name: '   ' }), SCHOOL_YEAR).name).toEqual(['Name is required.'])
    expect(findPaymentPlanFormErrors(buildForm({ name: 'a'.repeat(101) }), SCHOOL_YEAR).name).toEqual([
      'Name must be at most 100 characters.',
    ])
    expect(findPaymentPlanFormErrors(buildForm({ name: 'a'.repeat(100) }), SCHOOL_YEAR)).toEqual({})
  })

  it('limits the description to 1000 characters', () => {
    expect(findPaymentPlanFormErrors(buildForm({ description: 'a'.repeat(1001) }), SCHOOL_YEAR).description).toEqual([
      'Description must be at most 1000 characters.',
    ])
    expect(findPaymentPlanFormErrors(buildForm({ description: 'a'.repeat(1000) }), SCHOOL_YEAR)).toEqual({})
  })
})

describe('findPaymentPlanFormErrors down payment', () => {
  it('requires a type once dates exist and a value for either type', () => {
    const noTypeErrors = findPaymentPlanFormErrors(buildInstallmentForm({ down_payment_type: '' }), SCHOOL_YEAR)
    expect(noTypeErrors).toEqual({ 'down_payment.type': ['Choose a down payment type.'] })
    const fixedBlank = buildInstallmentForm({ down_payment_value: '' })
    expect(findPaymentPlanFormErrors(fixedBlank, SCHOOL_YEAR)['down_payment.value']).toEqual([AMOUNT_REQUIRED])
    const percentBlank = buildInstallmentForm({ down_payment_type: 'percent', down_payment_value: '' })
    expect(findPaymentPlanFormErrors(percentBlank, SCHOOL_YEAR)['down_payment.value']).toEqual([PERCENT_REQUIRED_MESSAGE])
  })

  it('ignores a leftover down payment on a Cash plan and sends null', () => {
    const cashForm = buildForm({ down_payment_type: 'fixed', down_payment_value: 'abc' })
    expect(findPaymentPlanFormErrors(cashForm, SCHOOL_YEAR)).toEqual({})
    expect(buildPaymentPlanPayload(cashForm).down_payment).toBeNull()
  })

  it('validates a fixed down payment from text', () => {
    const invalidValues = ['0', '-5', '1.234', 'abc', '1,500']
    invalidValues.forEach((invalidValue) => {
      const fixedForm = buildInstallmentForm({ down_payment_value: invalidValue })
      expect(findPaymentPlanFormErrors(fixedForm, SCHOOL_YEAR)['down_payment.value']).toEqual([AMOUNT_INVALID])
    })
    const tooLargeForm = buildInstallmentForm({ down_payment_value: '10000000000.00' })
    expect(findPaymentPlanFormErrors(tooLargeForm, SCHOOL_YEAR)['down_payment.value']).toEqual([AMOUNT_TOO_LARGE])
    const maxForm = buildInstallmentForm({ down_payment_value: '9999999999.99' })
    expect(findPaymentPlanFormErrors(maxForm, SCHOOL_YEAR)).toEqual({})
  })

  it('validates a percent down payment between 0 and 100 exclusive', () => {
    const invalidValues = ['0', '100', '100.00']
    invalidValues.forEach((invalidValue) => {
      const percentForm = buildInstallmentForm({ down_payment_type: 'percent', down_payment_value: invalidValue })
      expect(findPaymentPlanFormErrors(percentForm, SCHOOL_YEAR)['down_payment.value']).toEqual([
        DOWN_PAYMENT_PERCENT_MESSAGE,
      ])
    })
    const validValues = ['99.99', '0.01', '20']
    validValues.forEach((validValue) => {
      const percentForm = buildInstallmentForm({ down_payment_type: 'percent', down_payment_value: validValue })
      expect(findPaymentPlanFormErrors(percentForm, SCHOOL_YEAR)).toEqual({})
    })
  })
})

describe('findPaymentPlanFormErrors adjustment', () => {
  it('allows 100 percent and refuses 100.01 and 0, and refuses a fixed 0', () => {
    const buildAdjustmentForm = (adjustmentType, adjustmentValue) =>
      buildInstallmentForm({ adjustment_kind: 'surcharge', adjustment_type: adjustmentType, adjustment_value: adjustmentValue })
    expect(findPaymentPlanFormErrors(buildAdjustmentForm('percent', '100'), SCHOOL_YEAR)).toEqual({})
    expect(findPaymentPlanFormErrors(buildAdjustmentForm('percent', '100.01'), SCHOOL_YEAR)['adjustment.value']).toEqual([
      ADJUSTMENT_PERCENT_MESSAGE,
    ])
    expect(findPaymentPlanFormErrors(buildAdjustmentForm('percent', '0'), SCHOOL_YEAR)['adjustment.value']).toEqual([
      ADJUSTMENT_PERCENT_MESSAGE,
    ])
    expect(findPaymentPlanFormErrors(buildAdjustmentForm('fixed', '0'), SCHOOL_YEAR)['adjustment.value']).toEqual([
      AMOUNT_INVALID,
    ])
  })

  it('requires a type when a kind is set and ignores leftovers when the kind is blank', () => {
    const noTypeForm = buildInstallmentForm({ adjustment_kind: 'surcharge', adjustment_type: '' })
    expect(findPaymentPlanFormErrors(noTypeForm, SCHOOL_YEAR)).toEqual({ 'adjustment.type': ['Choose an adjustment type.'] })
    const leftoverForm = buildInstallmentForm({ adjustment_kind: '', adjustment_type: 'percent', adjustment_value: 'abc' })
    expect(findPaymentPlanFormErrors(leftoverForm, SCHOOL_YEAR)).toEqual({})
  })

  it('drops a discount on installments and a surcharge on Cash without errors and sends null', () => {
    const discountForm = buildInstallmentForm({ adjustment_kind: 'discount', adjustment_type: 'percent', adjustment_value: '5' })
    expect(findPaymentPlanFormErrors(discountForm, SCHOOL_YEAR)).toEqual({})
    const surchargeCashForm = buildForm({ adjustment_kind: 'surcharge', adjustment_type: 'fixed', adjustment_value: '5' })
    expect(findPaymentPlanFormErrors(surchargeCashForm, SCHOOL_YEAR)).toEqual({})
    expect(buildPaymentPlanPayload(surchargeCashForm).adjustment).toBeNull()
  })
})

describe('buildPaymentPlanPayload', () => {
  it('builds the full installment payload from string controls', () => {
    const formValues = buildInstallmentForm({
      name: '  Quarterly  ',
      description: '   ',
      due_dates: [' 2026-08-01 ', '2026-11-01'],
      down_payment_type: 'percent',
      down_payment_value: '20',
      adjustment_kind: 'surcharge',
      adjustment_type: 'fixed',
      adjustment_value: '500',
    })
    const paymentPlanPayload = buildPaymentPlanPayload(formValues)
    expect(paymentPlanPayload).toEqual({
      school_year_id: 5,
      name: 'Quarterly',
      description: null,
      due_dates: ['2026-08-01', '2026-11-01'],
      down_payment: { type: 'percent', value: '20.00' },
      adjustment: { kind: 'surcharge', type: 'fixed', value: '500.00' },
    })
    expect('is_active' in paymentPlanPayload).toBe(false)
  })

  it('builds a Cash payload with a percent discount and no down payment', () => {
    const cashForm = buildForm({ adjustment_kind: 'discount', adjustment_type: 'percent', adjustment_value: '5' })
    expect(buildPaymentPlanPayload(cashForm)).toEqual({
      school_year_id: 5,
      name: 'Quarterly',
      description: null,
      due_dates: [],
      down_payment: null,
      adjustment: { kind: 'discount', type: 'percent', value: '5.00' },
    })
  })
})
