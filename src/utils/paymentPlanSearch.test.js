import { describe, it, expect } from 'vitest'
import {
  applyPaymentPlanSchoolYearChange,
  buildPaymentPlanListParams,
  createPaymentPlanFilters,
} from '@/utils/paymentPlanSearch.js'

describe('createPaymentPlanFilters', () => {
  it('starts with no year, no search, all statuses and page 1', () => {
    expect(createPaymentPlanFilters()).toEqual({ schoolYearId: '', search: '', status: '', page: 1 })
  })
})

describe('buildPaymentPlanListParams', () => {
  it('returns null without a usable school year', () => {
    expect(buildPaymentPlanListParams({ ...createPaymentPlanFilters(), schoolYearId: '' })).toBeNull()
    expect(buildPaymentPlanListParams({ ...createPaymentPlanFilters(), schoolYearId: 'abc' })).toBeNull()
  })

  it('builds the full params from string controls', () => {
    const paymentPlanFilters = {
      schoolYearId: '5',
      search: '  Full   plan ',
      status: 'inactive',
      page: 2,
    }
    expect(buildPaymentPlanListParams(paymentPlanFilters)).toEqual({
      school_year_id: 5,
      page: 2,
      search: 'Full plan',
      status: 'inactive',
    })
  })

  it('drops an unknown status and an empty search and falls back to page 1', () => {
    const paymentPlanFilters = { schoolYearId: '5', search: '   ', status: 'archived', page: 0 }
    expect(buildPaymentPlanListParams(paymentPlanFilters)).toEqual({ school_year_id: 5, page: 1 })
  })
})

describe('applyPaymentPlanSchoolYearChange', () => {
  it('stores the id text, resets to page 1, keeps the rest and does not mutate', () => {
    const paymentPlanFilters = { schoolYearId: '5', search: 'Cash', status: 'active', page: 3 }
    const changedFilters = applyPaymentPlanSchoolYearChange(paymentPlanFilters, 7)
    expect(changedFilters).toEqual({ schoolYearId: '7', search: 'Cash', status: 'active', page: 1 })
    expect(paymentPlanFilters.page).toBe(3)
  })
})
