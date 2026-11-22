import { describe, it, expect } from 'vitest'
import {
  MEETING_STEP_MINUTES,
  SCHOOL_DAYS,
  SCHOOL_DAY_END,
  SCHOOL_DAY_START,
  appendMeeting,
  buildCreateClassPayload,
  buildUpdateClassPayload,
  createClassForm,
  createEmptyMeeting,
  findClassFormErrors,
  getDefaultMeetingRoomId,
  getMeetingErrors,
  listClassRoomOptions,
  listClassRoomsInUse,
  removeMeetingAt,
  toMinutesOfDay,
} from '@/utils/scheduleForm.js'
import { buildAdviserOptionLabel } from '@/utils/sectionDisplay.js'
import { listSelectableAdvisers } from '@/utils/sectionForm.js'

const SECTION = { id: 5, name: 'Rizal', room: { id: 3, name: 'Rm 101', building: null } }
const UNSCHEDULED_ROW = { curriculum_entry_id: 21, subject: { code: 'MATH7' }, class: null }
const SCHEDULED_ROW = {
  curriculum_entry_id: 21,
  subject: { code: 'MATH7' },
  class: {
    id: 9,
    teacher_id: 12,
    teacher: { id: 12, name: 'Ana Cruz' },
    meetings: [
      { id: 40, day: 1, start_time: '07:30', end_time: '08:30', room_id: 3, room: { id: 3, name: 'Rm 101' } },
      { id: 41, day: 3, start_time: '07:30', end_time: '08:30', room_id: null, room: null },
    ],
  },
}

function buildForm(meetings) {
  return { section_id: '5', curriculum_entry_id: '21', teacher_id: '12', meetings }
}

function buildMeeting(meetingChanges = {}) {
  return { id: null, day: '1', start_time: '07:30', end_time: '08:30', room_id: '3', ...meetingChanges }
}

describe('constants', () => {
  it('(1) keeps the day order, the school day bounds and the step', () => {
    expect(SCHOOL_DAYS).toEqual([1, 2, 3, 4, 5, 6])
    expect(SCHOOL_DAY_START).toBe('06:00')
    expect(SCHOOL_DAY_END).toBe('18:00')
    expect(MEETING_STEP_MINUTES).toBe(5)
  })
})

describe('toMinutesOfDay', () => {
  it('(2) reads HH:MM and rejects everything else', () => {
    expect(toMinutesOfDay('07:30')).toBe(450)
    for (const badTime of ['7:30', '24:00', '07:60', '', null]) {
      expect(toMinutesOfDay(badTime)).toBeNull()
    }
  })
})

describe('meeting defaults', () => {
  it('(3) defaults the room from the section and builds an empty meeting', () => {
    expect(getDefaultMeetingRoomId({ room: { id: 3 } })).toBe('3')
    expect(getDefaultMeetingRoomId({ room: null })).toBe('')
    expect(getDefaultMeetingRoomId('x')).toBe('')
    expect(createEmptyMeeting('3')).toEqual({ id: null, day: '', start_time: '', end_time: '', room_id: '3' })
  })
})

describe('createClassForm', () => {
  it('(4) builds the form of an unscheduled row', () => {
    expect(createClassForm(SECTION, UNSCHEDULED_ROW)).toEqual({
      section_id: '5',
      curriculum_entry_id: '21',
      teacher_id: '',
      meetings: [],
    })
  })

  it('(5) builds the form of a scheduled row with string values', () => {
    const classForm = createClassForm(SECTION, SCHEDULED_ROW)
    expect(classForm.teacher_id).toBe('12')
    expect(classForm.meetings[0]).toEqual({ id: 40, day: '1', start_time: '07:30', end_time: '08:30', room_id: '3' })
    expect(classForm.meetings[1].room_id).toBe('')
  })

  it('(6) falls back to blanks for non-object input', () => {
    expect(createClassForm(null, 'x')).toEqual({
      section_id: '',
      curriculum_entry_id: '',
      teacher_id: '',
      meetings: [],
    })
  })
})

describe('appendMeeting and removeMeetingAt', () => {
  it('(7) appends with the default room and removes by index without mutating', () => {
    const meetings = [buildMeeting()]
    const appendedMeetings = appendMeeting(meetings, '3')
    expect(appendedMeetings).toHaveLength(2)
    expect(appendedMeetings[1].room_id).toBe('3')
    expect(meetings).toHaveLength(1)
    expect(removeMeetingAt(appendedMeetings, 0)).toEqual([appendedMeetings[1]])
    const outOfRangeCopy = removeMeetingAt(meetings, 5)
    expect(outOfRangeCopy).toEqual(meetings)
    expect(outOfRangeCopy).not.toBe(meetings)
  })
})

describe('findClassFormErrors', () => {
  it('(8) requires a teacher', () => {
    expect(findClassFormErrors({ ...buildForm([]), teacher_id: '' })).toEqual({ teacher_id: ['Teacher is required.'] })
  })

  it('(9) rejects a day outside Monday to Saturday', () => {
    for (const badDay of ['', '7', 'mon']) {
      const fieldErrors = findClassFormErrors(buildForm([buildMeeting({ day: badDay })]))
      expect(fieldErrors['meetings.0.day']).toEqual(['Choose a day from Monday to Saturday.'])
    }
  })

  it('(10) requires times and checks the HH:MM format', () => {
    const blankErrors = findClassFormErrors(buildForm([buildMeeting({ start_time: '', end_time: '' })]))
    expect(blankErrors['meetings.0.start_time']).toEqual(['Start is required.'])
    expect(blankErrors['meetings.0.end_time']).toEqual(['End is required.'])
    const formatErrors = findClassFormErrors(buildForm([buildMeeting({ start_time: '7:30', end_time: '24:00' })]))
    expect(formatErrors['meetings.0.start_time']).toEqual(['Start must be a time in HH:MM format.'])
    expect(formatErrors['meetings.0.end_time']).toEqual(['End must be a time in HH:MM format.'])
  })

  it('(11) checks the 5-minute step', () => {
    const fieldErrors = findClassFormErrors(buildForm([buildMeeting({ start_time: '07:32' })]))
    expect(fieldErrors['meetings.0.start_time']).toEqual(['Start must be on a 5-minute step.'])
  })

  it('(12) checks the 06:00 to 18:00 bounds with both edges allowed', () => {
    const outsideErrors = findClassFormErrors(buildForm([buildMeeting({ start_time: '05:55', end_time: '18:05' })]))
    expect(outsideErrors['meetings.0.start_time']).toEqual(['Start must be between 06:00 and 18:00.'])
    expect(outsideErrors['meetings.0.end_time']).toEqual(['End must be between 06:00 and 18:00.'])
    expect(findClassFormErrors(buildForm([buildMeeting({ start_time: '06:00', end_time: '18:00' })]))).toEqual({})
  })

  it('(13) puts the order rule on end_time for equal and reversed times', () => {
    const equalErrors = findClassFormErrors(buildForm([buildMeeting({ start_time: '09:00', end_time: '09:00' })]))
    const reversedErrors = findClassFormErrors(buildForm([buildMeeting({ start_time: '10:00', end_time: '09:00' })]))
    expect(equalErrors).toEqual({ 'meetings.0.end_time': ['End must be after start.'] })
    expect(reversedErrors).toEqual({ 'meetings.0.end_time': ['End must be after start.'] })
  })

  it('(14) allows zero meetings and touching meetings', () => {
    expect(findClassFormErrors(buildForm([]))).toEqual({})
    const touchingMeetings = [
      buildMeeting({ start_time: '08:00', end_time: '09:00' }),
      buildMeeting({ start_time: '09:00', end_time: '10:00' }),
    ]
    expect(findClassFormErrors(buildForm(touchingMeetings))).toEqual({})
  })
})

describe('payloads', () => {
  it('(15) builds the create payload with numbers, no meeting id and a null blank room', () => {
    const createPayload = buildCreateClassPayload(
      buildForm([{ id: 40, day: '1', start_time: '07:30', end_time: '08:30', room_id: '' }]),
    )
    expect(Object.keys(createPayload)).toEqual(['section_id', 'curriculum_entry_id', 'teacher_id', 'meetings'])
    expect(createPayload).toEqual({
      section_id: 5,
      curriculum_entry_id: 21,
      teacher_id: 12,
      meetings: [{ day: 1, start_time: '07:30', end_time: '08:30', room_id: null }],
    })
  })

  it('(16) builds the update payload with only the teacher and the meeting set', () => {
    const updatePayload = buildUpdateClassPayload(buildForm([buildMeeting({ id: 40 }), buildMeeting({ day: '2' })]))
    expect(updatePayload).toEqual({
      teacher_id: 12,
      meetings: [
        { day: 1, start_time: '07:30', end_time: '08:30', room_id: 3 },
        { day: 2, start_time: '07:30', end_time: '08:30', room_id: 3 },
      ],
    })
  })
})

describe('class room options', () => {
  it('(17) keeps an inactive meeting room selectable once', () => {
    const activeRooms = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    const inactiveRoom = { id: 7, name: 'C' }
    const classRow = {
      class: { meetings: [{ room: inactiveRoom }, { room: inactiveRoom }, { room: null }] },
    }
    const roomsInUse = listClassRoomsInUse({ room: activeRooms[0] }, classRow)
    expect(roomsInUse).toHaveLength(3)
    const roomOptions = listClassRoomOptions(activeRooms, roomsInUse)
    expect(roomOptions.map((room) => room.id)).toEqual([1, 2, 7])
    expect(roomOptions[2].is_active).toBe(false)
    expect(listClassRoomOptions(null, roomsInUse).map((room) => room.id)).toEqual([1, 7])
  })
})

describe('getMeetingErrors', () => {
  it('(18) maps the conflict and the field errors of one meeting', () => {
    const conflictText = 'Conflicts with Grade 7 · Rizal MATH7 on Monday 07:30–08:30.'
    const fieldErrors = { 'meetings.1': [conflictText], 'meetings.1.room_id': ['Room is not active.'] }
    expect(getMeetingErrors(fieldErrors, 1)).toEqual({
      meeting: conflictText,
      day: '',
      start_time: '',
      end_time: '',
      room_id: 'Room is not active.',
    })
    const emptyErrors = { meeting: '', day: '', start_time: '', end_time: '', room_id: '' }
    expect(getMeetingErrors(fieldErrors, 0)).toEqual(emptyErrors)
    expect(getMeetingErrors(null, 0)).toEqual(emptyErrors)
  })
})

describe('teacher options', () => {
  it('(19) keeps a stale teacher selectable with the not-active marker', () => {
    const teacherOptions = listSelectableAdvisers([{ id: 1, name: 'Ana' }], { id: 9, name: 'Ben' })
    expect(teacherOptions[1].isUnavailable).toBe(true)
    expect(buildAdviserOptionLabel(teacherOptions[1])).toBe('Ben (not an active teacher)')
  })
})
