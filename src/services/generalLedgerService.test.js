import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import { fetchGeneralLedger } from '@/services/generalLedgerService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchGeneralLedger', () => {
  it('gets /general-ledger with the params and returns the response data', async () => {
    const ledgerParams = { account_id: 3, from: '2026-01-01', to: '2026-11-26' }
    http.get.mockResolvedValue({ data: { ledger: { lines: [] } } })
    await expect(fetchGeneralLedger(ledgerParams)).resolves.toEqual({ ledger: { lines: [] } })
    expect(http.get).toHaveBeenCalledWith('/general-ledger', { params: ledgerParams })
  })

  it('lets a rejected 422 error pass through unchanged', async () => {
    const validationError = { response: { status: 422, data: { errors: { account_id: ['x'] } } } }
    http.get.mockRejectedValue(validationError)
    await expect(fetchGeneralLedger({})).rejects.toBe(validationError)
  })
})
