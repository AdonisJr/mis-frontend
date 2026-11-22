import { NO_VALUE_LABEL, buildRoomLabel } from '@/utils/sectionDisplay.js'

export const ROOM_TYPE_CLASSROOM = 'classroom'
export const ROOM_TYPE_LABORATORY = 'laboratory'
export const ROOM_TYPE_OTHER = 'other'

export const ROOM_TYPES = Object.freeze([ROOM_TYPE_CLASSROOM, ROOM_TYPE_LABORATORY, ROOM_TYPE_OTHER])

export const ROOM_TYPE_LABELS = Object.freeze({
  [ROOM_TYPE_CLASSROOM]: 'Classroom',
  [ROOM_TYPE_LABORATORY]: 'Laboratory',
  [ROOM_TYPE_OTHER]: 'Other',
})

export const ROOM_TYPE_OPTIONS = Object.freeze(
  ROOM_TYPES.map((roomType) => Object.freeze({ value: roomType, label: ROOM_TYPE_LABELS[roomType] })),
)

export const ROOM_COLUMNS = Object.freeze(
  [
    { key: 'name', label: 'Name' },
    { key: 'building', label: 'Building' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'type', label: 'Type' },
    { key: 'is_active', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

const INACTIVE_SUFFIX = ' (inactive)'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function getRoomTypeLabel(roomType) {
  if (typeof roomType !== 'string') return ''
  return ROOM_TYPE_LABELS[roomType] ?? roomType
}

export function formatRoomBuilding(room) {
  const building = room?.building
  if (typeof building !== 'string' || building.trim() === '') return NO_VALUE_LABEL
  return building.trim()
}

export function formatRoomCapacity(room) {
  const capacity = room?.capacity
  if (!Number.isInteger(capacity) || capacity < 1) return NO_VALUE_LABEL
  return String(capacity)
}

export function buildRoomOptionLabel(room) {
  const roomLabel = buildRoomLabel(room)
  if (room?.is_active === false) return `${roomLabel}${INACTIVE_SUFFIX}`
  return roomLabel
}

export function buildRoomDeactivateMessage(room) {
  if (!isRecordObject(room)) return ''
  return `Deactivate room ${room.name}? It stays in the list and on its sections, but it cannot be picked for a section.`
}

export function buildRoomReactivateMessage(room) {
  if (!isRecordObject(room)) return ''
  return `Reactivate room ${room.name}? It can be picked for sections again.`
}
