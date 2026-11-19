import { describe, it, expect } from 'vitest'
import {
  DATE_RANGE_INVALID_MESSAGE,
  applyDateFromChange,
  applyDateToChange,
  applyMethodChange,
  applyRecorderChange,
  applyStatusChange,
  buildLedgerSearchParams,
  buildPaymentListParams,
  createPaymentFilters,
  findDateRangeError,
} from '@/utils/paymentSearch.js'

const TODAY = '2026-11-19'

describe('createPaymentFilters', () => {
  it('starts on today for both dates with blank filters on page 1', () => {
    expect(createPaymentFilters(TODAY)).toEqual({
      dateFrom: TODAY,
      dateTo: TODAY,
      method: '',
      recordedBy: '',
      status: '',
      search: '',
      page: 1,
    })
  })
})

describe('buildPaymentListParams', () => {
  it('sends only the dates and page by default', () => {
    expect(buildPaymentListParams(createPaymentFilters(TODAY))).toEqual({ date_from: TODAY, date_to: TODAY, page: 1 })
  })

  it('adds method, recorder id, status, normalized search and page', () => {
    const paymentFilters = {
      ...createPaymentFilters(TODAY),
      method: 'check',
      recordedBy: '7',
      status: 'voided',
      search: '  ana   cruz ',
      page: 2,
    }
    expect(buildPaymentListParams(paymentFilters)).toEqual({
      date_from: TODAY,
      date_to: TODAY,
      page: 2,
      method: 'check',
      recorded_by: 7,
      status: 'voided',
      search: 'ana cruz',
    })
  })

  it('drops junk values and resets a bad page to 1', () => {
    const paymentFilters = {
      ...createPaymentFilters(TODAY),
      method: 'bitcoin',
      recordedBy: 'abc',
      status: 'x',
      page: 0,
    }
    expect(buildPaymentListParams(paymentFilters)).toEqual({ date_from: TODAY, date_to: TODAY, page: 1 })
  })

  it('returns null for an inverted or blank range and accepts equal dates', () => {
    expect(buildPaymentListParams({ ...createPaymentFilters(TODAY), dateFrom: '2026-11-20' })).toBeNull()
    expect(buildPaymentListParams({ ...createPaymentFilters(TODAY), dateTo: '' })).toBeNull()
    expect(buildPaymentListParams({ ...createPaymentFilters(TODAY), dateFrom: TODAY, dateTo: TODAY })).not.toBeNull()
  })
})

describe('findDateRangeError', () => {
  it('returns the message for a bad range and an empty string for a valid one', () => {
    expect(findDateRangeError({ dateFrom: '2026-11-20', dateTo: TODAY })).toBe(DATE_RANGE_INVALID_MESSAGE)
    expect(findDateRangeError({ dateFrom: '', dateTo: TODAY })).toBe(DATE_RANGE_INVALID_MESSAGE)
    expect(findDateRangeError({ dateFrom: TODAY, dateTo: TODAY })).toBe('')
    expect(findDateRangeError({ dateFrom: '2026-11-01', dateTo: TODAY })).toBe('')
  })
})

describe('apply change helpers', () => {
  it('set the field as a string, reset to page 1 and do not mutate the input', () => {
    const paymentFilters = { ...createPaymentFilters(TODAY), page: 3 }
    const frozenSnapshot = { ...paymentFilters }
    expect(applyDateFromChange(paymentFilters, '2026-11-01')).toMatchObject({ dateFrom: '2026-11-01', page: 1 })
    expect(applyDateToChange(paymentFilters, '2026-11-30')).toMatchObject({ dateTo: '2026-11-30', page: 1 })
    expect(applyMethodChange(paymentFilters, 'cash')).toMatchObject({ method: 'cash', page: 1 })
    expect(applyRecorderChange(paymentFilters, 7)).toMatchObject({ recordedBy: '7', page: 1 })
    expect(applyStatusChange(paymentFilters, 'valid')).toMatchObject({ status: 'valid', page: 1 })
    expect(paymentFilters).toEqual(frozenSnapshot)
  })
})

describe('buildLedgerSearchParams', () => {
  it('needs a school year and a search text', () => {
    expect(buildLedgerSearchParams('', 'ana')).toBeNull()
    expect(buildLedgerSearchParams('5', '   ')).toBeNull()
    expect(buildLedgerSearchParams('5', ' ana  cruz ')).toEqual({ school_year_id: 5, search: 'ana cruz', page: 1 })
  })
})
