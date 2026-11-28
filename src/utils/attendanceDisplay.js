import { buildCsvText } from '@/utils/csvExport.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

// These mirror the backend StudentAttendance statuses plus the derived `absent` (Today only)
export const ATTENDANCE_STATUS_PRESENT = 'present'
export const ATTENDANCE_STATUS_LATE = 'late'
export const ATTENDANCE_STATUS_ABSENT = 'absent'

const GREEN_CHIP_CLASS = 'bg-green-100 text-green-800'
const AMBER_CHIP_CLASS = 'bg-amber-100 text-amber-800'
const RED_CHIP_CLASS = 'bg-red-100 text-red-800'
const NEUTRAL_CHIP_CLASS = 'bg-slate-200 text-slate-700'
const GRADE_SECTION_SEPARATOR = ' · '
const MANILA_TIME_ZONE = 'Asia/Manila'
const HOURS_PER_HALF_DAY = 12
const HOURS_PER_DAY = 24
const CLOCK_PATTERN = /^(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)(?::[0-5]\d)?$/
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/
// Intl's own hour12 output puts U+202F before AM/PM, so the 12-hour text is built by hand
const MANILA_CLOCK_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const MANILA_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const STATUS_LABELS = Object.freeze({
  [ATTENDANCE_STATUS_PRESENT]: 'Present',
  [ATTENDANCE_STATUS_LATE]: 'Late',
  [ATTENDANCE_STATUS_ABSENT]: 'Absent',
})
const STATUS_CHIP_CLASSES = Object.freeze({
  [ATTENDANCE_STATUS_PRESENT]: GREEN_CHIP_CLASS,
  [ATTENDANCE_STATUS_LATE]: AMBER_CHIP_CLASS,
  [ATTENDANCE_STATUS_ABSENT]: RED_CHIP_CLASS,
})

export const TIMED_OUT_CHIP = Object.freeze({ label: 'Timed out', colorClass: NEUTRAL_CHIP_CLASS })

export function getAttendanceStatusChip(status) {
  if (typeof status !== 'string' || !Object.hasOwn(STATUS_LABELS, status)) {
    // an unexpected status stays visible as its raw text instead of a blank cell
    return { label: typeof status === 'string' ? status : '', colorClass: NEUTRAL_CHIP_CLASS }
  }
  return { label: STATUS_LABELS[status], colorClass: STATUS_CHIP_CLASSES[status] }
}

function hasTimeOut(attendanceRow) {
  return typeof attendanceRow?.time_out === 'string' && attendanceRow.time_out !== ''
}

export function listAttendanceStatusChips(attendanceRow) {
  const status = attendanceRow?.status
  // a null status (Today, weekend, no scan) shows no status chip
  const statusChips = typeof status === 'string' && status !== '' ? [getAttendanceStatusChip(status)] : []
  return hasTimeOut(attendanceRow) ? [...statusChips, TIMED_OUT_CHIP] : statusChips
}

function formatClock(hour, minute) {
  const meridiem = hour < HOURS_PER_HALF_DAY ? 'AM' : 'PM'
  return `${hour % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY}:${String(minute).padStart(2, '0')} ${meridiem}`
}

function readManilaClock(isoText) {
  const parsedDate = new Date(isoText)
  if (Number.isNaN(parsedDate.getTime())) return null
  const clockParts = Object.fromEntries(
    MANILA_CLOCK_FORMAT.formatToParts(parsedDate).map((clockPart) => [clockPart.type, clockPart.value]),
  )
  return { hour: Number(clockParts.hour) % HOURS_PER_DAY, minute: Number(clockParts.minute) }
}

export function formatAttendanceTime(timeValue) {
  if (typeof timeValue !== 'string') return NO_VALUE_LABEL
  const clockMatch = CLOCK_PATTERN.exec(timeValue)
  if (clockMatch) return formatClock(Number(clockMatch.groups.hour), Number(clockMatch.groups.minute))
  if (!ISO_DATETIME_PATTERN.test(timeValue)) return NO_VALUE_LABEL
  const manilaClock = readManilaClock(timeValue)
  return manilaClock === null ? NO_VALUE_LABEL : formatClock(manilaClock.hour, manilaClock.minute)
}

export function getManilaTodayIso(nowDate) {
  if (!(nowDate instanceof Date) || Number.isNaN(nowDate.getTime())) return ''
  return MANILA_DATE_FORMAT.format(nowDate)
}

const SUMMARY_ITEMS = Object.freeze(
  [
    { key: 'enrolled', label: 'Enrolled', colorClass: NEUTRAL_CHIP_CLASS },
    { key: 'present', label: 'Present', colorClass: GREEN_CHIP_CLASS },
    { key: 'late', label: 'Late', colorClass: AMBER_CHIP_CLASS },
    { key: 'absent', label: 'Absent', colorClass: RED_CHIP_CLASS },
    { key: 'timed_out', label: 'Timed out', colorClass: NEUTRAL_CHIP_CLASS },
  ].map((summaryItem) => Object.freeze(summaryItem)),
)

export function buildAttendanceSummaryChips(summary) {
  return SUMMARY_ITEMS.map((summaryItem) => {
    const count = summary?.[summaryItem.key]
    return { ...summaryItem, count: Number.isInteger(count) && count >= 0 ? count : 0 }
  })
}

const ROSTER_COLUMNS = [
  { key: 'lrn', label: 'LRN' },
  { key: 'student', label: 'Student' },
  { key: 'grade_section', label: 'Grade · Section' },
  { key: 'time_in', label: 'Time in' },
  { key: 'time_out', label: 'Time out' },
  { key: 'status', label: 'Status' },
]

export const ATTENDANCE_TODAY_COLUMNS = Object.freeze(ROSTER_COLUMNS.map((column) => Object.freeze({ ...column })))
export const ATTENDANCE_RECORD_COLUMNS = Object.freeze(
  [{ key: 'date', label: 'Date' }, ...ROSTER_COLUMNS].map((column) => Object.freeze({ ...column })),
)

export function formatAttendanceGradeSection(attendanceRow) {
  const nameParts = [attendanceRow?.grade_level?.name, attendanceRow?.section?.name].filter(
    (namePart) => typeof namePart === 'string' && namePart !== '',
  )
  return nameParts.length === 0 ? NO_VALUE_LABEL : nameParts.join(GRADE_SECTION_SEPARATOR)
}

function buildRowKey(attendance, pageDate) {
  if (Number.isInteger(attendance?.attendance_id)) return `attendance-${attendance.attendance_id}`
  // a row with no scan has no attendance_id; Today rows carry no date, so the page date is used
  return `student-${attendance?.student?.id}-${attendance?.date ?? pageDate}`
}

export function buildAttendanceRows(attendances, pageDate) {
  if (!Array.isArray(attendances)) return []
  return attendances.map((attendance) => ({ ...attendance, key: buildRowKey(attendance, pageDate) }))
}

export const ATTENDANCE_CSV_COLUMNS = Object.freeze(
  [
    { key: 'date', label: 'Date' },
    { key: 'lrn', label: 'LRN' },
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'section', label: 'Section' },
    { key: 'time_in', label: 'Time in' },
    { key: 'time_out', label: 'Time out' },
    { key: 'status', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

function toCsvTime(timeValue) {
  const timeText = formatAttendanceTime(timeValue)
  return timeText === NO_VALUE_LABEL ? '' : timeText
}

function buildCsvRow(attendance) {
  return {
    date: attendance?.date ?? '',
    lrn: attendance?.student?.lrn ?? '',
    name: formatEnrollmentStudentName(attendance?.student),
    grade: attendance?.grade_level?.name ?? '',
    section: attendance?.section?.name ?? '',
    time_in: toCsvTime(attendance?.time_in),
    time_out: toCsvTime(attendance?.time_out),
    status: getAttendanceStatusChip(attendance?.status).label,
  }
}

export function buildAttendanceCsv(attendances) {
  const csvRows = Array.isArray(attendances) ? attendances.map(buildCsvRow) : []
  return buildCsvText(ATTENDANCE_CSV_COLUMNS, csvRows)
}
