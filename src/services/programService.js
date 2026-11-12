import http from '@/services/http.js'

const PROGRAMS_PATH = '/programs'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_PROGRAM_ID_MESSAGE = 'A valid program id is required.'
const FIRST_PROGRAM_PAGE = 1
const SECOND_PROGRAM_PAGE = 2

function assertProgramId(programId) {
  if (Number.isInteger(programId) && programId > 0) return
  throw new Error(INVALID_PROGRAM_ID_MESSAGE)
}

function buildProgramPath(programId) {
  assertProgramId(programId)
  return `${PROGRAMS_PATH}/${programId}`
}

export async function fetchPrograms(programListParams) {
  const response = await http.get(PROGRAMS_PATH, { params: programListParams })
  return response.data
}

export async function fetchAllPrograms() {
  const firstPageResponse = await fetchPrograms({ page: FIRST_PROGRAM_PAGE })
  const lastPage = firstPageResponse?.meta?.last_page
  const laterPageNumbers = Number.isInteger(lastPage)
    ? Array.from({ length: Math.max(lastPage - FIRST_PROGRAM_PAGE, 0) }, (_unused, index) => index + SECOND_PROGRAM_PAGE)
    : []
  const laterPageResponses = await Promise.all(laterPageNumbers.map((pageNumber) => fetchPrograms({ page: pageNumber })))
  return { programs: [firstPageResponse, ...laterPageResponses].flatMap((programPage) => programPage?.programs ?? []) }
}

export async function createProgram(programPayload) {
  const response = await http.post(PROGRAMS_PATH, programPayload)
  return response.data
}

export async function updateProgram(programId, programPayload) {
  const response = await http.put(buildProgramPath(programId), programPayload)
  return response.data
}

export async function deactivateProgram(programId) {
  const response = await http.put(buildProgramPath(programId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateProgram(programId) {
  const response = await http.put(buildProgramPath(programId) + REACTIVATE_SEGMENT)
  return response.data
}

export async function deleteProgram(programId) {
  const response = await http.delete(buildProgramPath(programId))
  return response.data
}
