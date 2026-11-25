import http from '@/services/http.js'

const CLASSES_PATH = '/classes'
const QUARTERS_SEGMENT = '/quarters'
const RECORD_SEGMENT = '/record'
const ACTIVITIES_SEGMENT = '/activities'
const SCORES_SEGMENT = '/scores'
const SUBMIT_SEGMENT = '/submit'
const REOPEN_SEGMENT = '/reopen'
const STUDENTS_PATH = '/students'
const REPORT_CARD_SEGMENT = '/report-card'
const SECTIONS_PATH = '/sections'
const REPORT_CARDS_SEGMENT = '/report-cards'
const QUARTER_NUMBERS = [1, 2, 3, 4]
const INVALID_ID_MESSAGE = 'A valid record id is required.'
const INVALID_QUARTER_MESSAGE = 'A valid quarter is required.'

function assertRecordId(recordId) {
  if (!Number.isInteger(recordId) || recordId <= 0) throw new Error(INVALID_ID_MESSAGE)
}

function assertQuarter(quarter) {
  if (!QUARTER_NUMBERS.includes(quarter)) throw new Error(INVALID_QUARTER_MESSAGE)
}

function buildQuarterPath(quarterRef) {
  assertRecordId(quarterRef?.classId)
  assertQuarter(quarterRef.quarter)
  return `${CLASSES_PATH}/${quarterRef.classId}${QUARTERS_SEGMENT}/${quarterRef.quarter}`
}

function buildActivityPath(activityRef) {
  const quarterPath = buildQuarterPath(activityRef)
  assertRecordId(activityRef.activityId)
  return `${quarterPath}${ACTIVITIES_SEGMENT}/${activityRef.activityId}`
}

export async function fetchClassRecord(quarterRef) {
  const response = await http.get(`${buildQuarterPath(quarterRef)}${RECORD_SEGMENT}`)
  return response.data
}

export async function createActivity(quarterRef, activityPayload) {
  const response = await http.post(`${buildQuarterPath(quarterRef)}${ACTIVITIES_SEGMENT}`, activityPayload)
  return response.data
}

export async function updateActivity(activityRef, activityPayload) {
  const response = await http.put(buildActivityPath(activityRef), activityPayload)
  return response.data
}

export async function deleteActivity(activityRef) {
  const response = await http.delete(buildActivityPath(activityRef))
  return response.data
}

export async function saveScores(quarterRef, scorePayload) {
  const response = await http.put(`${buildQuarterPath(quarterRef)}${SCORES_SEGMENT}`, scorePayload)
  return response.data
}

export async function submitQuarter(quarterRef) {
  const response = await http.post(`${buildQuarterPath(quarterRef)}${SUBMIT_SEGMENT}`)
  return response.data
}

export async function reopenQuarter(quarterRef, reopenPayload) {
  const response = await http.post(`${buildQuarterPath(quarterRef)}${REOPEN_SEGMENT}`, reopenPayload)
  return response.data
}

export async function fetchReportCard(studentId, schoolYearId) {
  assertRecordId(studentId)
  assertRecordId(schoolYearId)
  const response = await http.get(`${STUDENTS_PATH}/${studentId}${REPORT_CARD_SEGMENT}`, {
    params: { school_year_id: schoolYearId },
  })
  return response.data
}

export async function fetchSectionReportCards(sectionId) {
  assertRecordId(sectionId)
  const response = await http.get(`${SECTIONS_PATH}/${sectionId}${REPORT_CARDS_SEGMENT}`)
  return response.data
}
