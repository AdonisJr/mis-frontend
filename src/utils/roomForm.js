import { SECTION_CAPACITY_MAX } from '@/utils/sectionForm.js'
import { ROOM_TYPES } from '@/utils/roomDisplay.js'

export const ROOM_NAME_MAX_LENGTH = 50
export const ROOM_BUILDING_MAX_LENGTH = 100
export const ROOM_CAPACITY_MIN = 1
// client-only guard below the DB int ceiling; the backend decides
export const ROOM_CAPACITY_MAX = SECTION_CAPACITY_MAX

export const ROOM_FIELD_LABELS = Object.freeze({
  name: 'Name',
  building: 'Building',
  capacity: 'Capacity',
  type: 'Type',
})

const WHOLE_NUMBER_PATTERN = /^\d+$/

const NAME_TOO_LONG_MESSAGE = `Name must be at most ${ROOM_NAME_MAX_LENGTH} characters.`
const BUILDING_TOO_LONG_MESSAGE = `Building must be at most ${ROOM_BUILDING_MAX_LENGTH} characters.`
const CAPACITY_WHOLE_MESSAGE = `Capacity must be a whole number of at least ${ROOM_CAPACITY_MIN}.`
const CAPACITY_MAX_MESSAGE = `Capacity must be at most ${ROOM_CAPACITY_MAX}.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function buildRequiredMessage(fieldKey) {
  return `${ROOM_FIELD_LABELS[fieldKey]} is required.`
}

function findNameError(nameValue) {
  const trimmedName = toTrimmedText(nameValue)
  if (trimmedName === '') return buildRequiredMessage('name')
  if (trimmedName.length > ROOM_NAME_MAX_LENGTH) return NAME_TOO_LONG_MESSAGE
  return ''
}

function findCapacityError(capacityValue) {
  const capacityText = toTrimmedText(capacityValue)
  if (capacityText === '') return ''
  if (!WHOLE_NUMBER_PATTERN.test(capacityText) || Number(capacityText) < ROOM_CAPACITY_MIN) {
    return CAPACITY_WHOLE_MESSAGE
  }
  if (Number(capacityText) > ROOM_CAPACITY_MAX) return CAPACITY_MAX_MESSAGE
  return ''
}

export function createEmptyRoomForm() {
  return { name: '', building: '', capacity: '', type: '' }
}

export function buildFormFromRoom(room) {
  if (room === null || typeof room !== 'object') return createEmptyRoomForm()
  return {
    name: room.name ?? '',
    building: room.building ?? '',
    capacity: Number.isInteger(room.capacity) ? String(room.capacity) : '',
    type: ROOM_TYPES.includes(room.type) ? room.type : '',
  }
}

export function findRoomFormErrors(formValues) {
  const formErrors = {}
  const nameError = findNameError(formValues?.name)
  const capacityError = findCapacityError(formValues?.capacity)
  if (nameError !== '') formErrors.name = [nameError]
  if (toTrimmedText(formValues?.building).length > ROOM_BUILDING_MAX_LENGTH) {
    formErrors.building = [BUILDING_TOO_LONG_MESSAGE]
  }
  if (capacityError !== '') formErrors.capacity = [capacityError]
  if (!ROOM_TYPES.includes(formValues?.type)) formErrors.type = [buildRequiredMessage('type')]
  return formErrors
}

export function buildRoomPayload(formValues) {
  const trimmedBuilding = toTrimmedText(formValues?.building)
  const capacityText = toTrimmedText(formValues?.capacity)
  return {
    name: toTrimmedText(formValues?.name),
    building: trimmedBuilding === '' ? null : trimmedBuilding,
    capacity: capacityText === '' ? null : Number(capacityText),
    type: formValues?.type,
  }
}
