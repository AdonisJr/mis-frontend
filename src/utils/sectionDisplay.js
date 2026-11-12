export const NO_VALUE_LABEL = '—'

export const SECTION_COLUMNS = Object.freeze(
  [
    { key: 'name', label: 'Name' },
    { key: 'grade_level', label: 'Grade level' },
    { key: 'program', label: 'Program' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'room', label: 'Room' },
  ].map((column) => Object.freeze(column)),
)

const INACTIVE_SUFFIX = ' (inactive)'

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

export function formatSectionRoom(section) {
  const room = section?.room
  if (!isFilledText(room)) return NO_VALUE_LABEL
  return room.trim()
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
