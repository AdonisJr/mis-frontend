export const STAGE_JHS = 'jhs'
export const STAGE_SHS = 'shs'
export const STAGE_COLLEGE = 'college'

export const PROGRAM_STAGE_LABELS = Object.freeze({
  [STAGE_JHS]: 'JHS',
  [STAGE_SHS]: 'SHS',
  [STAGE_COLLEGE]: 'College',
})

function isProgramObject(program) {
  return program !== null && typeof program === 'object'
}

export function getStageLabel(stage) {
  if (typeof stage !== 'string' || stage === '') return ''
  // an unexpected stage stays visible as its raw key instead of a blank cell
  if (!Object.hasOwn(PROGRAM_STAGE_LABELS, stage)) return stage
  return PROGRAM_STAGE_LABELS[stage]
}

export function buildProgramDeactivateMessage(program) {
  if (!isProgramObject(program)) return ''
  return `Deactivate ${program.code} (${program.name})? It stays in the list and can be reactivated later.`
}

export function buildProgramReactivateMessage(program) {
  if (!isProgramObject(program)) return ''
  return `Reactivate ${program.code} (${program.name})? It becomes active again.`
}

export function buildProgramDeleteMessage(program) {
  if (!isProgramObject(program)) return ''
  return `Delete ${program.code} (${program.name})? This cannot be undone.`
}
