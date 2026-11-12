import http from '@/services/http.js'

const SECTIONS_PATH = '/sections'
const INVALID_SECTION_ID_MESSAGE = 'A valid section id is required.'

function assertSectionId(sectionId) {
  if (Number.isInteger(sectionId) && sectionId > 0) return
  throw new Error(INVALID_SECTION_ID_MESSAGE)
}

function buildSectionPath(sectionId) {
  assertSectionId(sectionId)
  return `${SECTIONS_PATH}/${sectionId}`
}

export async function fetchSections(sectionListParams) {
  const response = await http.get(SECTIONS_PATH, { params: sectionListParams })
  return response.data
}

export async function createSection(sectionPayload) {
  const response = await http.post(SECTIONS_PATH, sectionPayload)
  return response.data
}

export async function updateSection(sectionId, sectionPayload) {
  const response = await http.put(buildSectionPath(sectionId), sectionPayload)
  return response.data
}

export async function deleteSection(sectionId) {
  const response = await http.delete(buildSectionPath(sectionId))
  return response.data
}
