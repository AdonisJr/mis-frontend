import { describe, it, expect } from 'vitest'
import { applyFeeItemCategoryChange, buildFeeItemListParams, createFeeItemFilters } from '@/utils/feeItemSearch.js'

describe('createFeeItemFilters', () => {
  it('starts with no search, category or status and page 1', () => {
    expect(createFeeItemFilters()).toEqual({ search: '', category: '', status: '', page: 1 })
  })
})

describe('buildFeeItemListParams', () => {
  it('returns only page 1 for empty filters', () => {
    expect(buildFeeItemListParams(createFeeItemFilters())).toEqual({ page: 1 })
  })

  it('includes the normalized search, category and status', () => {
    const feeItemFilters = { search: '  Lab   fee ', category: 'other', status: 'active', page: 3 }
    expect(buildFeeItemListParams(feeItemFilters)).toEqual({
      page: 3,
      search: 'Lab fee',
      category: 'other',
      status: 'active',
    })
  })

  it('drops an unknown category or status and falls back to page 1 for a bad page', () => {
    const feeItemFilters = { search: '', category: 'books', status: 'archived', page: 0 }
    expect(buildFeeItemListParams(feeItemFilters)).toEqual({ page: 1 })
  })
})

describe('applyFeeItemCategoryChange', () => {
  it('keeps a listed category, clears an unknown one, resets to page 1 and does not mutate', () => {
    const feeItemFilters = { search: 'a', category: '', status: '', page: 4 }
    expect(applyFeeItemCategoryChange(feeItemFilters, 'tuition')).toEqual({
      search: 'a',
      category: 'tuition',
      status: '',
      page: 1,
    })
    expect(applyFeeItemCategoryChange(feeItemFilters, 'books').category).toBe('')
    expect(feeItemFilters.page).toBe(4)
  })
})
