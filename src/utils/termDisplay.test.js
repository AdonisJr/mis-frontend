import { describe, it, expect } from 'vitest'
import {
  TERM_TYPE_OPTIONS,
  buildActiveTermBadgeLabel,
  buildTermActivateMessage,
  buildTermDeleteMessage,
  buildTermLabel,
  buildTermShortLabel,
} from '@/utils/termDisplay.js'

const SCHOOL_YEAR = Object.freeze({ id: 7, name: 'SY 2030–2031', term_type: 'semester' })
const SECOND_TERM = Object.freeze({ id: 2, school_year_id: 7, term_number: 2, label: '2nd Semester' })

describe('TERM_TYPE_OPTIONS', () => {
  it('offers semester and trimester with Semester and Trimester labels', () => {
    expect(TERM_TYPE_OPTIONS).toEqual([
      { value: 'semester', label: 'Semester' },
      { value: 'trimester', label: 'Trimester' },
    ])
  })
})

describe('buildTermLabel', () => {
  it('builds 1st Semester and 2nd Semester for a semester year', () => {
    expect(buildTermLabel('semester', 1)).toBe('1st Semester')
    expect(buildTermLabel('semester', 2)).toBe('2nd Semester')
  })

  it('builds 1st Trimester, 2nd Trimester and 3rd Trimester for a trimester year', () => {
    expect(buildTermLabel('trimester', 1)).toBe('1st Trimester')
    expect(buildTermLabel('trimester', 2)).toBe('2nd Trimester')
    expect(buildTermLabel('trimester', 3)).toBe('3rd Trimester')
  })

  it('returns an empty string for a number outside the type or an unknown type', () => {
    expect(buildTermLabel('semester', 3)).toBe('')
    expect(buildTermLabel('trimester', 0)).toBe('')
    expect(buildTermLabel('trimester', 4)).toBe('')
    expect(buildTermLabel('quarter', 1)).toBe('')
    expect(buildTermLabel('semester', '1')).toBe('')
  })
})

describe('buildTermShortLabel', () => {
  it('builds 1st Sem, 2nd Sem, 1st Tri, 2nd Tri and 3rd Tri', () => {
    expect(buildTermShortLabel('semester', 1)).toBe('1st Sem')
    expect(buildTermShortLabel('semester', 2)).toBe('2nd Sem')
    expect(buildTermShortLabel('trimester', 1)).toBe('1st Tri')
    expect(buildTermShortLabel('trimester', 2)).toBe('2nd Tri')
    expect(buildTermShortLabel('trimester', 3)).toBe('3rd Tri')
  })

  it('returns an empty string for an invalid type or number', () => {
    expect(buildTermShortLabel('quarter', 1)).toBe('')
    expect(buildTermShortLabel('semester', 3)).toBe('')
    expect(buildTermShortLabel(undefined, 1)).toBe('')
  })
})

describe('buildActiveTermBadgeLabel', () => {
  it('returns the short label when the term belongs to the active school year', () => {
    expect(buildActiveTermBadgeLabel({ id: 7, term_type: 'semester' }, { school_year_id: 7, term_number: 1 })).toBe(
      '1st Sem',
    )
    expect(buildActiveTermBadgeLabel({ id: 8, term_type: 'trimester' }, { school_year_id: 8, term_number: 2 })).toBe(
      '2nd Tri',
    )
  })

  it('returns an empty string without a term, without a school year, or for a term of another school year', () => {
    expect(buildActiveTermBadgeLabel(SCHOOL_YEAR, null)).toBe('')
    expect(buildActiveTermBadgeLabel(null, SECOND_TERM)).toBe('')
    expect(buildActiveTermBadgeLabel(SCHOOL_YEAR, { school_year_id: 9, term_number: 1 })).toBe('')
  })
})

describe('buildTermDeleteMessage', () => {
  it('names the term and school year and warns it cannot be undone', () => {
    expect(buildTermDeleteMessage(SECOND_TERM, SCHOOL_YEAR)).toBe(
      'Delete the 2nd Semester of SY 2030–2031? This cannot be undone.',
    )
  })
})

describe('buildTermActivateMessage', () => {
  it('names the term and school year and says it replaces the active term', () => {
    expect(buildTermActivateMessage(SECOND_TERM, SCHOOL_YEAR)).toBe(
      'Set the 2nd Semester of SY 2030–2031 as the active term? It replaces the current active term.',
    )
  })
})

describe('dialog messages', () => {
  it('return an empty string for a missing term or school year', () => {
    expect(buildTermDeleteMessage(null, SCHOOL_YEAR)).toBe('')
    expect(buildTermDeleteMessage(SECOND_TERM, null)).toBe('')
    expect(buildTermActivateMessage(null, SCHOOL_YEAR)).toBe('')
    expect(buildTermActivateMessage(SECOND_TERM, undefined)).toBe('')
  })
})
