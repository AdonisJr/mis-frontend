import http from '@/services/http.js'

const POSTING_MAPPINGS_PATH = '/posting-settings'
const UNPOSTED_EVENTS_PATH = '/unposted-events'
const POST_PENDING_SEGMENT = '/post'

export async function fetchPostingMappings() {
  const response = await http.get(POSTING_MAPPINGS_PATH)
  return response.data
}

export async function updatePostingMappings(mappingPayload) {
  const response = await http.put(POSTING_MAPPINGS_PATH, mappingPayload)
  return response.data
}

export async function fetchUnpostedEvents(unpostedListParams) {
  const response = await http.get(UNPOSTED_EVENTS_PATH, { params: unpostedListParams })
  return response.data
}

export async function postPendingEvents() {
  const response = await http.post(UNPOSTED_EVENTS_PATH + POST_PENDING_SEGMENT)
  return response.data
}
