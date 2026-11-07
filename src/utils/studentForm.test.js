import { describe, it, expect } from 'vitest'
import {
  STUDENT_FORM_FIELDS,
  STUDENT_GENDER_OPTIONS,
  STUDENT_GRADE_LEVELS,
  buildFormFromStudent,
  buildStudentPayload,
  createEmptyStudentForm,
  findStudentFormErrors,
} from '@/utils/studentForm.js'

const LRN_FORMAT_ERROR = ['LRN must be exactly 12 digits.']

function buildCompleteForm() {
  return {
    lrn: '136512340001',
    first_name: 'Andrea',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    birth_date: '2010-05-14',
    gender: 'female',
    grade_level: 'Grade 10',
    section: 'Rizal',
    address: 'Quezon City',
    contact: '09171234567',
    guardian_name: 'Maria Dela Cruz',
    guardian_relationship: 'Mother',
    guardian_contact: '09181234567',
  }
}

describe('STUDENT_GRADE_LEVELS', () => {
  it('lists the ten levels in contract order', () => {
    expect(STUDENT_GRADE_LEVELS).toEqual([
      'Grade 7',
      'Grade 8',
      'Grade 9',
      'Grade 10',
      'Grade 11',
      'Grade 12',
      '1st Year College',
      '2nd Year College',
      '3rd Year College',
      '4th Year College',
    ])
  })
})

describe('STUDENT_GENDER_OPTIONS', () => {
  it('offers male and female with Male and Female labels', () => {
    expect(STUDENT_GENDER_OPTIONS).toEqual([
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ])
  })
})

describe('createEmptyStudentForm', () => {
  it('returns the thirteen form fields as empty strings', () => {
    const emptyForm = createEmptyStudentForm()
    expect(Object.keys(emptyForm)).toEqual([...STUDENT_FORM_FIELDS])
    expect(Object.keys(emptyForm)).toHaveLength(13)
    expect(Object.values(emptyForm).every((fieldValue) => fieldValue === '')).toBe(true)
  })
})

describe('buildFormFromStudent', () => {
  it('copies the editable fields and turns null into an empty string', () => {
    const student = { ...buildCompleteForm(), middle_name: null, address: null, contact: null }
    expect(buildFormFromStudent(student)).toEqual({ ...buildCompleteForm(), middle_name: '', address: '', contact: '' })
  })

  it('drops rfid, user_id, id and timestamps', () => {
    const student = {
      ...buildCompleteForm(),
      id: 7,
      rfid: '04:A3:2B:1C',
      user_id: 3,
      created_at: '2026-11-07T00:00:00.000000Z',
      updated_at: '2026-11-07T00:00:00.000000Z',
    }
    const studentForm = buildFormFromStudent(student)
    expect(Object.keys(studentForm)).toEqual([...STUDENT_FORM_FIELDS])
    expect(studentForm).not.toHaveProperty('rfid')
    expect(studentForm).not.toHaveProperty('user_id')
    expect(studentForm).not.toHaveProperty('id')
    expect(studentForm).not.toHaveProperty('created_at')
  })
})

describe('findStudentFormErrors', () => {
  it('returns no errors for a complete form', () => {
    expect(findStudentFormErrors(buildCompleteForm())).toEqual({})
  })

  it('flags the ten required fields when the form is empty', () => {
    const formErrors = findStudentFormErrors(createEmptyStudentForm())
    expect(Object.keys(formErrors)).toHaveLength(10)
    expect(formErrors.lrn).toEqual(['LRN is required.'])
    expect(formErrors.grade_level).toEqual(['Level is required.'])
    expect(formErrors.section).toEqual(['Section / course is required.'])
    expect(formErrors.guardian_contact).toEqual(['Guardian contact is required.'])
  })

  it('treats whitespace-only values as missing', () => {
    const formErrors = findStudentFormErrors({ ...buildCompleteForm(), first_name: '   ', section: '\t' })
    expect(formErrors).toEqual({ first_name: ['First name is required.'], section: ['Section / course is required.'] })
  })

  it('leaves middle_name, address and contact optional', () => {
    const studentForm = { ...buildCompleteForm(), middle_name: '', address: '', contact: '' }
    expect(findStudentFormErrors(studentForm)).toEqual({})
  })

  it('rejects an LRN that is not exactly 12 digits', () => {
    expect(findStudentFormErrors({ ...buildCompleteForm(), lrn: '12345678901' })).toEqual({ lrn: LRN_FORMAT_ERROR })
    expect(findStudentFormErrors({ ...buildCompleteForm(), lrn: '1234567890123' })).toEqual({ lrn: LRN_FORMAT_ERROR })
    expect(findStudentFormErrors({ ...buildCompleteForm(), lrn: '12345678901A' })).toEqual({ lrn: LRN_FORMAT_ERROR })
  })

  it('accepts a 12-digit LRN with leading zeros', () => {
    expect(findStudentFormErrors({ ...buildCompleteForm(), lrn: '000000000123' })).toEqual({})
  })
})

describe('buildStudentPayload', () => {
  it('trims every value and keeps the LRN as a string', () => {
    const paddedForm = { ...buildCompleteForm(), lrn: ' 000000000123 ', first_name: '  Andrea ', section: ' Rizal ' }
    const studentPayload = buildStudentPayload(paddedForm)
    expect(studentPayload.lrn).toBe('000000000123')
    expect(typeof studentPayload.lrn).toBe('string')
    expect(studentPayload.first_name).toBe('Andrea')
    expect(studentPayload.section).toBe('Rizal')
  })

  it('sends blank optional fields as null', () => {
    const studentPayload = buildStudentPayload({ ...buildCompleteForm(), middle_name: '', address: '  ', contact: '' })
    expect(studentPayload.middle_name).toBeNull()
    expect(studentPayload.address).toBeNull()
    expect(studentPayload.contact).toBeNull()
  })

  it('never includes rfid or user_id even when present in the form values', () => {
    const studentPayload = buildStudentPayload({ ...buildCompleteForm(), rfid: '04:A3:2B:1C', user_id: 3 })
    expect(Object.keys(studentPayload)).toEqual([...STUDENT_FORM_FIELDS])
    expect(studentPayload).not.toHaveProperty('rfid')
    expect(studentPayload).not.toHaveProperty('user_id')
  })
})
