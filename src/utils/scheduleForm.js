import { getFirstFieldError, listSelectableRooms, toIdText, toRecordId } from '@/utils/sectionForm.js'

export const SCHOOL_DAYS = Object.freeze([1, 2, 3, 4, 5, 6])
export const SCHOOL_DAY_START = '06:00'
export const SCHOOL_DAY_END = '18:00'
export const MEETING_STEP_MINUTES = 5

export const CLASS_FIELD_LABELS = Object.freeze({
  teacher_id: 'Teacher',
  day: 'Day',
  start_time: 'Start',
  end_time: 'End',
  room_id: 'Room',
})

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const MINUTES_PER_HOUR = 60
const TEACHER_REQUIRED_MESSAGE = 'Teacher is required.'
const DAY_INVALID_MESSAGE = 'Choose a day from Monday to Saturday.'
const END_BEFORE_START_MESSAGE = 'End must be after start.'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function toMeetingList(meetings) {
  return Array.isArray(meetings) ? meetings : []
}

export function toMinutesOfDay(timeText) {
  if (typeof timeText !== 'string') return null
  const timeParts = TIME_PATTERN.exec(timeText)
  if (timeParts === null) return null
  return Number(timeParts[1]) * MINUTES_PER_HOUR + Number(timeParts[2])
}

export function getDefaultMeetingRoomId(section) {
  return toIdText(section?.room?.id)
}

export function createEmptyMeeting(defaultRoomId) {
  return { id: null, day: '', start_time: '', end_time: '', room_id: toIdText(defaultRoomId) }
}

function buildFormMeeting(meeting) {
  return {
    id: meeting.id ?? null,
    day: String(meeting.day ?? ''),
    start_time: meeting.start_time ?? '',
    end_time: meeting.end_time ?? '',
    room_id: toIdText(meeting.room_id ?? meeting.room?.id),
  }
}

export function createClassForm(section, scheduleRow) {
  const classRecord = isRecordObject(scheduleRow?.class) ? scheduleRow.class : null
  return {
    section_id: toIdText(section?.id),
    curriculum_entry_id: toIdText(scheduleRow?.curriculum_entry_id),
    teacher_id: toIdText(classRecord?.teacher_id ?? classRecord?.teacher?.id),
    meetings: toMeetingList(classRecord?.meetings).filter(isRecordObject).map(buildFormMeeting),
  }
}

export function appendMeeting(meetings, defaultRoomId) {
  return [...toMeetingList(meetings), createEmptyMeeting(defaultRoomId)]
}

export function removeMeetingAt(meetings, meetingIndex) {
  return toMeetingList(meetings).filter((_unused, index) => index !== meetingIndex)
}

function findDayError(dayText) {
  const isSchoolDay = SCHOOL_DAYS.map(String).includes(String(dayText))
  return isSchoolDay ? '' : DAY_INVALID_MESSAGE
}

function findTimeError(timeText, fieldKey) {
  const fieldLabel = CLASS_FIELD_LABELS[fieldKey]
  if (typeof timeText !== 'string' || timeText.trim() === '') return `${fieldLabel} is required.`
  const minutesOfDay = toMinutesOfDay(timeText)
  if (minutesOfDay === null) return `${fieldLabel} must be a time in HH:MM format.`
  if (minutesOfDay % MEETING_STEP_MINUTES !== 0) {
    return `${fieldLabel} must be on a ${MEETING_STEP_MINUTES}-minute step.`
  }
  const isInsideDay =
    minutesOfDay >= toMinutesOfDay(SCHOOL_DAY_START) && minutesOfDay <= toMinutesOfDay(SCHOOL_DAY_END)
  if (!isInsideDay) return `${fieldLabel} must be between ${SCHOOL_DAY_START} and ${SCHOOL_DAY_END}.`
  return ''
}

function findMeetingFieldErrors(meeting) {
  const startError = findTimeError(meeting.start_time, 'start_time')
  const endError = findTimeError(meeting.end_time, 'end_time')
  const isOrderWrong =
    startError === '' && endError === '' && toMinutesOfDay(meeting.end_time) <= toMinutesOfDay(meeting.start_time)
  return {
    day: findDayError(meeting.day),
    start_time: startError,
    end_time: isOrderWrong ? END_BEFORE_START_MESSAGE : endError,
  }
}

function collectMeetingErrors(meeting, meetingIndex) {
  const fieldErrors = findMeetingFieldErrors(isRecordObject(meeting) ? meeting : {})
  return Object.entries(fieldErrors)
    .filter(([, errorMessage]) => errorMessage !== '')
    .map(([fieldKey, errorMessage]) => [`meetings.${meetingIndex}.${fieldKey}`, [errorMessage]])
}

export function findClassFormErrors(formValues) {
  const teacherEntries = []
  if (toRecordId(formValues?.teacher_id) === null) teacherEntries.push(['teacher_id', [TEACHER_REQUIRED_MESSAGE]])
  const meetingEntries = toMeetingList(formValues?.meetings).flatMap(collectMeetingErrors)
  return Object.fromEntries([...teacherEntries, ...meetingEntries])
}

function buildMeetingPayload(meeting) {
  return {
    day: Number(meeting.day),
    start_time: meeting.start_time,
    end_time: meeting.end_time,
    room_id: toRecordId(meeting.room_id),
  }
}

export function buildUpdateClassPayload(formValues) {
  return {
    teacher_id: toRecordId(formValues.teacher_id),
    meetings: toMeetingList(formValues.meetings).map(buildMeetingPayload),
  }
}

export function buildCreateClassPayload(formValues) {
  return {
    section_id: toRecordId(formValues.section_id),
    curriculum_entry_id: toRecordId(formValues.curriculum_entry_id),
    ...buildUpdateClassPayload(formValues),
  }
}

export function listClassRoomsInUse(section, scheduleRow) {
  const meetingRooms = toMeetingList(scheduleRow?.class?.meetings).map((meeting) => meeting?.room)
  return [section?.room, ...meetingRooms].filter(isRecordObject)
}

export function listClassRoomOptions(activeRooms, roomsInUse) {
  const activeRoomList = Array.isArray(activeRooms) ? activeRooms : []
  return toMeetingList(roomsInUse).reduce((roomOptions, room) => listSelectableRooms(roomOptions, room), activeRoomList)
}

export function getMeetingErrors(fieldErrors, meetingIndex) {
  const meetingKey = `meetings.${meetingIndex}`
  return {
    meeting: getFirstFieldError(fieldErrors, meetingKey),
    day: getFirstFieldError(fieldErrors, `${meetingKey}.day`),
    start_time: getFirstFieldError(fieldErrors, `${meetingKey}.start_time`),
    end_time: getFirstFieldError(fieldErrors, `${meetingKey}.end_time`),
    room_id: getFirstFieldError(fieldErrors, `${meetingKey}.room_id`),
  }
}
