export const NO_VALUE_LABEL = '—'

export const SECTION_COLUMNS = Object.freeze(
  [
    { key: 'name', label: 'Name' },
    { key: 'grade_level', label: 'Grade level' },
    { key: 'program', label: 'Program' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'room', label: 'Room' },
    { key: 'adviser', label: 'Adviser' },
  ].map((column) => Object.freeze(column)),
)

const INACTIVE_SUFFIX = ' (inactive)'
const UNAVAILABLE_ADVISER_SUFFIX = ' (not an active teacher)'
const ROOM_BUILDING_SEPARATOR = ' · '

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function isFilledText(textValue) {
  return typeof textValue === 'string' && textValue.trim() !== ''
}

export function formatSectionProgramCode(section) {
  const programCode = section?.program?.code
  if (!isFilledText(programCode)) return NO_VALUE_LABEL
  return programCode
}

export function buildRoomLabel(room) {
  if (!isRecordObject(room)) return ''
  const roomName = isFilledText(room.name) ? room.name.trim() : ''
  if (!isFilledText(room.building)) return roomName
  return `${roomName}${ROOM_BUILDING_SEPARATOR}${room.building.trim()}`
}

export function formatSectionRoom(section) {
  const roomLabel = buildRoomLabel(section?.room)
  return roomLabel === '' ? NO_VALUE_LABEL : roomLabel
}

export function formatSectionAdviser(section) {
  const adviserName = section?.adviser?.name
  if (!isFilledText(adviserName)) return NO_VALUE_LABEL
  return adviserName.trim()
}

export function buildAdviserOptionLabel(adviser) {
  if (!isRecordObject(adviser)) return ''
  if (adviser.isUnavailable === true) return `${adviser.name}${UNAVAILABLE_ADVISER_SUFFIX}`
  return adviser.name
}

export function buildProgramOptionLabel(program) {
  if (!isRecordObject(program)) return ''
  if (program.is_active === false) return `${program.code}${INACTIVE_SUFFIX}`
  return program.code
}

export function buildSectionDeleteMessage(section) {
  if (!isRecordObject(section)) return ''
  const gradeLevelName = section.grade_level?.name
  if (!isFilledText(gradeLevelName)) return `Delete section ${section.name}? This cannot be undone.`
  return `Delete section ${section.name} of ${gradeLevelName}? This cannot be undone.`
}
