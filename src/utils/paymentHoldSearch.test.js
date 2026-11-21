import { describe, it, expect } from 'vitest'
import {
  applyHoldSchoolYearChange,
  applyHoldStatusChange,
  buildHoldCheckParams,
  buildHoldListParams,
  createHoldFilters,
} from '@/utils/paymentHoldSearch.js'

describe('createHoldFilters', () => {
  it('starts blank on page 1', () => {
    expect(createHoldFilters()).toEqual({ noteStatus: '', schoolYearId: '', search: '', page: 1 })
  })
})

describe('buildHoldListParams', () => {
  it('sends only the page by default', () => {
    expect(buildHoldListParams(createHoldFilters())).toEqual({ page: 1 })
  })

  it('adds status, school year id, normalized search and page', () => {
    const holdFilters = { noteStatus: 'broken', schoolYearId: '3', search: '  dela   cruz ', page: 2 }
    expect(buildHoldListParams(holdFilters)).toEqual({
      page: 2,
      status: 'broken',
      school_year_id: 3,
      search: 'dela cruz',
    })
  })

  it('drops junk values and falls back to page 1', () => {
    const holdFilters = { noteStatus: 'x', schoolYearId: 'abc', search: '   ', page: 0 }
    expect(buildHoldListParams(holdFilters)).toEqual({ page: 1 })
  })
})

describe('filter changes', () => {
  it('sets the status as a string and returns to page 1 without mutating', () => {
    const holdFilters = { ...createHoldFilters(), page: 4 }
    expect(applyHoldStatusChange(holdFilters, 'active')).toEqual({ ...holdFilters, noteStatus: 'active', page: 1 })
    expect(holdFilters.page).toBe(4)
  })

  it('sets the school year as a string and returns to page 1 without mutating', () => {
    const holdFilters = { ...createHoldFilters(), page: 4 }
    expect(applyHoldSchoolYearChange(holdFilters, 3)).toEqual({ ...holdFilters, schoolYearId: '3', page: 1 })
    expect(holdFilters.schoolYearId).toBe('')
  })
})

describe('buildHoldCheckParams', () => {
  it('returns null for bad ids', () => {
    expect(buildHoldCheckParams('', '4')).toBeNull()
    expect(buildHoldCheckParams('7', 'abc')).toBeNull()
  })

  it('returns numeric ids', () => {
    expect(buildHoldCheckParams('7', '4')).toEqual({ student_id: 7, school_year_id: 4 })
  })
})
