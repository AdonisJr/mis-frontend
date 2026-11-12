import { describe, it, expect } from 'vitest'
import {
  buildEnrollPayload,
  buildMovePayload,
  buildSectionOptionLabel,
  clearTermForSection,
  createEmptyEnrollForm,
  createEmptyMoveForm,
  findEnrollFormErrors,
  findMoveFormErrors,
  getSeatsLeft,
  isSectionFull,
  isTermRequired,
  listMoveTargets,
  toIsoDate,
} from '@/utils/enrollmentForm.js'

const JHS_SECTION = Object.freeze({
  id: 1,
  name: 'Rizal',
  grade_level_id: 7,
  grade_level: { name: 'Grade 7', stage: 'jhs' },
  program: null,
  capacity: 40,
  enrolled_count: 12,
})
const SHS_SECTION = Object.freeze({
  id: 2,
  name: 'A',
  grade_level_id: 11,
  grade_level: { name: 'Grade 11', stage: 'shs' },
  program: { code: 'STEM' },
  capacity: 30,
  enrolled_count: 10,
})
const COLLEGE_SECTION = Object.freeze({ id: 3, name: 'B', grade_level: { name: '1st Year', stage: 'college' } })
const FILLED_ENROLL_FORM = Object.freeze({
  student_id: '9',
  section_id: '2',
  term_id: '5',
  enrolled_at: '2026-06-01',
  remarks: '  transferee  ',
})

describe('createEmptyEnrollForm and createEmptyMoveForm', () => {
  it('starts both forms with today as the date and the default term as text on enroll', () => {
    expect(createEmptyEnrollForm(5, '2026-06-01')).toEqual({
      student_id: '',
      section_id: '',
      term_id: '5',
      enrolled_at: '2026-06-01',
      remarks: '',
    })
    expect(createEmptyEnrollForm('', '2026-06-01').term_id).toBe('')
    expect(createEmptyMoveForm('2026-06-01')).toEqual({ section_id: '', ended_at: '2026-06-01', remarks: '' })
  })
})

describe('toIsoDate', () => {
  it('formats a local date with zero padding', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toIsoDate(new Date(2026, 10, 13))).toBe('2026-11-13')
  })

  it('returns an empty string for anything that is not a valid date', () => {
    for (const notADate of [new Date('nope'), '2026-01-05', null, undefined]) {
      expect(toIsoDate(notADate)).toBe('')
    }
  })
})

describe('isTermRequired', () => {
  it('is true only for a section whose stage is not JHS', () => {
    expect(isTermRequired(SHS_SECTION)).toBe(true)
    expect(isTermRequired(COLLEGE_SECTION)).toBe(true)
    expect(isTermRequired(JHS_SECTION)).toBe(false)
    expect(isTermRequired(null)).toBe(false)
  })
})

describe('clearTermForSection', () => {
  it('clears the term for JHS and for no section, and keeps it for SHS', () => {
    expect(clearTermForSection(FILLED_ENROLL_FORM, JHS_SECTION).term_id).toBe('')
    expect(clearTermForSection(FILLED_ENROLL_FORM, null).term_id).toBe('')
    expect(clearTermForSection(FILLED_ENROLL_FORM, SHS_SECTION)).toBe(FILLED_ENROLL_FORM)
  })
})

describe('findEnrollFormErrors', () => {
  it('returns no errors for a complete SHS form', () => {
    expect(findEnrollFormErrors(FILLED_ENROLL_FORM, SHS_SECTION)).toEqual({})
  })

  it('asks only for the student and the section on an empty form', () => {
    const formErrors = findEnrollFormErrors(createEmptyEnrollForm('', ''), null)
    expect(formErrors).toEqual({ student_id: ['Choose a student.'], section_id: ['Section is required.'] })
  })

  it('requires a term for SHS and college sections but not for JHS', () => {
    const noTermForm = { ...FILLED_ENROLL_FORM, term_id: '' }
    const message = 'Term is required for SHS and college sections.'
    expect(findEnrollFormErrors(noTermForm, SHS_SECTION).term_id).toEqual([message])
    expect(findEnrollFormErrors(noTermForm, COLLEGE_SECTION).term_id).toEqual([message])
    expect(findEnrollFormErrors(noTermForm, JHS_SECTION)).not.toHaveProperty('term_id')
  })

  it('rejects a malformed date and remarks over 1000 characters', () => {
    const badForm = { ...FILLED_ENROLL_FORM, enrolled_at: '06/01/2026', remarks: 'x'.repeat(1001) }
    const formErrors = findEnrollFormErrors(badForm, SHS_SECTION)
    expect(formErrors.enrolled_at).toEqual(['Enter a valid date.'])
    expect(formErrors.remarks).toEqual(['Remarks must be at most 1000 characters.'])
  })
})

describe('buildEnrollPayload', () => {
  it('sends numbers, the term for SHS and trimmed remarks', () => {
    expect(buildEnrollPayload(FILLED_ENROLL_FORM, SHS_SECTION)).toEqual({
      student_id: 9,
      section_id: 2,
      term_id: 5,
      enrolled_at: '2026-06-01',
      remarks: 'transferee',
    })
  })

  it('leaves out the term key for JHS, nulls blank remarks and omits a blank date', () => {
    const jhsForm = { student_id: '9', section_id: '1', term_id: '5', enrolled_at: '', remarks: '   ' }
    const enrollPayload = buildEnrollPayload(jhsForm, JHS_SECTION)
    expect(enrollPayload).toEqual({ student_id: 9, section_id: 1, remarks: null })
    expect(enrollPayload).not.toHaveProperty('term_id')
    expect(enrollPayload).not.toHaveProperty('enrolled_at')
  })
})

describe('findMoveFormErrors and buildMovePayload', () => {
  it('requires a section, checks the date and remarks, and builds the payload', () => {
    expect(findMoveFormErrors(createEmptyMoveForm('2026-06-01'))).toEqual({ section_id: ['Section is required.'] })
    const badForm = { section_id: '2', ended_at: 'soon', remarks: 'x'.repeat(1001) }
    const formErrors = findMoveFormErrors(badForm)
    expect(formErrors.ended_at).toEqual(['Enter a valid date.'])
    expect(formErrors.remarks).toEqual(['Remarks must be at most 1000 characters.'])

    expect(buildMovePayload({ section_id: '2', ended_at: '2026-06-02', remarks: ' ok ' })).toEqual({
      section_id: 2,
      ended_at: '2026-06-02',
      remarks: 'ok',
    })
    expect(buildMovePayload({ section_id: '2', ended_at: '', remarks: '' })).toEqual({ section_id: 2, remarks: null })
  })
})

describe('getSeatsLeft', () => {
  it('subtracts the enrolled count from the capacity, never below 0, or null when unknown', () => {
    expect(getSeatsLeft({ capacity: 40, enrolled_count: 12 })).toBe(28)
    expect(getSeatsLeft({ capacity: 10, enrolled_count: 12 })).toBe(0)
    expect(getSeatsLeft({ capacity: 40 })).toBeNull()
    expect(getSeatsLeft(null)).toBeNull()
  })
})

describe('buildSectionOptionLabel', () => {
  it('shows seats for JHS, the program and term seats for SHS, none for SHS without a term, singular and Full', () => {
    expect(buildSectionOptionLabel(JHS_SECTION, '')).toBe('Grade 7 · Rizal — 28 seats left')
    expect(buildSectionOptionLabel(SHS_SECTION, '5')).toBe('Grade 11 · A (STEM) — 20 seats left')
    expect(buildSectionOptionLabel(SHS_SECTION, '')).toBe('Grade 11 · A (STEM)')
    expect(buildSectionOptionLabel({ ...JHS_SECTION, enrolled_count: 39 }, '')).toBe('Grade 7 · Rizal — 1 seat left')
    expect(buildSectionOptionLabel({ ...JHS_SECTION, enrolled_count: 40 }, '')).toBe('Grade 7 · Rizal — Full')
  })
})

describe('isSectionFull', () => {
  it('is true only when the seat count is known and zero', () => {
    expect(isSectionFull({ ...JHS_SECTION, enrolled_count: 40 }, '')).toBe(true)
    expect(isSectionFull(JHS_SECTION, '')).toBe(false)
    expect(isSectionFull({ ...SHS_SECTION, enrolled_count: 30 }, '')).toBe(false)
    expect(isSectionFull({ ...SHS_SECTION, enrolled_count: 30 }, '5')).toBe(true)
  })
})

describe('listMoveTargets', () => {
  const sections = [
    JHS_SECTION,
    { ...JHS_SECTION, id: 4, name: 'Bonifacio' },
    { ...JHS_SECTION, id: 5, name: 'Mabini', grade_level_id: 8 },
  ]

  it('keeps the sections of the same grade level and drops the current one', () => {
    expect(listMoveTargets(sections, 1).map((section) => section.id)).toEqual([4])
  })

  it('returns an empty list for a non-array or an unlisted current section', () => {
    expect(listMoveTargets(null, 1)).toEqual([])
    expect(listMoveTargets(sections, 99)).toEqual([])
  })
})
