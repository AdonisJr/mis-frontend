import http from '@/services/http.js'

const PAYMENT_HOLDS_PATH = '/payment-holds'
const HOLD_CHECK_PATH = '/payment-holds/check'
const PROMISSORY_NOTES_PATH = '/promissory-notes'
const CANCEL_SEGMENT = '/cancel'
const INVALID_NOTE_ID_MESSAGE = 'A valid promissory note id is required.'

export const ENROLLMENT_HOLD_ERROR_KEY = 'hold'

function buildNotePath(noteId) {
  if (!Number.isInteger(noteId) || noteId <= 0) {
    throw new Error(INVALID_NOTE_ID_MESSAGE)
  }
  return `${PROMISSORY_NOTES_PATH}/${noteId}`
}

export async function fetchHoldCheck(holdCheckParams) {
  const response = await http.get(HOLD_CHECK_PATH, { params: holdCheckParams })
  return response.data
}

export async function fetchPaymentHolds(holdListParams) {
  const response = await http.get(PAYMENT_HOLDS_PATH, { params: holdListParams })
  return response.data
}

export async function createPromissoryNote(notePayload) {
  const response = await http.post(PROMISSORY_NOTES_PATH, notePayload)
  return response.data
}

export async function cancelPromissoryNote(noteId, cancelPayload) {
  const response = await http.put(buildNotePath(noteId) + CANCEL_SEGMENT, cancelPayload)
  return response.data
}
