import { describe, it, expect } from 'vitest'
import {
  SUBJECT_COLUMNS,
  SUBJECT_TYPES,
  SUBJECT_TYPE_STAGES,
  buildSubjectDeactivateMessage,
  buildSubjectReactivateMessage,
  formatWeeklyHours,
  getSubjectTypeLabel,
  getSubjectTypeStage,
  toHalfHourUnits,
} from '@/utils/subjectDisplay.js'

const MATH_SUBJECT = { code: 'MATH7', name: 'Mathematics 7' }

describe('SUBJECT_TYPES', () => {
  it('lists exactly the four subject types in order', () => {
    expect(SUBJECT_TYPES).toEqual(['jhs_learning_area', 'shs_core', 'shs_applied', 'shs_specialized'])
  })
})

describe('SUBJECT_TYPE_STAGES', () => {
  it('maps the JHS type to jhs and the three SHS types to shs', () => {
    expect(SUBJECT_TYPE_STAGES.jhs_learning_area).toBe('jhs')
    expect(SUBJECT_TYPE_STAGES.shs_core).toBe('shs')
    expect(SUBJECT_TYPE_STAGES.shs_applied).toBe('shs')
    expect(SUBJECT_TYPE_STAGES.shs_specialized).toBe('shs')
  })
})

describe('getSubjectTypeLabel', () => {
  it('returns the label of a known type, the raw value of an unknown one and an empty text for a non-string', () => {
    expect(getSubjectTypeLabel('shs_core')).toBe('SHS core')
    expect(getSubjectTypeLabel('college_major')).toBe('college_major')
    expect(getSubjectTypeLabel(null)).toBe('')
  })
})

describe('getSubjectTypeStage', () => {
  it('returns the stage of a known type and an empty text for an unknown one', () => {
    expect(getSubjectTypeStage('shs_applied')).toBe('shs')
    expect(getSubjectTypeStage('jhs_learning_area')).toBe('jhs')
    expect(getSubjectTypeStage('college_major')).toBe('')
  })
})

describe('formatWeeklyHours', () => {
  it('drops trailing zeros and shows a dash for text that is not hours', () => {
    expect(formatWeeklyHours('1.50')).toBe('1.5')
    expect(formatWeeklyHours('3.00')).toBe('3')
    expect(formatWeeklyHours(40)).toBe('40')
    expect(formatWeeklyHours('abc')).toBe('—')
  })
})

describe('toHalfHourUnits', () => {
  it('counts half-hour steps and returns null for anything else', () => {
    expect(toHalfHourUnits('0.5')).toBe(1)
    expect(toHalfHourUnits('40')).toBe(80)
    expect(toHalfHourUnits('1.25')).toBeNull()
    expect(toHalfHourUnits('abc')).toBeNull()
    expect(toHalfHourUnits('')).toBeNull()
  })
})

describe('subject status messages', () => {
  it('names the subject in the deactivate and reactivate texts', () => {
    expect(buildSubjectDeactivateMessage(MATH_SUBJECT)).toBe(
      'Deactivate MATH7 (Mathematics 7)? It stays in the list and existing curriculum entries, but it cannot be added to a curriculum.',
    )
    expect(buildSubjectReactivateMessage(MATH_SUBJECT)).toBe(
      'Reactivate MATH7 (Mathematics 7)? It can be added to curricula again.',
    )
    expect(buildSubjectDeactivateMessage(null)).toBe('')
    expect(buildSubjectReactivateMessage('MATH7')).toBe('')
  })
})

describe('SUBJECT_COLUMNS', () => {
  it('lists the column keys in order', () => {
    expect(SUBJECT_COLUMNS.map((column) => column.key)).toEqual(['code', 'name', 'type', 'weekly_hours', 'is_active'])
  })
})
