import http from '@/services/http.js'

const ATTENDANCE_PATH = '/attendance'
const ATTENDANCE_TODAY_PATH = '/attendance/today'
const FIRST_RECORD_PAGE = 1
const SECOND_RECORD_PAGE = 2
const EXPORT_PER_PAGE = 100

export async function fetchAttendanceToday(todayParams) {
  const response = await http.get(ATTENDANCE_TODAY_PATH, { params: todayParams })
  return response.data
}

export async function fetchAttendanceRecords(recordParams) {
  const response = await http.get(ATTENDANCE_PATH, { params: recordParams })
  return response.data
}

function dedupeByAttendanceId(attendances) {
  const seenIds = new Set()
  return attendances.filter((attendance) => {
    const attendanceId = attendance?.attendance_id
    if (attendanceId === null || attendanceId === undefined) return true
    if (seenIds.has(attendanceId)) return false
    seenIds.add(attendanceId)
    return true
  })
}

export async function fetchAllAttendanceRecords(recordParams) {
  const exportParams = { ...recordParams, per_page: EXPORT_PER_PAGE }
  const firstPageResponse = await fetchAttendanceRecords({ ...exportParams, page: FIRST_RECORD_PAGE })
  const lastPage = Number.isInteger(firstPageResponse?.meta?.last_page) ? firstPageResponse.meta.last_page : FIRST_RECORD_PAGE
  const collectedRecords = [...(firstPageResponse?.attendances ?? [])]
  // sequential on purpose: a 31-day export must not burst hundreds of requests
  for (let pageNumber = SECOND_RECORD_PAGE; pageNumber <= lastPage; pageNumber++) {
    const pageResponse = await fetchAttendanceRecords({ ...exportParams, page: pageNumber })
    collectedRecords.push(...(pageResponse?.attendances ?? []))
  }
  // rows scanned during the walk can shift between pages, so a row may repeat
  return { attendances: dedupeByAttendanceId(collectedRecords) }
}
