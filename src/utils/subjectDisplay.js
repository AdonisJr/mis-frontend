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

export const WEIGHT_GROUP_JHS_LANGUAGES_AP_ESP = 'jhs_languages_ap_esp'
export const WEIGHT_GROUP_JHS_SCIENCE_MATH = 'jhs_science_math'
export const WEIGHT_GROUP_JHS_MAPEH_EPP_TLE = 'jhs_mapeh_epp_tle'
export const WEIGHT_GROUP_SHS_CORE = 'shs_core'
export const WEIGHT_GROUP_SHS_ACADEMIC_OTHER = 'shs_academic_other'
export const WEIGHT_GROUP_SHS_ACADEMIC_IMMERSION_RESEARCH = 'shs_academic_immersion_research'
export const WEIGHT_GROUP_SHS_TVL_SPORTS_ARTS = 'shs_tvl_sports_arts'

export const SUBJECT_WEIGHT_GROUPS = Object.freeze([
  WEIGHT_GROUP_JHS_LANGUAGES_AP_ESP,
  WEIGHT_GROUP_JHS_SCIENCE_MATH,
  WEIGHT_GROUP_JHS_MAPEH_EPP_TLE,
  WEIGHT_GROUP_SHS_CORE,
  WEIGHT_GROUP_SHS_ACADEMIC_OTHER,
  WEIGHT_GROUP_SHS_ACADEMIC_IMMERSION_RESEARCH,
  WEIGHT_GROUP_SHS_TVL_SPORTS_ARTS,
])

export const SUBJECT_WEIGHT_GROUP_LABELS = Object.freeze({
  [WEIGHT_GROUP_JHS_LANGUAGES_AP_ESP]: 'JHS Languages, AP, EsP',
  [WEIGHT_GROUP_JHS_SCIENCE_MATH]: 'JHS Science, Math',
  [WEIGHT_GROUP_JHS_MAPEH_EPP_TLE]: 'JHS MAPEH, EPP/TLE',
  [WEIGHT_GROUP_SHS_CORE]: 'SHS Core',
  [WEIGHT_GROUP_SHS_ACADEMIC_OTHER]: 'SHS Academic (applied, specialized)',
  [WEIGHT_GROUP_SHS_ACADEMIC_IMMERSION_RESEARCH]: 'SHS Academic (immersion, research)',
  [WEIGHT_GROUP_SHS_TVL_SPORTS_ARTS]: 'SHS TVL, Sports, Arts',
})

export const SUBJECT_WEIGHT_GROUP_WEIGHTS = Object.freeze({
  [WEIGHT_GROUP_JHS_LANGUAGES_AP_ESP]: Object.freeze({ ww: 30, pt: 50, qa: 20 }),
  [WEIGHT_GROUP_JHS_SCIENCE_MATH]: Object.freeze({ ww: 40, pt: 40, qa: 20 }),
  [WEIGHT_GROUP_JHS_MAPEH_EPP_TLE]: Object.freeze({ ww: 20, pt: 60, qa: 20 }),
  [WEIGHT_GROUP_SHS_CORE]: Object.freeze({ ww: 25, pt: 50, qa: 25 }),
  [WEIGHT_GROUP_SHS_ACADEMIC_OTHER]: Object.freeze({ ww: 25, pt: 45, qa: 30 }),
  [WEIGHT_GROUP_SHS_ACADEMIC_IMMERSION_RESEARCH]: Object.freeze({ ww: 35, pt: 40, qa: 25 }),
  [WEIGHT_GROUP_SHS_TVL_SPORTS_ARTS]: Object.freeze({ ww: 20, pt: 60, qa: 20 }),
})

const SHS_ELECTIVE_WEIGHT_GROUPS = Object.freeze([
  WEIGHT_GROUP_SHS_ACADEMIC_OTHER,
  WEIGHT_GROUP_SHS_ACADEMIC_IMMERSION_RESEARCH,
  WEIGHT_GROUP_SHS_TVL_SPORTS_ARTS,
])

// mirrors the backend Subject weight-group fit map
export const SUBJECT_TYPE_WEIGHT_GROUPS = Object.freeze({
  [SUBJECT_TYPE_JHS_LEARNING_AREA]: Object.freeze([
    WEIGHT_GROUP_JHS_LANGUAGES_AP_ESP,
    WEIGHT_GROUP_JHS_SCIENCE_MATH,
    WEIGHT_GROUP_JHS_MAPEH_EPP_TLE,
  ]),
  [SUBJECT_TYPE_SHS_CORE]: Object.freeze([WEIGHT_GROUP_SHS_CORE]),
  [SUBJECT_TYPE_SHS_APPLIED]: SHS_ELECTIVE_WEIGHT_GROUPS,
  [SUBJECT_TYPE_SHS_SPECIALIZED]: SHS_ELECTIVE_WEIGHT_GROUPS,
})

export const SUBJECT_COLUMNS = Object.freeze(
  [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'weight_group', label: 'Weight group' },
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

function buildWeightGroupLabel(weightGroup) {
  const { ww, pt, qa } = SUBJECT_WEIGHT_GROUP_WEIGHTS[weightGroup]
  return `${SUBJECT_WEIGHT_GROUP_LABELS[weightGroup]} (${ww}/${pt}/${qa})`
}

export function listWeightGroupOptions(type) {
  if (typeof type !== 'string' || !Object.hasOwn(SUBJECT_TYPE_WEIGHT_GROUPS, type)) return []
  return SUBJECT_TYPE_WEIGHT_GROUPS[type].map((weightGroup) => ({
    value: weightGroup,
    label: buildWeightGroupLabel(weightGroup),
  }))
}

export function getWeightGroupLabel(weightGroup) {
  if (typeof weightGroup !== 'string') return ''
  if (!Object.hasOwn(SUBJECT_WEIGHT_GROUP_LABELS, weightGroup)) return weightGroup
  return SUBJECT_WEIGHT_GROUP_LABELS[weightGroup]
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
