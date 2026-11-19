import { describe, it, expect } from 'vitest'
import {
  ASSESSMENT_GUARD_ERROR_KEY,
  PLAN_NOT_ASSESSABLE_MESSAGE,
  PLAN_REQUIRED_MESSAGE,
  REASSESS_DELETE_PARAMS,
  STUDENT_REQUIRED_MESSAGE,
  buildAssessPayload,
  buildPreviewKey,
  buildReassessAssignPayload,
  buildReassessPayload,
  createEmptyAssessForm,
  createReassessForm,
  findAssessFormErrors,
  isPreviewReady,
  isReassessConfirmNeeded,
  listAssessablePlans,
} from '@/utils/assessmentForm.js'

const PLANS = [
  { id: 1, school_year_id: 5, is_active: true },
  { id: 2, school_year_id: 5, is_active: false },
  { id: 3, school_year_id: 6, is_active: true },
]
const ASSESSABLE_PLANS = [PLANS[0]]

describe('assessmentForm', () => {
  it('exposes the messages and creates the empty form', () => {
    expect(STUDENT_REQUIRED_MESSAGE).toBe('Choose a student.')
    expect(PLAN_REQUIRED_MESSAGE).toBe('Choose a payment plan.')
    expect(createEmptyAssessForm('5')).toEqual({ school_year_id: '5', student_id: '', payment_plan_id: '' })
    expect(createEmptyAssessForm(5)).toEqual({ school_year_id: '5', student_id: '', payment_plan_id: '' })
  })

  it('lists active plans of the same school year only', () => {
    expect(listAssessablePlans(PLANS, '5')).toEqual([PLANS[0]])
    expect(listAssessablePlans('nope', '5')).toEqual([])
    expect(listAssessablePlans(PLANS, '')).toEqual([])
  })

  it('requires a student and a plan', () => {
    const emptyForm = createEmptyAssessForm('5')
    expect(findAssessFormErrors({ ...emptyForm, payment_plan_id: '1' }, ASSESSABLE_PLANS)).toEqual({
      student_id: [STUDENT_REQUIRED_MESSAGE],
    })
    expect(findAssessFormErrors({ ...emptyForm, student_id: '9' }, ASSESSABLE_PLANS)).toEqual({
      payment_plan_id: [PLAN_REQUIRED_MESSAGE],
    })
    expect(Object.keys(findAssessFormErrors(emptyForm, ASSESSABLE_PLANS))).toEqual(['student_id', 'payment_plan_id'])
  })

  it('rejects a plan that is not assessable and accepts one that is', () => {
    const formValues = { school_year_id: '5', student_id: '9', payment_plan_id: '2' }
    expect(findAssessFormErrors(formValues, ASSESSABLE_PLANS)).toEqual({ payment_plan_id: [PLAN_NOT_ASSESSABLE_MESSAGE] })
    expect(findAssessFormErrors({ ...formValues, payment_plan_id: '1' }, ASSESSABLE_PLANS)).toEqual({})
  })

  it('builds the numeric payload with exactly three keys', () => {
    const payload = buildAssessPayload({ school_year_id: '5', student_id: '9', payment_plan_id: '1' })
    expect(payload).toEqual({ student_id: 9, school_year_id: 5, payment_plan_id: 1 })
    expect(Object.keys(payload)).toHaveLength(3)
  })

  it('knows when the preview can be requested', () => {
    expect(isPreviewReady({ school_year_id: '5', student_id: '9', payment_plan_id: '1' })).toBe(true)
    expect(isPreviewReady(createEmptyAssessForm('5'))).toBe(false)
    expect(isPreviewReady({ school_year_id: '5', student_id: 'x', payment_plan_id: '1' })).toBe(false)
  })

  it('builds a stable preview key that changes with the plan', () => {
    const formValues = { school_year_id: '5', student_id: '9', payment_plan_id: '1' }
    expect(buildPreviewKey(formValues)).toBe('9:5:1')
    expect(buildPreviewKey({ ...formValues })).toBe(buildPreviewKey(formValues))
    expect(buildPreviewKey({ ...formValues, payment_plan_id: '4' })).not.toBe(buildPreviewKey(formValues))
    expect(buildPreviewKey(createEmptyAssessForm('5'))).toBe('')
  })

  it('pre-selects the plan of the assessment only when it is still assessable', () => {
    const assessment = { school_year_id: 5, student: { id: 9 }, payment_plan_id: 1 }
    expect(createReassessForm(assessment, ASSESSABLE_PLANS)).toEqual({
      school_year_id: '5',
      student_id: '9',
      payment_plan_id: '1',
    })
    expect(createReassessForm({ ...assessment, payment_plan_id: 2 }, ASSESSABLE_PLANS).payment_plan_id).toBe('')
    expect(createReassessForm({ ...assessment, payment_plan_id: null }, ASSESSABLE_PLANS).payment_plan_id).toBe('')
  })

  it('validates the re-assess plan like the assess form', () => {
    const formValues = { school_year_id: '5', student_id: '9', payment_plan_id: '' }
    expect(findAssessFormErrors(formValues, ASSESSABLE_PLANS)).toEqual({ payment_plan_id: [PLAN_REQUIRED_MESSAGE] })
    expect(findAssessFormErrors({ ...formValues, payment_plan_id: '2' }, ASSESSABLE_PLANS)).toEqual({
      payment_plan_id: [PLAN_NOT_ASSESSABLE_MESSAGE],
    })
    expect(findAssessFormErrors({ ...formValues, payment_plan_id: '1' }, ASSESSABLE_PLANS)).toEqual({})
  })

  it('builds the re-assess payload with the plan only', () => {
    expect(buildReassessPayload({ school_year_id: '5', student_id: '9', payment_plan_id: '1' })).toEqual({
      payment_plan_id: 1,
    })
  })

  it('needs the confirm step only for a 422 with errors.assessment', () => {
    const guardResponse = { status: 422, data: { errors: { [ASSESSMENT_GUARD_ERROR_KEY]: ['has assessment'] } } }
    expect(isReassessConfirmNeeded(guardResponse)).toBe(true)
    expect(isReassessConfirmNeeded({ status: 422, data: { errors: { reassess: ['inactive'] } } })).toBe(false)
    expect(isReassessConfirmNeeded({ status: 422, data: { errors: { student_id: ['x'] } } })).toBe(false)
    expect(isReassessConfirmNeeded({ status: 404, data: {} })).toBe(false)
    expect(isReassessConfirmNeeded(undefined)).toBe(false)
  })

  it('adds the reassess flag without mutating and freezes the delete params', () => {
    const assignPayload = { student_id: 9 }
    expect(buildReassessAssignPayload(assignPayload)).toEqual({ student_id: 9, reassess: true })
    expect(assignPayload).toEqual({ student_id: 9 })
    expect(REASSESS_DELETE_PARAMS).toEqual({ reassess: 1 })
    expect(Object.isFrozen(REASSESS_DELETE_PARAMS)).toBe(true)
  })
})
