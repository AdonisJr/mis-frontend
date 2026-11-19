import http from '@/services/http.js'

const PAYMENTS_PATH = '/payments'
const RECORDERS_PATH = '/payments/recorders'
const LEDGER_PATH = '/payments/ledger'
const VOID_SEGMENT = '/void'
const RECEIPT_SEGMENT = '/receipt'
const INVALID_PAYMENT_ID_MESSAGE = 'A valid payment id is required.'

function buildPaymentPath(paymentId) {
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw new Error(INVALID_PAYMENT_ID_MESSAGE)
  }
  return `${PAYMENTS_PATH}/${paymentId}`
}

export async function fetchPayments(paymentListParams) {
  const response = await http.get(PAYMENTS_PATH, { params: paymentListParams })
  return response.data
}

export async function fetchPaymentRecorders() {
  const response = await http.get(RECORDERS_PATH)
  return response.data
}

export async function recordPayment(paymentPayload) {
  const response = await http.post(PAYMENTS_PATH, paymentPayload)
  return response.data
}

export async function voidPayment(paymentId, voidPayload) {
  const response = await http.put(buildPaymentPath(paymentId) + VOID_SEGMENT, voidPayload)
  return response.data
}

export async function fetchPaymentReceipt(paymentId) {
  const response = await http.get(buildPaymentPath(paymentId) + RECEIPT_SEGMENT)
  return response.data
}

export async function fetchStudentLedger(ledgerParams) {
  const response = await http.get(LEDGER_PATH, { params: ledgerParams })
  return response.data
}
