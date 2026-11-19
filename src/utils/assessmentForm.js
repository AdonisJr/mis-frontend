import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const STUDENT_REQUIRED_MESSAGE = 'Choose a student.'
export const PLAN_REQUIRED_MESSAGE = 'Choose a payment plan.'
export const PLAN_NOT_ASSESSABLE_MESSAGE = 'Choose an active payment plan of this school year.'
// the confirm step keys on errors.assessment; errors.reassess is a final failure
export const ASSESSMENT_GUARD_ERROR_KEY = 'assessment'
export const REASSESS_DELETE_PARAMS = Object.freeze({ reassess: 1 })

const HTTP_UNPROCESSABLE_ENTITY = 422

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function listAssessablePlans(paymentPlans, schoolYearId) {
  const yearId = toRecordId(schoolYearId)
  if (!Array.isArray(paymentPlans) || yearId === null) return []
  return paymentPlans.filter((paymentPlan) => paymentPlan?.is_active === true && paymentPlan.school_year_id === yearId)
}

export function createEmptyAssessForm(schoolYearId) {
  return { school_year_id: toIdText(schoolYearId), student_id: '', payment_plan_id: '' }
}

function findPlanError(paymentPlanId, assessablePlans) {
  const planId = toRecordId(paymentPlanId)
  if (planId === null) return [PLAN_REQUIRED_MESSAGE]
  const isAssessable = Array.isArray(assessablePlans) && assessablePlans.some((paymentPlan) => paymentPlan.id === planId)
  return isAssessable ? null : [PLAN_NOT_ASSESSABLE_MESSAGE]
}

export function findAssessFormErrors(formValues, assessablePlans) {
  const formErrors = {}
  if (toRecordId(formValues?.student_id) === null) formErrors.student_id = [STUDENT_REQUIRED_MESSAGE]
  const planError = findPlanError(formValues?.payment_plan_id, assessablePlans)
  if (planError) formErrors.payment_plan_id = planError
  return formErrors
}

export function buildAssessPayload(formValues) {
  return {
    student_id: toRecordId(formValues?.student_id),
    school_year_id: toRecordId(formValues?.school_year_id),
    payment_plan_id: toRecordId(formValues?.payment_plan_id),
  }
}

export function isPreviewReady(formValues) {
  const { student_id: studentId, school_year_id: schoolYearId, payment_plan_id: paymentPlanId } = buildAssessPayload(formValues)
  return studentId !== null && schoolYearId !== null && paymentPlanId !== null
}

export function buildPreviewKey(formValues) {
  if (!isPreviewReady(formValues)) return ''
  const { student_id: studentId, school_year_id: schoolYearId, payment_plan_id: paymentPlanId } = buildAssessPayload(formValues)
  return `${studentId}:${schoolYearId}:${paymentPlanId}`
}

export function createReassessForm(assessment, assessablePlans) {
  const paymentPlanId = toRecordId(assessment?.payment_plan_id)
  const isPlanAssessable =
    paymentPlanId !== null && Array.isArray(assessablePlans) && assessablePlans.some((paymentPlan) => paymentPlan.id === paymentPlanId)
  return {
    school_year_id: toIdText(assessment?.school_year_id),
    student_id: toIdText(assessment?.student?.id),
    payment_plan_id: isPlanAssessable ? String(paymentPlanId) : '',
  }
}

export function isReassessConfirmNeeded(errorResponse) {
  if (errorResponse?.status !== HTTP_UNPROCESSABLE_ENTITY) return false
  return Array.isArray(errorResponse.data?.errors?.[ASSESSMENT_GUARD_ERROR_KEY])
}

export function buildReassessAssignPayload(assignPayload) {
  if (!isRecordObject(assignPayload)) return { reassess: true }
  return { ...assignPayload, reassess: true }
}

export function buildReassessPayload(formValues) {
  return { payment_plan_id: toRecordId(formValues?.payment_plan_id) }
}
