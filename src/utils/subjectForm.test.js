import { describe, it, expect } from 'vitest'
import {
  buildFormFromSubject,
  buildSubjectPayload,
  createEmptySubjectForm,
  findSubjectFormErrors,
} from '@/utils/subjectForm.js'

function buildValidForm(overrides = {}) {
  return { code: 'MATH7', name: 'Mathematics 7', type: 'jhs_learning_area', weekly_hours: '4', description: '', ...overrides }
}

describe('createEmptySubjectForm', () => {
  it('returns blank strings for every field', () => {
    expect(createEmptySubjectForm()).toEqual({ code: '', name: '', type: '', weekly_hours: '', description: '' })
  })
})

describe('buildFormFromSubject', () => {
  it('maps a row, trimming the hours text, and blanks an unknown type', () => {
    const subject = { code: 'MATH7', name: 'Mathematics 7', type: 'jhs_learning_area', weekly_hours: '1.50', description: null }
    expect(buildFormFromSubject(subject)).toEqual({
      code: 'MATH7',
      name: 'Mathematics 7',
      type: 'jhs_learning_area',
      weekly_hours: '1.5',
      description: '',
    })
    expect(buildFormFromSubject({ ...subject, type: 'college_major' }).type).toBe('')
  })

  it('returns the empty form for null', () => {
    expect(buildFormFromSubject(null)).toEqual(createEmptySubjectForm())
  })
})

describe('findSubjectFormErrors', () => {
  it('requires a code and limits it to 20 characters', () => {
    expect(findSubjectFormErrors(buildValidForm({ code: '   ' })).code).toEqual(['Code is required.'])
    expect(findSubjectFormErrors(buildValidForm({ code: 'A'.repeat(20) })).code).toBeUndefined()
    expect(findSubjectFormErrors(buildValidForm({ code: 'A'.repeat(21) })).code).toEqual([
      'Code must be at most 20 characters.',
    ])
  })

  it('requires a name and limits it to 150 characters', () => {
    expect(findSubjectFormErrors(buildValidForm({ name: '' })).name).toEqual(['Name is required.'])
    expect(findSubjectFormErrors(buildValidForm({ name: 'N'.repeat(150) })).name).toBeUndefined()
    expect(findSubjectFormErrors(buildValidForm({ name: 'N'.repeat(151) })).name).toEqual([
      'Name must be at most 150 characters.',
    ])
  })

  it('requires one of the four types', () => {
    expect(findSubjectFormErrors(buildValidForm({ type: 'college_major' })).type).toEqual(['Type is required.'])
    expect(findSubjectFormErrors(buildValidForm({ type: '' })).type).toEqual(['Type is required.'])
  })

  it('requires the hours to be filled and numeric', () => {
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '' })).weekly_hours).toEqual([
      'Weekly hours are required.',
    ])
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: 'abc' })).weekly_hours).toEqual([
      'Weekly hours must be a number.',
    ])
  })

  it('accepts both range edges and rejects values just outside', () => {
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '0.5' })).weekly_hours).toBeUndefined()
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '40' })).weekly_hours).toBeUndefined()
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '0' })).weekly_hours).toEqual([
      'Weekly hours must be from 0.5 to 40.',
    ])
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '40.5' })).weekly_hours).toEqual([
      'Weekly hours must be from 0.5 to 40.',
    ])
  })

  it('requires steps of 0.5', () => {
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '1.25' })).weekly_hours).toEqual([
      'Weekly hours must be in steps of 0.5.',
    ])
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '2.5' })).weekly_hours).toBeUndefined()
    expect(findSubjectFormErrors(buildValidForm({ weekly_hours: '1.50' })).weekly_hours).toBeUndefined()
  })

  it('limits the optional description to 500 characters', () => {
    expect(findSubjectFormErrors(buildValidForm({ description: 'D'.repeat(500) })).description).toBeUndefined()
    expect(findSubjectFormErrors(buildValidForm({ description: 'D'.repeat(501) })).description).toEqual([
      'Description must be at most 500 characters.',
    ])
    expect(findSubjectFormErrors(buildValidForm({ description: '  ' })).description).toBeUndefined()
  })

  it('returns no errors for a valid form', () => {
    expect(findSubjectFormErrors(buildValidForm())).toEqual({})
  })
})

describe('buildSubjectPayload', () => {
  it('trims text, sends the hours as a number and a blank description as null, without is_active', () => {
    const subjectPayload = buildSubjectPayload(
      buildValidForm({ code: ' MATH7 ', name: ' Mathematics 7 ', weekly_hours: ' 2.5 ', description: '  ' }),
    )
    expect(subjectPayload).toEqual({
      code: 'MATH7',
      name: 'Mathematics 7',
      type: 'jhs_learning_area',
      weekly_hours: 2.5,
      description: null,
    })
    expect(Object.hasOwn(subjectPayload, 'is_active')).toBe(false)
  })
})
