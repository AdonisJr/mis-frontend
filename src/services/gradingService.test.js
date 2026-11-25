import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  createActivity,
  deleteActivity,
  fetchClassRecord,
  fetchReportCard,
  fetchSectionReportCards,
  reopenQuarter,
  saveScores,
  submitQuarter,
  updateActivity,
} from '@/services/gradingService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const QUARTER_REF = { classId: 7, quarter: 2 }
const ACTIVITY_REF = { classId: 7, quarter: 2, activityId: 5 }
const BODY = { title: 'Quiz 1' }
const INVALID_ID_MESSAGE = 'A valid record id is required.'
const INVALID_QUARTER_MESSAGE = 'A valid quarter is required.'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchClassRecord', () => {
  it('(1) gets the quarter record and returns the data', async () => {
    http.get.mockResolvedValue({ data: { class_record: {} } })
    await expect(fetchClassRecord(QUARTER_REF)).resolves.toEqual({ class_record: {} })
    expect(http.get).toHaveBeenCalledWith('/classes/7/quarters/2/record')
  })
})

describe('activity calls', () => {
  it('(2) creates, updates and deletes under the quarter path', async () => {
    http.post.mockResolvedValue({ data: {} })
    http.put.mockResolvedValue({ data: {} })
    http.delete.mockResolvedValue({ data: '' })
    await createActivity(QUARTER_REF, BODY)
    await updateActivity(ACTIVITY_REF, BODY)
    await deleteActivity(ACTIVITY_REF)
    expect(http.post).toHaveBeenCalledWith('/classes/7/quarters/2/activities', BODY)
    expect(http.put).toHaveBeenCalledWith('/classes/7/quarters/2/activities/5', BODY)
    expect(http.delete).toHaveBeenCalledWith('/classes/7/quarters/2/activities/5')
  })
})

describe('saveScores', () => {
  it('(3) puts the scores body to the quarter scores path', async () => {
    http.put.mockResolvedValue({ data: {} })
    const scorePayload = { scores: [{ student_id: 1, activity_id: 2, score: 7.5 }] }
    await saveScores(QUARTER_REF, scorePayload)
    expect(http.put).toHaveBeenCalledWith('/classes/7/quarters/2/scores', scorePayload)
  })
})

describe('submitQuarter and reopenQuarter', () => {
  it('(4) posts submit without a body and reopen with the reason', async () => {
    http.post.mockResolvedValue({ data: {} })
    await submitQuarter(QUARTER_REF)
    await reopenQuarter(QUARTER_REF, { reason: 'Typo' })
    expect(http.post).toHaveBeenNthCalledWith(1, '/classes/7/quarters/2/submit')
    expect(http.post).toHaveBeenNthCalledWith(2, '/classes/7/quarters/2/reopen', { reason: 'Typo' })
  })
})

describe('report card reads', () => {
  it('(5) gets one report card with the school year and the section report cards', async () => {
    http.get.mockResolvedValue({ data: {} })
    await fetchReportCard(3, 9)
    await fetchSectionReportCards(4)
    expect(http.get).toHaveBeenNthCalledWith(1, '/students/3/report-card', { params: { school_year_id: 9 } })
    expect(http.get).toHaveBeenNthCalledWith(2, '/sections/4/report-cards')
  })
})

describe('id and quarter guards', () => {
  it('(6) rejects a bad id or quarter before any request', async () => {
    await expect(fetchClassRecord({ classId: '7', quarter: 2 })).rejects.toThrow(INVALID_ID_MESSAGE)
    await expect(fetchClassRecord({ classId: 0, quarter: 2 })).rejects.toThrow(INVALID_ID_MESSAGE)
    await expect(fetchClassRecord({ classId: null, quarter: 2 })).rejects.toThrow(INVALID_ID_MESSAGE)
    await expect(fetchClassRecord({ classId: 7, quarter: 0 })).rejects.toThrow(INVALID_QUARTER_MESSAGE)
    await expect(fetchClassRecord({ classId: 7, quarter: 5 })).rejects.toThrow(INVALID_QUARTER_MESSAGE)
    await expect(fetchClassRecord({ classId: 7, quarter: '2' })).rejects.toThrow(INVALID_QUARTER_MESSAGE)
    await expect(deleteActivity({ classId: 7, quarter: 2, activityId: 0 })).rejects.toThrow(INVALID_ID_MESSAGE)
    expect(http.get).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
  })
})

describe('error passthrough', () => {
  it('(7) lets a 422 rejection reach the caller unchanged', async () => {
    const validationError = { response: { status: 422, data: { errors: { quarter: ['The quarter is already submitted.'] } } } }
    http.post.mockRejectedValue(validationError)
    await expect(submitQuarter(QUARTER_REF)).rejects.toBe(validationError)
  })
})
