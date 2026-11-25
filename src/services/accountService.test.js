import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  createAccount,
  deactivateAccount,
  deleteAccount,
  fetchAccount,
  fetchAccounts,
  fetchAllAccounts,
  reactivateAccount,
  updateAccount,
} from '@/services/accountService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const ACCOUNT_PAYLOAD = { code: '1010', name: 'Cash', type: 'asset', subtype: 'current_asset', is_contra: false, description: null }
const ID_MESSAGE = 'A valid account id is required.'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchAccounts', () => {
  it('gets /accounts with the params and returns the response data', async () => {
    http.get.mockResolvedValue({ data: { accounts: [] } })
    await expect(fetchAccounts({ type: 'asset', page: 2 })).resolves.toEqual({ accounts: [] })
    expect(http.get).toHaveBeenCalledWith('/accounts', { params: { type: 'asset', page: 2 } })
  })
})

describe('fetchAllAccounts', () => {
  it('merges every page and keeps type and status on each call', async () => {
    http.get
      .mockResolvedValueOnce({ data: { accounts: [{ id: 1 }], meta: { last_page: 3 } } })
      .mockResolvedValueOnce({ data: { accounts: [{ id: 2 }], meta: { last_page: 3 } } })
      .mockResolvedValueOnce({ data: { accounts: [{ id: 3 }], meta: { last_page: 3 } } })
    const accountResponse = await fetchAllAccounts({ type: 'asset', status: 'active' })
    expect(accountResponse).toEqual({ accounts: [{ id: 1 }, { id: 2 }, { id: 3 }] })
    expect(http.get).toHaveBeenCalledTimes(3)
    expect(http.get).toHaveBeenNthCalledWith(1, '/accounts', { params: { type: 'asset', status: 'active', page: 1 } })
    expect(http.get).toHaveBeenNthCalledWith(3, '/accounts', { params: { type: 'asset', status: 'active', page: 3 } })
  })

  it('makes one call when the response has no meta', async () => {
    http.get.mockResolvedValue({ data: { accounts: [{ id: 1 }] } })
    await expect(fetchAllAccounts({})).resolves.toEqual({ accounts: [{ id: 1 }] })
    expect(http.get).toHaveBeenCalledTimes(1)
  })
})

describe('fetchAccount', () => {
  it('gets /accounts/7', async () => {
    http.get.mockResolvedValue({ data: { account: { id: 7 } } })
    await expect(fetchAccount(7)).resolves.toEqual({ account: { id: 7 } })
    expect(http.get).toHaveBeenCalledWith('/accounts/7')
  })
})

describe('createAccount and updateAccount', () => {
  it('posts the payload to /accounts', async () => {
    http.post.mockResolvedValue({ data: { account: { id: 1 } } })
    await expect(createAccount(ACCOUNT_PAYLOAD)).resolves.toEqual({ account: { id: 1 } })
    expect(http.post).toHaveBeenCalledWith('/accounts', ACCOUNT_PAYLOAD)
  })

  it('puts the payload to /accounts/7', async () => {
    http.put.mockResolvedValue({ data: { account: { id: 7 } } })
    await expect(updateAccount(7, ACCOUNT_PAYLOAD)).resolves.toEqual({ account: { id: 7 } })
    expect(http.put).toHaveBeenCalledWith('/accounts/7', ACCOUNT_PAYLOAD)
  })
})

describe('status and delete calls', () => {
  it('sends body-less puts to the deactivate and reactivate segments', async () => {
    http.put.mockResolvedValue({ data: { account: { id: 7 } } })
    await deactivateAccount(7)
    await reactivateAccount(7)
    expect(http.put).toHaveBeenNthCalledWith(1, '/accounts/7/deactivate')
    expect(http.put).toHaveBeenNthCalledWith(2, '/accounts/7/reactivate')
  })

  it('deletes /accounts/7', async () => {
    http.delete.mockResolvedValue({ data: '' })
    await deleteAccount(7)
    expect(http.delete).toHaveBeenCalledWith('/accounts/7')
  })
})

describe('guards and errors', () => {
  it('rejects an invalid id before any call', async () => {
    await expect(fetchAccount('7')).rejects.toThrow(ID_MESSAGE)
    await expect(deleteAccount(0)).rejects.toThrow(ID_MESSAGE)
    await expect(deactivateAccount(null)).rejects.toThrow(ID_MESSAGE)
    expect(http.get).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
  })

  it('passes a rejected 422 error through unchanged', async () => {
    const validationError = { response: { status: 422, data: { message: 'Invalid.', errors: { code: ['Taken.'] } } } }
    http.post.mockRejectedValue(validationError)
    await expect(createAccount(ACCOUNT_PAYLOAD)).rejects.toBe(validationError)
  })
})
