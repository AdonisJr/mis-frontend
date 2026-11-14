import { AMOUNT_INVALID, AMOUNT_REQUIRED, AMOUNT_TOO_LARGE } from '@/utils/feeScheduleForm.js'
import { AMOUNT_MAX_CENTS, formatCentsAsAmount, toCents } from '@/utils/moneyDisplay.js'
import {
  ADJUSTMENT_PERCENT_MESSAGE,
  DESCRIPTION_TOO_LONG_MESSAGE,
  NAME_REQUIRED_MESSAGE,
  NAME_TOO_LONG_MESSAGE,
  PERCENT_REQUIRED_MESSAGE,
  VALUE_TYPE_FIXED,
  VALUE_TYPE_PERCENT,
} from '@/utils/paymentPlanForm.js'
import { STAGE_JHS, STAGE_SHS, getStageLabel } from '@/utils/programDisplay.js'

export const SOURCE_GOVERNMENT = 'government'
export const SOURCE_SCHOOL = 'school'
export const DISCOUNT_SOURCE_OPTIONS = Object.freeze([
  Object.freeze({ value: SOURCE_GOVERNMENT, label: 'Government' }),
  Object.freeze({ value: SOURCE_SCHOOL, label: 'School' }),
])
export const BASE_TUITION = 'tuition'
export const BASE_TOTAL = 'total'
export const DISCOUNT_BASE_OPTIONS = Object.freeze([
  Object.freeze({ value: BASE_TUITION, label: 'Tuition' }),
  Object.freeze({ value: BASE_TOTAL, label: 'Total' }),
])
export const DISCOUNT_STAGES = Object.freeze([STAGE_JHS, STAGE_SHS])
export const DISCOUNT_STAGE_OPTIONS = Object.freeze(
  DISCOUNT_STAGES.map((stage) => Object.freeze({ value: stage, label: getStageLabel(stage) })),
)
export const DISCOUNT_TYPE_NAME_MAX_LENGTH = 100
export const DISCOUNT_TYPE_DESCRIPTION_MAX_LENGTH = 1000

export const SOURCE_REQUIRED_MESSAGE = 'Choose a source.'
export const BASE_REQUIRED_MESSAGE = 'Choose a base.'
export const VALUE_TYPE_REQUIRED_MESSAGE = 'Choose a value type.'
export const STAGES_REQUIRED_MESSAGE = 'Choose at least one stage (JHS or SHS).'
export const STAGE_INVALID_MESSAGE = 'Only JHS and SHS can be chosen.'

const PERCENT_MAX_HUNDREDTHS = 10000
const SOURCE_VALUES = DISCOUNT_SOURCE_OPTIONS.map((option) => option.value)
const BASE_VALUES = DISCOUNT_BASE_OPTIONS.map((option) => option.value)

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function toText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function toCanonicalStages(stages) {
  return DISCOUNT_STAGES.filter((stage) => stages.includes(stage))
}

export function createEmptyDiscountTypeForm() {
  return { name: '', description: '', source: '', value_type: '', value: '', base: '', stages: [] }
}

export function buildFormFromDiscountType(discountType) {
  if (!isRecordObject(discountType)) return createEmptyDiscountTypeForm()
  return {
    name: discountType.name ?? '',
    description: discountType.description ?? '',
    source: discountType.source ?? '',
    value_type: discountType.value_type ?? '',
    value: discountType.value ?? '',
    base: discountType.base ?? '',
    stages: Array.isArray(discountType.stages) ? toCanonicalStages(discountType.stages) : [],
  }
}

export function toggleDiscountStage(stages, stage) {
  const knownStages = Array.isArray(stages) ? toCanonicalStages(stages) : []
  if (!DISCOUNT_STAGES.includes(stage)) return knownStages
  if (knownStages.includes(stage)) return knownStages.filter((knownStage) => knownStage !== stage)
  return toCanonicalStages([...knownStages, stage])
}

function findFixedValueError(valueText) {
  const cents = toCents(valueText)
  if (cents === null || cents <= 0) return AMOUNT_INVALID
  if (cents > AMOUNT_MAX_CENTS) return AMOUNT_TOO_LARGE
  return ''
}

function findPercentValueError(valueText) {
  const hundredths = toCents(valueText)
  const isValid = hundredths !== null && hundredths >= 1 && hundredths <= PERCENT_MAX_HUNDREDTHS
  return isValid ? '' : ADJUSTMENT_PERCENT_MESSAGE
}

function findValueError(valueType, valueText) {
  const trimmedText = toText(valueText)
  const isFixed = valueType === VALUE_TYPE_FIXED
  if (trimmedText === '') return isFixed ? AMOUNT_REQUIRED : PERCENT_REQUIRED_MESSAGE
  return isFixed ? findFixedValueError(trimmedText) : findPercentValueError(trimmedText)
}

function findNameErrors(formValues) {
  const nameText = toText(formValues?.name)
  const nameErrors = {}
  if (nameText === '') nameErrors.name = [NAME_REQUIRED_MESSAGE]
  if (nameText.length > DISCOUNT_TYPE_NAME_MAX_LENGTH) nameErrors.name = [NAME_TOO_LONG_MESSAGE]
  if (toText(formValues?.description).length > DISCOUNT_TYPE_DESCRIPTION_MAX_LENGTH) {
    nameErrors.description = [DESCRIPTION_TOO_LONG_MESSAGE]
  }
  return nameErrors
}

function findChoiceErrors(formValues) {
  const choiceErrors = {}
  if (!SOURCE_VALUES.includes(formValues?.source)) choiceErrors.source = [SOURCE_REQUIRED_MESSAGE]
  if (!BASE_VALUES.includes(formValues?.base)) choiceErrors.base = [BASE_REQUIRED_MESSAGE]
  return choiceErrors
}

function findValueErrors(formValues) {
  const valueType = formValues?.value_type
  if (valueType !== VALUE_TYPE_FIXED && valueType !== VALUE_TYPE_PERCENT) {
    return { value_type: [VALUE_TYPE_REQUIRED_MESSAGE] }
  }
  const valueError = findValueError(valueType, formValues.value)
  return valueError === '' ? {} : { value: [valueError] }
}

function findStageErrors(formValues) {
  const stages = formValues?.stages
  if (!Array.isArray(stages) || stages.length === 0) return { stages: [STAGES_REQUIRED_MESSAGE] }
  if (stages.some((stage) => !DISCOUNT_STAGES.includes(stage))) return { stages: [STAGE_INVALID_MESSAGE] }
  return {}
}

export function findDiscountTypeFormErrors(formValues) {
  return {
    ...findNameErrors(formValues),
    ...findChoiceErrors(formValues),
    ...findValueErrors(formValues),
    ...findStageErrors(formValues),
  }
}

export function buildDiscountTypePayload(formValues) {
  const descriptionText = toText(formValues.description)
  return {
    name: toText(formValues.name),
    description: descriptionText === '' ? null : descriptionText,
    source: formValues.source,
    value_type: formValues.value_type,
    value: formatCentsAsAmount(toCents(toText(formValues.value))),
    base: formValues.base,
    stages: toCanonicalStages(formValues.stages),
  }
}
