import { getCategoryLabel } from '@/utils/feeItemForm.js'
import { AMOUNT_MAX_CENTS, formatCentsAsAmount, toCents } from '@/utils/moneyDisplay.js'
import { STAGE_JHS, STAGE_SHS } from '@/utils/programDisplay.js'
import { listSelectablePrograms, listStagePrograms, toIdText, toRecordId } from '@/utils/sectionForm.js'

export const FEE_SCHEDULE_BILLABLE_STAGES = Object.freeze([STAGE_JHS, STAGE_SHS])

export const GRADE_LEVEL_NOT_BILLABLE = 'Choose a JHS or SHS grade level.'
export const PROGRAM_SHS_ONLY = 'Only SHS schedules can have a program.'
export const LINES_REQUIRED = 'Add at least one fee line.'
export const LINE_ITEM_REQUIRED = 'Choose a fee item.'
export const LINE_ITEM_DUPLICATE = 'This fee item is already on the schedule.'
export const AMOUNT_REQUIRED = 'Amount is required.'
export const AMOUNT_INVALID = 'Amount must be greater than 0 with at most two decimals.'
export const AMOUNT_TOO_LARGE = 'Amount must be at most 9,999,999,999.99.'
export const COPY_SOURCE_REQUIRED = 'Choose a source school year.'
export const COPY_SAME_YEAR = 'Choose a school year other than the one you copy into.'

const SCHOOL_YEAR_REQUIRED = 'School year is required.'
const GRADE_LEVEL_REQUIRED = 'Grade level is required.'
const INACTIVE_SUFFIX = ' (inactive)'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function toAmountText(amountValue) {
  if (amountValue === null || amountValue === undefined) return ''
  return String(amountValue).trim()
}

export function listBillableGradeLevels(gradeLevels) {
  if (!Array.isArray(gradeLevels)) return []
  return gradeLevels.filter((gradeLevel) => FEE_SCHEDULE_BILLABLE_STAGES.includes(gradeLevel?.stage))
}

export function isProgramAllowed(gradeLevel) {
  return gradeLevel?.stage === STAGE_SHS
}

export function listScheduleProgramOptions(programs, gradeLevel) {
  if (!isProgramAllowed(gradeLevel)) return []
  return listSelectablePrograms(listStagePrograms(programs, STAGE_SHS), null)
}

export function createEmptyLine() {
  return { fee_item_id: '', amount: '' }
}

export function createEmptyFeeScheduleForm(schoolYearId) {
  return {
    school_year_id: toIdText(schoolYearId),
    grade_level_id: '',
    program_id: '',
    lines: [createEmptyLine()],
  }
}

function buildLineFromFeeScheduleLine(scheduleLine) {
  return { fee_item_id: toIdText(scheduleLine?.fee_item_id), amount: scheduleLine?.amount ?? '' }
}

export function buildFormFromFeeSchedule(feeSchedule) {
  if (!isRecordObject(feeSchedule)) return createEmptyFeeScheduleForm('')
  return {
    school_year_id: toIdText(feeSchedule.school_year_id),
    grade_level_id: toIdText(feeSchedule.grade_level_id),
    program_id: toIdText(feeSchedule.program_id),
    lines: Array.isArray(feeSchedule.lines) ? feeSchedule.lines.map(buildLineFromFeeScheduleLine) : [],
  }
}

export function appendLine(formValues) {
  return { ...formValues, lines: [...formValues.lines, createEmptyLine()] }
}

export function removeLineAt(formValues, lineIndex) {
  const isIndexValid = Number.isInteger(lineIndex) && lineIndex >= 0 && lineIndex < formValues.lines.length
  if (!isIndexValid) return formValues
  return { ...formValues, lines: formValues.lines.filter((_line, index) => index !== lineIndex) }
}

export function clearUnfitScheduleProgram(formValues, gradeLevel) {
  if (isProgramAllowed(gradeLevel)) return formValues
  return { ...formValues, program_id: '' }
}

function findKeyErrors(formValues, gradeLevel) {
  const keyErrors = {}
  const isGradeLevelChosen = isRecordObject(gradeLevel)
  const isProgramChosen = toRecordId(formValues?.program_id) !== null
  if (toRecordId(formValues?.school_year_id) === null) keyErrors.school_year_id = [SCHOOL_YEAR_REQUIRED]
  if (toRecordId(formValues?.grade_level_id) === null) keyErrors.grade_level_id = [GRADE_LEVEL_REQUIRED]
  if (isGradeLevelChosen && !FEE_SCHEDULE_BILLABLE_STAGES.includes(gradeLevel.stage)) {
    keyErrors.grade_level_id = [GRADE_LEVEL_NOT_BILLABLE]
  }
  if (isGradeLevelChosen && isProgramChosen && !isProgramAllowed(gradeLevel)) {
    keyErrors.program_id = [PROGRAM_SHS_ONLY]
  }
  return keyErrors
}

function findAmountError(amountValue) {
  const amountText = toAmountText(amountValue)
  if (amountText === '') return AMOUNT_REQUIRED
  const cents = toCents(amountText)
  if (cents === null || cents <= 0) return AMOUNT_INVALID
  if (cents > AMOUNT_MAX_CENTS) return AMOUNT_TOO_LARGE
  return ''
}

function findLineItemError(lineItemId, seenItemIds) {
  const recordId = toRecordId(lineItemId)
  if (recordId === null) return LINE_ITEM_REQUIRED
  if (seenItemIds.has(recordId)) return LINE_ITEM_DUPLICATE
  seenItemIds.add(recordId)
  return ''
}

function findLineErrors(formValues) {
  const lines = formValues?.lines
  if (!Array.isArray(lines) || lines.length === 0) return { lines: [LINES_REQUIRED] }
  const lineErrors = {}
  const seenItemIds = new Set()
  lines.forEach((line, lineIndex) => {
    const itemError = findLineItemError(line?.fee_item_id, seenItemIds)
    const amountError = findAmountError(line?.amount)
    if (itemError !== '') lineErrors[`lines.${lineIndex}.fee_item_id`] = [itemError]
    if (amountError !== '') lineErrors[`lines.${lineIndex}.amount`] = [amountError]
  })
  return lineErrors
}

export function findFeeScheduleFormErrors(formValues, gradeLevel) {
  return { ...findKeyErrors(formValues, gradeLevel), ...findLineErrors(formValues) }
}

function buildLineSelectionPredicate(usedIdSet, currentId) {
  return (feeItem) => {
    const feeItemId = toRecordId(feeItem?.id)
    if (feeItemId === currentId) return true
    return feeItem?.is_active === true && !usedIdSet.has(feeItemId)
  }
}

function toLineItemOption(feeItem) {
  const suffix = feeItem.is_active === false ? INACTIVE_SUFFIX : ''
  return { id: feeItem.id, label: `${feeItem.name} · ${getCategoryLabel(feeItem.category)}${suffix}` }
}

export function buildLineItemOptions(feeItems, lines) {
  if (!Array.isArray(feeItems) || !Array.isArray(lines)) return []
  const usedIdSet = new Set(lines.map((line) => toRecordId(line?.fee_item_id)).filter((recordId) => recordId !== null))
  return lines.map((line) => {
    const currentId = toRecordId(line?.fee_item_id)
    return feeItems.filter(buildLineSelectionPredicate(usedIdSet, currentId)).map(toLineItemOption)
  })
}

function buildLinePayload(line) {
  return { fee_item_id: toRecordId(line.fee_item_id), amount: formatCentsAsAmount(toCents(toAmountText(line.amount))) }
}

export function buildFeeSchedulePayload(formValues) {
  return {
    school_year_id: toRecordId(formValues?.school_year_id),
    grade_level_id: toRecordId(formValues?.grade_level_id),
    program_id: toRecordId(formValues?.program_id),
    lines: formValues.lines.map(buildLinePayload),
  }
}

export function findCopyFormErrors(sourceSchoolYearId, targetSchoolYearId) {
  const sourceId = toRecordId(sourceSchoolYearId)
  if (sourceId === null) return { source_school_year_id: [COPY_SOURCE_REQUIRED] }
  if (sourceId === toRecordId(targetSchoolYearId)) return { source_school_year_id: [COPY_SAME_YEAR] }
  return {}
}

export function buildCopyPayload(sourceSchoolYearId, targetSchoolYearId) {
  return {
    source_school_year_id: toRecordId(sourceSchoolYearId),
    target_school_year_id: toRecordId(targetSchoolYearId),
  }
}
