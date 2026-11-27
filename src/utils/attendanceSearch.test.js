import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_RECORD_STATUS_OPTIONS,
  ATTENDANCE_TODAY_STATUS_OPTIONS,
  RECORD_RANGE_TOO_LONG_MESSAGE,
  TODAY_DATE_FUTURE_MESSAGE,
  TODAY_DATE_INVALID_MESSAGE,
  applyAttendanceGradeLevelChange,
  applyAttendanceSectionChange,
  applyAttendanceStatusChange,
  applyRecordDateFromChange,
  applyRecordDateToChange,
  applyRecordStudentChange,
  applyTodayDateChange,
  buildAttendanceSectionOptions,
  buildRecordParams,
  buildTodayParams,
  clearRecordStudent,
  createRecordFilters,
  createTodayFilters,
  findRecordRangeError,
  findTodayDateError,
} from '@/utils/attendanceSearch.js'
import { DATE_RANGE_INVALID_MESSAGE } from '@/utils/paymentSearch.js'

const TODAY = '2026-11-27'

function range(dateFrom, dateTo) {
  return { dateFrom, dateTo }
}

describe('filter factories', () => {
  it('creates the Today filters', () => {
    expect(createTodayFilters(TODAY)).toEqual({ date: TODAY, gradeLevelId: '', sectionId: '', status: '', search: '', page: 1 })
  })

  it('creates the Records filters', () => {
    expect(createRecordFilters(TODAY)).toEqual({
      dateFrom: TODAY,
      dateTo: TODAY,
      studentId: '',
      studentLabel: '',
      gradeLevelId: '',
      sectionId: '',
      status: '',
      search: '',
      page: 1,
    })
  })
})

describe('findTodayDateError', () => {
  it('allows today, refuses a future or malformed date', () => {
    expect(findTodayDateError(TODAY, TODAY)).toBe('')
    expect(findTodayDateError('2026-11-28', TODAY)).toBe(TODAY_DATE_FUTURE_MESSAGE)
    expect(findTodayDateError('', TODAY)).toBe(TODAY_DATE_INVALID_MESSAGE)
    expect(findTodayDateError('27/11/2026', TODAY)).toBe(TODAY_DATE_INVALID_MESSAGE)
  })
})

describe('buildTodayParams', () => {
  it('builds the defaults', () => {
    expect(buildTodayParams(createTodayFilters(TODAY), TODAY)).toEqual({ date: TODAY, page: 1 })
  })

  it('converts string selects and normalises search', () => {
    const todayFilters = { ...createTodayFilters(TODAY), gradeLevelId: '3', sectionId: '12', status: 'absent', search: '  dela   cruz ', page: 2 }
    expect(buildTodayParams(todayFilters, TODAY)).toEqual({
      date: TODAY,
      page: 2,
      grade_level_id: 3,
      section_id: 12,
      status: 'absent',
      search: 'dela cruz',
    })
  })

  it('drops tampered values and returns null for a future date', () => {
    const tampered = { ...createTodayFilters(TODAY), status: 'timed_out', gradeLevelId: 'abc' }
    expect(buildTodayParams(tampered, TODAY)).toEqual({ date: TODAY, page: 1 })
    expect(buildTodayParams({ ...createTodayFilters('2026-11-28') }, TODAY)).toBeNull()
  })
})

describe('findRecordRangeError', () => {
  it('checks order, then the 31-day inclusive span', () => {
    expect(findRecordRangeError(range(TODAY, TODAY))).toBe('')
    expect(findRecordRangeError(range('2026-11-02', '2026-11-01'))).toBe(DATE_RANGE_INVALID_MESSAGE)
    expect(findRecordRangeError(range('2026-11-01', '2026-12-01'))).toBe('')
    expect(findRecordRangeError(range('2026-11-01', '2026-12-02'))).toBe(RECORD_RANGE_TOO_LONG_MESSAGE)
  })

  it('counts a leap February correctly', () => {
    expect(findRecordRangeError(range('2028-02-01', '2028-03-02'))).toBe('')
    expect(findRecordRangeError(range('2028-02-01', '2028-03-03'))).toBe(RECORD_RANGE_TOO_LONG_MESSAGE)
  })
})

describe('buildRecordParams', () => {
  it('builds the defaults and the full set', () => {
    expect(buildRecordParams(createRecordFilters(TODAY))).toEqual({ date_from: TODAY, date_to: TODAY, page: 1 })
    const recordFilters = {
      ...createRecordFilters(TODAY),
      studentId: '4',
      status: 'late',
      gradeLevelId: '3',
      sectionId: '12',
      search: ' juan ',
    }
    expect(buildRecordParams(recordFilters)).toEqual({
      date_from: TODAY,
      date_to: TODAY,
      page: 1,
      student_id: 4,
      grade_level_id: 3,
      section_id: 12,
      status: 'late',
      search: 'juan',
    })
  })

  it('drops absent on Records and returns null for a bad range', () => {
    expect(buildRecordParams({ ...createRecordFilters(TODAY), status: 'absent' })).toEqual({ date_from: TODAY, date_to: TODAY, page: 1 })
    expect(buildRecordParams({ ...createRecordFilters(TODAY), dateFrom: '2026-10-01' })).toBeNull()
  })
})

describe('filter changes', () => {
  it('clears the section when the grade level changes and resets the page', () => {
    const changed = applyAttendanceGradeLevelChange({ ...createTodayFilters(TODAY), sectionId: '12', page: 3 }, 5)
    expect(changed).toMatchObject({ gradeLevelId: '5', sectionId: '', page: 1 })
    expect(applyAttendanceSectionChange(createTodayFilters(TODAY), '12').sectionId).toBe('12')
    expect(applyAttendanceStatusChange(createTodayFilters(TODAY), null).status).toBe('')
  })

  it('sets the date fields as strings and resets the page', () => {
    const paged = { ...createRecordFilters(TODAY), page: 4 }
    expect(applyTodayDateChange(paged, '2026-11-01')).toMatchObject({ date: '2026-11-01', page: 1 })
    expect(applyRecordDateFromChange(paged, '2026-11-01')).toMatchObject({ dateFrom: '2026-11-01', page: 1 })
    expect(applyRecordDateToChange(paged, undefined)).toMatchObject({ dateTo: '', page: 1 })
  })

  it('sets and clears the student filter', () => {
    const paged = { ...createRecordFilters(TODAY), page: 3 }
    const student = { id: 4, last_name: 'Dela Cruz', first_name: 'Juan', middle_name: 'Perez' }
    const withStudent = applyRecordStudentChange(paged, student)
    expect(withStudent).toMatchObject({ studentId: '4', studentLabel: 'Dela Cruz, Juan P.', page: 1 })
    expect(applyRecordStudentChange(paged, null)).toBe(paged)
    expect(applyRecordStudentChange(paged, { id: 'x' })).toBe(paged)
    expect(clearRecordStudent(withStudent)).toMatchObject({ studentId: '', studentLabel: '', page: 1 })
  })
})

describe('buildAttendanceSectionOptions', () => {
  const sections = [
    { id: 1, name: 'Rizal', grade_level_id: 7, grade_level: { id: 7, name: 'Grade 7' } },
    { id: 2, name: 'Mabini', grade_level_id: 8, grade_level: { id: 8, name: 'Grade 8' } },
  ]

  it('labels sections without a seats suffix and narrows by grade level', () => {
    expect(buildAttendanceSectionOptions(sections, '').map((option) => option.label)).toEqual(['Grade 7 · Rizal', 'Grade 8 · Mabini'])
    expect(buildAttendanceSectionOptions(sections, '7')).toEqual([{ id: 1, label: 'Grade 7 · Rizal' }])
    expect(buildAttendanceSectionOptions(null, '')).toEqual([])
  })
})

describe('status options', () => {
  it('lists Today and Records statuses, frozen', () => {
    expect(ATTENDANCE_TODAY_STATUS_OPTIONS.map((option) => option.value)).toEqual(['present', 'late', 'absent'])
    expect(ATTENDANCE_RECORD_STATUS_OPTIONS.map((option) => option.value)).toEqual(['present', 'late'])
    expect(Object.isFrozen(ATTENDANCE_TODAY_STATUS_OPTIONS)).toBe(true)
    expect(Object.isFrozen(ATTENDANCE_RECORD_STATUS_OPTIONS[0])).toBe(true)
  })
})
