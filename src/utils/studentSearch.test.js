import { describe, it, expect } from 'vitest'
import {
  FIRST_PAGE,
  applyGradeLevelChange,
  applyPageChange,
  applySearchChange,
  buildStudentListParams,
  createStudentFilters,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

describe('createStudentFilters', () => {
  it('starts with an empty search, all grade levels and page 1', () => {
    expect(createStudentFilters()).toEqual({ search: '', gradeLevelId: '', page: 1 })
  })
})

describe('normalizeSearchText', () => {
  it('trims and collapses inner whitespace', () => {
    expect(normalizeSearchText('  Dela   Cruz \t ')).toBe('Dela Cruz')
  })

  it('returns an empty string for non-string input', () => {
    expect(normalizeSearchText(null)).toBe('')
    expect(normalizeSearchText(undefined)).toBe('')
    expect(normalizeSearchText(42)).toBe('')
    expect(normalizeSearchText(['Reyes'])).toBe('')
  })
})

describe('buildStudentListParams', () => {
  it('returns only page 1 for empty filters', () => {
    expect(buildStudentListParams(createStudentFilters())).toEqual({ page: 1 })
  })

  it('includes the normalized search and grade_level_id as a number when set', () => {
    const studentFilters = { search: '  Dela   Cruz ', gradeLevelId: '10', page: 2 }
    expect(buildStudentListParams(studentFilters)).toEqual({ page: 2, search: 'Dela Cruz', grade_level_id: 10 })
  })

  it('drops a whitespace-only search and an empty grade level', () => {
    expect(buildStudentListParams({ search: '   ', gradeLevelId: '', page: 1 })).toEqual({ page: 1 })
  })

  it('never includes a section param', () => {
    const studentListParams = buildStudentListParams({ search: 'Reyes', gradeLevelId: '7', page: 1, section: 'Rizal' })
    expect(studentListParams).not.toHaveProperty('section')
  })

  it('drops a grade level that is not an id', () => {
    expect(buildStudentListParams({ search: '', gradeLevelId: 'Grade 10', page: 1 })).toEqual({ page: 1 })
  })

  it('falls back to page 1 for a non-positive or non-integer page', () => {
    expect(buildStudentListParams({ search: '', gradeLevelId: '', page: 0 }).page).toBe(FIRST_PAGE)
    expect(buildStudentListParams({ search: '', gradeLevelId: '', page: -3 }).page).toBe(FIRST_PAGE)
    expect(buildStudentListParams({ search: '', gradeLevelId: '', page: 1.5 }).page).toBe(FIRST_PAGE)
    expect(buildStudentListParams({ search: '', gradeLevelId: '', page: '2' }).page).toBe(FIRST_PAGE)
  })
})

describe('applySearchChange', () => {
  it('stores the normalized search and resets to page 1 without mutating the input', () => {
    const studentFilters = { search: 'old', gradeLevelId: '8', page: 4 }
    const nextFilters = applySearchChange(studentFilters, '  Reyes  Miguel ')
    expect(nextFilters).toEqual({ search: 'Reyes Miguel', gradeLevelId: '8', page: 1 })
    expect(studentFilters).toEqual({ search: 'old', gradeLevelId: '8', page: 4 })
    expect(nextFilters).not.toBe(studentFilters)
  })
})

describe('applyGradeLevelChange', () => {
  it('sets the grade level and resets to page 1', () => {
    const studentFilters = { search: 'Reyes', gradeLevelId: '', page: 3 }
    expect(applyGradeLevelChange(studentFilters, '10')).toEqual({ search: 'Reyes', gradeLevelId: '10', page: 1 })
    expect(applyGradeLevelChange(studentFilters, null)).toEqual({ search: 'Reyes', gradeLevelId: '', page: 1 })
    expect(studentFilters.page).toBe(3)
  })
})

describe('applyPageChange', () => {
  it('moves to the requested page', () => {
    const studentFilters = { search: 'Reyes', gradeLevelId: '10', page: 1 }
    expect(applyPageChange(studentFilters, 3)).toEqual({ search: 'Reyes', gradeLevelId: '10', page: 3 })
    expect(studentFilters.page).toBe(1)
  })

  it('returns the same filters for an invalid page', () => {
    const studentFilters = { search: '', gradeLevelId: '', page: 2 }
    expect(applyPageChange(studentFilters, 0)).toBe(studentFilters)
    expect(applyPageChange(studentFilters, -1)).toBe(studentFilters)
    expect(applyPageChange(studentFilters, 2.5)).toBe(studentFilters)
    expect(applyPageChange(studentFilters, '3')).toBe(studentFilters)
  })
})

describe('isPageBeyondLast', () => {
  it('is true when current_page is past last_page', () => {
    expect(isPageBeyondLast({ current_page: 3, last_page: 2, per_page: 15, total: 16 })).toBe(true)
  })

  it('is false on a valid page or a missing meta', () => {
    expect(isPageBeyondLast({ current_page: 2, last_page: 2, per_page: 15, total: 16 })).toBe(false)
    expect(isPageBeyondLast({ current_page: 1, last_page: 1, per_page: 15, total: 0 })).toBe(false)
    expect(isPageBeyondLast(undefined)).toBe(false)
    expect(isPageBeyondLast(null)).toBe(false)
    expect(isPageBeyondLast({ current_page: '3', last_page: 2 })).toBe(false)
  })
})
