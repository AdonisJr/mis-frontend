import { AMOUNT_INVALID, AMOUNT_REQUIRED, AMOUNT_TOO_LARGE } from '@/utils/feeScheduleForm.js'
import { AMOUNT_MAX_CENTS, formatCentsAsAmount, toCents } from '@/utils/moneyDisplay.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const PAYMENT_PLAN_MAX_INSTALLMENTS = 12
export const PAYMENT_PLAN_NAME_MAX_LENGTH = 100
export const PAYMENT_PLAN_DESCRIPTION_MAX_LENGTH = 1000
export const VALUE_TYPE_FIXED = 'fixed'
export const VALUE_TYPE_PERCENT = 'percent'
export const VALUE_TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: VALUE_TYPE_FIXED, label: 'Fixed amount (₱)' }),
  Object.freeze({ value: VALUE_TYPE_PERCENT, label: 'Percent (%)' }),
])
export const ADJUSTMENT_KIND_DISCOUNT = 'discount'
export const ADJUSTMENT_KIND_SURCHARGE = 'surcharge'

export const SCHOOL_YEAR_REQUIRED_MESSAGE = 'School year is required.'
export const NAME_REQUIRED_MESSAGE = 'Name is required.'
export const NAME_TOO_LONG_MESSAGE = `Name must be at most ${PAYMENT_PLAN_NAME_MAX_LENGTH} characters.`
export const DESCRIPTION_TOO_LONG_MESSAGE = `Description must be at most ${PAYMENT_PLAN_DESCRIPTION_MAX_LENGTH} characters.`
export const TOO_MANY_INSTALLMENTS_MESSAGE = `A plan can have at most ${PAYMENT_PLAN_MAX_INSTALLMENTS} installments.`
export const DUE_DATE_INVALID_MESSAGE = 'Enter a valid due date.'
export const DUE_DATE_OUTSIDE_MESSAGE = 'Due date must be within the school year.'
export const DUE_DATE_DUPLICATE_MESSAGE = 'Due dates must be distinct.'
export const DUE_DATE_ORDER_MESSAGE = 'Each due date must be after the one above it.'
export const DOWN_PAYMENT_TYPE_MESSAGE = 'Choose a down payment type.'
export const ADJUSTMENT_TYPE_MESSAGE = 'Choose an adjustment type.'
export const PERCENT_REQUIRED_MESSAGE = 'Percent is required.'
export const DOWN_PAYMENT_PERCENT_MESSAGE =
  'Percent must be greater than 0 and less than 100, with at most two decimals.'
export const ADJUSTMENT_PERCENT_MESSAGE = 'Percent must be greater than 0 and at most 100, with at most two decimals.'

const DOWN_PAYMENT_PERCENT_MAX_HUNDREDTHS = 9999
const ADJUSTMENT_PERCENT_MAX_HUNDREDTHS = 10000
const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const VALUE_TYPES = VALUE_TYPE_OPTIONS.map((option) => option.value)
const DISCOUNT_OPTIONS = Object.freeze([{ value: ADJUSTMENT_KIND_DISCOUNT, label: 'Full-payment discount' }])
const SURCHARGE_OPTIONS = Object.freeze([{ value: ADJUSTMENT_KIND_SURCHARGE, label: 'Installment surcharge' }])

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function toText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function listDueDates(formValues) {
  return Array.isArray(formValues?.due_dates) ? formValues.due_dates : []
}

export function createEmptyPaymentPlanForm(schoolYearId) {
  return {
    school_year_id: toIdText(schoolYearId),
    name: '',
    description: '',
    due_dates: [],
    down_payment_type: '',
    down_payment_value: '',
    adjustment_kind: '',
    adjustment_type: '',
    adjustment_value: '',
  }
}

function listSortedDueDates(installments) {
  if (!Array.isArray(installments)) return []
  return [...installments].sort((first, second) => first.sequence - second.sequence).map((row) => row.due_date)
}

export function buildFormFromPaymentPlan(paymentPlan) {
  if (!isRecordObject(paymentPlan)) return createEmptyPaymentPlanForm('')
  return {
    school_year_id: toIdText(paymentPlan.school_year_id),
    name: paymentPlan.name ?? '',
    description: paymentPlan.description ?? '',
    due_dates: listSortedDueDates(paymentPlan.installments),
    down_payment_type: paymentPlan.down_payment?.type ?? '',
    down_payment_value: paymentPlan.down_payment?.value ?? '',
    adjustment_kind: paymentPlan.adjustment?.kind ?? '',
    adjustment_type: paymentPlan.adjustment?.type ?? '',
    adjustment_value: paymentPlan.adjustment?.value ?? '',
  }
}

export function appendDueDate(formValues) {
  if (formValues.due_dates.length >= PAYMENT_PLAN_MAX_INSTALLMENTS) return formValues
  return { ...formValues, due_dates: [...formValues.due_dates, ''] }
}

export function removeDueDateAt(formValues, dateIndex) {
  const isIndexValid = Number.isInteger(dateIndex) && dateIndex >= 0 && dateIndex < formValues.due_dates.length
  if (!isIndexValid) return formValues
  return { ...formValues, due_dates: formValues.due_dates.filter((_date, index) => index !== dateIndex) }
}

export function listAdjustmentKindOptions(dueDateCount) {
  if (!Number.isInteger(dueDateCount) || dueDateCount < 0) return []
  return dueDateCount === 0 ? DISCOUNT_OPTIONS : SURCHARGE_OPTIONS
}

export function clearUnfitPlanFields(formValues) {
  const dueDateCount = listDueDates(formValues).length
  const keptKinds = listAdjustmentKindOptions(dueDateCount).map((option) => option.value)
  const clearedFields = {}
  if (dueDateCount === 0 && (formValues.down_payment_type !== '' || formValues.down_payment_value !== '')) {
    Object.assign(clearedFields, { down_payment_type: '', down_payment_value: '' })
  }
  if (formValues.adjustment_kind !== '' && !keptKinds.includes(formValues.adjustment_kind)) {
    Object.assign(clearedFields, { adjustment_kind: '', adjustment_type: '', adjustment_value: '' })
  }
  if (Object.keys(clearedFields).length === 0) return formValues
  return { ...formValues, ...clearedFields }
}

function findPlanKeyErrors(formValues) {
  const keyErrors = {}
  const nameText = toText(formValues?.name)
  if (toRecordId(formValues?.school_year_id) === null) keyErrors.school_year_id = [SCHOOL_YEAR_REQUIRED_MESSAGE]
  if (nameText === '') keyErrors.name = [NAME_REQUIRED_MESSAGE]
  if (nameText.length > PAYMENT_PLAN_NAME_MAX_LENGTH) keyErrors.name = [NAME_TOO_LONG_MESSAGE]
  if (toText(formValues?.description).length > PAYMENT_PLAN_DESCRIPTION_MAX_LENGTH) {
    keyErrors.description = [DESCRIPTION_TOO_LONG_MESSAGE]
  }
  return keyErrors
}

function isOutsideSchoolYear(dueDate, schoolYear) {
  if (!isRecordObject(schoolYear)) return false
  return dueDate < schoolYear.start_date || dueDate > schoolYear.end_date
}

function findDueDateError(dueDate, dateContext) {
  if (typeof dueDate !== 'string' || !DUE_DATE_PATTERN.test(dueDate)) return DUE_DATE_INVALID_MESSAGE
  if (isOutsideSchoolYear(dueDate, dateContext.schoolYear)) return DUE_DATE_OUTSIDE_MESSAGE
  if (dueDate === dateContext.previousDate) return DUE_DATE_DUPLICATE_MESSAGE
  if (dueDate < dateContext.previousDate) return DUE_DATE_ORDER_MESSAGE
  return ''
}

function findDueDateErrors(formValues, schoolYear) {
  const dueDates = listDueDates(formValues)
  if (dueDates.length > PAYMENT_PLAN_MAX_INSTALLMENTS) return { due_dates: [TOO_MANY_INSTALLMENTS_MESSAGE] }
  const dueDateErrors = {}
  let previousDate = ''
  dueDates.forEach((dueDate, dateIndex) => {
    const dueDateError = findDueDateError(dueDate, { previousDate, schoolYear })
    if (dueDateError === '') previousDate = dueDate
    else dueDateErrors[`due_dates.${dateIndex}`] = [dueDateError]
  })
  return dueDateErrors
}

function findFixedValueError(valueText) {
  const cents = toCents(valueText)
  if (cents === null || cents <= 0) return AMOUNT_INVALID
  if (cents > AMOUNT_MAX_CENTS) return AMOUNT_TOO_LARGE
  return ''
}

function findPercentValueError(valueText, percentMaxHundredths) {
  const hundredths = toCents(valueText)
  const isValid = hundredths !== null && hundredths >= 1 && hundredths <= percentMaxHundredths
  if (isValid) return ''
  return percentMaxHundredths === DOWN_PAYMENT_PERCENT_MAX_HUNDREDTHS
    ? DOWN_PAYMENT_PERCENT_MESSAGE
    : ADJUSTMENT_PERCENT_MESSAGE
}

// percentMaxHundredths is null for a fixed amount, else the largest allowed percent in hundredths
function findValueError(valueText, percentMaxHundredths) {
  const isFixed = percentMaxHundredths === null
  const trimmedText = toText(valueText)
  if (trimmedText === '') return isFixed ? AMOUNT_REQUIRED : PERCENT_REQUIRED_MESSAGE
  if (isFixed) return findFixedValueError(trimmedText)
  return findPercentValueError(trimmedText, percentMaxHundredths)
}

function pickPercentMax(valueType, percentMaxHundredths) {
  return valueType === VALUE_TYPE_PERCENT ? percentMaxHundredths : null
}

function findDownPaymentErrors(formValues) {
  if (listDueDates(formValues).length === 0) return {}
  if (!VALUE_TYPES.includes(formValues.down_payment_type)) return { 'down_payment.type': [DOWN_PAYMENT_TYPE_MESSAGE] }
  const percentMax = pickPercentMax(formValues.down_payment_type, DOWN_PAYMENT_PERCENT_MAX_HUNDREDTHS)
  const valueError = findValueError(formValues.down_payment_value, percentMax)
  return valueError === '' ? {} : { 'down_payment.value': [valueError] }
}

function findAdjustmentErrors(formValues) {
  if (toText(formValues?.adjustment_kind) === '') return {}
  if (!VALUE_TYPES.includes(formValues.adjustment_type)) return { 'adjustment.type': [ADJUSTMENT_TYPE_MESSAGE] }
  const percentMax = pickPercentMax(formValues.adjustment_type, ADJUSTMENT_PERCENT_MAX_HUNDREDTHS)
  const valueError = findValueError(formValues.adjustment_value, percentMax)
  return valueError === '' ? {} : { 'adjustment.value': [valueError] }
}

export function findPaymentPlanFormErrors(formValues, schoolYear) {
  const fitValues = clearUnfitPlanFields(formValues)
  return {
    ...findPlanKeyErrors(fitValues),
    ...findDueDateErrors(fitValues, schoolYear),
    ...findDownPaymentErrors(fitValues),
    ...findAdjustmentErrors(fitValues),
  }
}

function buildValuePayload(valueText) {
  return formatCentsAsAmount(toCents(toText(valueText)))
}

function buildDownPaymentPayload(formValues) {
  if (listDueDates(formValues).length === 0 || formValues.down_payment_type === '') return null
  return { type: formValues.down_payment_type, value: buildValuePayload(formValues.down_payment_value) }
}

function buildAdjustmentPayload(formValues) {
  if (formValues.adjustment_kind === '') return null
  return {
    kind: formValues.adjustment_kind,
    type: formValues.adjustment_type,
    value: buildValuePayload(formValues.adjustment_value),
  }
}

export function buildPaymentPlanPayload(formValues) {
  const fitValues = clearUnfitPlanFields(formValues)
  const descriptionText = toText(fitValues.description)
  return {
    school_year_id: toRecordId(fitValues.school_year_id),
    name: toText(fitValues.name),
    description: descriptionText === '' ? null : descriptionText,
    due_dates: listDueDates(fitValues).map(toText),
    down_payment: buildDownPaymentPayload(fitValues),
    adjustment: buildAdjustmentPayload(fitValues),
  }
}
