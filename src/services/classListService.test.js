import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import { fetchAdvisorySection, fetchClassRoster, fetchMyClasses } from '@/services/classListService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn() },
}))

const LIST_PARAMS = { school_year_id: 7, term_number: 2 }
const INVALID_ID_MESSAGE = 'A valid class id is required.'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchMyClasses', () => {
  it('(1) gets /my-classes with the params and returns the data', async () => {
    http.get.mockResolvedValue({ data: { classes: [] } })
    await expect(fetchMyClasses(LIST_PARAMS)).resolves.toEqual({ classes: [] })
    expect(http.get).toHaveBeenCalledWith('/my-classes', { params: LIST_PARAMS })
  })
})

describe('fetchAdvisorySection', () => {
  it('(2) gets /my-advisory-section with the params', async () => {
    http.get.mockResolvedValue({ data: { advisory_section: null } })
    await expect(fetchAdvisorySection(LIST_PARAMS)).resolves.toEqual({ advisory_section: null })
    expect(http.get).toHaveBeenCalledWith('/my-advisory-section', { params: LIST_PARAMS })
  })
})

describe('fetchClassRoster', () => {
  it('(3) gets /classes/{id}/roster', async () => {
    http.get.mockResolvedValue({ data: { students: [] } })
    await expect(fetchClassRoster(7)).resolves.toEqual({ students: [] })
    expect(http.get).toHaveBeenCalledWith('/classes/7/roster')
  })

  it('(4) rejects an invalid id before any request', async () => {
    for (const invalidId of ['7', 0, null, 1.5]) {
      await expect(fetchClassRoster(invalidId)).rejects.toThrow(INVALID_ID_MESSAGE)
    }
    expect(http.get).not.toHaveBeenCalled()
  })

  it('(5) passes a rejected 403 through unchanged', async () => {
    const forbiddenError = { response: { status: 403, data: { message: 'No.' } } }
    http.get.mockRejectedValue(forbiddenError)
    await expect(fetchClassRoster(7)).rejects.toBe(forbiddenError)
  })
})
