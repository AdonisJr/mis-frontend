import { describe, it, expect } from 'vitest'
import {
  CARD_FILTER_OPTIONS,
  buildCardFilterParams,
  extractRfidConflictMessage,
  formatCardUid,
  formatCountdown,
  getRemainingSeconds,
} from '@/utils/rfidDisplay.js'

const NOW = 1_000_000

function buildRequestError(status, data) {
  return { response: { status, data } }
}

describe('formatCardUid', () => {
  it('returns the stored UID unchanged', () => {
    expect(formatCardUid('04:A3:1B:2C')).toBe('04:A3:1B:2C')
  })

  it('shows No card for empty or non-string values', () => {
    for (const emptyValue of [null, '', undefined, 42]) expect(formatCardUid(emptyValue)).toBe('No card')
  })
})

describe('getRemainingSeconds', () => {
  it('returns the full window at the start', () => {
    expect(getRemainingSeconds(NOW + 300000, NOW)).toBe(300)
  })

  it('rounds partial seconds up', () => {
    expect(getRemainingSeconds(NOW + 1500, NOW)).toBe(2)
    expect(getRemainingSeconds(NOW + 1, NOW)).toBe(1)
  })

  it('is closed at and after the deadline, and for non-finite input', () => {
    expect(getRemainingSeconds(NOW, NOW)).toBe(0)
    expect(getRemainingSeconds(NOW, NOW + 5)).toBe(0)
    expect(getRemainingSeconds(NaN, NOW)).toBe(0)
  })
})

describe('formatCountdown', () => {
  it('formats M:SS', () => {
    expect(formatCountdown(300)).toBe('5:00')
    expect(formatCountdown(65)).toBe('1:05')
    expect(formatCountdown(9)).toBe('0:09')
  })

  it('falls back to 0:00 for invalid input', () => {
    for (const invalidValue of [0, -5, 1.5, '60']) expect(formatCountdown(invalidValue)).toBe('0:00')
  })
})

describe('card filter', () => {
  it('lists all, with and without options, frozen', () => {
    expect(CARD_FILTER_OPTIONS.map((option) => option.value)).toEqual(['', 'with', 'without'])
    expect(CARD_FILTER_OPTIONS.map((option) => option.label)).toEqual(['All students', 'With card', 'Without card'])
    expect(Object.isFrozen(CARD_FILTER_OPTIONS)).toBe(true)
    expect(CARD_FILTER_OPTIONS.every((option) => Object.isFrozen(option))).toBe(true)
  })

  it('maps with and without to has_rfid 1 and 0', () => {
    expect(buildCardFilterParams('with')).toEqual({ has_rfid: 1 })
    expect(buildCardFilterParams('without')).toEqual({ has_rfid: 0 })
  })

  it('omits has_rfid for all and unknown values', () => {
    for (const otherValue of ['', 'maybe', undefined]) expect(buildCardFilterParams(otherValue)).toEqual({})
  })
})

describe('extractRfidConflictMessage', () => {
  it('returns the 422 holder message', () => {
    const holderError = buildRequestError(422, { errors: { rfid: ['Card held by Ana.'] } })
    expect(extractRfidConflictMessage(holderError)).toBe('Card held by Ana.')
  })

  it('returns an empty string for everything else', () => {
    expect(extractRfidConflictMessage(buildRequestError(422, { errors: {} }))).toBe('')
    expect(extractRfidConflictMessage(buildRequestError(404, { errors: { rfid: ['x'] } }))).toBe('')
    expect(extractRfidConflictMessage(new Error('network'))).toBe('')
    expect(extractRfidConflictMessage(buildRequestError(422, { errors: { rfid: [5] } }))).toBe('')
  })
})
