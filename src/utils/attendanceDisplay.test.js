import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_CSV_COLUMNS,
  ATTENDANCE_RECORD_COLUMNS,
  ATTENDANCE_TODAY_COLUMNS,
  TIMED_OUT_CHIP,
  buildAttendanceCsv,
  buildAttendanceRows,
  buildAttendanceSummaryChips,
  formatAttendanceGradeSection,
  formatAttendanceTime,
  getAttendanceStatusChip,
  getManilaTodayIso,
  listAttendanceStatusChips,
} from '@/utils/attendanceDisplay.js'

const GREEN = 'bg-green-100 text-green-800'
const AMBER = 'bg-amber-100 text-amber-800'
const RED = 'bg-red-100 text-red-800'
const NEUTRAL = 'bg-slate-200 text-slate-700'

const CSV_ROW = {
  attendance_id: 5,
  date: '2026-11-27',
  student: { id: 4, lrn: '123456789012', first_name: 'Juan', middle_name: 'Perez', last_name: 'Dela Cruz' },
  grade_level: { id: 7, name: 'Grade 7' },
  section: { id: 3, name: 'Rizal' },
  time_in: '07:05:00',
  time_out: '15:02:00',
  status: 'present',
}

describe('getAttendanceStatusChip', () => {
  it('maps present, late and absent to labelled colour chips', () => {
    expect(getAttendanceStatusChip('present')).toEqual({ label: 'Present', colorClass: GREEN })
    expect(getAttendanceStatusChip('late')).toEqual({ label: 'Late', colorClass: AMBER })
    expect(getAttendanceStatusChip('absent')).toEqual({ label: 'Absent', colorClass: RED })
  })

  it('shows an unknown status as raw text in a neutral chip', () => {
    expect(getAttendanceStatusChip('excused')).toEqual({ label: 'excused', colorClass: NEUTRAL })
    expect(getAttendanceStatusChip(null)).toEqual({ label: '', colorClass: NEUTRAL })
  })
})

describe('listAttendanceStatusChips', () => {
  it('adds a Timed out chip only when time_out is a non-empty string', () => {
    expect(listAttendanceStatusChips({ status: 'late', time_out: null }).map((chip) => chip.label)).toEqual(['Late'])
    expect(listAttendanceStatusChips({ status: 'present', time_out: '15:02:00' })).toEqual([
      getAttendanceStatusChip('present'),
      TIMED_OUT_CHIP,
    ])
    expect(listAttendanceStatusChips({ status: 'present', time_out: '' })).toHaveLength(1)
  })

  it('shows no status chip for a null status', () => {
    expect(listAttendanceStatusChips({ status: null, time_out: null })).toEqual([])
    expect(listAttendanceStatusChips({ status: null, time_out: '15:00:00' })).toEqual([TIMED_OUT_CHIP])
  })
})

describe('formatAttendanceTime', () => {
  it('formats HH:MM and HH:MM:SS wall-clock text as 12-hour time', () => {
    expect(formatAttendanceTime('07:05:00')).toBe('7:05 AM')
    expect(formatAttendanceTime('00:00')).toBe('12:00 AM')
    expect(formatAttendanceTime('12:30:59')).toBe('12:30 PM')
    expect(formatAttendanceTime('23:59')).toBe('11:59 PM')
  })

  it('reads an ISO datetime in Manila time', () => {
    expect(formatAttendanceTime('2026-11-27T07:31:00+08:00')).toBe('7:31 AM')
    expect(formatAttendanceTime('2026-11-26T23:31:00Z')).toBe('7:31 AM')
  })

  it('shows a dash for missing or malformed values', () => {
    for (const badValue of [null, '', '25:00', '7:5', 42, '2026-99-99T00:00:00Z']) {
      expect(formatAttendanceTime(badValue)).toBe('—')
    }
  })
})

describe('getManilaTodayIso', () => {
  it('returns the Manila calendar date, not the UTC date', () => {
    expect(getManilaTodayIso(new Date('2026-11-27T15:59:59Z'))).toBe('2026-11-27')
    expect(getManilaTodayIso(new Date('2026-11-27T16:00:00Z'))).toBe('2026-11-28')
  })

  it('returns an empty string for anything but a valid Date', () => {
    expect(getManilaTodayIso(new Date('nope'))).toBe('')
    expect(getManilaTodayIso('x')).toBe('')
  })
})

describe('buildAttendanceSummaryChips', () => {
  it('returns the five chips in order with their counts', () => {
    const chips = buildAttendanceSummaryChips({ enrolled: 40, present: 30, late: 5, absent: 5, timed_out: 12 })
    expect(chips.map((chip) => [chip.label, chip.count])).toEqual([
      ['Enrolled', 40],
      ['Present', 30],
      ['Late', 5],
      ['Absent', 5],
      ['Timed out', 12],
    ])
    expect(chips.map((chip) => chip.colorClass)).toEqual([NEUTRAL, GREEN, AMBER, RED, NEUTRAL])
  })

  it('counts 0 for a null summary and for values that are not non-negative integers', () => {
    expect(buildAttendanceSummaryChips(null).every((chip) => chip.count === 0)).toBe(true)
    const chips = buildAttendanceSummaryChips({ present: '3', late: -1, absent: 1.5 })
    expect(chips.map((chip) => chip.count)).toEqual([0, 0, 0, 0, 0])
  })
})

describe('formatAttendanceGradeSection and columns', () => {
  it('joins grade and section, or shows a dash', () => {
    expect(formatAttendanceGradeSection({ grade_level: { name: 'Grade 7' }, section: { name: 'Rizal' } })).toBe('Grade 7 · Rizal')
    expect(formatAttendanceGradeSection({ grade_level: { name: 'Grade 7' }, section: null })).toBe('Grade 7')
    expect(formatAttendanceGradeSection({ grade_level: null, section: null })).toBe('—')
  })

  it('has no Date column on Today and a leading Date column on Records', () => {
    expect(ATTENDANCE_TODAY_COLUMNS.map((column) => column.key)).toEqual([
      'lrn',
      'student',
      'grade_section',
      'time_in',
      'time_out',
      'status',
    ])
    expect(ATTENDANCE_RECORD_COLUMNS[0].key).toBe('date')
    expect(ATTENDANCE_RECORD_COLUMNS).toHaveLength(7)
  })
})

describe('buildAttendanceRows', () => {
  it('keys rows by attendance_id, else by student and date', () => {
    const rows = buildAttendanceRows(
      [
        { attendance_id: 9, student: { id: 1 } },
        { attendance_id: null, student: { id: 4 } },
        { attendance_id: null, student: { id: 5 }, date: '2026-11-20' },
      ],
      '2026-11-27',
    )
    expect(rows.map((row) => row.key)).toEqual(['attendance-9', 'student-4-2026-11-27', 'student-5-2026-11-20'])
  })

  it('returns an empty list for a non-array', () => {
    expect(buildAttendanceRows(null, '2026-11-27')).toEqual([])
  })
})

describe('buildAttendanceCsv', () => {
  it('writes the header and a formatted row', () => {
    const csvLines = buildAttendanceCsv([CSV_ROW]).split('\r\n')
    expect(ATTENDANCE_CSV_COLUMNS).toHaveLength(8)
    expect(csvLines[0]).toBe('Date,LRN,Name,Grade,Section,Time in,Time out,Status')
    expect(csvLines[1]).toBe('2026-11-27,123456789012,"Dela Cruz, Juan P.",Grade 7,Rizal,7:05 AM,3:02 PM,Present')
  })

  it('leaves a missing time empty, guards formulas, and handles a non-array', () => {
    const noTimeOutLine = buildAttendanceCsv([{ ...CSV_ROW, time_out: null }]).split('\r\n')[1]
    expect(noTimeOutLine).toContain('7:05 AM,,Present')
    const formulaLine = buildAttendanceCsv([{ ...CSV_ROW, student: { ...CSV_ROW.student, last_name: '=HYPERLINK(1)' } }]).split('\r\n')[1]
    expect(formulaLine).toContain('"\'=HYPERLINK(1), ')
    expect(buildAttendanceCsv(null)).toBe('Date,LRN,Name,Grade,Section,Time in,Time out,Status')
  })
})
