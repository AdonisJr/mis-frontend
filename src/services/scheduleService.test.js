import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import {
  createClass,
  deleteClass,
  fetchRoomTimetable,
  fetchSectionTimetable,
  fetchTeacherTimetable,
  updateClass,
} from '@/services/scheduleService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const CLASS_PAYLOAD = { teacher_id: 12, meetings: [{ day: 1, start_time: '07:30', end_time: '08:30', room_id: 3 }] }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createClass', () => {
  it('(1) posts the payload to /classes and returns the data', async () => {
    http.post.mockResolvedValue({ data: { class: { id: 1 } } })
    await expect(createClass(CLASS_PAYLOAD)).resolves.toEqual({ class: { id: 1 } })
    expect(http.post).toHaveBeenCalledWith('/classes', CLASS_PAYLOAD)
  })
})

describe('updateClass', () => {
  it('(2) puts the payload to /classes/{id}', async () => {
    http.put.mockResolvedValue({ data: { class: { id: 7 } } })
    await expect(updateClass(7, CLASS_PAYLOAD)).resolves.toEqual({ class: { id: 7 } })
    expect(http.put).toHaveBeenCalledWith('/classes/7', CLASS_PAYLOAD)
  })
})

describe('deleteClass', () => {
  it('(3) deletes /classes/{id}', async () => {
    http.delete.mockResolvedValue({ data: '' })
    await deleteClass(7)
    expect(http.delete).toHaveBeenCalledWith('/classes/7')
  })
})

describe('timetable reads', () => {
  it('(4) gets the section timetable with its params', async () => {
    http.get.mockResolvedValue({ data: { subjects: [] } })
    await expect(fetchSectionTimetable(5, { term_number: 2 })).resolves.toEqual({ subjects: [] })
    expect(http.get).toHaveBeenCalledWith('/sections/5/timetable', { params: { term_number: 2 } })
  })

  it('(5) gets the teacher timetable', async () => {
    http.get.mockResolvedValue({ data: { meetings: [] } })
    await expect(fetchTeacherTimetable(12, { school_year_id: 1 })).resolves.toEqual({ meetings: [] })
    expect(http.get).toHaveBeenCalledWith('/teachers/12/timetable', { params: { school_year_id: 1 } })
  })

  it('(6) gets the room timetable', async () => {
    http.get.mockResolvedValue({ data: { meetings: [] } })
    await fetchRoomTimetable(3, { school_year_id: 1, term_number: 2 })
    expect(http.get).toHaveBeenCalledWith('/rooms/3/timetable', { params: { school_year_id: 1, term_number: 2 } })
  })
})

describe('id guards', () => {
  it('(7) reject invalid ids before any request', async () => {
    await expect(updateClass('7', CLASS_PAYLOAD)).rejects.toThrow('A valid class id is required.')
    await expect(deleteClass(0)).rejects.toThrow('A valid class id is required.')
    await expect(fetchSectionTimetable(null, {})).rejects.toThrow('A valid section id is required.')
    await expect(fetchTeacherTimetable(-1, {})).rejects.toThrow('A valid teacher id is required.')
    await expect(fetchRoomTimetable(1.5, {})).rejects.toThrow('A valid room id is required.')
    expect(http.put).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
    expect(http.get).not.toHaveBeenCalled()
  })
})

describe('failures', () => {
  it('(8) lets a 422 rejection through unchanged', async () => {
    const validationError = { response: { status: 422, data: { errors: { 'meetings.0': ['Conflict.'] } } } }
    http.put.mockRejectedValue(validationError)
    await expect(updateClass(7, CLASS_PAYLOAD)).rejects.toBe(validationError)
  })
})
