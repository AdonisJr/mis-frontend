import { describe, it, expect } from 'vitest'
import {
  PROGRAM_STAGE_LABELS,
  buildProgramDeactivateMessage,
  buildProgramDeleteMessage,
  buildProgramReactivateMessage,
  getStageLabel,
} from '@/utils/programDisplay.js'

const SAMPLE_PROGRAM = { code: 'BSIT', name: 'Bachelor of Science in Information Technology' }

describe('PROGRAM_STAGE_LABELS', () => {
  it('maps jhs, shs and college to JHS, SHS and College', () => {
    expect(PROGRAM_STAGE_LABELS).toEqual({ jhs: 'JHS', shs: 'SHS', college: 'College' })
  })
})

describe('getStageLabel', () => {
  it('returns the label for a known stage', () => {
    expect(getStageLabel('shs')).toBe('SHS')
    expect(getStageLabel('college')).toBe('College')
    expect(getStageLabel('jhs')).toBe('JHS')
  })

  it('returns the raw value for an unknown stage and an empty string for a missing one', () => {
    expect(getStageLabel('elementary')).toBe('elementary')
    expect(getStageLabel('toString')).toBe('toString')
    expect(getStageLabel('')).toBe('')
    expect(getStageLabel(null)).toBe('')
    expect(getStageLabel(undefined)).toBe('')
    expect(getStageLabel(3)).toBe('')
  })
})

describe('buildProgramDeactivateMessage', () => {
  it('names the code and program and says it stays listed', () => {
    expect(buildProgramDeactivateMessage(SAMPLE_PROGRAM)).toBe(
      'Deactivate BSIT (Bachelor of Science in Information Technology)? It stays in the list and can be reactivated later.',
    )
  })
})

describe('buildProgramReactivateMessage', () => {
  it('names the code and program and says it becomes active', () => {
    expect(buildProgramReactivateMessage(SAMPLE_PROGRAM)).toBe(
      'Reactivate BSIT (Bachelor of Science in Information Technology)? It becomes active again.',
    )
  })
})

describe('buildProgramDeleteMessage', () => {
  it('names the code and program and warns it cannot be undone', () => {
    expect(buildProgramDeleteMessage(SAMPLE_PROGRAM)).toBe(
      'Delete BSIT (Bachelor of Science in Information Technology)? This cannot be undone.',
    )
  })

  it('returns an empty string for a missing program', () => {
    expect(buildProgramDeleteMessage(null)).toBe('')
    expect(buildProgramDeleteMessage(undefined)).toBe('')
    expect(buildProgramDeactivateMessage(null)).toBe('')
    expect(buildProgramReactivateMessage(null)).toBe('')
  })
})
