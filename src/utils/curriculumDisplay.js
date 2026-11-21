import { formatWeeklyHours, getSubjectTypeLabel } from '@/utils/subjectDisplay.js'

export const CURRICULUM_COLUMNS = Object.freeze(
  [
    { key: 'position', label: '#' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Subject' },
    { key: 'type', label: 'Type' },
    { key: 'weekly_hours', label: 'Weekly hours' },
  ].map((column) => Object.freeze(column)),
)

const SINGLE_COUNT = 1

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function toCount(countValue) {
  return Number.isInteger(countValue) ? countValue : 0
}

function findSkippedCount(copyResponse) {
  if (Number.isInteger(copyResponse?.skipped_count)) return copyResponse.skipped_count
  if (Array.isArray(copyResponse?.skipped)) return copyResponse.skipped.length
  return 0
}

function buildCountText(countValue, noun) {
  if (countValue === 0) return `No entries were ${noun}.`
  if (countValue === SINGLE_COUNT) return `1 entry ${noun}.`
  return `${countValue} entries ${noun}.`
}

export function buildSubjectOptionLabel(subject) {
  if (!isRecordObject(subject)) return ''
  return `${subject.code} — ${subject.name} · ${getSubjectTypeLabel(subject.type)} · ${formatWeeklyHours(subject.weekly_hours)} h`
}

export function buildRemoveEntryMessage(entry) {
  if (!isRecordObject(entry)) return ''
  return `Remove ${entry.subject?.code} (${entry.subject?.name}) from this curriculum group? You can add it again later.`
}

export function normalizeCurriculumCopyResult(copyResponse) {
  return {
    copiedText: buildCountText(toCount(copyResponse?.copied_count), 'copied'),
    skippedText: buildCountText(findSkippedCount(copyResponse), 'skipped'),
  }
}

export function buildCopyToastText(copyResult) {
  return `${copyResult.copiedText} ${copyResult.skippedText}`
}
