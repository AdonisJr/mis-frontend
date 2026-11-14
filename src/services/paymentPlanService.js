import http from '@/services/http.js'

const PAYMENT_PLANS_PATH = '/payment-plans'
const COPY_PATH = '/payment-plans/copy'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_PAYMENT_PLAN_ID_MESSAGE = 'A valid payment plan id is required.'

function assertPaymentPlanId(paymentPlanId) {
  if (Number.isInteger(paymentPlanId) && paymentPlanId > 0) return
  throw new Error(INVALID_PAYMENT_PLAN_ID_MESSAGE)
}

function buildPaymentPlanPath(paymentPlanId) {
  assertPaymentPlanId(paymentPlanId)
  return `${PAYMENT_PLANS_PATH}/${paymentPlanId}`
}

export async function fetchPaymentPlans(paymentPlanListParams) {
  const response = await http.get(PAYMENT_PLANS_PATH, { params: paymentPlanListParams })
  return response.data
}

export async function fetchPaymentPlan(paymentPlanId) {
  const response = await http.get(buildPaymentPlanPath(paymentPlanId))
  return response.data
}

export async function createPaymentPlan(paymentPlanPayload) {
  const response = await http.post(PAYMENT_PLANS_PATH, paymentPlanPayload)
  return response.data
}

export async function updatePaymentPlan(paymentPlanId, paymentPlanPayload) {
  const response = await http.put(buildPaymentPlanPath(paymentPlanId), paymentPlanPayload)
  return response.data
}

export async function deactivatePaymentPlan(paymentPlanId) {
  const response = await http.put(buildPaymentPlanPath(paymentPlanId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivatePaymentPlan(paymentPlanId) {
  const response = await http.put(buildPaymentPlanPath(paymentPlanId) + REACTIVATE_SEGMENT)
  return response.data
}

export async function deletePaymentPlan(paymentPlanId) {
  const response = await http.delete(buildPaymentPlanPath(paymentPlanId))
  return response.data
}

export async function copyPaymentPlans(copyPayload) {
  const response = await http.post(COPY_PATH, copyPayload)
  return response.data
}
