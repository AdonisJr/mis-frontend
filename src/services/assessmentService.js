import http from '@/services/http.js'

const ASSESSMENTS_PATH = '/assessments'
const CANDIDATES_PATH = '/assessments/candidates'
const PREVIEW_PATH = '/assessments/preview'
const REASSESS_SEGMENT = '/reassess'
const HISTORY_SEGMENT = '/history'
const INVALID_ASSESSMENT_ID_MESSAGE = 'A valid assessment id is required.'

function buildAssessmentPath(assessmentId) {
  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    throw new Error(INVALID_ASSESSMENT_ID_MESSAGE)
  }
  return `${ASSESSMENTS_PATH}/${assessmentId}`
}

export async function fetchAssessments(assessmentListParams) {
  const response = await http.get(ASSESSMENTS_PATH, { params: assessmentListParams })
  return response.data
}

export async function fetchAssessment(assessmentId) {
  const response = await http.get(buildAssessmentPath(assessmentId))
  return response.data
}

export async function fetchAssessmentHistory(assessmentId) {
  const response = await http.get(buildAssessmentPath(assessmentId) + HISTORY_SEGMENT)
  return response.data
}

export async function fetchAssessmentCandidates(candidateParams) {
  const response = await http.get(CANDIDATES_PATH, { params: candidateParams })
  return response.data
}

export async function previewAssessment(assessPayload) {
  const response = await http.post(PREVIEW_PATH, assessPayload)
  return response.data
}

export async function createAssessment(assessPayload) {
  const response = await http.post(ASSESSMENTS_PATH, assessPayload)
  return response.data
}

export async function reassessAssessment(assessmentId, reassessPayload) {
  const response = await http.post(buildAssessmentPath(assessmentId) + REASSESS_SEGMENT, reassessPayload)
  return response.data
}
