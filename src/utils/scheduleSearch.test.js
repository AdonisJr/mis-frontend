import { describe, it, expect } from 'vitest'
import {
  SCHEDULE_MODE_TABS,
  applyScheduleModeChange,
  applyScheduleRoomChange,
  applyScheduleSchoolYearChange,
  applyScheduleSectionChange,
  applyScheduleTeacherChange,
  applyScheduleTermChange,
  buildTimetableRequest,
  createScheduleFilters,
  isScheduleTermVisible,
} from '@/utils/scheduleSearch.js'

const SHS_SECTION = { id: 5, grade_level: { id: 11, name: 'Grade 11', stage: 'shs' } }
const JHS_SECTION = { id: 6, grade_level: { id: 7, name: 'Grade 7', stage: 'jhs' } }

function buildFilters(filterChanges) {
  return { ...createScheduleFilters(), ...filterChanges }
}

describe('createScheduleFilters', () => {
  it('(1) starts in section mode with blank strings and keeps the tab order', () => {
    expect(createScheduleFilters()).toEqual({
      mode: 'section',
      schoolYearId: '',
      sectionId: '',
      teacherId: '',
      roomId: '',
      termNumber: '',
    })
    expect(SCHEDULE_MODE_TABS.map((tab) => tab.label)).toEqual(['Section', 'Teacher', 'Room'])
  })
})

describe('applyScheduleModeChange', () => {
  it('(2) switches to a known mode and falls back to section for an unknown one', () => {
    const scheduleFilters = buildFilters({})
    expect(applyScheduleModeChange(scheduleFilters, 'teacher').mode).toBe('teacher')
    expect(applyScheduleModeChange(buildFilters({ mode: 'room' }), 'nope').mode).toBe('section')
    expect(scheduleFilters.mode).toBe('section')
  })
})

describe('applyScheduleSchoolYearChange', () => {
  it('(3) clears the section and the term but keeps the mode, teacher and room', () => {
    const scheduleFilters = buildFilters({ mode: 'teacher', sectionId: '5', termNumber: '2', teacherId: '12', roomId: '3' })
    expect(applyScheduleSchoolYearChange(scheduleFilters, '4')).toEqual({
      mode: 'teacher',
      schoolYearId: '4',
      sectionId: '',
      termNumber: '',
      teacherId: '12',
      roomId: '3',
    })
  })
})

describe('single field changes', () => {
  it('(4) store id text and blank out junk', () => {
    const scheduleFilters = buildFilters({})
    expect(applyScheduleSectionChange(scheduleFilters, '5').sectionId).toBe('5')
    expect(applyScheduleTeacherChange(scheduleFilters, 12).teacherId).toBe('12')
    expect(applyScheduleRoomChange(scheduleFilters, '3').roomId).toBe('3')
    expect(applyScheduleTermChange(scheduleFilters, '2').termNumber).toBe('2')
    expect(applyScheduleSectionChange(scheduleFilters, 'abc').sectionId).toBe('')
    expect(applyScheduleTermChange(scheduleFilters, 'x').termNumber).toBe('')
  })
})

describe('buildTimetableRequest in section mode', () => {
  it('(5) sends the term of an SHS section and waits while it is blank', () => {
    const request = buildTimetableRequest(buildFilters({ sectionId: '5', termNumber: '2' }), SHS_SECTION)
    expect(request).toEqual({ mode: 'section', recordId: 5, params: { term_number: 2 } })
    expect(buildTimetableRequest(buildFilters({ sectionId: '5' }), SHS_SECTION)).toBeNull()
  })

  it('(6) never sends a term for a JHS section and needs a section', () => {
    const request = buildTimetableRequest(buildFilters({ sectionId: '6', termNumber: '2' }), JHS_SECTION)
    expect(request).toEqual({ mode: 'section', recordId: 6, params: {} })
    expect(buildTimetableRequest(buildFilters({}), null)).toBeNull()
  })
})

describe('buildTimetableRequest in teacher and room mode', () => {
  it('(7) needs the year and the teacher, and adds the term when picked', () => {
    const teacherFilters = buildFilters({ mode: 'teacher', schoolYearId: '1', teacherId: '12' })
    expect(buildTimetableRequest(teacherFilters, null)).toEqual({
      mode: 'teacher',
      recordId: 12,
      params: { school_year_id: 1 },
    })
    expect(buildTimetableRequest({ ...teacherFilters, termNumber: '2' }, null).params).toEqual({
      school_year_id: 1,
      term_number: 2,
    })
    expect(buildTimetableRequest({ ...teacherFilters, teacherId: '' }, null)).toBeNull()
    expect(buildTimetableRequest({ ...teacherFilters, schoolYearId: '' }, null)).toBeNull()
  })

  it('(8) needs the year and the room', () => {
    const roomFilters = buildFilters({ mode: 'room', schoolYearId: '1', roomId: '3' })
    expect(buildTimetableRequest(roomFilters, null)).toEqual({ mode: 'room', recordId: 3, params: { school_year_id: 1 } })
    expect(buildTimetableRequest({ ...roomFilters, roomId: '' }, null)).toBeNull()
    expect(buildTimetableRequest({ ...roomFilters, schoolYearId: '' }, null)).toBeNull()
  })
})

describe('isScheduleTermVisible', () => {
  it('(9) shows the term for SHS and for teacher and room mode only', () => {
    expect(isScheduleTermVisible(buildFilters({}), SHS_SECTION)).toBe(true)
    expect(isScheduleTermVisible(buildFilters({}), JHS_SECTION)).toBe(false)
    expect(isScheduleTermVisible(buildFilters({}), null)).toBe(false)
    expect(isScheduleTermVisible(buildFilters({ mode: 'teacher' }), null)).toBe(true)
    expect(isScheduleTermVisible(buildFilters({ mode: 'room' }), null)).toBe(true)
  })
})
