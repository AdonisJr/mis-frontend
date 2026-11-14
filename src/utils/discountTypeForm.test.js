import { describe, it, expect } from 'vitest'
import {
  BASE_REQUIRED_MESSAGE,
  DISCOUNT_BASE_OPTIONS,
  DISCOUNT_SOURCE_OPTIONS,
  DISCOUNT_STAGES,
  DISCOUNT_STAGE_OPTIONS,
  SOURCE_REQUIRED_MESSAGE,
  STAGES_REQUIRED_MESSAGE,
  STAGE_INVALID_MESSAGE,
  VALUE_TYPE_REQUIRED_MESSAGE,
  buildDiscountTypePayload,
  buildFormFromDiscountType,
  createEmptyDiscountTypeForm,
  findDiscountTypeFormErrors,
  toggleDiscountStage,
} from '@/utils/discountTypeForm.js'
import { AMOUNT_INVALID, AMOUNT_REQUIRED, AMOUNT_TOO_LARGE } from '@/utils/feeScheduleForm.js'
import {
  ADJUSTMENT_PERCENT_MESSAGE,
  DESCRIPTION_TOO_LONG_MESSAGE,
  NAME_REQUIRED_MESSAGE,
  NAME_TOO_LONG_MESSAGE,
  PERCENT_REQUIRED_MESSAGE,
} from '@/utils/paymentPlanForm.js'

function buildValidFixed() {
  return {
    name: 'ESC grantee',
    description: '',
    source: 'government',
    value_type: 'fixed',
    value: '1500',
    base: 'tuition',
    stages: ['jhs', 'shs'],
  }
}

function errorsFor(overrides) {
  return findDiscountTypeFormErrors({ ...buildValidFixed(), ...overrides })
}

describe('discountTypeForm', () => {
  it('exposes the option constants in order', () => {
    expect(DISCOUNT_SOURCE_OPTIONS.map((option) => option.value)).toEqual(['government', 'school'])
    expect(DISCOUNT_BASE_OPTIONS.map((option) => option.value)).toEqual(['tuition', 'total'])
    expect(DISCOUNT_STAGES).toEqual(['jhs', 'shs'])
    expect(DISCOUNT_STAGE_OPTIONS).toEqual([
      { value: 'jhs', label: 'JHS' },
      { value: 'shs', label: 'SHS' },
    ])
  })

  it('creates an empty form', () => {
    expect(createEmptyDiscountTypeForm()).toEqual({
      name: '',
      description: '',
      source: '',
      value_type: '',
      value: '',
      base: '',
      stages: [],
    })
  })

  it('builds a form from a discount type with canonical stages and empty description', () => {
    const form = buildFormFromDiscountType({
      name: 'Sibling',
      description: null,
      source: 'school',
      value_type: 'percent',
      value: '10.00',
      base: 'total',
      stages: ['shs', 'jhs'],
    })
    expect(form.stages).toEqual(['jhs', 'shs'])
    expect(form.description).toBe('')
    expect(form.value).toBe('10.00')
  })

  it('returns the empty form for a non-object', () => {
    expect(buildFormFromDiscountType(null)).toEqual(createEmptyDiscountTypeForm())
    expect(buildFormFromDiscountType('x')).toEqual(createEmptyDiscountTypeForm())
  })

  it('toggles stages in canonical order without mutating', () => {
    const original = ['shs']
    expect(toggleDiscountStage(original, 'jhs')).toEqual(['jhs', 'shs'])
    expect(original).toEqual(['shs'])
    expect(toggleDiscountStage(['jhs', 'shs'], 'jhs')).toEqual(['shs'])
    expect(toggleDiscountStage(['jhs'], 'college')).toEqual(['jhs'])
    expect(toggleDiscountStage('nope', 'jhs')).toEqual(['jhs'])
  })

  it('accepts a valid fixed form', () => {
    expect(findDiscountTypeFormErrors(buildValidFixed())).toEqual({})
  })

  it('accepts a valid percent form at 100', () => {
    expect(errorsFor({ value_type: 'percent', value: '100' })).toEqual({})
  })

  it('checks the name length', () => {
    expect(errorsFor({ name: '   ' }).name).toEqual([NAME_REQUIRED_MESSAGE])
    expect(errorsFor({ name: 'a'.repeat(101) }).name).toEqual([NAME_TOO_LONG_MESSAGE])
    expect(errorsFor({ name: 'a'.repeat(100) }).name).toBeUndefined()
  })

  it('checks the description length', () => {
    expect(errorsFor({ description: 'a'.repeat(1001) }).description).toEqual([DESCRIPTION_TOO_LONG_MESSAGE])
    expect(errorsFor({ description: 'a'.repeat(1000) }).description).toBeUndefined()
  })

  it('requires known source, value type and base', () => {
    expect(errorsFor({ source: '' }).source).toEqual([SOURCE_REQUIRED_MESSAGE])
    expect(errorsFor({ source: 'private' }).source).toEqual([SOURCE_REQUIRED_MESSAGE])
    expect(errorsFor({ value_type: 'ratio' }).value_type).toEqual([VALUE_TYPE_REQUIRED_MESSAGE])
    expect(errorsFor({ base: '' }).base).toEqual([BASE_REQUIRED_MESSAGE])
    expect(errorsFor({ base: 'other' }).base).toEqual([BASE_REQUIRED_MESSAGE])
  })

  it('validates a fixed value', () => {
    expect(errorsFor({ value: '' }).value).toEqual([AMOUNT_REQUIRED])
    ;['0', '-5', '1.234', 'abc', '1,500'].forEach((value) => {
      expect(errorsFor({ value }).value).toEqual([AMOUNT_INVALID])
    })
    expect(errorsFor({ value: '10000000000.00' }).value).toEqual([AMOUNT_TOO_LARGE])
    expect(errorsFor({ value: '9999999999.99' }).value).toBeUndefined()
  })

  it('validates a percent value', () => {
    const percent = { value_type: 'percent' }
    expect(errorsFor({ ...percent, value: '' }).value).toEqual([PERCENT_REQUIRED_MESSAGE])
    ;['0', '100.01', '101', '1.234'].forEach((value) => {
      expect(errorsFor({ ...percent, value }).value).toEqual([ADJUSTMENT_PERCENT_MESSAGE])
    })
    ;['0.01', '12.5', '100.00'].forEach((value) => {
      expect(errorsFor({ ...percent, value }).value).toBeUndefined()
    })
  })

  it('reports only value_type when no value type is chosen', () => {
    const errors = errorsFor({ value_type: '', value: 'garbage' })
    expect(errors.value_type).toEqual([VALUE_TYPE_REQUIRED_MESSAGE])
    expect(errors.value).toBeUndefined()
  })

  it('validates stages', () => {
    expect(errorsFor({ stages: [] }).stages).toEqual([STAGES_REQUIRED_MESSAGE])
    expect(errorsFor({ stages: ['college'] }).stages).toEqual([STAGE_INVALID_MESSAGE])
    expect(errorsFor({ stages: ['jhs', 'college'] }).stages).toEqual([STAGE_INVALID_MESSAGE])
    expect(errorsFor({ stages: ['shs'] }).stages).toBeUndefined()
  })

  it('builds a fixed payload with a 2-decimal value and canonical stages', () => {
    const payload = buildDiscountTypePayload({
      ...buildValidFixed(),
      name: '  ESC grantee ',
      description: '   ',
      value: '1500.5',
      stages: ['shs', 'jhs'],
    })
    expect(payload).toEqual({
      name: 'ESC grantee',
      description: null,
      source: 'government',
      value_type: 'fixed',
      value: '1500.50',
      base: 'tuition',
      stages: ['jhs', 'shs'],
    })
    expect(payload).not.toHaveProperty('is_active')
  })

  it('builds a percent payload with a 2-decimal value', () => {
    const payload = buildDiscountTypePayload({ ...buildValidFixed(), value_type: 'percent', value: '12.5' })
    expect(payload.value).toBe('12.50')
    expect(payload.value_type).toBe('percent')
  })
})
