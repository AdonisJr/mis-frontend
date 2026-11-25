import { toTenths } from '@/utils/gradeComputation.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'

const NUMBER_PATTERN = /^\d+(\.\d+)?$/
const NUMBER_MESSAGE = 'Enter a number.'
const DECIMAL_MESSAGE = 'Use at most one decimal.'
const TENTHS_PER_POINT = 10
const BLANK_TITLE_SEPARATOR = ', '

const MOVE_BY_KEY = Object.freeze({
  ArrowUp: { rowStep: -1, columnStep: 0 },
  ArrowDown: { rowStep: 1, columnStep: 0 },
  ArrowLeft: { rowStep: 0, columnStep: -1 },
  ArrowRight: { rowStep: 0, columnStep: 1 },
  Enter: { rowStep: 1, columnStep: 0 },
  Tab: { rowStep: 0, columnStep: 1 },
  'Shift+Tab': { rowStep: 0, columnStep: -1 },
})

export function buildCellKey(studentId, activityId) {
  return `${studentId}:${activityId}`
}

export function findScoreError(scoreText, highestScore) {
  const trimmedText = String(scoreText ?? '').trim()
  if (trimmedText === '') return ''
  if (!NUMBER_PATTERN.test(trimmedText)) return NUMBER_MESSAGE
  const scoreTenths = toTenths(trimmedText)
  if (scoreTenths === null) return DECIMAL_MESSAGE
  if (scoreTenths > highestScore * TENTHS_PER_POINT) return `Enter 0 to ${highestScore}.`
  return ''
}

function listActivities(classRecord) {
  return Array.isArray(classRecord?.activities) ? classRecord.activities : []
}

function listStudents(classRecord) {
  return Array.isArray(classRecord?.students) ? classRecord.students : []
}

function buildServerScoreText(studentRow, activityId) {
  const scoreEntry = (studentRow.scores ?? []).find((scoreItem) => scoreItem.activity_id === activityId)
  if (scoreEntry === undefined || scoreEntry.score === null || scoreEntry.score === undefined) return ''
  return String(scoreEntry.score)
}

function readDraftText(scoreDraft, cellKey) {
  return String(scoreDraft?.[cellKey] ?? '').trim()
}

function buildRowDraft(studentRow, classRecord) {
  const rowDraft = {}
  for (const activity of listActivities(classRecord)) {
    rowDraft[buildCellKey(studentRow.student_id, activity.id)] = buildServerScoreText(studentRow, activity.id)
  }
  return rowDraft
}

export function buildScoreDraft(classRecord) {
  const scoreDraft = {}
  for (const studentRow of listStudents(classRecord)) {
    Object.assign(scoreDraft, buildRowDraft(studentRow, classRecord))
  }
  return scoreDraft
}

function findRowErrors(studentRow, classRecord, scoreDraft) {
  const rowErrors = {}
  for (const activity of listActivities(classRecord)) {
    const cellKey = buildCellKey(studentRow.student_id, activity.id)
    const errorText = findScoreError(scoreDraft?.[cellKey], activity.highest_possible_score)
    if (errorText !== '') rowErrors[cellKey] = errorText
  }
  return rowErrors
}

export function buildCellErrors(classRecord, scoreDraft) {
  const cellErrors = {}
  for (const studentRow of listStudents(classRecord)) {
    Object.assign(cellErrors, findRowErrors(studentRow, classRecord, scoreDraft))
  }
  return cellErrors
}

function isSameScore(serverText, draftText) {
  if (serverText === draftText) return true
  if (serverText === '' || draftText === '') return false
  return Number(serverText) === Number(draftText)
}

function findChangedRowScores(studentRow, classRecord, scoreDraft) {
  const changedScores = []
  for (const activity of listActivities(classRecord)) {
    const draftText = readDraftText(scoreDraft, buildCellKey(studentRow.student_id, activity.id))
    if (isSameScore(buildServerScoreText(studentRow, activity.id), draftText)) continue
    changedScores.push({
      student_id: studentRow.student_id,
      activity_id: activity.id,
      score: draftText === '' ? null : Number(draftText),
    })
  }
  return changedScores
}

export function listChangedScores(classRecord, scoreDraft) {
  return listStudents(classRecord).flatMap((studentRow) => findChangedRowScores(studentRow, classRecord, scoreDraft))
}

function listBlankTitles(studentRow, classRecord, scoreDraft) {
  return listActivities(classRecord)
    .filter((activity) => readDraftText(scoreDraft, buildCellKey(studentRow.student_id, activity.id)) === '')
    .map((activity) => activity.title)
}

export function listBlankScoreLines(classRecord, scoreDraft) {
  const blankLines = []
  for (const studentRow of listStudents(classRecord)) {
    const blankTitles = listBlankTitles(studentRow, classRecord, scoreDraft)
    if (blankTitles.length === 0) continue
    blankLines.push(`${formatEnrollmentStudentName(studentRow)}: ${blankTitles.join(BLANK_TITLE_SEPARATOR)}`)
  }
  return blankLines
}

export function createCellNavigator(rowCount, columnCount) {
  return (cellPosition, keyName) => {
    if (!Object.hasOwn(MOVE_BY_KEY, keyName)) return null
    const { rowStep, columnStep } = MOVE_BY_KEY[keyName]
    const rowIndex = cellPosition.rowIndex + rowStep
    const columnIndex = cellPosition.columnIndex + columnStep
    if (rowIndex < 0 || rowIndex >= rowCount) return null
    if (columnIndex < 0 || columnIndex >= columnCount) return null
    return { rowIndex, columnIndex }
  }
}
