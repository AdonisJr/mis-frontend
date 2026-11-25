import { SUBJECT_TYPES, listWeightGroupOptions, toHalfHourUnits } from '@/utils/subjectDisplay.js'

export const SUBJECT_CODE_MAX_LENGTH = 20
export const SUBJECT_NAME_MAX_LENGTH = 150
export const SUBJECT_DESCRIPTION_MAX_LENGTH = 500
export const WEEKLY_HOURS_MIN_UNITS = 1
export const WEEKLY_HOURS_MAX_UNITS = 80

export const SUBJECT_FIELD_LABELS = Object.freeze({
  code: 'Code',
  name: 'Name',
  type: 'Type',
  weight_group: 'Weight group',
  weekly_hours: 'Weekly hours',
  description: 'Description',
})

const HOURS_PATTERN = /^\d+(\.\d+)?$/
const UNITS_PER_HOUR = 2

const CODE_REQUIRED_MESSAGE = 'Code is required.'
const CODE_TOO_LONG_MESSAGE = `Code must be at most ${SUBJECT_CODE_MAX_LENGTH} characters.`
const NAME_REQUIRED_MESSAGE = 'Name is required.'
const NAME_TOO_LONG_MESSAGE = `Name must be at most ${SUBJECT_NAME_MAX_LENGTH} characters.`
const TYPE_REQUIRED_MESSAGE = 'Type is required.'
const WEIGHT_GROUP_REQUIRED_MESSAGE = 'Weight group is required.'
const WEIGHT_GROUP_UNFIT_MESSAGE = 'Choose a weight group that fits the type.'
const HOURS_REQUIRED_MESSAGE = 'Weekly hours are required.'
const HOURS_NUMBER_MESSAGE = 'Weekly hours must be a number.'
const HOURS_RANGE_MESSAGE = 'Weekly hours must be from 0.5 to 40.'
const HOURS_STEP_MESSAGE = 'Weekly hours must be in steps of 0.5.'
const DESCRIPTION_TOO_LONG_MESSAGE = `Description must be at most ${SUBJECT_DESCRIPTION_MAX_LENGTH} characters.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function isSubjectType(typeValue) {
  return SUBJECT_TYPES.includes(typeValue)
}

function isWeightGroupFit(typeValue, weightGroup) {
  return listWeightGroupOptions(typeValue).some((weightOption) => weightOption.value === weightGroup)
}

function findWeightGroupError(formValues) {
  const weightGroup = toTrimmedText(formValues?.weight_group)
  if (weightGroup === '') return WEIGHT_GROUP_REQUIRED_MESSAGE
  if (!isSubjectType(formValues?.type)) return ''
  return isWeightGroupFit(formValues.type, weightGroup) ? '' : WEIGHT_GROUP_UNFIT_MESSAGE
}

function isSubjectObject(subject) {
  return subject !== null && typeof subject === 'object'
}

function buildHoursText(hoursValue) {
  const halfHourUnits = toHalfHourUnits(hoursValue)
  if (halfHourUnits === null) return ''
  return String(halfHourUnits / UNITS_PER_HOUR)
}

function isHoursOutOfRange(hoursNumber) {
  return (
    hoursNumber < WEEKLY_HOURS_MIN_UNITS / UNITS_PER_HOUR || hoursNumber > WEEKLY_HOURS_MAX_UNITS / UNITS_PER_HOUR
  )
}

function findHoursError(hoursValue) {
  const hoursText = toTrimmedText(hoursValue)
  if (hoursText === '') return HOURS_REQUIRED_MESSAGE
  if (!HOURS_PATTERN.test(hoursText)) return HOURS_NUMBER_MESSAGE
  if (isHoursOutOfRange(Number(hoursText))) return HOURS_RANGE_MESSAGE
  if (toHalfHourUnits(hoursText) === null) return HOURS_STEP_MESSAGE
  return ''
}

function findCodeAndNameErrors(formValues) {
  const textErrors = {}
  const codeText = toTrimmedText(formValues?.code)
  const nameText = toTrimmedText(formValues?.name)
  if (codeText === '') textErrors.code = [CODE_REQUIRED_MESSAGE]
  if (codeText.length > SUBJECT_CODE_MAX_LENGTH) textErrors.code = [CODE_TOO_LONG_MESSAGE]
  if (nameText === '') textErrors.name = [NAME_REQUIRED_MESSAGE]
  if (nameText.length > SUBJECT_NAME_MAX_LENGTH) textErrors.name = [NAME_TOO_LONG_MESSAGE]
  return textErrors
}

export function createEmptySubjectForm() {
  return { code: '', name: '', type: '', weight_group: '', weekly_hours: '', description: '' }
}

export function buildFormFromSubject(subject) {
  if (!isSubjectObject(subject)) return createEmptySubjectForm()
  const subjectType = isSubjectType(subject.type) ? subject.type : ''
  return {
    code: subject.code ?? '',
    name: subject.name ?? '',
    type: subjectType,
    weight_group: isWeightGroupFit(subjectType, subject.weight_group) ? subject.weight_group : '',
    weekly_hours: buildHoursText(subject.weekly_hours),
    description: subject.description ?? '',
  }
}

export function applySubjectFormTypeChange(formValues, nextType) {
  const nextForm = { ...formValues, type: nextType }
  if (!isWeightGroupFit(nextType, formValues?.weight_group)) nextForm.weight_group = ''
  return nextForm
}

export function findSubjectFormErrors(formValues) {
  const formErrors = findCodeAndNameErrors(formValues)
  const hoursError = findHoursError(formValues?.weekly_hours)
  const weightGroupError = findWeightGroupError(formValues)
  if (weightGroupError !== '') formErrors.weight_group = [weightGroupError]
  if (!isSubjectType(formValues?.type)) formErrors.type = [TYPE_REQUIRED_MESSAGE]
  if (hoursError !== '') formErrors.weekly_hours = [hoursError]
  if (toTrimmedText(formValues?.description).length > SUBJECT_DESCRIPTION_MAX_LENGTH) {
    formErrors.description = [DESCRIPTION_TOO_LONG_MESSAGE]
  }
  return formErrors
}

export function buildSubjectPayload(formValues) {
  const descriptionText = toTrimmedText(formValues?.description)
  return {
    code: toTrimmedText(formValues?.code),
    name: toTrimmedText(formValues?.name),
    type: toTrimmedText(formValues?.type),
    weight_group: toTrimmedText(formValues?.weight_group),
    weekly_hours: Number(toTrimmedText(formValues?.weekly_hours)),
    description: descriptionText === '' ? null : descriptionText,
  }
}
