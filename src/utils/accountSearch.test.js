import { describe, it, expect } from 'vitest'
import {
  applyAccountSearchChange,
  applyAccountStatusChange,
  applyAccountTypeChange,
  buildAccountListParams,
  createAccountFilters,
} from '@/utils/accountSearch.js'

describe('createAccountFilters', () => {
  it('starts with no filters', () => {
    expect(createAccountFilters()).toEqual({ search: '', type: '', status: '' })
  })
})

describe('buildAccountListParams', () => {
  it('omits empty values and never sends a page', () => {
    expect(buildAccountListParams(createAccountFilters())).toEqual({})
    expect(buildAccountListParams(undefined)).toEqual({})
  })

  it('sends a normalised search, a known type and a known status', () => {
    const accountListParams = buildAccountListParams({ search: '  petty   cash ', type: 'asset', status: 'inactive' })
    expect(accountListParams).toEqual({ search: 'petty cash', type: 'asset', status: 'inactive' })
  })

  it('drops unknown type and status values', () => {
    expect(buildAccountListParams({ search: '', type: 'mystery', status: 'archived' })).toEqual({})
  })
})

describe('filter change helpers', () => {
  it('normalise the search and pick only known type and status values', () => {
    const accountFilters = createAccountFilters()
    expect(applyAccountSearchChange(accountFilters, '  cash ').search).toBe('cash')
    expect(applyAccountTypeChange(accountFilters, 'revenue').type).toBe('revenue')
    expect(applyAccountTypeChange(accountFilters, 'bogus').type).toBe('')
    expect(applyAccountStatusChange(accountFilters, 'active').status).toBe('active')
    expect(applyAccountStatusChange(accountFilters, 'bogus').status).toBe('')
  })
})
