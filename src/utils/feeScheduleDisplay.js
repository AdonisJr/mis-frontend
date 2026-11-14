import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const ALL_PROGRAMS_LABEL = 'All programs'

export const FEE_SCHEDULE_COLUMNS = Object.freeze(
  [
    { key: 'grade_level', label: 'Grade level' },
    { key: 'program', label: 'Program' },
    { key: 'lines_count', label: 'Lines' },
    { key: 'total', label: 'Total' },
  ].map((column) => Object.freeze(column)),
)

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function isFilledText(textValue) {
  return typeof textValue === 'string' && textValue.trim() !== ''
}

export function formatScheduleGradeLevel(feeSchedule) {
  const gradeLevelName = feeSchedule?.grade_level?.name
  if (!isFilledText(gradeLevelName)) return NO_VALUE_LABEL
  return gradeLevelName
}

export function formatScheduleProgram(feeSchedule) {
  const programCode = feeSchedule?.program?.code
  if (!isFilledText(programCode)) return ALL_PROGRAMS_LABEL
  return programCode
}

export function buildFeeScheduleTitle(feeSchedule) {
  return `${formatScheduleGradeLevel(feeSchedule)} · ${formatScheduleProgram(feeSchedule)}`
}

export function buildFeeScheduleDeleteMessage(feeSchedule) {
  if (!isRecordObject(feeSchedule)) return ''
  return `Delete the ${buildFeeScheduleTitle(feeSchedule)} fee schedule? Its lines are removed. This cannot be undone.`
}

function buildCopiedText(copiedCount) {
  if (copiedCount === 0) return 'No schedules were copied.'
  if (copiedCount === 1) return '1 schedule copied.'
  return `${copiedCount} schedules copied.`
}

function toSkippedRow(skippedRow, rowIndex) {
  const reason = skippedRow?.reason
  return { key: rowIndex, label: buildFeeScheduleTitle(skippedRow), reason: typeof reason === 'string' ? reason : '' }
}

export function normalizeCopyResult(copyResponse) {
  const copiedCount = copyResponse?.copied_count
  const skippedRows = copyResponse?.skipped
  return {
    copiedText: buildCopiedText(Number.isInteger(copiedCount) ? copiedCount : 0),
    skipped: Array.isArray(skippedRows) ? skippedRows.map(toSkippedRow) : [],
  }
}
