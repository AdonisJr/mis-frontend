import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/services/http.js'
import { deleteStudentRfid, fetchStudents, updateStudentRfid } from '@/services/studentService.js'

vi.mock('@/services/http.js', () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const ID_MESSAGE = 'A valid student id is required.'
const UID_MESSAGE = 'A scanned card UID is required.'
const CARD_UID = '04:A3:1B:2C'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchStudents', () => {
  it('passes the params through unchanged', async () => {
    http.get.mockResolvedValue({ data: { students: [] } })
    await expect(fetchStudents({ page: 1, has_rfid: 0 })).resolves.toEqual({ students: [] })
    expect(http.get).toHaveBeenCalledWith('/students', { params: { page: 1, has_rfid: 0 } })
  })
})

describe('updateStudentRfid', () => {
  it('puts the UID to /students/rfid/{id}', async () => {
    http.put.mockResolvedValue({ data: { student: { id: 7 } } })
    await expect(updateStudentRfid(7, CARD_UID)).resolves.toEqual({ student: { id: 7 } })
    expect(http.put).toHaveBeenCalledWith('/students/rfid/7', { rfid: CARD_UID })
  })

  it('refuses an empty UID before any request', async () => {
    for (const emptyUid of ['', '   ', null]) await expect(updateStudentRfid(7, emptyUid)).rejects.toThrow(UID_MESSAGE)
    expect(http.put).not.toHaveBeenCalled()
  })

  it('lets a 422 rejection pass through unchanged', async () => {
    const conflictError = { response: { status: 422 } }
    http.put.mockRejectedValue(conflictError)
    await expect(updateStudentRfid(7, CARD_UID)).rejects.toBe(conflictError)
  })
})

describe('deleteStudentRfid', () => {
  it('deletes /students/rfid/{id}', async () => {
    http.delete.mockResolvedValue({ data: { student: { id: 7 } } })
    await expect(deleteStudentRfid(7)).resolves.toEqual({ student: { id: 7 } })
    expect(http.delete).toHaveBeenCalledWith('/students/rfid/7')
  })
})

describe('student id guard', () => {
  it('rejects invalid ids with no request', async () => {
    for (const badId of [0, '7', null]) {
      await expect(updateStudentRfid(badId, CARD_UID)).rejects.toThrow(ID_MESSAGE)
      await expect(deleteStudentRfid(badId)).rejects.toThrow(ID_MESSAGE)
    }
    expect(http.put).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
  })
})
