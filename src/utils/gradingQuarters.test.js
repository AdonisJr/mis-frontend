import { describe, it, expect } from 'vitest'
import {
  buildClassRecordQuery,
  buildQuarterOptions,
  listClassQuarters,
  pickQuarter,
  readClassRecordQuery,
} from '@/utils/gradingQuarters.js'

function buildHeader(termNumber, termType = 'semester') {
  return { term_number: termNumber, school_year: { id: 1, name: '2026-2027', term_type: termType } }
}

describe('listClassQuarters', () => {
  it('(1) gives all four quarters to a whole-year class', () => {
    expect(listClassQuarters(buildHeader(null))).toEqual([1, 2, 3, 4])
  })

  it('(2) splits the quarters by semester', () => {
    expect(listClassQuarters(buildHeader(1))).toEqual([1, 2])
    expect(listClassQuarters(buildHeader(2))).toEqual([3, 4])
  })

  it('(3) gives no quarters to a trimester class or a bad header', () => {
    expect(listClassQuarters(buildHeader(null, 'trimester'))).toEqual([])
    expect(listClassQuarters(buildHeader(2, 'trimester'))).toEqual([])
    expect(listClassQuarters(null)).toEqual([])
  })
})

describe('buildQuarterOptions', () => {
  it('(4) labels each quarter', () => {
    expect(buildQuarterOptions([1, 2])).toEqual([
      { value: '1', label: 'Quarter 1' },
      { value: '2', label: 'Quarter 2' },
    ])
  })
})

describe('pickQuarter', () => {
  it('(5) keeps a listed quarter, else falls back to the first', () => {
    expect(pickQuarter([3, 4], '4')).toBe('4')
    expect(pickQuarter([3, 4], '1')).toBe('3')
    expect(pickQuarter([3, 4], '')).toBe('3')
    expect(pickQuarter([], '1')).toBe('')
  })
})

describe('class record query', () => {
  it('(6) reads and builds the class list filters plus the quarter', () => {
    const routeQuery = { school_year_id: '9', term_number: '1', teacher_id: '4', quarter: '2' }
    const classRecordFilters = readClassRecordQuery(routeQuery)
    expect(classRecordFilters).toEqual({ schoolYearId: '9', termNumber: '1', teacherId: '4', quarter: '2' })
    expect(buildClassRecordQuery(classRecordFilters, '2')).toEqual(routeQuery)
    expect(buildClassRecordQuery(classRecordFilters, '')).toEqual({
      school_year_id: '9',
      term_number: '1',
      teacher_id: '4',
    })
  })
})
