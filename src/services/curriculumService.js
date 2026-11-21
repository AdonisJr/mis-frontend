import http from '@/services/http.js'

const CURRICULUM_ENTRIES_PATH = '/curriculum-entries'
const COPY_PATH = '/curriculum-entries/copy'
const INVALID_ENTRY_ID_MESSAGE = 'A valid curriculum entry id is required.'

function buildEntryPath(entryId) {
  if (!Number.isInteger(entryId) || entryId <= 0) throw new Error(INVALID_ENTRY_ID_MESSAGE)
  return `${CURRICULUM_ENTRIES_PATH}/${entryId}`
}

export async function fetchCurriculumEntries(curriculumListParams) {
  const response = await http.get(CURRICULUM_ENTRIES_PATH, { params: curriculumListParams })
  return response.data
}

export async function addCurriculumEntry(entryPayload) {
  const response = await http.post(CURRICULUM_ENTRIES_PATH, entryPayload)
  return response.data
}

export async function updateCurriculumEntrySortOrder(entryId, sortOrder) {
  const response = await http.put(buildEntryPath(entryId), { sort_order: sortOrder })
  return response.data
}

export async function removeCurriculumEntry(entryId) {
  const response = await http.delete(buildEntryPath(entryId))
  return response.data
}

export async function copyCurriculum(copyPayload) {
  const response = await http.post(COPY_PATH, copyPayload)
  return response.data
}
