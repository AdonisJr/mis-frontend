export const NO_CARD_LABEL = 'No card'

export function formatCardUid(rfid) {
  if (typeof rfid === 'string' && rfid !== '') return rfid
  return NO_CARD_LABEL
}

// mirrors the backend RFID assignment window TTL
export const ASSIGNMENT_WINDOW_SECONDS = 300

export function getRemainingSeconds(deadlineMs, nowMs) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) return 0
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000))
}

const SECONDS_PER_MINUTE = 60
const ZERO_COUNTDOWN = '0:00'

export function formatCountdown(remainingSeconds) {
  if (!Number.isInteger(remainingSeconds) || remainingSeconds < 0) return ZERO_COUNTDOWN
  const minutes = Math.floor(remainingSeconds / SECONDS_PER_MINUTE)
  const seconds = String(remainingSeconds % SECONDS_PER_MINUTE).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export const CARD_FILTER_ALL = ''
export const CARD_FILTER_WITH = 'with'
export const CARD_FILTER_WITHOUT = 'without'
export const CARD_FILTER_OPTIONS = Object.freeze([
  Object.freeze({ value: CARD_FILTER_ALL, label: 'All students' }),
  Object.freeze({ value: CARD_FILTER_WITH, label: 'With card' }),
  Object.freeze({ value: CARD_FILTER_WITHOUT, label: 'Without card' }),
])

export const HAS_RFID_PARAM = 'has_rfid'
const CARD_FILTER_PARAMS = Object.freeze({
  [CARD_FILTER_WITH]: Object.freeze({ [HAS_RFID_PARAM]: 1 }),
  [CARD_FILTER_WITHOUT]: Object.freeze({ [HAS_RFID_PARAM]: 0 }),
})

export function buildCardFilterParams(cardFilter) {
  return { ...(CARD_FILTER_PARAMS[cardFilter] ?? {}) }
}

export const RFID_ACTION_SCAN = 'scan'
export const RFID_ACTION_UNASSIGN = 'unassign'

const HTTP_UNPROCESSABLE_ENTITY = 422

export function extractRfidConflictMessage(requestError) {
  if (requestError?.response?.status !== HTTP_UNPROCESSABLE_ENTITY) return ''
  const conflictMessage = requestError.response.data?.errors?.rfid?.[0]
  return typeof conflictMessage === 'string' && conflictMessage !== '' ? conflictMessage : ''
}
