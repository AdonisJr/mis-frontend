import { SCHOOL_DAYS } from '@/utils/scheduleForm.js'
import { NO_VALUE_LABEL, buildRoomLabel } from '@/utils/sectionDisplay.js'

export const SCHOOL_DAY_LABELS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
export const SCHOOL_DAY_SHORT_LABELS = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
export const SCHOOL_DAY_OPTIONS = Object.freeze(
  SCHOOL_DAYS.map((day, dayIndex) => Object.freeze({ value: String(day), label: SCHOOL_DAY_LABELS[dayIndex] })),
)

export const CLASS_SCHEDULE_COLUMNS = Object.freeze(
  [
    { key: 'code', label: 'Code' },
    { key: 'subject', label: 'Subject' },
    { key: 'teacher', label: 'Teacher' },
    { key: 'meetings', label: 'Meetings' },
    { key: 'hours', label: 'Weekly hours' },
  ].map((column) => Object.freeze(column)),
)

export const NOT_SCHEDULED_LABEL = 'Not yet scheduled'
export const HOURS_STATUS_UNDER = 'under'
export const HOURS_STATUS_EXACT = 'exact'
export const HOURS_STATUS_OVER = 'over'

const NO_ROOM_LABEL = 'No room'
const HOURS_PATTERN = /^\d+(\.\d{1,2})?$/
const UNSCHEDULED_HOURS_TEXT = '0'
const TIME_RANGE_SEPARATOR = '–'
const SUMMARY_SEPARATOR = ' · '

const HOURS_STATUS_CHIPS = Object.freeze({
  [HOURS_STATUS_UNDER]: Object.freeze({ label: 'Under', colorClass: 'bg-amber-100 text-amber-800' }),
  [HOURS_STATUS_EXACT]: Object.freeze({ label: 'Exact', colorClass: 'bg-green-100 text-green-800' }),
  [HOURS_STATUS_OVER]: Object.freeze({ label: 'Over', colorClass: 'bg-red-100 text-red-800' }),
})
const NOT_SCHEDULED_CHIP = Object.freeze({ label: 'Not scheduled', colorClass: 'bg-slate-200 text-slate-700' })

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function isFilledText(textValue) {
  return typeof textValue === 'string' && textValue.trim() !== ''
}

function findDayIndex(day) {
  return SCHOOL_DAYS.findIndex((schoolDay) => String(schoolDay) === String(day))
}

export function getDayLabel(day) {
  return SCHOOL_DAY_LABELS[findDayIndex(day)] ?? ''
}

export function getDayShortLabel(day) {
  return SCHOOL_DAY_SHORT_LABELS[findDayIndex(day)] ?? ''
}

export function getHoursStatusChip(hoursStatus) {
  if (!Object.hasOwn(HOURS_STATUS_CHIPS, hoursStatus)) return NOT_SCHEDULED_CHIP
  return HOURS_STATUS_CHIPS[hoursStatus]
}

export function formatHoursValue(hoursText) {
  const hoursValue = typeof hoursText === 'number' ? String(hoursText) : hoursText
  if (typeof hoursValue !== 'string' || !HOURS_PATTERN.test(hoursValue)) return NO_VALUE_LABEL
  if (!hoursValue.includes('.')) return hoursValue
  return hoursValue.replace(/0+$/, '').replace(/\.$/, '')
}

export function buildHoursText(scheduleRow) {
  const classRecord = isRecordObject(scheduleRow?.class) ? scheduleRow.class : null
  const scheduledText = classRecord ? formatHoursValue(classRecord.scheduled_weekly_hours) : UNSCHEDULED_HOURS_TEXT
  const requiredText = formatHoursValue(classRecord?.required_weekly_hours ?? scheduleRow?.subject?.weekly_hours)
  return `${scheduledText} / ${requiredText} h`
}

export function formatMeetingTime(meeting) {
  return `${getDayShortLabel(meeting?.day)} ${meeting?.start_time}${TIME_RANGE_SEPARATOR}${meeting?.end_time}`
}

function buildRoomText(room) {
  return buildRoomLabel(room) || NO_ROOM_LABEL
}

export function buildMeetingSummary(meeting) {
  return `${formatMeetingTime(meeting)}${SUMMARY_SEPARATOR}${buildRoomText(meeting?.room)}`
}

export function formatClassTeacher(scheduleRow) {
  const teacherName = scheduleRow?.class?.teacher?.name
  if (!isFilledText(teacherName)) return NOT_SCHEDULED_LABEL
  return teacherName.trim()
}

export function listScheduleRows(sectionTimetable) {
  if (!isRecordObject(sectionTimetable) || !Array.isArray(sectionTimetable.subjects)) return []
  return sectionTimetable.subjects.map((subjectRow) => ({
    id: subjectRow.curriculum_entry_id,
    curriculum_entry_id: subjectRow.curriculum_entry_id,
    sort_order: subjectRow.sort_order,
    subject: subjectRow.subject,
    class: subjectRow.class ?? null,
  }))
}

export function buildSectionOptionLabel(section) {
  if (!isRecordObject(section)) return ''
  const gradeLevelName = section.grade_level?.name
  if (!isFilledText(gradeLevelName)) return section.name ?? ''
  return `${gradeLevelName}${SUMMARY_SEPARATOR}${section.name}`
}

export function buildClassModalTitle(scheduleRow) {
  const subjectCode = scheduleRow?.subject?.code
  if (scheduleRow?.class) return `Edit ${subjectCode} class`
  return `Schedule ${subjectCode}`
}

export function buildClassDeleteMessage(scheduleRow) {
  if (!isRecordObject(scheduleRow)) return ''
  return `Delete the ${scheduleRow.subject?.code} class? Its meetings are deleted too. This cannot be undone.`
}

function buildEntryBase(meeting) {
  return {
    key: `meeting-${meeting.id}`,
    day: meeting.day,
    start_time: meeting.start_time,
    end_time: meeting.end_time,
  }
}

function buildClassEntries(classRecord) {
  const teacherName = classRecord.teacher?.name ?? ''
  const meetings = Array.isArray(classRecord.meetings) ? classRecord.meetings : []
  return meetings.map((meeting) => ({
    ...buildEntryBase(meeting),
    title: classRecord.subject?.code ?? '',
    subtitle: `${teacherName}${SUMMARY_SEPARATOR}${buildRoomText(meeting.room)}`,
  }))
}

export function buildSectionTimetableEntries(scheduleRows) {
  if (!Array.isArray(scheduleRows)) return []
  return scheduleRows
    .filter((scheduleRow) => isRecordObject(scheduleRow?.class))
    .flatMap((scheduleRow) => buildClassEntries(scheduleRow.class))
}

function buildMeetingTitle(meeting) {
  return `${meeting.class?.subject?.code ?? ''}${SUMMARY_SEPARATOR}${meeting.class?.section?.name ?? ''}`
}

export function buildTeacherTimetableEntries(meetings) {
  if (!Array.isArray(meetings)) return []
  return meetings.map((meeting) => ({
    ...buildEntryBase(meeting),
    title: buildMeetingTitle(meeting),
    subtitle: buildRoomText(meeting.room),
  }))
}

export function buildRoomTimetableEntries(meetings) {
  if (!Array.isArray(meetings)) return []
  return meetings.map((meeting) => ({
    ...buildEntryBase(meeting),
    title: buildMeetingTitle(meeting),
    subtitle: meeting.class?.teacher?.name ?? '',
  }))
}
