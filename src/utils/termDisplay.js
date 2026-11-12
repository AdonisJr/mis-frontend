export const TERM_TYPE_SEMESTER = 'semester'
export const TERM_TYPE_TRIMESTER = 'trimester'

export const TERM_COUNT_BY_TYPE = Object.freeze({ [TERM_TYPE_SEMESTER]: 2, [TERM_TYPE_TRIMESTER]: 3 })

export const TERM_TYPE_LABELS = Object.freeze({
  [TERM_TYPE_SEMESTER]: 'Semester',
  [TERM_TYPE_TRIMESTER]: 'Trimester',
})

export const TERM_TYPE_OPTIONS = Object.freeze(
  [TERM_TYPE_SEMESTER, TERM_TYPE_TRIMESTER].map((termTypeValue) =>
    Object.freeze({ value: termTypeValue, label: TERM_TYPE_LABELS[termTypeValue] }),
  ),
)

const TERM_TYPE_SHORT_LABELS = Object.freeze({ [TERM_TYPE_SEMESTER]: 'Sem', [TERM_TYPE_TRIMESTER]: 'Tri' })
const TERM_ORDINALS = Object.freeze(['1st', '2nd', '3rd'])

function isRecord(candidate) {
  return candidate !== null && typeof candidate === 'object'
}

function findOrdinal(termType, termNumber) {
  if (!Object.hasOwn(TERM_COUNT_BY_TYPE, termType)) return ''
  if (!Number.isInteger(termNumber) || termNumber < 1 || termNumber > TERM_COUNT_BY_TYPE[termType]) return ''
  return TERM_ORDINALS[termNumber - 1]
}

export function buildTermLabel(termType, termNumber) {
  const ordinal = findOrdinal(termType, termNumber)
  if (!ordinal) return ''
  return `${ordinal} ${TERM_TYPE_LABELS[termType]}`
}

export function buildTermShortLabel(termType, termNumber) {
  const ordinal = findOrdinal(termType, termNumber)
  if (!ordinal) return ''
  return `${ordinal} ${TERM_TYPE_SHORT_LABELS[termType]}`
}

export function buildActiveTermBadgeLabel(schoolYear, term) {
  if (!isRecord(schoolYear) || !isRecord(term)) return ''
  if (term.school_year_id !== schoolYear.id) return ''
  return buildTermShortLabel(schoolYear.term_type, term.term_number)
}

export function buildTermDeleteMessage(term, schoolYear) {
  if (!isRecord(term) || !isRecord(schoolYear)) return ''
  return `Delete the ${term.label} of ${schoolYear.name}? This cannot be undone.`
}

export function buildTermActivateMessage(term, schoolYear) {
  if (!isRecord(term) || !isRecord(schoolYear)) return ''
  return `Set the ${term.label} of ${schoolYear.name} as the active term? It replaces the current active term.`
}
