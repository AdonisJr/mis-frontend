import { describe, it, expect } from 'vitest'
import {
  ENROLLMENT_COLUMNS,
  formatCurrentEnrollment,
  formatEnrollmentGradeLevel,
  formatEnrollmentSection,
  formatEnrollmentStudentName,
  formatEnrollmentTerm,
} from '@/utils/enrollmentDisplay.js'

describe('ENROLLMENT_COLUMNS', () => {
  it('lists the seven columns in order', () => {
    expect(ENROLLMENT_COLUMNS.map((column) => column.key)).toEqual([
      'lrn',
      'student',
      'grade_level',
      'section',
      'term',
      'status',
      'enrolled_at',
    ])
    expect(ENROLLMENT_COLUMNS.map((column) => column.label)).toEqual([
      'LRN',
      'Student',
      'Grade level',
      'Section',
      'Term',
      'Status',
      'Enrolled',
    ])
  })
})

describe('formatEnrollmentStudentName', () => {
  it('formats Last, First with a middle initial when there is one', () => {
    const student = { first_name: 'Ana', middle_name: 'reyes', last_name: 'Cruz' }
    expect(formatEnrollmentStudentName(student)).toBe('Cruz, Ana R.')
    expect(formatEnrollmentStudentName({ ...student, middle_name: null })).toBe('Cruz, Ana')
    expect(formatEnrollmentStudentName(null)).toBe('—')
  })
})

describe('formatEnrollmentTerm', () => {
  it('shows the term label, or Whole year when there is no term', () => {
    expect(formatEnrollmentTerm({ term: { id: 1, label: '1st Semester' } })).toBe('1st Semester')
    expect(formatEnrollmentTerm({ term: null })).toBe('Whole year')
  })
})

describe('formatEnrollmentSection', () => {
  it('adds the program code only when there is a program', () => {
    expect(formatEnrollmentSection({ section: { name: 'A', program: { code: 'STEM' } } })).toBe('A (STEM)')
    expect(formatEnrollmentSection({ section: { name: 'Rizal', program: null } })).toBe('Rizal')
  })
})

describe('formatEnrollmentGradeLevel', () => {
  it('shows the section grade level name or the placeholder', () => {
    expect(formatEnrollmentGradeLevel({ section: { grade_level: { name: 'Grade 7' } } })).toBe('Grade 7')
    expect(formatEnrollmentGradeLevel({})).toBe('—')
  })
})

describe('formatCurrentEnrollment', () => {
  it('shows grade level and section of the current enrollment', () => {
    const student = { current_enrollment: { section: { id: 1, name: 'A' }, grade_level: { id: 7, name: 'Grade 7' } } }
    expect(formatCurrentEnrollment(student)).toBe('Grade 7 · A')
  })

  it('shows Not enrolled for a null or missing current enrollment', () => {
    expect(formatCurrentEnrollment({ current_enrollment: null })).toBe('Not enrolled')
    expect(formatCurrentEnrollment({})).toBe('Not enrolled')
  })
})
