import { describe, it, expect } from 'vitest'
import {
  CLASS_SCHEDULE_COLUMNS,
  NOT_SCHEDULED_LABEL,
  SCHOOL_DAY_OPTIONS,
  buildClassDeleteMessage,
  buildClassModalTitle,
  buildHoursText,
  buildMeetingSummary,
  buildRoomTimetableEntries,
  buildSectionOptionLabel,
  buildSectionTimetableEntries,
  buildTeacherTimetableEntries,
  formatClassTeacher,
  formatHoursValue,
  formatMeetingTime,
  getDayLabel,
  getDayShortLabel,
  getHoursStatusChip,
  listScheduleRows,
} from '@/utils/scheduleDisplay.js'

const ROOM = { id: 3, name: 'Rm 101', building: null }
const SCHEDULED_ROW = {
  id: 21,
  curriculum_entry_id: 21,
  subject: { code: 'MATH7', weekly_hours: '4.0' },
  class: {
    id: 9,
    scheduled_weekly_hours: '3.50',
    required_weekly_hours: '4.00',
    teacher: { id: 12, name: 'Ana Cruz' },
    subject: { code: 'MATH7' },
    meetings: [{ id: 40, day: 1, start_time: '07:30', end_time: '08:30', room: ROOM }],
  },
}
const UNSCHEDULED_ROW = { id: 22, curriculum_entry_id: 22, subject: { code: 'SCI7', weekly_hours: '4.0' }, class: null }
const TEACHER_MEETING = {
  id: 40,
  day: 2,
  start_time: '09:00',
  end_time: '10:00',
  room: null,
  class: { section: { name: 'Rizal' }, subject: { code: 'MATH7' }, teacher: { name: 'Ana Cruz' } },
}

describe('day labels', () => {
  it('(1) labels days from numbers or digit strings', () => {
    expect(SCHOOL_DAY_OPTIONS.map((option) => option.label)).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ])
    expect(SCHOOL_DAY_OPTIONS[0]).toEqual({ value: '1', label: 'Monday' })
    expect(getDayLabel(6)).toBe('Saturday')
    expect(getDayLabel('6')).toBe('Saturday')
    expect(getDayShortLabel(1)).toBe('Mon')
    for (const badDay of [7, 'sun', null]) {
      expect(getDayLabel(badDay)).toBe('')
      expect(getDayShortLabel(badDay)).toBe('')
    }
  })
})

describe('columns', () => {
  it('(2) lists the column keys in order', () => {
    expect(CLASS_SCHEDULE_COLUMNS.map((column) => column.key)).toEqual(['code', 'subject', 'teacher', 'meetings', 'hours'])
  })
})

describe('getHoursStatusChip', () => {
  it('(3) maps each status to a labelled chip', () => {
    expect(getHoursStatusChip('under')).toEqual({ label: 'Under', colorClass: 'bg-amber-100 text-amber-800' })
    expect(getHoursStatusChip('exact')).toEqual({ label: 'Exact', colorClass: 'bg-green-100 text-green-800' })
    expect(getHoursStatusChip('over')).toEqual({ label: 'Over', colorClass: 'bg-red-100 text-red-800' })
    expect(getHoursStatusChip(null).label).toBe('Not scheduled')
    expect(getHoursStatusChip('x').colorClass).toBe('bg-slate-200 text-slate-700')
  })
})

describe('hours text', () => {
  it('(4) strips trailing zeros and rejects non-hours', () => {
    expect(formatHoursValue('3.50')).toBe('3.5')
    expect(formatHoursValue('4.00')).toBe('4')
    expect(formatHoursValue('3.42')).toBe('3.42')
    expect(formatHoursValue('0.00')).toBe('0')
    expect(formatHoursValue('abc')).toBe('—')
    expect(formatHoursValue(null)).toBe('—')
  })

  it('(5) builds scheduled and unscheduled hours text', () => {
    expect(buildHoursText(SCHEDULED_ROW)).toBe('3.5 / 4 h')
    expect(buildHoursText(UNSCHEDULED_ROW)).toBe('0 / 4 h')
  })
})

describe('meeting text', () => {
  it('(6) formats the time and the summary with or without a room', () => {
    const meeting = SCHEDULED_ROW.class.meetings[0]
    expect(formatMeetingTime(meeting)).toBe('Mon 07:30–08:30')
    expect(buildMeetingSummary({ ...meeting, room: { ...ROOM, building: 'Main' } })).toBe(
      'Mon 07:30–08:30 · Rm 101 · Main',
    )
    expect(buildMeetingSummary({ ...meeting, room: null })).toBe('Mon 07:30–08:30 · No room')
  })
})

describe('formatClassTeacher', () => {
  it('(7) shows the trimmed teacher or the unscheduled label', () => {
    expect(formatClassTeacher(SCHEDULED_ROW)).toBe('Ana Cruz')
    expect(formatClassTeacher({ class: { teacher: { name: ' Ben ' } } })).toBe('Ben')
    expect(formatClassTeacher(UNSCHEDULED_ROW)).toBe(NOT_SCHEDULED_LABEL)
    expect(NOT_SCHEDULED_LABEL).toBe('Not yet scheduled')
  })
})

describe('listScheduleRows', () => {
  it('(8) maps the subjects of a section timetable', () => {
    const sectionTimetable = {
      subjects: [
        { curriculum_entry_id: 21, sort_order: 1, subject: { code: 'MATH7' }, class: { id: 9 } },
        { curriculum_entry_id: 22, sort_order: 2, subject: { code: 'SCI7' } },
      ],
    }
    expect(listScheduleRows(sectionTimetable)).toEqual([
      { id: 21, curriculum_entry_id: 21, sort_order: 1, subject: { code: 'MATH7' }, class: { id: 9 } },
      { id: 22, curriculum_entry_id: 22, sort_order: 2, subject: { code: 'SCI7' }, class: null },
    ])
    expect(listScheduleRows('x')).toEqual([])
    expect(listScheduleRows(null)).toEqual([])
  })
})

describe('labels and messages', () => {
  it('(9) builds the section option label', () => {
    expect(buildSectionOptionLabel({ name: 'Rizal', grade_level: { name: 'Grade 7' } })).toBe('Grade 7 · Rizal')
    expect(buildSectionOptionLabel({ name: 'Rizal' })).toBe('Rizal')
    expect(buildSectionOptionLabel('x')).toBe('')
  })

  it('(10) builds the modal title and the delete message', () => {
    expect(buildClassModalTitle(UNSCHEDULED_ROW)).toBe('Schedule SCI7')
    expect(buildClassModalTitle(SCHEDULED_ROW)).toBe('Edit MATH7 class')
    expect(buildClassDeleteMessage(SCHEDULED_ROW)).toBe(
      'Delete the MATH7 class? Its meetings are deleted too. This cannot be undone.',
    )
    expect(buildClassDeleteMessage(null)).toBe('')
  })
})

describe('timetable entries', () => {
  it('(11) builds section entries from scheduled rows only', () => {
    expect(buildSectionTimetableEntries([UNSCHEDULED_ROW, SCHEDULED_ROW])).toEqual([
      {
        key: 'meeting-40',
        day: 1,
        start_time: '07:30',
        end_time: '08:30',
        title: 'MATH7',
        subtitle: 'Ana Cruz · Rm 101',
      },
    ])
    expect(buildSectionTimetableEntries(null)).toEqual([])
  })

  it('(12) builds teacher and room entries', () => {
    const [teacherEntry] = buildTeacherTimetableEntries([TEACHER_MEETING])
    expect(teacherEntry.title).toBe('MATH7 · Rizal')
    expect(teacherEntry.subtitle).toBe('No room')
    expect(buildTeacherTimetableEntries([{ ...TEACHER_MEETING, room: ROOM }])[0].subtitle).toBe('Rm 101')
    const [roomEntry] = buildRoomTimetableEntries([TEACHER_MEETING])
    expect(roomEntry.title).toBe('MATH7 · Rizal')
    expect(roomEntry.subtitle).toBe('Ana Cruz')
  })
})
