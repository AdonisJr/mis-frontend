import { describe, it, expect } from 'vitest'
import { buildCurriculumGroupKey, findGroupTotalHours } from '@/utils/curriculumTotals.js'

const GROUP_TOTALS = [
  { grade_level_id: 4, program_id: null, term_number: null, entries_count: 7, weekly_hours_total: '28.50' },
  { grade_level_id: 5, program_id: 2, term_number: 1, entries_count: 8, weekly_hours_total: '30.00' },
]

describe('buildCurriculumGroupKey', () => {
  it('uses none for a missing program and term', () => {
    expect(buildCurriculumGroupKey({ grade_level_id: 4, program_id: null, term_number: null })).toBe('4:none:none')
    expect(buildCurriculumGroupKey({ grade_level_id: 5, program_id: 2, term_number: 1 })).toBe('5:2:1')
  })
})

describe('findGroupTotalHours', () => {
  it('formats the server total of the matching group', () => {
    expect(findGroupTotalHours(GROUP_TOTALS, { school_year_id: 1, grade_level_id: 4 })).toBe('28.5')
  })

  it('returns 0 for a group with another term or program', () => {
    expect(findGroupTotalHours(GROUP_TOTALS, { grade_level_id: 5, program_id: 2, term_number: 2 })).toBe('0')
    expect(findGroupTotalHours(GROUP_TOTALS, { grade_level_id: 5, program_id: 3, term_number: 1 })).toBe('0')
  })

  it('returns 0 for a non-array and drops trailing zeros', () => {
    expect(findGroupTotalHours(null, { grade_level_id: 4 })).toBe('0')
    expect(findGroupTotalHours(GROUP_TOTALS, { grade_level_id: 5, program_id: 2, term_number: 1 })).toBe('30')
  })
})
