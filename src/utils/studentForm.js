export const LRN_LENGTH = 12
const LRN_PATTERN = new RegExp(`^\\d{${LRN_LENGTH}}$`)
export const TEXT_MAX_LENGTH = 255
export const CONTACT_MAX_LENGTH = 20

export const STUDENT_GENDER_OPTIONS = Object.freeze([
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
])

export const STUDENT_FIELD_LABELS = Object.freeze({
  lrn: 'LRN',
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  birth_date: 'Birth date',
  gender: 'Gender',
  address: 'Address',
  contact: 'Contact',
  guardian_name: 'Guardian name',
  guardian_relationship: 'Guardian relationship',
  guardian_contact: 'Guardian contact',
})

export const STUDENT_FORM_FIELDS = Object.freeze(Object.keys(STUDENT_FIELD_LABELS))
export const OPTIONAL_STUDENT_FIELDS = Object.freeze(['middle_name', 'address', 'contact'])
const REQUIRED_STUDENT_FIELDS = Object.freeze(
  STUDENT_FORM_FIELDS.filter((fieldKey) => !OPTIONAL_STUDENT_FIELDS.includes(fieldKey)),
)
export const LRN_FORMAT_MESSAGE = `LRN must be exactly ${LRN_LENGTH} digits.`

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function buildRequiredMessage(fieldKey) {
  return `${STUDENT_FIELD_LABELS[fieldKey]} is required.`
}

function toPayloadValue(formValues, fieldKey) {
  const trimmedValue = toTrimmedText(formValues?.[fieldKey])
  if (trimmedValue === '' && OPTIONAL_STUDENT_FIELDS.includes(fieldKey)) return null
  return trimmedValue
}

export function createEmptyStudentForm() {
  return Object.fromEntries(STUDENT_FORM_FIELDS.map((fieldKey) => [fieldKey, '']))
}

export function buildFormFromStudent(student) {
  if (student === null || typeof student !== 'object') return createEmptyStudentForm()
  return Object.fromEntries(STUDENT_FORM_FIELDS.map((fieldKey) => [fieldKey, student[fieldKey] ?? '']))
}

export function findStudentFormErrors(formValues) {
  const formErrors = {}
  for (const fieldKey of REQUIRED_STUDENT_FIELDS) {
    if (toTrimmedText(formValues?.[fieldKey]) === '') formErrors[fieldKey] = [buildRequiredMessage(fieldKey)]
  }
  const trimmedLrn = toTrimmedText(formValues?.lrn)
  if (trimmedLrn !== '' && !LRN_PATTERN.test(trimmedLrn)) formErrors.lrn = [LRN_FORMAT_MESSAGE]
  return formErrors
}

export function buildStudentPayload(formValues) {
  return Object.fromEntries(STUDENT_FORM_FIELDS.map((fieldKey) => [fieldKey, toPayloadValue(formValues, fieldKey)]))
}
