import { describe, it, expect } from 'vitest'
import {
  FEE_ITEM_CATEGORY_OPTIONS,
  buildFeeItemDeactivateMessage,
  buildFeeItemPayload,
  buildFeeItemReactivateMessage,
  buildFormFromFeeItem,
  createEmptyFeeItemForm,
  findFeeItemFormErrors,
  getCategoryLabel,
} from '@/utils/feeItemForm.js'

const validForm = { name: 'Tuition', category: 'tuition', description: '' }

describe('fee item categories', () => {
  it('lists the categories in order with labels', () => {
    expect(FEE_ITEM_CATEGORY_OPTIONS).toEqual([
      { value: 'tuition', label: 'Tuition' },
      { value: 'miscellaneous', label: 'Miscellaneous' },
      { value: 'other', label: 'Other' },
    ])
  })

  it('getCategoryLabel maps known, keeps unknown and blanks non-strings', () => {
    expect(getCategoryLabel('miscellaneous')).toBe('Miscellaneous')
    expect(getCategoryLabel('books')).toBe('books')
    expect(getCategoryLabel(null)).toBe('')
  })
})

describe('form building', () => {
  it('starts empty', () => {
    expect(createEmptyFeeItemForm()).toEqual({ name: '', category: '', description: '' })
  })

  it('maps a fee item, an unknown category and a non-object', () => {
    expect(buildFormFromFeeItem({ name: 'Lab', category: 'other', description: null })).toEqual({
      name: 'Lab',
      category: 'other',
      description: '',
    })
    expect(buildFormFromFeeItem({ name: 'Lab', category: 'books' }).category).toBe('')
    expect(buildFormFromFeeItem(null)).toEqual(createEmptyFeeItemForm())
  })
})

describe('findFeeItemFormErrors', () => {
  it('returns nothing for a complete form', () => {
    expect(findFeeItemFormErrors(validForm)).toEqual({})
  })

  it('requires a name and a category', () => {
    expect(findFeeItemFormErrors({ name: '   ', category: '', description: '' })).toEqual({
      name: ['Name is required.'],
      category: ['Category is required.'],
    })
  })

  it('limits the name to 255 characters', () => {
    expect(findFeeItemFormErrors({ ...validForm, name: 'a'.repeat(256) }).name).toEqual([
      'Name must be at most 255 characters.',
    ])
    expect(findFeeItemFormErrors({ ...validForm, name: 'a'.repeat(255) })).toEqual({})
  })

  it('rejects a category that is not listed', () => {
    expect(findFeeItemFormErrors({ ...validForm, category: 'books' }).category).toEqual(['Category is required.'])
  })

  it('limits the description to 1000 characters', () => {
    expect(findFeeItemFormErrors({ ...validForm, description: 'a'.repeat(1001) }).description).toEqual([
      'Description must be at most 1000 characters.',
    ])
    expect(findFeeItemFormErrors({ ...validForm, description: 'a'.repeat(1000) })).toEqual({})
  })
})

describe('buildFeeItemPayload', () => {
  it('trims text, sends a blank description as null and never sends is_active', () => {
    expect(buildFeeItemPayload({ name: ' Tuition ', category: 'tuition', description: '  ' })).toEqual({
      name: 'Tuition',
      category: 'tuition',
      description: null,
    })
    expect(buildFeeItemPayload({ ...validForm, description: ' note ' }).description).toBe('note')
  })
})

describe('status messages', () => {
  it('names the fee item and returns an empty string for a non-object', () => {
    expect(buildFeeItemDeactivateMessage({ name: 'Lab' })).toBe(
      'Deactivate Lab? It stays on existing schedules but cannot be added to new lines.',
    )
    expect(buildFeeItemReactivateMessage({ name: 'Lab' })).toBe(
      'Reactivate Lab? It can be added to schedule lines again.',
    )
    expect(buildFeeItemDeactivateMessage(null)).toBe('')
    expect(buildFeeItemReactivateMessage(null)).toBe('')
  })
})
