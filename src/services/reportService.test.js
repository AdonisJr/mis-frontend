import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import { fetchArAging, fetchBalanceSheet, fetchIncomeStatement, fetchTrialBalance } from '@/services/reportService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn() },
}))

const REPORT_CASES = [
  { name: 'fetchTrialBalance', fetchReport: fetchTrialBalance, path: '/reports/trial-balance', params: { as_of: '2026-11-26' } },
  {
    name: 'fetchIncomeStatement',
    fetchReport: fetchIncomeStatement,
    path: '/reports/income-statement',
    params: { from: '2026-01-01', to: '2026-11-26' },
  },
  { name: 'fetchBalanceSheet', fetchReport: fetchBalanceSheet, path: '/reports/balance-sheet', params: { as_of: '2026-11-26' } },
  { name: 'fetchArAging', fetchReport: fetchArAging, path: '/reports/ar-aging', params: { as_of: '2026-11-26', school_year_id: 2 } },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe.each(REPORT_CASES)('$name', ({ fetchReport, path, params }) => {
  it('gets the report path with the params and returns the response data', async () => {
    http.get.mockResolvedValue({ data: { report: true } })
    await expect(fetchReport(params)).resolves.toEqual({ report: true })
    expect(http.get).toHaveBeenCalledWith(path, { params })
  })

  it('lets a rejected 422 error pass through unchanged', async () => {
    const validationError = { response: { status: 422, data: { errors: { as_of: ['x'] } } } }
    http.get.mockRejectedValue(validationError)
    await expect(fetchReport({})).rejects.toBe(validationError)
  })
})
