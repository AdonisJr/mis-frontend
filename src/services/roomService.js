import http from '@/services/http.js'

const ROOMS_PATH = '/rooms'
const ACTIVE_ROOMS_PATH = '/rooms/active'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_ROOM_ID_MESSAGE = 'A valid room id is required.'

function assertRoomId(roomId) {
  if (Number.isInteger(roomId) && roomId > 0) return
  throw new Error(INVALID_ROOM_ID_MESSAGE)
}

function buildRoomPath(roomId) {
  assertRoomId(roomId)
  return `${ROOMS_PATH}/${roomId}`
}

export async function fetchRooms(roomListParams) {
  const response = await http.get(ROOMS_PATH, { params: roomListParams })
  return response.data
}

export async function fetchActiveRooms() {
  const response = await http.get(ACTIVE_ROOMS_PATH)
  return response.data
}

export async function createRoom(roomPayload) {
  const response = await http.post(ROOMS_PATH, roomPayload)
  return response.data
}

export async function updateRoom(roomId, roomPayload) {
  const response = await http.put(buildRoomPath(roomId), roomPayload)
  return response.data
}

export async function deactivateRoom(roomId) {
  const response = await http.put(buildRoomPath(roomId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateRoom(roomId) {
  const response = await http.put(buildRoomPath(roomId) + REACTIVATE_SEGMENT)
  return response.data
}
