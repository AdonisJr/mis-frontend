import { describe, it, expect } from 'vitest'
import {
  OTHER_TYPE_SUFFIX,
  buildMappingPayload,
  buildPurposeAccountOptions,
  createMappingSelections,
  getPurposeError,
  groupPostingMappings,
} from '@/utils/postingSettingsForm.js'

const MAPPINGS = [
  { purpose: 'ar_students', label: 'Student receivables', group: 'receivables', account_type: 'asset', account: { id: 3, code: '1100', name: 'AR', is_active: true } },
  { purpose: 'receivable_government', label: 'Government receivables', group: 'receivables', account_type: 'asset', account: null },
  { purpose: 'revenue_tuition', label: 'Tuition revenue', group: 'revenue', account_type: 'revenue', account: { id: 40, code: '4000', name: 'Old tuition', is_active: false } },
  { purpose: 'revenue_other', label: 'Other revenue', group: 'revenue', account_type: 'revenue', account: { id: 41, code: '4100', name: 'Other', is_active: true } },
]
const ACCOUNTS = [
  { id: 5, code: '1050', name: 'Cash', type: 'asset', is_active: true },
  { id: 3, code: '1100', name: 'AR', type: 'asset', is_active: true },
  { id: 42, code: '4050', name: 'Misc', type: 'revenue', is_active: true },
  { id: 41, code: '4100', name: 'Other', type: 'revenue', is_active: true },
]

describe('groupPostingMappings', () => {
  it('groups in first-appearance order and handles a non-array', () => {
    const groups = groupPostingMappings(MAPPINGS)
    expect(groups.map((group) => group.group)).toEqual(['receivables', 'revenue'])
    expect(groups.map((group) => group.label)).toEqual(['Receivables', 'Revenue'])
    expect(groups[0].mappings).toHaveLength(2)
    expect(groupPostingMappings([{ purpose: 'x', group: 'new_group' }])[0].label).toBe('new_group')
    expect(groupPostingMappings(null)).toEqual([])
  })
})

describe('createMappingSelections', () => {
  it('uses id text and blank for unmapped', () => {
    expect(createMappingSelections(MAPPINGS)).toEqual({
      ar_students: '3',
      receivable_government: '',
      revenue_tuition: '40',
      revenue_other: '41',
    })
  })
})

describe('buildPurposeAccountOptions', () => {
  it('filters by type and sorts by code', () => {
    expect(buildPurposeAccountOptions(MAPPINGS[1], ACCOUNTS)).toEqual([
      { value: '5', label: '1050 Cash' },
      { value: '3', label: '1100 AR' },
    ])
  })

  it('appends a stale inactive mapped account with the suffix', () => {
    expect(buildPurposeAccountOptions(MAPPINGS[2], ACCOUNTS)).toEqual([
      { value: '42', label: '4050 Misc' },
      { value: '41', label: '4100 Other' },
      { value: '40', label: '4000 Old tuition (inactive)' },
    ])
  })

  it('appends an active mapped account of another type with the other-type suffix', () => {
    const wrongTypeMapping = { ...MAPPINGS[3], account: { id: 5, code: '1050', name: 'Cash', is_active: true } }
    const accountOptions = buildPurposeAccountOptions(wrongTypeMapping, ACCOUNTS)
    expect(accountOptions.at(-1)).toEqual({ value: '5', label: `1050 Cash${OTHER_TYPE_SUFFIX}` })
  })

  it('returns no options for an unmapped row without an accounts list', () => {
    expect(buildPurposeAccountOptions(MAPPINGS[1], null)).toEqual([])
  })
})

describe('buildMappingPayload', () => {
  it('sends only changed non-blank purposes as numbers', () => {
    const selections = { ar_students: '3', receivable_government: '5', revenue_tuition: '', revenue_other: '42' }
    expect(buildMappingPayload(MAPPINGS, selections)).toEqual({
      mappings: { receivable_government: 5, revenue_other: 42 },
    })
  })

  it('returns null when nothing changed or only blanks', () => {
    expect(buildMappingPayload(MAPPINGS, createMappingSelections(MAPPINGS))).toBeNull()
    expect(buildMappingPayload(MAPPINGS, { receivable_government: '' })).toBeNull()
  })
})

describe('getPurposeError', () => {
  it('reads mappings.<purpose> and returns blank otherwise', () => {
    const fieldErrors = { 'mappings.ar_students': ['Account is inactive.'] }
    expect(getPurposeError(fieldErrors, 'ar_students')).toBe('Account is inactive.')
    expect(getPurposeError(fieldErrors, 'revenue_other')).toBe('')
    expect(getPurposeError(null, 'ar_students')).toBe('')
  })
})
