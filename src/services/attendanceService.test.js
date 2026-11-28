import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAllAttendanceRecords, fetchAttendanceRecords, fetchAttendanceToday } from '@/services/attendanceService.js'
import http from '@/services/http.js'

vi.mock('@/services/http.js', () => ({ default: { get: vi.fn() } }))

const RANGE_PARAMS = { date_from: '2026-11-01', date_to: '2026-11-30', status: 'late' }

function pageOf(attendances, lastPage) {
  return { data: { attendances, meta: { current_page: 1, last_page: lastPage, per_page: 100, total: 0 } } }
}

describe('attendanceService', () => {
  beforeEach(() => {
    http.get.mockReset()
  })

  it('fetchAttendanceToday gets /attendance/today with the params', async () => {
    const todayParams = { date: '2026-11-27', page: 1 }
    http.get.mockResolvedValue({ data: { date: '2026-11-27' } })
    await expect(fetchAttendanceToday(todayParams)).resolves.toEqual({ date: '2026-11-27' })
    expect(http.get).toHaveBeenCalledWith('/attendance/today', { params: todayParams })
  })

  it('fetchAttendanceRecords gets /attendance with the params', async () => {
    http.get.mockResolvedValue({ data: { attendances: [] } })
    await expect(fetchAttendanceRecords(RANGE_PARAMS)).resolves.toEqual({ attendances: [] })
    expect(http.get).toHaveBeenCalledWith('/attendance', { params: RANGE_PARAMS })
  })

  it('fetchAllAttendanceRecords walks pages 1..last in order, one at a time, with per_page 100', async () => {
    let releasePageOne
    const pageOneGate = new Promise((resolve) => {
      releasePageOne = resolve
    })
    http.get
      .mockImplementationOnce(() => pageOneGate)
      .mockResolvedValueOnce(pageOf([{ attendance_id: 2 }], 3))
      .mockResolvedValueOnce(pageOf([{ attendance_id: 3 }], 3))
    const exportPromise = fetchAllAttendanceRecords(RANGE_PARAMS)
    expect(http.get).toHaveBeenCalledTimes(1)
    releasePageOne(pageOf([{ attendance_id: 1 }], 3))
    await expect(exportPromise).resolves.toEqual({
      attendances: [{ attendance_id: 1 }, { attendance_id: 2 }, { attendance_id: 3 }],
    })
    const calledPages = http.get.mock.calls.map(([, config]) => config.params.page)
    expect(calledPages).toEqual([1, 2, 3])
    for (const [, config] of http.get.mock.calls) expect(config.params.per_page).toBe(100)
  })

  it('fetchAllAttendanceRecords exports a row repeated across pages once', async () => {
    http.get
      .mockResolvedValueOnce(pageOf([{ attendance_id: 1 }, { attendance_id: 2 }], 2))
      .mockResolvedValueOnce(pageOf([{ attendance_id: 2 }, { attendance_id: 3 }], 2))
    const exportResponse = await fetchAllAttendanceRecords(RANGE_PARAMS)
    expect(exportResponse.attendances.map((attendance) => attendance.attendance_id)).toEqual([1, 2, 3])
  })

  it('fetchAllAttendanceRecords makes one call when meta is missing', async () => {
    http.get.mockResolvedValue({ data: { attendances: [{ attendance_id: 7 }] } })
    await expect(fetchAllAttendanceRecords(RANGE_PARAMS)).resolves.toEqual({ attendances: [{ attendance_id: 7 }] })
    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it('fetchAllAttendanceRecords rejects when page 2 fails and never requests page 3', async () => {
    const failure = new Error('boom')
    http.get.mockResolvedValueOnce(pageOf([{ attendance_id: 1 }], 3)).mockRejectedValueOnce(failure)
    await expect(fetchAllAttendanceRecords(RANGE_PARAMS)).rejects.toBe(failure)
    expect(http.get).toHaveBeenCalledTimes(2)
  })

  it('passes a 422 rejection through unchanged', async () => {
    const validationError = { response: { status: 422, data: { message: 'bad range' } } }
    http.get.mockRejectedValue(validationError)
    await expect(fetchAttendanceRecords(RANGE_PARAMS)).rejects.toBe(validationError)
  })
})
