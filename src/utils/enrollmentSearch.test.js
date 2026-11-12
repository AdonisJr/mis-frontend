import { describe, it, expect } from 'vitest'
import {
  applyEnrollmentGradeLevelChange,
  applyEnrollmentSchoolYearChange,
  applyEnrollmentSectionChange,
  applyEnrollmentStatusChange,
  applyEnrollmentTermChange,
  buildEnrollmentListParams,
  clearUnfitSectionFilter,
  createEnrollmentFilters,
  listGradeLevelSections,
  pickDefaultTermId,
} from '@/utils/enrollmentSearch.js'

const FILLED_FILTERS = Object.freeze({
  schoolYearId: '4',
  termId: '2',
  sectionId: '8',
  gradeLevelId: '7',
  status: 'dropped',
  search: ' Dela   Cruz ',
  page: 3,
})

function buildFiltersFor(schoolYearId) {
  return { ...createEnrollmentFilters(), schoolYearId }
}

describe('createEnrollmentFilters', () => {
  it('starts with no school year, all options, an empty search and page 1', () => {
    expect(createEnrollmentFilters()).toEqual({
      schoolYearId: '',
      termId: '',
      sectionId: '',
      gradeLevelId: '',
      status: '',
      search: '',
      page: 1,
    })
  })
})

describe('buildEnrollmentListParams', () => {
  it('returns null without a valid school year so no request is sent', () => {
    for (const schoolYearId of ['', 'abc']) {
      expect(buildEnrollmentListParams(buildFiltersFor(schoolYearId))).toBeNull()
    }
  })

  it('sends only the school year and the page from a minimal filter set', () => {
    expect(buildEnrollmentListParams(buildFiltersFor('5'))).toEqual({ school_year_id: 5, page: 1 })
  })

  it('sends every chosen id as a number plus the status and the normalized search', () => {
    expect(buildEnrollmentListParams(FILLED_FILTERS)).toEqual({
      school_year_id: 4,
      page: 3,
      term_id: 2,
      section_id: 8,
      grade_level_id: 7,
      status: 'dropped',
      search: 'Dela Cruz',
    })
  })

  it('drops an unknown status and empty optional filters', () => {
    const listParams = buildEnrollmentListParams({ ...buildFiltersFor('4'), status: 'archived', termId: 'x' })
    for (const paramName of ['status', 'term_id', 'section_id', 'grade_level_id', 'search']) {
      expect(listParams).not.toHaveProperty(paramName)
    }
  })

  it('falls back to page 1 for an invalid page', () => {
    expect(buildEnrollmentListParams({ ...buildFiltersFor('4'), page: 0 }).page).toBe(1)
    expect(buildEnrollmentListParams({ ...buildFiltersFor('4'), page: '2' }).page).toBe(1)
  })
})

describe('applyEnrollmentSchoolYearChange', () => {
  it('clears the term and section of the old year, resets to page 1 and does not mutate the input', () => {
    const nextFilters = applyEnrollmentSchoolYearChange(FILLED_FILTERS, '6')
    expect(nextFilters).toMatchObject({ schoolYearId: '6', termId: '', sectionId: '', gradeLevelId: '7', page: 1 })
    expect(FILLED_FILTERS.schoolYearId).toBe('4')
    expect(FILLED_FILTERS.termId).toBe('2')
  })
})

describe('term, section and grade level changes', () => {
  it('store the id as text, reset to page 1 and keep an empty choice empty', () => {
    expect(applyEnrollmentTermChange(FILLED_FILTERS, '7')).toMatchObject({ termId: '7', page: 1 })
    expect(applyEnrollmentSectionChange(FILLED_FILTERS, '7')).toMatchObject({ sectionId: '7', page: 1 })
    expect(applyEnrollmentGradeLevelChange(FILLED_FILTERS, '7')).toMatchObject({ gradeLevelId: '7', page: 1 })

    expect(applyEnrollmentTermChange(FILLED_FILTERS, '').termId).toBe('')
    expect(applyEnrollmentSectionChange(FILLED_FILTERS, '').sectionId).toBe('')
    expect(applyEnrollmentGradeLevelChange(FILLED_FILTERS, '').gradeLevelId).toBe('')
  })
})

describe('applyEnrollmentStatusChange', () => {
  it('keeps a listed status, empties an unknown one and resets to page 1', () => {
    expect(applyEnrollmentStatusChange(FILLED_FILTERS, 'moved')).toMatchObject({ status: 'moved', page: 1 })
    expect(applyEnrollmentStatusChange(FILLED_FILTERS, 'archived').status).toBe('')
  })
})

describe('clearUnfitSectionFilter', () => {
  const sectionOptions = [{ id: 8 }, { id: 9 }]

  it('keeps a section that is still offered, and clears one that is not', () => {
    expect(clearUnfitSectionFilter(FILLED_FILTERS, sectionOptions)).toBe(FILLED_FILTERS)
    expect(clearUnfitSectionFilter(FILLED_FILTERS, [{ id: 9 }])).toMatchObject({ sectionId: '', page: 1 })
  })
})

describe('listGradeLevelSections', () => {
  const sections = [
    { id: 1, grade_level_id: 7 },
    { id: 2, grade_level_id: 8 },
  ]

  it('narrows to the grade level or returns all for an empty choice', () => {
    expect(listGradeLevelSections(sections, '8')).toEqual([{ id: 2, grade_level_id: 8 }])
    expect(listGradeLevelSections(sections, '')).toEqual(sections)
  })
})

describe('pickDefaultTermId', () => {
  const terms = [{ id: 2 }, { id: 3 }]

  it('picks the active term when listed, else falls back to all terms', () => {
    expect(pickDefaultTermId(terms, { id: 3 })).toBe('3')
    expect(pickDefaultTermId(terms, { id: 9 })).toBe('')
    expect(pickDefaultTermId(terms, null)).toBe('')
    expect(pickDefaultTermId([], { id: 3 })).toBe('')
  })
})
