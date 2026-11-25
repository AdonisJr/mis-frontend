import { describe, it, expect } from 'vitest'
import {
  buildActivityPayload,
  buildFormFromActivity,
  buildReopenPayload,
  createEmptyActivityForm,
  findActivityFormErrors,
  findReopenReasonError,
  listComponentOptions,
} from '@/utils/classRecordForm.js'

function buildValidForm(overrides = {}) {
  return { component: 'ww', title: 'Quiz 1', highest_possible_score: '20', activity_date: '2026-11-22', ...overrides }
}

describe('activity form basics', () => {
  it('(1) starts blank', () => {
    expect(createEmptyActivityForm()).toEqual({
      component: '',
      title: '',
      highest_possible_score: '',
      activity_date: '',
    })
  })

  it('(2) maps an activity to text fields', () => {
    const activity = { component: 'pt', title: 'Project', highest_possible_score: 50, activity_date: null }
    expect(buildFormFromActivity(activity)).toEqual({
      component: 'pt',
      title: 'Project',
      highest_possible_score: '50',
      activity_date: '',
    })
    expect(buildFormFromActivity(null)).toEqual(createEmptyActivityForm())
  })
})

describe('findActivityFormErrors', () => {
  it('(3) checks every field and accepts a valid form', () => {
    expect(findActivityFormErrors(buildValidForm())).toEqual({})
    expect(findActivityFormErrors(buildValidForm({ component: '' })).component).toEqual(['Component is required.'])
    expect(findActivityFormErrors(buildValidForm({ title: '  ' })).title).toEqual(['Title is required.'])
    expect(findActivityFormErrors(buildValidForm({ title: 'T'.repeat(150) })).title).toBeUndefined()
    expect(findActivityFormErrors(buildValidForm({ title: 'T'.repeat(151) })).title).toEqual([
      'Title must be at most 150 characters.',
    ])
    for (const badScore of ['0', '1.5', '1000', 'x', '']) {
      expect(findActivityFormErrors(buildValidForm({ highest_possible_score: badScore })).highest_possible_score).toEqual([
        'Enter a whole number from 1 to 999.',
      ])
    }
    expect(findActivityFormErrors(buildValidForm({ highest_possible_score: '999' })).highest_possible_score).toBeUndefined()
    expect(findActivityFormErrors(buildValidForm({ activity_date: '2026-13-01' })).activity_date).toEqual([
      'Enter a valid date.',
    ])
    expect(findActivityFormErrors(buildValidForm({ activity_date: '' })).activity_date).toBeUndefined()
  })
})

describe('listComponentOptions', () => {
  it('(4) disables QA when another activity is QA and enables it when editing that one', () => {
    const activities = [{ id: 4, component: 'qa' }]
    expect(listComponentOptions(activities, null).map((option) => option.isDisabled)).toEqual([false, false, true])
    expect(listComponentOptions(activities, 4).map((option) => option.isDisabled)).toEqual([false, false, false])
    expect(listComponentOptions([], null).map((option) => option.value)).toEqual(['ww', 'pt', 'qa'])
  })
})

describe('buildActivityPayload', () => {
  it('(5) trims, sends a number and a null date, with no quarter key', () => {
    const activityPayload = buildActivityPayload(buildValidForm({ title: ' Quiz 1 ', activity_date: '' }))
    expect(activityPayload).toEqual({
      component: 'ww',
      title: 'Quiz 1',
      highest_possible_score: 20,
      activity_date: null,
    })
    expect(Object.hasOwn(activityPayload, 'quarter')).toBe(false)
  })
})

describe('reopen reason', () => {
  it('(6) requires a reason up to 500 characters and sends it trimmed', () => {
    expect(findReopenReasonError('  ')).toBe('A reason is required.')
    expect(findReopenReasonError('R'.repeat(500))).toBe('')
    expect(findReopenReasonError('R'.repeat(501))).toBe('The reason must be at most 500 characters.')
    expect(buildReopenPayload('  Typo in Quiz 1 ')).toEqual({ reason: 'Typo in Quiz 1' })
  })
})
