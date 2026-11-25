import { describe, it, expect } from 'vitest'
import {
  applyAccountFormTypeChange,
  buildAccountPayload,
  buildFormFromAccount,
  createEmptyAccountForm,
  findAccountFormErrors,
} from '@/utils/accountForm.js'

function buildValidForm(overrides = {}) {
  return { ...createEmptyAccountForm(), code: '1010', name: 'Cash', type: 'asset', subtype: 'current_asset', ...overrides }
}

describe('createEmptyAccountForm and buildFormFromAccount', () => {
  it('starts empty with a false contra flag', () => {
    expect(createEmptyAccountForm()).toEqual({ code: '', name: '', type: '', subtype: '', is_contra: false, description: '' })
  })

  it('fills the form from an account and nulls become empty text', () => {
    const accountForm = buildFormFromAccount({
      code: '1190', name: 'Allowance', type: 'asset', subtype: 'current_asset', is_contra: true, description: null,
    })
    expect(accountForm).toEqual({
      code: '1190', name: 'Allowance', type: 'asset', subtype: 'current_asset', is_contra: true, description: '',
    })
  })

  it('drops an unknown type and an unfit subtype', () => {
    expect(buildFormFromAccount({ code: '1', name: 'x', type: 'mystery', subtype: 'equity' })).toMatchObject({ type: '', subtype: '' })
    expect(buildFormFromAccount({ type: 'asset', subtype: 'other_income' })).toMatchObject({ type: 'asset', subtype: '' })
    expect(buildFormFromAccount(null)).toEqual(createEmptyAccountForm())
  })
})

describe('applyAccountFormTypeChange', () => {
  it('clears an unfit subtype and keeps a fitting one', () => {
    const revenueForm = applyAccountFormTypeChange(buildValidForm(), 'revenue')
    expect(revenueForm).toMatchObject({ type: 'revenue', subtype: '' })
    const sameForm = applyAccountFormTypeChange(buildValidForm(), 'asset')
    expect(sameForm.subtype).toBe('current_asset')
  })
})

describe('findAccountFormErrors code rules', () => {
  it('accepts a valid form', () => {
    expect(findAccountFormErrors(buildValidForm())).toEqual({})
  })

  it('requires the code', () => {
    expect(findAccountFormErrors(buildValidForm({ code: '  ' })).code).toEqual(['Code is required.'])
  })

  it('refuses non-digit codes', () => {
    expect(findAccountFormErrors(buildValidForm({ code: '12a4' })).code).toEqual(['Code must contain digits only.'])
  })

  it('refuses short and long codes but keeps a leading zero and the 4 and 10 limits', () => {
    expect(findAccountFormErrors(buildValidForm({ code: '123' })).code).toEqual(['Code must be 4 to 10 digits.'])
    expect(findAccountFormErrors(buildValidForm({ code: '12345678901' })).code).toEqual(['Code must be 4 to 10 digits.'])
    expect(findAccountFormErrors(buildValidForm({ code: '0101' })).code).toBeUndefined()
    expect(findAccountFormErrors(buildValidForm({ code: '1234567890' })).code).toBeUndefined()
  })
})

describe('findAccountFormErrors other fields', () => {
  it('requires a name of at most 150 characters after trimming', () => {
    expect(findAccountFormErrors(buildValidForm({ name: ' ' })).name).toEqual(['Name is required.'])
    expect(findAccountFormErrors(buildValidForm({ name: 'x'.repeat(151) })).name).toEqual(['Name must be at most 150 characters.'])
    expect(findAccountFormErrors(buildValidForm({ name: ` ${'x'.repeat(150)} ` })).name).toBeUndefined()
  })

  it('requires a type, then a subtype that fits it', () => {
    expect(findAccountFormErrors(buildValidForm({ type: '', subtype: '' })).type).toEqual(['Type is required.'])
    expect(findAccountFormErrors(buildValidForm({ subtype: '' })).subtype).toEqual(['Select a subtype for this type.'])
    expect(findAccountFormErrors(buildValidForm({ subtype: 'other_income' })).subtype).toEqual(['Select a subtype for this type.'])
  })

  it('does not limit the description', () => {
    expect(findAccountFormErrors(buildValidForm({ description: 'x'.repeat(5000) }))).toEqual({})
  })
})

describe('buildAccountPayload', () => {
  it('trims, nulls an empty description, keeps a boolean contra flag and never sends is_active', () => {
    const accountPayload = buildAccountPayload(buildValidForm({ code: ' 1010 ', name: ' Cash ', description: '  ', is_contra: true }))
    expect(accountPayload).toEqual({
      code: '1010', name: 'Cash', type: 'asset', subtype: 'current_asset', is_contra: true, description: null,
    })
    expect(accountPayload).not.toHaveProperty('is_active')
    expect(buildAccountPayload(buildValidForm({ is_contra: 'yes', description: ' note ' }))).toMatchObject({
      is_contra: false, description: 'note',
    })
  })
})
