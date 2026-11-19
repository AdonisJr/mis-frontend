import { describe, it, expect } from 'vitest'
import {
  applyDiscountSourceChange,
  applyDiscountTypeFilterChange,
  applyStudentDiscountSchoolYearChange,
  buildDiscountTypeListParams,
  buildEnrollmentCandidateParams,
  buildStudentDiscountListParams,
  createDiscountTypeFilters,
  createStudentDiscountFilters,
} from '@/utils/discountSearch.js'

describe('discountSearch', () => {
  it('builds full discount type params', () => {
    expect(createDiscountTypeFilters()).toEqual({ search: '', source: '', status: '', page: 1 })
    const filters = { search: '  ESC  grantee ', source: 'government', status: 'inactive', page: 2 }
    expect(buildDiscountTypeListParams(filters)).toEqual({
      page: 2,
      search: 'ESC grantee',
      source: 'government',
      status: 'inactive',
    })
  })

  it('drops unknown source and status, bad page and empty search', () => {
    const filters = { search: '   ', source: 'private', status: 'gone', page: 0 }
    expect(buildDiscountTypeListParams(filters)).toEqual({ page: 1 })
  })

  it('changes the source filter and resets the page', () => {
    const filters = { search: 'a', source: '', status: '', page: 3 }
    const next = applyDiscountSourceChange(filters, 'school')
    expect(next).toEqual({ search: 'a', source: 'school', status: '', page: 1 })
    expect(applyDiscountSourceChange(filters, 'bogus').source).toBe('')
    expect(filters.page).toBe(3)
  })

  it('builds student discount filters and returns null without a year', () => {
    expect(createStudentDiscountFilters()).toEqual({
      schoolYearId: '',
      search: '',
      discountTypeId: '',
      source: '',
      page: 1,
    })
    expect(buildStudentDiscountListParams({ ...createStudentDiscountFilters(), schoolYearId: '' })).toBeNull()
    expect(buildStudentDiscountListParams({ ...createStudentDiscountFilters(), schoolYearId: 'abc' })).toBeNull()
  })

  it('builds full student discount params with numeric ids', () => {
    const filters = { schoolYearId: '5', search: ' ana ', discountTypeId: '3', source: 'school', page: 2 }
    expect(buildStudentDiscountListParams(filters)).toEqual({
      school_year_id: 5,
      page: 2,
      search: 'ana',
      discount_type_id: 3,
      source: 'school',
    })
  })

  it('drops a junk type id and unknown source', () => {
    const filters = { schoolYearId: '5', search: '', discountTypeId: 'x', source: 'bogus', page: 1 }
    expect(buildStudentDiscountListParams(filters)).toEqual({ school_year_id: 5, page: 1 })
  })

  it('keeps the type on a year change and resets the page', () => {
    const filters = { schoolYearId: '5', search: '', discountTypeId: '3', source: '', page: 4 }
    const nextYear = applyStudentDiscountSchoolYearChange(filters, 6)
    expect(nextYear).toEqual({ ...filters, schoolYearId: '6', page: 1 })
    const nextType = applyDiscountTypeFilterChange(filters, '8')
    expect(nextType).toEqual({ ...filters, discountTypeId: '8', page: 1 })
  })

  it('builds the two enrollment candidate requests, or none', () => {
    expect(buildEnrollmentCandidateParams('5', ' ana ')).toEqual([
      { school_year_id: 5, status: 'enrolled', search: 'ana', page: 1 },
      { school_year_id: 5, status: 'completed', search: 'ana', page: 1 },
    ])
    expect(buildEnrollmentCandidateParams('5', '   ')).toEqual([])
    expect(buildEnrollmentCandidateParams('', 'ana')).toEqual([])
  })
})
