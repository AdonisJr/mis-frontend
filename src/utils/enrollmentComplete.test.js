import { describe, it, expect } from 'vitest'
import {
  buildClosedCountText,
  buildCompleteConfirm,
  buildCompleteCountText,
  buildCompletePayload,
  createCompleteForm,
  findCompleteFormErrors,
  getCompleteCount,
} from '@/utils/enrollmentComplete.js'

const JHS_SECTION = { id: 1, name: 'Rizal', grade_level: { name: 'Grade 7', stage: 'jhs' }, program: null, enrolled_count: 1 }
const SHS_SECTION = {
  id: 2,
  name: 'A',
  grade_level: { name: 'Grade 11', stage: 'shs' },
  program: { code: 'STEM' },
  enrolled_count: 12,
}
const COLLEGE_SECTION = { id: 3, name: 'B', grade_level: { name: 'Year 1', stage: 'college' }, program: null, enrolled_count: 4 }

describe('createCompleteForm', () => {
  it('turns ids into select strings', () => {
    expect(createCompleteForm(7, '')).toEqual({ section_id: '7', term_id: '' })
  })
})

describe('findCompleteFormErrors', () => {
  it('requires a section', () => {
    expect(findCompleteFormErrors({ section_id: '', term_id: '' }, null).section_id).toEqual(['Section is required.'])
  })

  it('requires a term for SHS and college sections', () => {
    const formValues = { section_id: '2', term_id: '' }
    expect(findCompleteFormErrors(formValues, SHS_SECTION).term_id).toEqual([
      'Term is required for SHS and college sections.',
    ])
    expect(findCompleteFormErrors(formValues, COLLEGE_SECTION).term_id).toBeDefined()
  })

  it('accepts JHS without a term and SHS with one', () => {
    expect(findCompleteFormErrors({ section_id: '1', term_id: '' }, JHS_SECTION)).toEqual({})
    expect(findCompleteFormErrors({ section_id: '2', term_id: '4' }, SHS_SECTION)).toEqual({})
  })
})

describe('buildCompletePayload', () => {
  it('sends the term for SHS and nothing for JHS', () => {
    expect(buildCompletePayload({ section_id: '2', term_id: '4' }, SHS_SECTION)).toEqual({ term_id: 4 })
    expect(buildCompletePayload({ section_id: '1', term_id: '4' }, JHS_SECTION)).toEqual({})
  })
})

describe('getCompleteCount', () => {
  it('reads enrolled_count only when the term rule is met', () => {
    expect(getCompleteCount(SHS_SECTION, '4')).toBe(12)
    expect(getCompleteCount(SHS_SECTION, '')).toBeNull()
    expect(getCompleteCount(JHS_SECTION, '')).toBe(1)
    expect(getCompleteCount({ ...SHS_SECTION, enrolled_count: undefined }, '4')).toBeNull()
  })
})

describe('buildCompleteCountText', () => {
  it('words the count', () => {
    expect(buildCompleteCountText(null)).toBe('')
    expect(buildCompleteCountText(0)).toBe('No enrolled records to close.')
    expect(buildCompleteCountText(1)).toBe('1 enrolled record will be closed.')
    expect(buildCompleteCountText(12)).toBe('12 enrolled records will be closed.')
  })
})

describe('buildCompleteConfirm', () => {
  it('names the term for SHS, the whole year for JHS, and the singular record', () => {
    const shsConfirm = buildCompleteConfirm(SHS_SECTION, { label: 'Term 1' })
    expect(shsConfirm.title).toBe('Complete section')
    expect(shsConfirm.confirmLabel).toBe('Complete')
    expect(shsConfirm.message).toBe(
      'Close 12 enrolled records of Grade 11 · A (STEM) for the Term 1 as completed? Closed records cannot be changed.',
    )
    expect(buildCompleteConfirm(JHS_SECTION, null).message).toBe(
      'Close 1 enrolled record of Grade 7 · Rizal for the whole school year as completed? Closed records cannot be changed.',
    )
    expect(buildCompleteConfirm(null, null)).toBeNull()
  })
})

describe('buildClosedCountText', () => {
  it('words the closed count', () => {
    expect(buildClosedCountText({ completed_count: 1 })).toBe('Closed 1 enrollment record.')
    expect(buildClosedCountText({ completed_count: 3 })).toBe('Closed 3 enrollment records.')
    expect(buildClosedCountText({})).toBe('Closed 0 enrollment records.')
  })
})
