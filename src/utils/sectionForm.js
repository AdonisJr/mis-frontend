import { STAGE_JHS } from '@/utils/programDisplay.js'

export const SECTION_NAME_MAX_LENGTH = 255
export const SECTION_ROOM_MAX_LENGTH = 255
export const SECTION_CAPACITY_MIN = 1
export const SECTION_CAPACITY_MAX = 2147483647

export const SECTION_FIELD_LABELS = Object.freeze({
  school_year_id: 'School year',
  grade_level_id: 'Grade level',
  program_id: 'Program',
  name: 'Name',
  capacity: 'Capacity',
  room: 'Room',
})

const RECORD_ID_PATTERN = /^[1-9]\d*$/
const WHOLE_NUMBER_PATTERN = /^\d+$/

const PROGRAM_FORBIDDEN_MESSAGE = 'JHS sections have no program.'
const PROGRAM_REQUIRED_MESSAGE = 'Program is required for this grade level.'
const PROGRAM_UNAVAILABLE_MESSAGE = "Choose an active program of this grade level's stage."
const NAME_TOO_LONG_MESSAGE = 'Name must be at most 255 characters.'
const ROOM_TOO_LONG_MESSAGE = 'Room must be at most 255 characters.'
const CAPACITY_WHOLE_MESSAGE = 'Capacity must be a whole number of at least 1.'
const CAPACITY_MAX_MESSAGE = `Capacity must be at most ${SECTION_CAPACITY_MAX}.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function buildRequiredMessage(fieldKey) {
  return `${SECTION_FIELD_LABELS[fieldKey]} is required.`
}

export function toRecordId(idValue) {
  if (Number.isInteger(idValue) && idValue > 0) return idValue
  if (typeof idValue !== 'string') return null
  const trimmedId = idValue.trim()
  if (!RECORD_ID_PATTERN.test(trimmedId)) return null
  return Number(trimmedId)
}

export function toIdText(idValue) {
  const recordId = toRecordId(idValue)
  if (recordId === null) return ''
  return String(recordId)
}

export function createEmptySectionForm(schoolYearId) {
  return {
    school_year_id: toIdText(schoolYearId),
    grade_level_id: '',
    program_id: '',
    name: '',
    capacity: '',
    room: '',
  }
}

export function buildFormFromSection(section) {
  if (section === null || typeof section !== 'object') return createEmptySectionForm('')
  return {
    school_year_id: toIdText(section.school_year_id),
    grade_level_id: toIdText(section.grade_level_id),
    program_id: toIdText(section.program_id),
    name: section.name ?? '',
    capacity: Number.isInteger(section.capacity) ? String(section.capacity) : '',
    room: section.room ?? '',
  }
}

export function findGradeLevel(gradeLevels, gradeLevelId) {
  const recordId = toRecordId(gradeLevelId)
  if (!Array.isArray(gradeLevels) || recordId === null) return null
  return gradeLevels.find((gradeLevel) => gradeLevel.id === recordId) ?? null
}

export function listStagePrograms(programs, stage) {
  if (!Array.isArray(programs)) return []
  if (typeof stage !== 'string' || stage === '') return programs
  return programs.filter((program) => program.stage === stage)
}

export function listSelectablePrograms(stagePrograms, currentProgramId) {
  if (!Array.isArray(stagePrograms)) return []
  const currentRecordId = toRecordId(currentProgramId)
  return stagePrograms.filter((program) => program.is_active === true || program.id === currentRecordId)
}

export function buildSectionProgramRule(gradeLevel, selectablePrograms) {
  return {
    isGradeLevelChosen: gradeLevel !== null && typeof gradeLevel === 'object',
    isProgramForbidden: gradeLevel?.stage === STAGE_JHS,
    programIds: Array.isArray(selectablePrograms) ? selectablePrograms.map((program) => program.id) : [],
  }
}

// the backend skips program rules when grade_level_id failed, so only the grade level error shows
function findProgramError(formValues, programRule) {
  if (!programRule?.isGradeLevelChosen) return ''
  const programId = toRecordId(formValues?.program_id)
  if (programRule.isProgramForbidden && programId !== null) return PROGRAM_FORBIDDEN_MESSAGE
  if (programRule.isProgramForbidden) return ''
  if (programId === null) return PROGRAM_REQUIRED_MESSAGE
  if (!programRule.programIds.includes(programId)) return PROGRAM_UNAVAILABLE_MESSAGE
  return ''
}

function findCapacityError(capacityValue) {
  const capacityText = toTrimmedText(capacityValue)
  if (capacityText === '') return buildRequiredMessage('capacity')
  if (!WHOLE_NUMBER_PATTERN.test(capacityText) || Number(capacityText) < SECTION_CAPACITY_MIN) {
    return CAPACITY_WHOLE_MESSAGE
  }
  if (Number(capacityText) > SECTION_CAPACITY_MAX) return CAPACITY_MAX_MESSAGE
  return ''
}

export function findSectionFormErrors(formValues, programRule) {
  const formErrors = {}
  const trimmedName = toTrimmedText(formValues?.name)
  const programError = findProgramError(formValues, programRule)
  const capacityError = findCapacityError(formValues?.capacity)
  if (toRecordId(formValues?.school_year_id) === null) formErrors.school_year_id = [buildRequiredMessage('school_year_id')]
  if (toRecordId(formValues?.grade_level_id) === null) formErrors.grade_level_id = [buildRequiredMessage('grade_level_id')]
  if (programError !== '') formErrors.program_id = [programError]
  if (trimmedName === '') formErrors.name = [buildRequiredMessage('name')]
  if (trimmedName.length > SECTION_NAME_MAX_LENGTH) formErrors.name = [NAME_TOO_LONG_MESSAGE]
  if (capacityError !== '') formErrors.capacity = [capacityError]
  if (toTrimmedText(formValues?.room).length > SECTION_ROOM_MAX_LENGTH) formErrors.room = [ROOM_TOO_LONG_MESSAGE]
  return formErrors
}

export function clearUnfitProgram(formValues, programRule) {
  const programId = toRecordId(formValues?.program_id)
  if (programId === null) return formValues
  if (!programRule?.isProgramForbidden && programRule?.programIds?.includes(programId)) return formValues
  return { ...formValues, program_id: '' }
}

export function buildSectionPayload(formValues) {
  const trimmedRoom = toTrimmedText(formValues?.room)
  return {
    school_year_id: toRecordId(formValues?.school_year_id),
    grade_level_id: toRecordId(formValues?.grade_level_id),
    program_id: toRecordId(formValues?.program_id),
    name: toTrimmedText(formValues?.name),
    capacity: Number(toTrimmedText(formValues?.capacity)),
    room: trimmedRoom === '' ? null : trimmedRoom,
  }
}
