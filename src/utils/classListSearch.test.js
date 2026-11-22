import { describe, it, expect } from 'vitest'
import {
  applyClassListSchoolYearChange,
  applyClassListTeacherChange,
  applyClassListTermChange,
  buildClassListParams,
  buildClassListQuery,
  createClassListFilters,
  pickDefaultTermNumber,
  readClassListQuery,
} from '@/utils/classListSearch.js'

const SEMESTER_YEAR = { id: 7, term_type: 'semester' }
const TRIMESTER_YEAR = { id: 8, term_type: 'trimester' }

describe('createClassListFilters', () => {
  it('(1) starts with blank strings', () => {
    expect(createClassListFilters()).toEqual({ schoolYearId: '', termNumber: '', teacherId: '' })
  })
})

describe('pickDefaultTermNumber', () => {
  it('(2) follows the active term of the year, else the first term, else blank', () => {
    expect(pickDefaultTermNumber(SEMESTER_YEAR, { school_year_id: 7, term_number: 2 })).toBe('2')
    expect(pickDefaultTermNumber(SEMESTER_YEAR, { school_year_id: 9, term_number: 2 })).toBe('1')
    expect(pickDefaultTermNumber(TRIMESTER_YEAR, { school_year_id: 8, term_number: 3 })).toBe('3')
    expect(pickDefaultTermNumber({ id: 7, term_type: null }, null)).toBe('')
    expect(pickDefaultTermNumber('x', null)).toBe('')
  })
})

describe('applyClassListSchoolYearChange', () => {
  it('(3) stores the year id and the first term, keeping the teacher', () => {
    const changedFilters = applyClassListSchoolYearChange({ schoolYearId: '1', termNumber: '2', teacherId: '12' }, SEMESTER_YEAR)
    expect(changedFilters).toEqual({ schoolYearId: '7', termNumber: '1', teacherId: '12' })
    expect(applyClassListSchoolYearChange({ schoolYearId: '1', termNumber: '2', teacherId: '' }, 'x')).toEqual({
      schoolYearId: '',
      termNumber: '',
      teacherId: '',
    })
  })
})

describe('term and teacher changes', () => {
  it('(4) store id text and blank out junk', () => {
    const startFilters = createClassListFilters()
    expect(applyClassListTermChange(startFilters, 2).termNumber).toBe('2')
    expect(applyClassListTermChange(startFilters, 'junk').termNumber).toBe('')
    expect(applyClassListTeacherChange(startFilters, '12').teacherId).toBe('12')
    expect(applyClassListTeacherChange(startFilters, null).teacherId).toBe('')
  })
})

describe('buildClassListParams for a teacher-only user', () => {
  it('(5) never sends teacher_id', () => {
    const classListFilters = { schoolYearId: '7', termNumber: '2', teacherId: '99' }
    expect(buildClassListParams(classListFilters, false)).toEqual({ school_year_id: 7, term_number: 2 })
  })
})

describe('buildClassListParams when the teacher can be picked', () => {
  it('(6) needs a teacher and then sends teacher_id', () => {
    expect(buildClassListParams({ schoolYearId: '7', termNumber: '1', teacherId: '' }, true)).toBeNull()
    expect(buildClassListParams({ schoolYearId: '7', termNumber: '1', teacherId: '12' }, true)).toEqual({
      school_year_id: 7,
      term_number: 1,
      teacher_id: 12,
    })
  })
})

describe('buildClassListParams without a year or term', () => {
  it('(7) returns null without a year and omits a blank term', () => {
    expect(buildClassListParams({ schoolYearId: '', termNumber: '1', teacherId: '' }, false)).toBeNull()
    expect(buildClassListParams({ schoolYearId: '7', termNumber: '', teacherId: '' }, false)).toEqual({ school_year_id: 7 })
  })
})

describe('readClassListQuery', () => {
  it('(8) reads strings and drops junk or arrays', () => {
    const queryFilters = readClassListQuery({ school_year_id: '7', term_number: '2', teacher_id: 'x' })
    expect(queryFilters).toEqual({ schoolYearId: '7', termNumber: '2', teacherId: '' })
    expect(readClassListQuery({ school_year_id: ['7'] }).schoolYearId).toBe('')
  })
})

describe('buildClassListQuery', () => {
  it('(9) omits blank keys', () => {
    expect(buildClassListQuery({ schoolYearId: '7', termNumber: '', teacherId: '12' })).toEqual({
      school_year_id: '7',
      teacher_id: '12',
    })
  })
})
