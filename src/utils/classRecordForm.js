import { COMPONENT_LABELS } from '@/utils/classRecordDisplay.js'
import { COMPONENTS } from '@/utils/gradeComputation.js'

export const ACTIVITY_TITLE_MAX_LENGTH = 150
export const HIGHEST_SCORE_MAX = 999
export const REOPEN_REASON_MAX_LENGTH = 500

export const ACTIVITY_FIELD_LABELS = Object.freeze({
  component: 'Component',
  title: 'Title',
  highest_possible_score: 'Highest possible score',
  activity_date: 'Date',
})

const QA_COMPONENT = 'qa'
const WHOLE_NUMBER_PATTERN = /^\d+$/
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const COMPONENT_MESSAGE = 'Component is required.'
const TITLE_REQUIRED_MESSAGE = 'Title is required.'
const TITLE_TOO_LONG_MESSAGE = `Title must be at most ${ACTIVITY_TITLE_MAX_LENGTH} characters.`
const HIGHEST_MESSAGE = `Enter a whole number from 1 to ${HIGHEST_SCORE_MAX}.`
const DATE_MESSAGE = 'Enter a valid date.'
const REASON_REQUIRED_MESSAGE = 'A reason is required.'
const REASON_TOO_LONG_MESSAGE = `The reason must be at most ${REOPEN_REASON_MAX_LENGTH} characters.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

export function createEmptyActivityForm() {
  return { component: '', title: '', highest_possible_score: '', activity_date: '' }
}

export function buildFormFromActivity(activity) {
  if (activity === null || typeof activity !== 'object') return createEmptyActivityForm()
  return {
    component: COMPONENTS.includes(activity.component) ? activity.component : '',
    title: activity.title ?? '',
    highest_possible_score: toTrimmedText(activity.highest_possible_score),
    activity_date: activity.activity_date ?? '',
  }
}

export function listComponentOptions(activities, editingActivityId) {
  const activityList = Array.isArray(activities) ? activities : []
  const isQaTaken = activityList.some(
    (activity) => activity.component === QA_COMPONENT && String(activity.id) !== String(editingActivityId),
  )
  return COMPONENTS.map((component) => ({
    value: component,
    label: COMPONENT_LABELS[component],
    isDisabled: component === QA_COMPONENT && isQaTaken,
  }))
}

function findTitleError(titleText) {
  if (titleText === '') return TITLE_REQUIRED_MESSAGE
  return titleText.length > ACTIVITY_TITLE_MAX_LENGTH ? TITLE_TOO_LONG_MESSAGE : ''
}

function isHighestScoreValid(highestText) {
  if (!WHOLE_NUMBER_PATTERN.test(highestText)) return false
  const highestScore = Number(highestText)
  return highestScore >= 1 && highestScore <= HIGHEST_SCORE_MAX
}

export function findActivityFormErrors(formValues) {
  const formErrors = {}
  const titleError = findTitleError(toTrimmedText(formValues?.title))
  const dateText = toTrimmedText(formValues?.activity_date)
  if (!COMPONENTS.includes(formValues?.component)) formErrors.component = [COMPONENT_MESSAGE]
  if (titleError !== '') formErrors.title = [titleError]
  if (!isHighestScoreValid(toTrimmedText(formValues?.highest_possible_score))) {
    formErrors.highest_possible_score = [HIGHEST_MESSAGE]
  }
  if (dateText !== '' && !DATE_PATTERN.test(dateText)) formErrors.activity_date = [DATE_MESSAGE]
  return formErrors
}

export function buildActivityPayload(formValues) {
  const dateText = toTrimmedText(formValues?.activity_date)
  return {
    component: formValues?.component,
    title: toTrimmedText(formValues?.title),
    highest_possible_score: Number(toTrimmedText(formValues?.highest_possible_score)),
    activity_date: dateText === '' ? null : dateText,
  }
}

export function findReopenReasonError(reasonText) {
  const trimmedReason = toTrimmedText(reasonText)
  if (trimmedReason === '') return REASON_REQUIRED_MESSAGE
  return trimmedReason.length > REOPEN_REASON_MAX_LENGTH ? REASON_TOO_LONG_MESSAGE : ''
}

export function buildReopenPayload(reasonText) {
  return { reason: toTrimmedText(reasonText) }
}
