import { describe, it, expect } from 'vitest'
import {
  applyFeeScheduleGradeLevelChange,
  applyFeeScheduleProgramChange,
  applyFeeScheduleSchoolYearChange,
  buildFeeScheduleListParams,
  clearUnfitScheduleProgramFilter,
  createFeeScheduleFilters,
  listScheduleFilterPrograms,
} from '@/utils/feeScheduleSearch.js'

const programs = [
  { id: 7, stage: 'shs', is_active: true },
  { id: 8, stage: 'shs', is_active: false },
  { id: 9, stage: 'college', is_active: true },
]

describe('createFeeScheduleFilters', () => {
  it('starts with no year, grade level or program and page 1', () => {
    expect(createFeeScheduleFilters()).toEqual({ schoolYearId: '', gradeLevelId: '', programId: '', page: 1 })
  })
})

describe('buildFeeScheduleListParams', () => {
  it('returns null without a valid school year', () => {
    expect(buildFeeScheduleListParams(createFeeScheduleFilters())).toBeNull()
    expect(buildFeeScheduleListParams({ ...createFeeScheduleFilters(), schoolYearId: 'abc' })).toBeNull()
  })

  it('builds the minimal params from a year text', () => {
    expect(buildFeeScheduleListParams({ ...createFeeScheduleFilters(), schoolYearId: '5' })).toEqual({
      school_year_id: 5,
      page: 1,
    })
  })

  it('sends the grade level and program as numbers', () => {
    const feeScheduleFilters = { schoolYearId: '5', gradeLevelId: '3', programId: '7', page: 2 }
    expect(buildFeeScheduleListParams(feeScheduleFilters)).toEqual({
      school_year_id: 5,
      grade_level_id: 3,
      program_id: 7,
      page: 2,
    })
  })

  it('sends program_id none for default-only, drops junk and falls back to page 1', () => {
    const baseFilters = { ...createFeeScheduleFilters(), schoolYearId: '5' }
    expect(buildFeeScheduleListParams({ ...baseFilters, programId: 'default' }).program_id).toBe('none')
    expect(buildFeeScheduleListParams({ ...baseFilters, programId: 'junk' })).toEqual({ school_year_id: 5, page: 1 })
    expect(buildFeeScheduleListParams({ ...baseFilters, page: -3 }).page).toBe(1)
  })
})

describe('filter changes', () => {
  it('changes the year and grade level, resets to page 1, keeps the rest and does not mutate', () => {
    const feeScheduleFilters = { schoolYearId: '1', gradeLevelId: '2', programId: '7', page: 4 }
    expect(applyFeeScheduleSchoolYearChange(feeScheduleFilters, '9')).toEqual({
      schoolYearId: '9',
      gradeLevelId: '2',
      programId: '7',
      page: 1,
    })
    expect(applyFeeScheduleGradeLevelChange(feeScheduleFilters, 3)).toEqual({
      schoolYearId: '1',
      gradeLevelId: '3',
      programId: '7',
      page: 1,
    })
    expect(feeScheduleFilters.page).toBe(4)
  })

  it('changes the program to empty, default, an id or junk', () => {
    const feeScheduleFilters = { ...createFeeScheduleFilters(), page: 3 }
    expect(applyFeeScheduleProgramChange(feeScheduleFilters, '').programId).toBe('')
    expect(applyFeeScheduleProgramChange(feeScheduleFilters, 'default')).toMatchObject({ programId: 'default', page: 1 })
    expect(applyFeeScheduleProgramChange(feeScheduleFilters, '7').programId).toBe('7')
    expect(applyFeeScheduleProgramChange(feeScheduleFilters, 'junk').programId).toBe('')
  })
})

describe('program filter options', () => {
  it('lists no programs for JHS and every SHS program otherwise', () => {
    expect(listScheduleFilterPrograms(programs, { stage: 'jhs' })).toEqual([])
    expect(listScheduleFilterPrograms(programs, { stage: 'shs' }).map((program) => program.id)).toEqual([7, 8])
    expect(listScheduleFilterPrograms(programs, null).map((program) => program.id)).toEqual([7, 8])
  })

  it('keeps an empty, default or listed program filter and clears an unlisted one', () => {
    const shsPrograms = listScheduleFilterPrograms(programs, null)
    const baseFilters = { ...createFeeScheduleFilters(), page: 3 }
    expect(clearUnfitScheduleProgramFilter({ ...baseFilters, programId: '' }, shsPrograms).page).toBe(3)
    expect(clearUnfitScheduleProgramFilter({ ...baseFilters, programId: 'default' }, []).programId).toBe('default')
    expect(clearUnfitScheduleProgramFilter({ ...baseFilters, programId: '7' }, shsPrograms).programId).toBe('7')
    expect(clearUnfitScheduleProgramFilter({ ...baseFilters, programId: '9' }, shsPrograms)).toMatchObject({
      programId: '',
      page: 1,
    })
  })
})
