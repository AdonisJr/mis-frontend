export const COMPONENTS = Object.freeze(['ww', 'pt', 'qa'])

const SCORE_PATTERN = /^\d+(\.\d)?$/
const TENTHS_PER_POINT = 10
const PERCENT_SCALE = 100
const PERCENTAGE_TENTHS_FACTOR = 1000
const PASSING_INITIAL_GRADE = 6000
const PASSING_BASE_GRADE = 75
const PASSING_STEP = 160
const FAILING_BASE_GRADE = 60
const FAILING_STEP = 400

export function toTenths(scoreText) {
  if (typeof scoreText !== 'string') return null
  const trimmedText = scoreText.trim()
  if (!SCORE_PATTERN.test(trimmedText)) return null
  const [wholeText, decimalText = '0'] = trimmedText.split('.')
  return Number(wholeText) * TENTHS_PER_POINT + Number(decimalText)
}

function divideHalfUp(numerator, denominator) {
  return Math.floor((2 * numerator + denominator) / (2 * denominator))
}

function sumOneComponent(componentActivities, scoreTextByActivityId) {
  let rawTenths = 0
  let highestTotal = 0
  for (const activity of componentActivities) {
    rawTenths += toTenths(scoreTextByActivityId?.[activity.id]) ?? 0
    highestTotal += activity.highest_possible_score
  }
  return { rawTenths, highestTotal }
}

export function sumComponentTotals(activities, scoreTextByActivityId) {
  const activityList = Array.isArray(activities) ? activities : []
  const componentTotals = {}
  for (const component of COMPONENTS) {
    const componentActivities = activityList.filter((activity) => activity.component === component)
    componentTotals[component] = sumOneComponent(componentActivities, scoreTextByActivityId)
  }
  return componentTotals
}

export function transmuteInitialGrade(initialHundredths) {
  if (initialHundredths >= PASSING_INITIAL_GRADE) {
    return PASSING_BASE_GRADE + Math.floor((initialHundredths - PASSING_INITIAL_GRADE) / PASSING_STEP)
  }
  return FAILING_BASE_GRADE + Math.floor(initialHundredths / FAILING_STEP)
}

function computePercentage(componentTotal) {
  if (componentTotal.highestTotal === 0) return 0
  return divideHalfUp(componentTotal.rawTenths * PERCENTAGE_TENTHS_FACTOR, componentTotal.highestTotal)
}

export function computeQuarterGrade(componentTotals, weights) {
  const quarterGrade = {}
  let initialHundredths = 0
  for (const component of COMPONENTS) {
    const percentage = computePercentage(componentTotals[component])
    const weighted = divideHalfUp(percentage * weights[component], PERCENT_SCALE)
    quarterGrade[`${component}_percentage`] = percentage
    quarterGrade[`${component}_weighted`] = weighted
    initialHundredths += weighted
  }
  quarterGrade.initial_grade = initialHundredths
  quarterGrade.quarterly_grade = transmuteInitialGrade(initialHundredths)
  return quarterGrade
}

export function formatHundredths(hundredthsValue) {
  const wholePart = Math.floor(hundredthsValue / PERCENT_SCALE)
  const fractionPart = hundredthsValue - wholePart * PERCENT_SCALE
  return `${wholePart}.${String(fractionPart).padStart(2, '0')}`
}

export function listEmptyComponents(activities) {
  const activityList = Array.isArray(activities) ? activities : []
  return COMPONENTS.filter((component) => !activityList.some((activity) => activity.component === component))
}
