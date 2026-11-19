import { toCents } from '@/utils/moneyDisplay.js'

const ONES = Object.freeze([
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
])
const TENS = Object.freeze(['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'])
const SCALES = Object.freeze(['', 'thousand', 'million', 'billion'])
const CENTS_PER_PESO = 100
const CHUNK_SIZE = 1000
const HUNDRED = 100
const TWENTY = 20
const TEN = 10
const WORD_SEPARATOR = ' '
const SINGULAR_PESO_WORD = 'peso'
const PLURAL_PESO_WORD = 'pesos'

function formatTensInWords(tensValue) {
  if (tensValue < TWENTY) return ONES[tensValue]
  const tensWord = TENS[Math.floor(tensValue / TEN)]
  const onesValue = tensValue % TEN
  return onesValue === 0 ? tensWord : `${tensWord}-${ONES[onesValue]}`
}

function formatHundredsInWords(chunkValue) {
  const hundredsValue = Math.floor(chunkValue / HUNDRED)
  const tensValue = chunkValue % HUNDRED
  const hundredsWords = hundredsValue > 0 ? [`${ONES[hundredsValue]} hundred`] : []
  const tensWords = tensValue > 0 ? [formatTensInWords(tensValue)] : []
  return [...hundredsWords, ...tensWords].join(WORD_SEPARATOR)
}

function splitIntoChunks(wholeValue) {
  const chunkValues = []
  let remainingValue = wholeValue
  while (remainingValue > 0) {
    chunkValues.push(remainingValue % CHUNK_SIZE)
    remainingValue = Math.floor(remainingValue / CHUNK_SIZE)
  }
  return chunkValues
}

function formatWholeInWords(wholeValue) {
  if (wholeValue === 0) return ONES[0]
  return splitIntoChunks(wholeValue)
    .map((chunkValue, scaleIndex) => ({ chunkValue, scaleIndex }))
    .filter((chunkEntry) => chunkEntry.chunkValue > 0)
    .map((chunkEntry) => [formatHundredsInWords(chunkEntry.chunkValue), SCALES[chunkEntry.scaleIndex]])
    .map((chunkWords) => chunkWords.filter((word) => word !== '').join(WORD_SEPARATOR))
    .reverse()
    .join(WORD_SEPARATOR)
}

function capitalizeFirst(sentenceText) {
  return sentenceText.charAt(0).toUpperCase() + sentenceText.slice(1)
}

export function formatAmountInWords(amountText) {
  const cents = toCents(amountText)
  if (cents === null) return ''
  const wholeValue = Math.floor(cents / CENTS_PER_PESO)
  const centsValue = cents % CENTS_PER_PESO
  const pesoWord = wholeValue === 1 ? SINGULAR_PESO_WORD : PLURAL_PESO_WORD
  const suffixText = centsValue === 0 ? 'only' : `and ${String(centsValue).padStart(2, '0')}/100`
  return capitalizeFirst(`${formatWholeInWords(wholeValue)} ${pesoWord} ${suffixText}`)
}
