import { describe, it, expect } from 'vitest'
import {
  applyAssessmentGradeLevelChange,
  applyAssessmentPlanChange,
  applyAssessmentSchoolYearChange,
  buildAssessmentListParams,
  buildCandidateParams,
  createAssessmentFilters,
  hasMoreCandidatePages,
} from '@/utils/assessmentSearch.js'

describe('assessmentSearch', () => {
  it('creates the empty filters', () => {
    expect(createAssessmentFilters()).toEqual({
      schoolYearId: '',
      search: '',
      gradeLevelId: '',
      paymentPlanId: '',
      page: 1,
    })
  })

  it('builds no params without a valid school year', () => {
    expect(buildAssessmentListParams({ ...createAssessmentFilters(), schoolYearId: '' })).toBeNull()
    expect(buildAssessmentListParams({ ...createAssessmentFilters(), schoolYearId: 'abc' })).toBeNull()
  })

  it('builds full list params', () => {
    const filters = { schoolYearId: '5', search: '  ana  cruz ', gradeLevelId: '3', paymentPlanId: '7', page: 2 }
    expect(buildAssessmentListParams(filters)).toEqual({
      school_year_id: 5,
      page: 2,
      search: 'ana cruz',
      grade_level_id: 3,
      payment_plan_id: 7,
    })
  })

  it('drops junk ids, a bad page and a blank search', () => {
    const filters = { schoolYearId: '5', search: '   ', gradeLevelId: 'x', paymentPlanId: '0', page: 0 }
    expect(buildAssessmentListParams(filters)).toEqual({ school_year_id: 5, page: 1 })
  })

  it('clears the plan on a school year change and keeps the grade level', () => {
    const filters = { schoolYearId: '5', search: 'ana', gradeLevelId: '3', paymentPlanId: '7', page: 4 }
    const changedFilters = applyAssessmentSchoolYearChange(filters, 6)
    expect(changedFilters).toEqual({ schoolYearId: '6', search: 'ana', gradeLevelId: '3', paymentPlanId: '', page: 1 })
    expect(filters.paymentPlanId).toBe('7')
    expect(filters.page).toBe(4)
  })

  it('changes the grade level and plan filters and resets the page', () => {
    const filters = { ...createAssessmentFilters(), schoolYearId: '5', page: 3 }
    expect(applyAssessmentGradeLevelChange(filters, '9')).toMatchObject({ gradeLevelId: '9', page: 1 })
    expect(applyAssessmentPlanChange(filters, 8)).toMatchObject({ paymentPlanId: '8', page: 1 })
    expect(applyAssessmentPlanChange(filters, 'junk').paymentPlanId).toBe('')
  })

  it('builds candidate params', () => {
    expect(buildCandidateParams('', 'ana')).toBeNull()
    expect(buildCandidateParams('5', ' ana ')).toEqual({ school_year_id: 5, page: 1, search: 'ana' })
    expect(buildCandidateParams('5', '   ')).toEqual({ school_year_id: 5, page: 1 })
  })

  it('detects more candidate pages', () => {
    expect(hasMoreCandidatePages({ current_page: 1, last_page: 2 })).toBe(true)
    expect(hasMoreCandidatePages({ current_page: 1, last_page: 1 })).toBe(false)
    expect(hasMoreCandidatePages({})).toBe(false)
    expect(hasMoreCandidatePages({ current_page: '1', last_page: 2 })).toBe(false)
  })
})
