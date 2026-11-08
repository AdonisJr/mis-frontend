import { PROGRAM_STAGE_LABELS, STAGE_COLLEGE, STAGE_SHS } from '@/utils/programDisplay.js'

export const PROGRAM_CODE_MAX_LENGTH = 20
export const PROGRAM_DESCRIPTION_MAX_LENGTH = 1000

export const PROGRAM_STAGE_OPTIONS = Object.freeze(
  [STAGE_SHS, STAGE_COLLEGE].map((stageValue) =>
    Object.freeze({ value: stageValue, label: PROGRAM_STAGE_LABELS[stageValue] }),
  ),
)

export const PROGRAM_FIELD_LABELS = Object.freeze({
  code: 'Code',
  name: 'Name',
  stage: 'Stage',
  description: 'Description',
})

const PROGRAM_STAGE_VALUES = Object.freeze(PROGRAM_STAGE_OPTIONS.map((stageOption) => stageOption.value))
const REQUIRED_TEXT_FIELDS = Object.freeze(['code', 'name'])

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function buildRequiredMessage(fieldKey) {
  return `${PROGRAM_FIELD_LABELS[fieldKey]} is required.`
}

function isProgramStage(stageValue) {
  return PROGRAM_STAGE_VALUES.includes(stageValue)
}

export function createEmptyProgramForm() {
  return { code: '', name: '', stage: '', description: '' }
}

export function buildFormFromProgram(program) {
  if (program === null || typeof program !== 'object') return createEmptyProgramForm()
  return {
    code: program.code ?? '',
    name: program.name ?? '',
    stage: isProgramStage(program.stage) ? program.stage : '',
    description: program.description ?? '',
  }
}

export function findProgramFormErrors(formValues) {
  const formErrors = {}
  for (const fieldKey of REQUIRED_TEXT_FIELDS) {
    if (toTrimmedText(formValues?.[fieldKey]) === '') formErrors[fieldKey] = [buildRequiredMessage(fieldKey)]
  }
  if (!isProgramStage(formValues?.stage)) formErrors.stage = [buildRequiredMessage('stage')]
  return formErrors
}

export function buildProgramPayload(formValues) {
  const trimmedDescription = toTrimmedText(formValues?.description)
  return {
    code: toTrimmedText(formValues?.code).toUpperCase(),
    name: toTrimmedText(formValues?.name),
    stage: toTrimmedText(formValues?.stage),
    description: trimmedDescription === '' ? null : trimmedDescription,
  }
}
