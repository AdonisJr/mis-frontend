import { describe, it, expect } from 'vitest'
import {
  applySectionGradeLevelChange,
  applySectionProgramChange,
  applySectionSchoolYearChange,
  buildSectionListParams,
  clearUnfitProgramFilter,
  createSectionFilters,
  pickDefaultSchoolYearId,
} from '@/utils/sectionSearch.js'
import { applySearchChange } from '@/utils/studentSearch.js'

const FILLED_FILTERS = Object.freeze({ schoolYearId: '4', gradeLevelId: '5', programId: '1', search: 'A', page: 3 })

function buildFiltersFor(schoolYearId) {
  return { ...createSectionFilters(), schoolYearId }
}

describe('createSectionFilters', () => {
  it('starts without a school year, with all grade levels and programs, an empty search and page 1', () => {
    expect(createSectionFilters()).toEqual({ schoolYearId: '', gradeLevelId: '', programId: '', search: '', page: 1 })
  })
})

describe('buildSectionListParams', () => {
  it('always sends the school year as a number and the page', () => {
    expect(buildSectionListParams(buildFiltersFor('4'))).toEqual({ school_year_id: 4, page: 1 })
  })

  it('returns null without a valid school year so no request is sent', () => {
    for (const schoolYearId of ['', '0', 'abc']) {
      expect(buildSectionListParams(buildFiltersFor(schoolYearId))).toBeNull()
    }
  })

  it('adds the grade level and program as numbers when chosen', () => {
    const chosenFilters = { ...buildFiltersFor('4'), gradeLevelId: '5', programId: '1', page: 2 }
    expect(buildSectionListParams(chosenFilters)).toEqual({ school_year_id: 4, page: 2, grade_level_id: 5, program_id: 1 })
  })

  it('drops empty or invalid optional filters', () => {
    const listParams = buildSectionListParams({ ...buildFiltersFor('4'), gradeLevelId: '', programId: 'x' })
    expect(listParams).not.toHaveProperty('grade_level_id')
    expect(listParams).not.toHaveProperty('program_id')
  })

  it('trims and collapses the search and drops a blank one', () => {
    expect(buildSectionListParams({ ...buildFiltersFor('4'), search: '  STEM   11 ' }).search).toBe('STEM 11')
    expect(buildSectionListParams({ ...buildFiltersFor('4'), search: '   ' })).not.toHaveProperty('search')
  })

  it('falls back to page 1 for an invalid page', () => {
    expect(buildSectionListParams({ ...buildFiltersFor('4'), page: 0 }).page).toBe(1)
    expect(buildSectionListParams({ ...buildFiltersFor('4'), page: '2' }).page).toBe(1)
  })
})

describe('applySectionSchoolYearChange', () => {
  it('stores the selected year as a string, keeps the other filters and resets to page 1', () => {
    expect(applySectionSchoolYearChange(FILLED_FILTERS, '6')).toEqual({
      schoolYearId: '6',
      gradeLevelId: '5',
      programId: '1',
      search: 'A',
      page: 1,
    })
  })
})

describe('applySectionGradeLevelChange', () => {
  it('stores the selected grade level, empty for All, and resets to page 1', () => {
    const chosenFilters = applySectionGradeLevelChange(FILLED_FILTERS, '7')
    expect(chosenFilters.gradeLevelId).toBe('7')
    expect(chosenFilters.page).toBe(1)
    const allFilters = applySectionGradeLevelChange(FILLED_FILTERS, '')
    expect(allFilters.gradeLevelId).toBe('')
    expect(allFilters.page).toBe(1)
  })
})

describe('applySectionProgramChange', () => {
  it('stores the selected program, empty for All, and resets to page 1', () => {
    const chosenFilters = applySectionProgramChange(FILLED_FILTERS, '2')
    expect(chosenFilters.programId).toBe('2')
    expect(chosenFilters.page).toBe(1)
    const allFilters = applySectionProgramChange(FILLED_FILTERS, '')
    expect(allFilters.programId).toBe('')
    expect(allFilters.page).toBe(1)
  })
})

describe('applySearchChange', () => {
  it('keeps the section filters and resets to page 1', () => {
    const searchedFilters = applySearchChange({ ...createSectionFilters(), schoolYearId: '4', page: 3 }, ' Rizal ')
    expect(searchedFilters.schoolYearId).toBe('4')
    expect(searchedFilters.search).toBe('Rizal')
    expect(searchedFilters.page).toBe(1)
  })
})

describe('clearUnfitProgramFilter', () => {
  it('clears a program that is not among the options and keeps one that is', () => {
    const programFilters = { ...FILLED_FILTERS, programId: '1' }
    const clearedFilters = clearUnfitProgramFilter(programFilters, [{ id: 3 }])
    expect(clearedFilters.programId).toBe('')
    expect(clearedFilters.page).toBe(1)
    expect(clearUnfitProgramFilter(programFilters, [{ id: 1 }])).toBe(programFilters)
    const allProgramsFilters = { ...FILLED_FILTERS, programId: '' }
    expect(clearUnfitProgramFilter(allProgramsFilters, [{ id: 3 }])).toBe(allProgramsFilters)
  })
})

describe('pickDefaultSchoolYearId', () => {
  it('picks the active school year', () => {
    expect(pickDefaultSchoolYearId([{ id: 8 }, { id: 4 }], { id: 4 })).toBe('4')
  })

  it('falls back to the newest school year when none is active or the active one is not listed', () => {
    expect(pickDefaultSchoolYearId([{ id: 8 }, { id: 4 }], null)).toBe('8')
    expect(pickDefaultSchoolYearId([{ id: 8 }, { id: 4 }], { id: 99 })).toBe('8')
  })

  it('returns an empty string when there are no school years', () => {
    expect(pickDefaultSchoolYearId([], { id: 4 })).toBe('')
    expect(pickDefaultSchoolYearId(null, null)).toBe('')
  })
})
