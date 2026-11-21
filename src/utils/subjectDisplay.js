import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { STAGE_JHS, STAGE_SHS } from '@/utils/programDisplay.js'

export const SUBJECT_TYPE_JHS_LEARNING_AREA = 'jhs_learning_area'
export const SUBJECT_TYPE_SHS_CORE = 'shs_core'
export const SUBJECT_TYPE_SHS_APPLIED = 'shs_applied'
export const SUBJECT_TYPE_SHS_SPECIALIZED = 'shs_specialized'

export const SUBJECT_TYPES = Object.freeze([
  SUBJECT_TYPE_JHS_LEARNING_AREA,
  SUBJECT_TYPE_SHS_CORE,
  SUBJECT_TYPE_SHS_APPLIED,
  SUBJECT_TYPE_SHS_SPECIALIZED,
])

export const SUBJECT_TYPE_LABELS = Object.freeze({
  [SUBJECT_TYPE_JHS_LEARNING_AREA]: 'JHS learning area',
  [SUBJECT_TYPE_SHS_CORE]: 'SHS core',
  [SUBJECT_TYPE_SHS_APPLIED]: 'SHS applied',
  [SUBJECT_TYPE_SHS_SPECIALIZED]: 'SHS specialized',
})

export const SUBJECT_TYPE_OPTIONS = Object.freeze(
  SUBJECT_TYPES.map((typeValue) => Object.freeze({ value: typeValue, label: SUBJECT_TYPE_LABELS[typeValue] })),
)

// mirrors the backend Subject::TYPE_STAGES
export const SUBJECT_TYPE_STAGES = Object.freeze({
  [SUBJECT_TYPE_JHS_LEARNING_AREA]: STAGE_JHS,
  [SUBJECT_TYPE_SHS_CORE]: STAGE_SHS,
  [SUBJECT_TYPE_SHS_APPLIED]: STAGE_SHS,
  [SUBJECT_TYPE_SHS_SPECIALIZED]: STAGE_SHS,
})

export const SUBJECT_COLUMNS = Object.freeze(
  [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'weekly_hours', label: 'Weekly hours' },
    { key: 'is_active', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

const HOURS_PATTERN = /^\d+(\.\d+)?$/
const UNITS_PER_HOUR = 2

function isSubjectObject(subject) {
  return subject !== null && typeof subject === 'object'
}

export function getSubjectTypeLabel(type) {
  if (typeof type !== 'string') return ''
  if (!Object.hasOwn(SUBJECT_TYPE_LABELS, type)) return type
  return SUBJECT_TYPE_LABELS[type]
}

export function getSubjectTypeStage(type) {
  if (typeof type !== 'string') return ''
  if (!Object.hasOwn(SUBJECT_TYPE_STAGES, type)) return ''
  return SUBJECT_TYPE_STAGES[type]
}

// hours are compared as integer half-hour units so no float sum or rounding ever decides validity
export function toHalfHourUnits(hoursValue) {
  if (hoursValue === null || hoursValue === undefined) return null
  const hoursText = String(hoursValue).trim()
  if (!HOURS_PATTERN.test(hoursText)) return null
  const halfHourUnits = Number(hoursText) * UNITS_PER_HOUR
  return Number.isInteger(halfHourUnits) ? halfHourUnits : null
}

export function formatWeeklyHours(hoursValue) {
  const halfHourUnits = toHalfHourUnits(hoursValue)
  if (halfHourUnits === null) return NO_VALUE_LABEL
  return String(halfHourUnits / UNITS_PER_HOUR)
}

export function buildSubjectDeactivateMessage(subject) {
  if (!isSubjectObject(subject)) return ''
  return `Deactivate ${subject.code} (${subject.name})? It stays in the list and existing curriculum entries, but it cannot be added to a curriculum.`
}

export function buildSubjectReactivateMessage(subject) {
  if (!isSubjectObject(subject)) return ''
  return `Reactivate ${subject.code} (${subject.name})? It can be added to curricula again.`
}
