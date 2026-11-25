import { toIdText } from '@/utils/sectionForm.js'
import { buildClassListQuery, readClassListQuery } from '@/utils/classListSearch.js'
import { TERM_TYPE_TRIMESTER } from '@/utils/termDisplay.js'

export const TRIMESTER_TEXT = 'Grading is not available for trimester school years.'

const QUARTER_PARAM = 'quarter'
const WHOLE_YEAR_QUARTERS = Object.freeze([1, 2, 3, 4])
const QUARTERS_BY_TERM = Object.freeze({ 1: Object.freeze([1, 2]), 2: Object.freeze([3, 4]) })

export function listClassQuarters(classHeader) {
  if (classHeader === null || typeof classHeader !== 'object') return []
  if (classHeader.school_year?.term_type === TERM_TYPE_TRIMESTER) return []
  if (classHeader.term_number === null || classHeader.term_number === undefined) return [...WHOLE_YEAR_QUARTERS]
  if (!Object.hasOwn(QUARTERS_BY_TERM, classHeader.term_number)) return []
  return [...QUARTERS_BY_TERM[classHeader.term_number]]
}

export function buildQuarterOptions(quarterNumbers) {
  if (!Array.isArray(quarterNumbers)) return []
  return quarterNumbers.map((quarterNumber) => ({
    value: String(quarterNumber),
    label: `Quarter ${quarterNumber}`,
  }))
}

export function pickQuarter(quarterNumbers, queryQuarter) {
  if (!Array.isArray(quarterNumbers) || quarterNumbers.length === 0) return ''
  const isListed = quarterNumbers.some((quarterNumber) => String(quarterNumber) === queryQuarter)
  return isListed ? queryQuarter : String(quarterNumbers[0])
}

export function readClassRecordQuery(routeQuery) {
  return { ...readClassListQuery(routeQuery), quarter: toIdText(routeQuery?.[QUARTER_PARAM]) }
}

export function buildClassRecordQuery(classListFilters, quarter) {
  const classRecordQuery = buildClassListQuery(classListFilters)
  if (quarter) classRecordQuery[QUARTER_PARAM] = String(quarter)
  return classRecordQuery
}
