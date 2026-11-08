import { describe, it, expect } from 'vitest'
import { applyStageChange, buildProgramListParams, createProgramFilters } from '@/utils/programSearch.js'

describe('createProgramFilters', () => {
  it('starts with an empty search, all stages, all statuses and page 1', () => {
    expect(createProgramFilters()).toEqual({ search: '', stage: '', status: '', page: 1 })
  })
})

describe('buildProgramListParams', () => {
  it('returns only page 1 for empty filters', () => {
    expect(buildProgramListParams(createProgramFilters())).toEqual({ page: 1 })
  })

  it('includes the normalized search when set', () => {
    const programFilters = { ...createProgramFilters(), search: '  Bachelor   of  ' }
    expect(buildProgramListParams(programFilters)).toEqual({ page: 1, search: 'Bachelor of' })
  })

  it('includes stage=shs or stage=college when a stage is chosen', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), stage: 'shs' })).toEqual({ page: 1, stage: 'shs' })
    expect(buildProgramListParams({ ...createProgramFilters(), stage: 'college' })).toEqual({
      page: 1,
      stage: 'college',
    })
  })

  it('drops the stage param for All stages', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), stage: '' })).toEqual({ page: 1 })
  })

  it('drops an unknown stage such as jhs', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), stage: 'jhs' })).toEqual({ page: 1 })
    expect(buildProgramListParams({ ...createProgramFilters(), stage: 'SHS' })).toEqual({ page: 1 })
    expect(buildProgramListParams({ ...createProgramFilters(), stage: ['shs'] })).toEqual({ page: 1 })
  })

  it('includes status=active or status=inactive when a status is chosen', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), status: 'active' })).toEqual({
      page: 1,
      status: 'active',
    })
    expect(buildProgramListParams({ ...createProgramFilters(), status: 'inactive' })).toEqual({
      page: 1,
      status: 'inactive',
    })
  })

  it('drops the status param for All statuses', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), status: '' })).toEqual({ page: 1 })
  })

  it('drops an unknown status', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), status: 'archived' })).toEqual({ page: 1 })
    expect(buildProgramListParams({ ...createProgramFilters(), status: true })).toEqual({ page: 1 })
  })

  it('combines page, search, stage and status', () => {
    const programFilters = { search: 'Bachelor of', stage: 'college', status: 'inactive', page: 2 }
    expect(buildProgramListParams(programFilters)).toEqual({
      page: 2,
      search: 'Bachelor of',
      stage: 'college',
      status: 'inactive',
    })
  })

  it('drops a whitespace-only search', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), search: ' \t  ' })).toEqual({ page: 1 })
  })

  it('falls back to page 1 for a non-positive or non-integer page', () => {
    expect(buildProgramListParams({ ...createProgramFilters(), page: 0 })).toEqual({ page: 1 })
    expect(buildProgramListParams({ ...createProgramFilters(), page: -2 })).toEqual({ page: 1 })
    expect(buildProgramListParams({ ...createProgramFilters(), page: 1.5 })).toEqual({ page: 1 })
    expect(buildProgramListParams({ ...createProgramFilters(), page: '2' })).toEqual({ page: 1 })
    expect(buildProgramListParams(null)).toEqual({ page: 1 })
  })
})

describe('applyStageChange', () => {
  it('sets the stage and resets to page 1 without mutating the input', () => {
    const programFilters = { search: 'BS', stage: '', status: 'active', page: 3 }
    const nextFilters = applyStageChange(programFilters, 'college')
    expect(nextFilters).toEqual({ search: 'BS', stage: 'college', status: 'active', page: 1 })
    expect(programFilters).toEqual({ search: 'BS', stage: '', status: 'active', page: 3 })
  })

  it('stores an empty stage for an unknown or non-string value', () => {
    expect(applyStageChange(createProgramFilters(), 'jhs').stage).toBe('')
    expect(applyStageChange(createProgramFilters(), null).stage).toBe('')
    expect(applyStageChange(createProgramFilters(), 7).stage).toBe('')
    expect(applyStageChange({ ...createProgramFilters(), stage: 'shs', page: 2 }, '')).toEqual({
      search: '',
      stage: '',
      status: '',
      page: 1,
    })
  })
})
