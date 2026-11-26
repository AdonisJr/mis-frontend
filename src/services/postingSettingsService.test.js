import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  fetchPostingMappings,
  fetchUnpostedEvents,
  postPendingEvents,
  updatePostingMappings,
} from '@/services/postingSettingsService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('postingSettingsService', () => {
  it('fetches the posting mappings', async () => {
    const body = { posting_mappings: [] }
    http.get.mockResolvedValue({ data: body })

    await expect(fetchPostingMappings()).resolves.toBe(body)
    expect(http.get).toHaveBeenCalledWith('/posting-settings')
  })

  it('sends only the changed mappings on update', async () => {
    const payload = { mappings: { ar_students: 12 } }
    const body = { posting_mappings: [] }
    http.put.mockResolvedValue({ data: body })

    await expect(updatePostingMappings(payload)).resolves.toBe(body)
    expect(http.put).toHaveBeenCalledWith('/posting-settings', payload)
  })

  it('fetches a page of unposted events', async () => {
    const body = { unposted_events: [], meta: {} }
    http.get.mockResolvedValue({ data: body })

    await expect(fetchUnpostedEvents({ page: 2 })).resolves.toBe(body)
    expect(http.get).toHaveBeenCalledWith('/unposted-events', { params: { page: 2 } })
  })

  it('posts pending events with no body', async () => {
    const body = { posted_count: 1, failed_count: 0, failures: [] }
    http.post.mockResolvedValue({ data: body })

    await expect(postPendingEvents()).resolves.toBe(body)
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post.mock.calls[0]).toEqual(['/unposted-events/post'])
  })

  it('passes a rejected 422 error through unchanged', async () => {
    const error = { response: { status: 422, data: { message: 'Invalid' } } }
    http.put.mockRejectedValue(error)

    await expect(updatePostingMappings({ mappings: {} })).rejects.toBe(error)
  })
})
