import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import { closeRfidChannel, openRfidChannel } from '@/services/rfidService.js'

vi.mock('@/services/http.js', () => ({
  default: { post: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('openRfidChannel', () => {
  it('posts /rfid/open and returns the response data', async () => {
    http.post.mockResolvedValue({ data: { message: 'open' } })
    await expect(openRfidChannel()).resolves.toEqual({ message: 'open' })
    expect(http.post).toHaveBeenCalledWith('/rfid/open')
  })
})

describe('closeRfidChannel', () => {
  it('posts /rfid/close without auth handling and returns the response data', async () => {
    http.post.mockResolvedValue({ data: { message: 'closed' } })
    await expect(closeRfidChannel()).resolves.toEqual({ message: 'closed' })
    expect(http.post).toHaveBeenCalledWith('/rfid/close', null, { skipAuthHandling: true })
  })
})

describe('rejections', () => {
  it('rejects with the same error object', async () => {
    const requestError = new Error('boom')
    http.post.mockRejectedValue(requestError)
    await expect(openRfidChannel()).rejects.toBe(requestError)
    await expect(closeRfidChannel()).rejects.toBe(requestError)
  })
})
