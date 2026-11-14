import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const AMOUNT_MAX_CENTS = 999999999999
export const PESO_SIGN = '₱'

const AMOUNT_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/
const THOUSANDS_PATTERN = /\B(?=(\d{3})+(?!\d))/g
const CENTS_PER_UNIT = 100

function isAmountInput(amountValue) {
  if (typeof amountValue === 'string') return true
  return typeof amountValue === 'number' && Number.isFinite(amountValue)
}

function isCentsValue(centsValue) {
  return Number.isSafeInteger(centsValue) && centsValue >= 0
}

export function toCents(amountValue) {
  if (!isAmountInput(amountValue)) return null
  const amountMatch = AMOUNT_PATTERN.exec(String(amountValue).trim())
  if (amountMatch === null) return null
  const wholeText = amountMatch[1]
  const fractionText = (amountMatch[2] ?? '').padEnd(2, '0')
  const cents = Number(wholeText) * CENTS_PER_UNIT + Number(fractionText)
  return Number.isSafeInteger(cents) ? cents : null
}

function splitCents(cents) {
  return {
    wholeText: String(Math.floor(cents / CENTS_PER_UNIT)),
    fractionText: String(cents % CENTS_PER_UNIT).padStart(2, '0'),
  }
}

export function formatCentsAsAmount(cents) {
  if (!isCentsValue(cents)) return ''
  const { wholeText, fractionText } = splitCents(cents)
  return `${wholeText}.${fractionText}`
}

export function formatPesoFromCents(cents) {
  if (!isCentsValue(cents)) return ''
  const { wholeText, fractionText } = splitCents(cents)
  return `${PESO_SIGN}${wholeText.replace(THOUSANDS_PATTERN, ',')}.${fractionText}`
}

export function formatPeso(amountValue) {
  const cents = toCents(amountValue)
  if (cents === null) return NO_VALUE_LABEL
  return formatPesoFromCents(cents)
}
