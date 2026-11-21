import { formatWeeklyHours } from '@/utils/subjectDisplay.js'

const NO_PART_TEXT = 'none'
const ZERO_HOURS_TEXT = '0'

export function buildCurriculumGroupKey(groupRow) {
  return `${groupRow?.grade_level_id}:${groupRow?.program_id ?? NO_PART_TEXT}:${groupRow?.term_number ?? NO_PART_TEXT}`
}

// the server total is shown as is, so the page does no float math on hours
export function findGroupTotalHours(groupTotals, groupFields) {
  if (!Array.isArray(groupTotals)) return ZERO_HOURS_TEXT
  const groupKey = buildCurriculumGroupKey(groupFields)
  const totalRow = groupTotals.find((groupRow) => buildCurriculumGroupKey(groupRow) === groupKey)
  if (!totalRow) return ZERO_HOURS_TEXT
  return formatWeeklyHours(totalRow.weekly_hours_total)
}
