import { describe, it, expect } from 'vitest'
import { applySubjectTypeChange, buildSubjectListParams, createSubjectFilters } from '@/utils/subjectSearch.js'

describe('createSubjectFilters', () => {
  it('starts with no search, type or status and page 1', () => {
    expect(createSubjectFilters()).toEqual({ search: '', type: '', status: '', page: 1 })
  })
})

describe('buildSubjectListParams', () => {
  it('returns only page 1 for empty filters', () => {
    expect(buildSubjectListParams(createSubjectFilters())).toEqual({ page: 1 })
  })

  it('includes the normalized search, type and status', () => {
    const subjectFilters = { search: '  Math   7 ', type: 'shs_core', status: 'inactive', page: 2 }
    expect(buildSubjectListParams(subjectFilters)).toEqual({
      page: 2,
      search: 'Math 7',
      type: 'shs_core',
      status: 'inactive',
    })
  })

  it('drops an unknown type or status and falls back to page 1 for a bad page', () => {
    const subjectFilters = { search: '', type: 'x', status: 'y', page: 0 }
    expect(buildSubjectListParams(subjectFilters)).toEqual({ page: 1 })
  })
})

describe('applySubjectTypeChange', () => {
  it('keeps a known type, blanks an unknown one, resets the page and leaves the input unchanged', () => {
    const subjectFilters = { search: 'a', type: '', status: '', page: 4 }
    expect(applySubjectTypeChange(subjectFilters, 'shs_applied')).toEqual({
      search: 'a',
      type: 'shs_applied',
      status: '',
      page: 1,
    })
    expect(applySubjectTypeChange(subjectFilters, 'nope').type).toBe('')
    expect(subjectFilters.page).toBe(4)
  })
})
