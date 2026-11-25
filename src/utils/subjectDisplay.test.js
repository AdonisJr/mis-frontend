import { describe, it, expect } from 'vitest'
import {
  SUBJECT_COLUMNS,
  SUBJECT_TYPES,
  SUBJECT_TYPE_STAGES,
  SUBJECT_TYPE_WEIGHT_GROUPS,
  SUBJECT_WEIGHT_GROUPS,
  SUBJECT_WEIGHT_GROUP_WEIGHTS,
  buildSubjectDeactivateMessage,
  buildSubjectReactivateMessage,
  formatWeeklyHours,
  getSubjectTypeLabel,
  getSubjectTypeStage,
  getWeightGroupLabel,
  listWeightGroupOptions,
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
    expect(SUBJECT_COLUMNS.map((column) => column.key)).toEqual([
      'code',
      'name',
      'type',
      'weight_group',
      'weekly_hours',
      'is_active',
    ])
  })
})

describe('weight groups', () => {
  it('lists the seven groups, their weights and the type fit map exactly', () => {
    expect(SUBJECT_WEIGHT_GROUPS).toEqual([
      'jhs_languages_ap_esp',
      'jhs_science_math',
      'jhs_mapeh_epp_tle',
      'shs_core',
      'shs_academic_other',
      'shs_academic_immersion_research',
      'shs_tvl_sports_arts',
    ])
    expect(SUBJECT_WEIGHT_GROUP_WEIGHTS.jhs_languages_ap_esp).toEqual({ ww: 30, pt: 50, qa: 20 })
    expect(SUBJECT_WEIGHT_GROUP_WEIGHTS.jhs_science_math).toEqual({ ww: 40, pt: 40, qa: 20 })
    expect(SUBJECT_WEIGHT_GROUP_WEIGHTS.shs_academic_other).toEqual({ ww: 25, pt: 45, qa: 30 })
    expect(SUBJECT_TYPE_WEIGHT_GROUPS.shs_core).toEqual(['shs_core'])
    expect(SUBJECT_TYPE_WEIGHT_GROUPS.shs_applied).toEqual(SUBJECT_TYPE_WEIGHT_GROUPS.shs_specialized)
    expect(SUBJECT_TYPE_WEIGHT_GROUPS.jhs_learning_area).toHaveLength(3)
  })

  it('lists the options of a type with the weights in the label and reads labels back', () => {
    expect(listWeightGroupOptions('shs_core')).toEqual([{ value: 'shs_core', label: 'SHS Core (25/50/25)' }])
    expect(listWeightGroupOptions('jhs_learning_area').map((option) => option.value)).toEqual([
      'jhs_languages_ap_esp',
      'jhs_science_math',
      'jhs_mapeh_epp_tle',
    ])
    expect(listWeightGroupOptions('college_major')).toEqual([])
    expect(getWeightGroupLabel('shs_core')).toBe('SHS Core')
    expect(getWeightGroupLabel('other_group')).toBe('other_group')
    expect(getWeightGroupLabel(null)).toBe('')
  })
})
