import { describe, it, expect } from 'vitest'
import {
  MY_CLASS_COLUMNS,
  buildAdvisoryBlock,
  buildClassHeaderItems,
  buildMyTimetableEntries,
  buildScheduleSummaryLines,
  formatClassTerm,
  listMyClassRows,
} from '@/utils/classListDisplay.js'

const ROOM = { id: 1, name: 'Rm 101', building: 'Main' }

function buildClass(overrides) {
  return {
    id: 5,
    section: { id: 3, name: 'Rizal' },
    grade_level: { id: 1, name: 'Grade 7', stage: 'jhs' },
    subject: { id: 2, code: 'MATH7', name: 'Mathematics 7' },
    teacher: { id: 12, name: 'Ana Cruz' },
    meetings: [{ id: 40, day: 1, start_time: '07:30', end_time: '08:30', room: ROOM }],
    student_count: 31,
    ...overrides,
  }
}

describe('MY_CLASS_COLUMNS', () => {
  it('(1) lists the column keys', () => {
    expect(MY_CLASS_COLUMNS.map((column) => column.key)).toEqual(['section', 'subject', 'schedule', 'students'])
  })
})

describe('buildScheduleSummaryLines', () => {
  it('(2) sorts by day then start time and handles empty input', () => {
    const summaryLines = buildScheduleSummaryLines([
      { day: 3, start_time: '08:00', end_time: '09:00', room: null },
      { day: '1', start_time: '09:00', end_time: '10:00', room: null },
      { day: 1, start_time: '07:30', end_time: '08:30', room: null },
    ])
    expect(summaryLines).toEqual(['Mon 07:30–08:30 · No room', 'Mon 09:00–10:00 · No room', 'Wed 08:00–09:00 · No room'])
    expect(buildScheduleSummaryLines([])).toEqual(['Not yet scheduled'])
    expect(buildScheduleSummaryLines(null)).toEqual(['Not yet scheduled'])
  })
})

describe('listMyClassRows', () => {
  it('(3) maps classes to table rows', () => {
    const [classRow] = listMyClassRows([buildClass({})])
    expect(classRow).toMatchObject({ id: 5, section: 'Grade 7 · Rizal', subject: 'MATH7 Mathematics 7', students: '31' })
    expect(listMyClassRows([buildClass({ student_count: 0 })])[0].students).toBe('0')
    expect(listMyClassRows([buildClass({ student_count: undefined })])[0].students).toBe('0')
    expect(listMyClassRows(null)).toEqual([])
  })
})

describe('buildMyTimetableEntries', () => {
  it('(4) builds grid entries without mutating the input', () => {
    const classes = [buildClass({ meetings: [{ id: 40, day: 1, start_time: '07:30', end_time: '08:30', room: ROOM }, { id: 41, day: 2, start_time: '07:30', end_time: '08:30', room: null }] })]
    const classesBefore = JSON.stringify(classes)
    const entries = buildMyTimetableEntries(classes)
    expect(entries[0]).toMatchObject({ key: 'meeting-40', title: 'MATH7 · Rizal', subtitle: 'Rm 101 · Main' })
    expect(entries[1].subtitle).toBe('No room')
    expect(buildMyTimetableEntries(null)).toEqual([])
    expect(JSON.stringify(classes)).toBe(classesBefore)
  })
})

describe('formatClassTerm', () => {
  it('(5) names a whole-year class and a termed class', () => {
    expect(formatClassTerm(null, 'semester')).toBe('Whole year')
    expect(formatClassTerm(2, 'semester')).toBe('2nd Semester')
  })
})

describe('buildClassHeaderItems', () => {
  it('(6) keeps the header order and fills gaps', () => {
    const headerItems = buildClassHeaderItems({
      ...buildClass({}),
      school_year: { id: 1, name: '2026-2027', term_type: 'semester' },
      term_number: 1,
    })
    expect(headerItems.map((headerItem) => headerItem.key)).toEqual(['school_year', 'term', 'section', 'grade_level', 'subject', 'teacher'])
    expect(headerItems.map((headerItem) => headerItem.label)).toEqual(['School year', 'Term', 'Section', 'Grade level', 'Subject', 'Teacher'])
    expect(headerItems[4].text).toBe('MATH7 Mathematics 7')
    const gapItems = buildClassHeaderItems({ ...buildClass({}), teacher: null })
    expect(gapItems.find((headerItem) => headerItem.key === 'teacher').text).toBe('—')
  })
})

describe('buildAdvisoryBlock without a section', () => {
  it('(7) returns null', () => {
    expect(buildAdvisoryBlock({ advisory_section: null })).toBeNull()
    expect(buildAdvisoryBlock({})).toBeNull()
  })
})

function buildAdvisoryResponse() {
  const scheduledClass = buildClass({ id: 5 })
  return {
    advisory_section: {
      section: {
        id: 3,
        name: 'Rizal',
        grade_level: { id: 1, name: 'Grade 7' },
        room: ROOM,
        adviser: { id: 12, name: 'Ana Cruz' },
        enrolled_count: 31,
      },
      term_number: null,
      timetable: [
        { curriculum_entry_id: 1, sort_order: 1, subject: { id: 2, code: 'MATH7', name: 'Mathematics 7' }, class: scheduledClass },
        { curriculum_entry_id: 2, sort_order: 2, subject: { id: 3, code: 'SCI7', name: 'Science 7' }, class: null },
      ],
      students: [{ enrollment_id: 1, last_name: 'Cruz', first_name: 'Ben', status: 'enrolled', guardian_name: 'Maria' }],
      left_the_class: [{ enrollment_id: 2, last_name: 'Reyes', first_name: 'Al', status: 'dropped', guardian_name: null }],
    },
  }
}

describe('buildAdvisoryBlock', () => {
  it('(8) builds the summary, entries and class links from scheduled rows only', () => {
    const advisoryBlock = buildAdvisoryBlock(buildAdvisoryResponse())
    expect(advisoryBlock).toMatchObject({
      sectionId: 3,
      sectionText: 'Grade 7 · Rizal',
      adviserText: 'Ana Cruz',
      roomText: 'Rm 101 · Main',
      enrolledText: '31',
      termNumber: null,
    })
    expect(advisoryBlock.entries.map((entry) => entry.key)).toEqual(['meeting-40'])
    expect(advisoryBlock.classLinks).toEqual([{ classId: 5, label: 'MATH7 · Ana Cruz' }])
  })
})

describe('buildAdvisoryBlock roster', () => {
  it('(9) splits the roster as the roster helper does', () => {
    const { rosterGroups } = buildAdvisoryBlock(buildAdvisoryResponse())
    expect(rosterGroups.listedRows.map((row) => row.key)).toEqual([1])
    expect(rosterGroups.leftRows.map((row) => row.key)).toEqual([2])
    expect(rosterGroups.leftRows[0].guardian_name).toBe('—')
  })
})
