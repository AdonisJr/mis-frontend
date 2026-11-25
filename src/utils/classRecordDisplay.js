import { COMPONENTS, computeQuarterGrade, formatHundredths, sumComponentTotals } from '@/utils/gradeComputation.js'
import { buildCellKey, findScoreError } from '@/utils/scoreGrid.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const COMPONENT_LABELS = Object.freeze({
  ww: 'Written work',
  pt: 'Performance task',
  qa: 'Quarterly assessment',
})

export const GRADE_COLUMNS = Object.freeze(
  [
    { key: 'ww_weighted', label: 'WW' },
    { key: 'pt_weighted', label: 'PT' },
    { key: 'qa_weighted', label: 'QA' },
    { key: 'initial_grade', label: 'Initial' },
    { key: 'quarterly_grade', label: 'Quarterly' },
  ].map((column) => Object.freeze(column)),
)

const STATUS_SUBMITTED = 'submitted'
const ACTION_LABELS = Object.freeze({ submitted: 'Submitted', reopened: 'Reopened' })
const SUBMITTED_CHIP_CLASS = 'bg-green-100 text-green-800'
const DRAFT_CHIP_CLASS = 'bg-slate-200 text-slate-700'
const DRAFT_TEXT = 'Not submitted yet.'
const DATE_LENGTH = 10
const WEIGHT_SEPARATOR = ' · '

function listRows(rowList) {
  return Array.isArray(rowList) ? rowList.filter((row) => row !== null && typeof row === 'object') : []
}

function listActivities(classRecord) {
  return listRows(classRecord?.activities)
}

function formatWeight(weights, component) {
  const weightValue = weights?.[component]
  return weightValue === undefined || weightValue === null ? NO_VALUE_LABEL : `${weightValue}%`
}

export function buildWeightsText(weights) {
  if (weights === null || typeof weights !== 'object') return NO_VALUE_LABEL
  return COMPONENTS.map((component) => `${component.toUpperCase()} ${formatWeight(weights, component)}`).join(
    WEIGHT_SEPARATOR,
  )
}

export function groupActivityColumns(activities, weights) {
  const activityList = listRows(activities)
  return COMPONENTS.map((component) => ({
    component,
    label: COMPONENT_LABELS[component],
    weightText: formatWeight(weights, component),
    activities: activityList.filter((activity) => activity.component === component),
  }))
}

function buildBlankGrades() {
  return Object.fromEntries(GRADE_COLUMNS.map((gradeColumn) => [gradeColumn.key, NO_VALUE_LABEL]))
}

function buildServerGrades(studentRow) {
  return {
    ww_weighted: studentRow.ww?.weighted ?? NO_VALUE_LABEL,
    pt_weighted: studentRow.pt?.weighted ?? NO_VALUE_LABEL,
    qa_weighted: studentRow.qa?.weighted ?? NO_VALUE_LABEL,
    initial_grade: studentRow.initial_grade ?? NO_VALUE_LABEL,
    quarterly_grade:
      studentRow.quarterly_grade === null || studentRow.quarterly_grade === undefined
        ? NO_VALUE_LABEL
        : String(studentRow.quarterly_grade),
  }
}

function readScoreTexts(studentRow, classRecord, scoreDraft) {
  const scoreTextByActivityId = {}
  for (const activity of listActivities(classRecord)) {
    scoreTextByActivityId[activity.id] = scoreDraft[buildCellKey(studentRow.student_id, activity.id)] ?? ''
  }
  return scoreTextByActivityId
}

function hasInvalidScore(scoreTextByActivityId, classRecord) {
  return listActivities(classRecord).some(
    (activity) => findScoreError(scoreTextByActivityId[activity.id], activity.highest_possible_score) !== '',
  )
}

function buildLiveGrades(studentRow, classRecord, scoreDraft) {
  const scoreTextByActivityId = readScoreTexts(studentRow, classRecord, scoreDraft)
  if (hasInvalidScore(scoreTextByActivityId, classRecord)) return buildBlankGrades()
  const totals = sumComponentTotals(classRecord.activities, scoreTextByActivityId)
  const quarterGrade = computeQuarterGrade(totals, classRecord.weights)
  return {
    ww_weighted: formatHundredths(quarterGrade.ww_weighted),
    pt_weighted: formatHundredths(quarterGrade.pt_weighted),
    qa_weighted: formatHundredths(quarterGrade.qa_weighted),
    initial_grade: formatHundredths(quarterGrade.initial_grade),
    quarterly_grade: String(quarterGrade.quarterly_grade),
  }
}

function buildScoreMap(studentRow) {
  const scoreByActivityId = {}
  for (const scoreEntry of listRows(studentRow.scores)) {
    scoreByActivityId[scoreEntry.activity_id] = scoreEntry.score ?? ''
  }
  return scoreByActivityId
}

function buildGradeRow(studentRow, grades) {
  return {
    key: studentRow.enrollment_id,
    studentId: studentRow.student_id,
    name: formatEnrollmentStudentName(studentRow),
    scoreByActivityId: buildScoreMap(studentRow),
    grades,
  }
}

export function buildGradeRows(classRecord, scoreDraft) {
  return listRows(classRecord?.students).map((studentRow) => {
    const isLive = scoreDraft !== null && scoreDraft !== undefined
    return buildGradeRow(studentRow, isLive ? buildLiveGrades(studentRow, classRecord, scoreDraft) : buildServerGrades(studentRow))
  })
}

export function buildLeftRows(classRecord) {
  return listRows(classRecord?.left_the_class).map((studentRow) =>
    buildGradeRow(studentRow, buildServerGrades(studentRow)),
  )
}

function buildSubmittedText(classRecord) {
  const dateText = formatDisplayDate(String(classRecord.submitted_at ?? '').slice(0, DATE_LENGTH))
  const userName = classRecord.submitted_by?.name ?? NO_VALUE_LABEL
  return `Submitted by ${userName} on ${dateText || NO_VALUE_LABEL}`
}

export function buildStatusInfo(classRecord) {
  const isSubmitted = classRecord?.status === STATUS_SUBMITTED
  return {
    isSubmitted,
    label: isSubmitted ? 'Submitted' : 'Draft',
    chipClass: isSubmitted ? SUBMITTED_CHIP_CLASS : DRAFT_CHIP_CLASS,
    text: isSubmitted ? buildSubmittedText(classRecord) : DRAFT_TEXT,
  }
}

export function buildHistoryRows(history) {
  return listRows(history).map((historyEntry) => ({
    key: historyEntry.id,
    actionLabel: ACTION_LABELS[historyEntry.action] ?? NO_VALUE_LABEL,
    userName: historyEntry.user?.name ?? NO_VALUE_LABEL,
    dateText: formatDisplayDate(String(historyEntry.created_at ?? '').slice(0, DATE_LENGTH)) || NO_VALUE_LABEL,
    reasonText: historyEntry.reason ?? NO_VALUE_LABEL,
  }))
}

export function buildEmptyComponentText(components) {
  if (!Array.isArray(components) || components.length === 0) return ''
  const componentText = components.map((component) => String(component).toUpperCase()).join(' and ')
  const verbText = components.length === 1 ? 'counts' : 'count'
  return `No ${componentText} activity yet; ${componentText} ${verbText} as 0.`
}
