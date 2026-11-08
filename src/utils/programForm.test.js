import { describe, it, expect } from 'vitest'
import {
  PROGRAM_FIELD_LABELS,
  PROGRAM_STAGE_OPTIONS,
  buildFormFromProgram,
  buildProgramPayload,
  createEmptyProgramForm,
  findProgramFormErrors,
} from '@/utils/programForm.js'

const COMPLETE_FORM = Object.freeze({
  code: 'BSED',
  name: 'Bachelor of Secondary Education',
  stage: 'college',
  description: 'Teacher education program',
})

describe('PROGRAM_STAGE_OPTIONS', () => {
  it('offers shs and college with SHS and College labels', () => {
    expect(PROGRAM_STAGE_OPTIONS).toEqual([
      { value: 'shs', label: 'SHS' },
      { value: 'college', label: 'College' },
    ])
  })
})

describe('PROGRAM_FIELD_LABELS', () => {
  it('labels code, name, stage and description', () => {
    expect(PROGRAM_FIELD_LABELS).toEqual({ code: 'Code', name: 'Name', stage: 'Stage', description: 'Description' })
  })
})

describe('createEmptyProgramForm', () => {
  it('returns empty code, name, stage and description', () => {
    expect(createEmptyProgramForm()).toEqual({ code: '', name: '', stage: '', description: '' })
  })
})

describe('buildFormFromProgram', () => {
  it('copies code, name, stage and description', () => {
    const program = { id: 4, ...COMPLETE_FORM, is_active: true }
    expect(buildFormFromProgram(program)).toEqual(COMPLETE_FORM)
  })

  it('turns a null description into an empty string and never copies id, is_active or timestamps', () => {
    const program = {
      id: 7,
      code: 'STEM',
      name: 'Science, Technology, Engineering and Mathematics',
      stage: 'shs',
      description: null,
      is_active: false,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-02T00:00:00.000000Z',
    }
    const programForm = buildFormFromProgram(program)
    expect(programForm).toEqual({
      code: 'STEM',
      name: 'Science, Technology, Engineering and Mathematics',
      stage: 'shs',
      description: '',
    })
    expect(Object.keys(programForm)).toEqual(['code', 'name', 'stage', 'description'])
  })

  it('returns an empty form for a missing program', () => {
    expect(buildFormFromProgram(null)).toEqual(createEmptyProgramForm())
    expect(buildFormFromProgram(undefined)).toEqual(createEmptyProgramForm())
    expect(buildFormFromProgram('BSIT')).toEqual(createEmptyProgramForm())
  })
})

describe('findProgramFormErrors', () => {
  it('returns no errors for a complete form', () => {
    expect(findProgramFormErrors(COMPLETE_FORM)).toEqual({})
  })

  it('flags code, name and stage on an empty form', () => {
    expect(findProgramFormErrors(createEmptyProgramForm())).toEqual({
      code: ['Code is required.'],
      name: ['Name is required.'],
      stage: ['Stage is required.'],
    })
  })

  it('treats whitespace-only code and name as missing', () => {
    expect(findProgramFormErrors({ ...COMPLETE_FORM, code: '   ', name: '\t ' })).toEqual({
      code: ['Code is required.'],
      name: ['Name is required.'],
    })
  })

  it('rejects jhs and unknown stages', () => {
    const stageError = { stage: ['Stage is required.'] }
    expect(findProgramFormErrors({ ...COMPLETE_FORM, stage: 'jhs' })).toEqual(stageError)
    expect(findProgramFormErrors({ ...COMPLETE_FORM, stage: 'SHS' })).toEqual(stageError)
    expect(findProgramFormErrors({ ...COMPLETE_FORM, stage: 'elementary' })).toEqual(stageError)
    expect(findProgramFormErrors({ ...COMPLETE_FORM, stage: null })).toEqual(stageError)
  })

  it('accepts a form with no description', () => {
    expect(findProgramFormErrors({ ...COMPLETE_FORM, description: '' })).toEqual({})
    expect(findProgramFormErrors({ code: 'GAS', name: 'General Academic Strand', stage: 'shs' })).toEqual({})
  })
})

describe('buildProgramPayload', () => {
  it('trims and upper-cases the code', () => {
    expect(buildProgramPayload({ ...COMPLETE_FORM, code: '  bsit ' }).code).toBe('BSIT')
  })

  it('trims name and description and sends a blank description as null', () => {
    const programPayload = buildProgramPayload({ ...COMPLETE_FORM, name: '  Bachelor of Arts ', description: '  Major in English  ' })
    expect(programPayload.name).toBe('Bachelor of Arts')
    expect(programPayload.description).toBe('Major in English')
    expect(buildProgramPayload({ ...COMPLETE_FORM, description: '   ' }).description).toBeNull()
    expect(buildProgramPayload({ ...COMPLETE_FORM, description: null }).description).toBeNull()
  })

  it('sends only code, name, stage and description, never is_active', () => {
    const programPayload = buildProgramPayload({ ...COMPLETE_FORM, id: 3, is_active: false })
    expect(Object.keys(programPayload)).toEqual(['code', 'name', 'stage', 'description'])
    expect(programPayload).toEqual({
      code: 'BSED',
      name: 'Bachelor of Secondary Education',
      stage: 'college',
      description: 'Teacher education program',
    })
  })
})
