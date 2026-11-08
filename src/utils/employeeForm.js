export const PASSWORD_MIN_LENGTH = 8

export const EMPLOYEE_ROLE_OPTIONS = Object.freeze([
  { value: 'admin', label: 'Admin' },
  { value: 'registrar', label: 'Registrar' },
])

export const EMPLOYEE_FIELD_LABELS = Object.freeze({
  name: 'Name',
  email: 'Email',
  contact: 'Contact',
  roles: 'Roles',
  password: 'Password',
  password_confirmation: 'Confirm password',
})

export const ROLES_REQUIRED_MESSAGE = 'Select at least one role.'
export const PASSWORD_LENGTH_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
export const PASSWORD_MISMATCH_MESSAGE = 'Passwords do not match.'

const EMPLOYEE_ROLE_VALUES = Object.freeze(EMPLOYEE_ROLE_OPTIONS.map((roleOption) => roleOption.value))
const REQUIRED_TEXT_FIELDS = Object.freeze(['name', 'email'])

function toTrimmedText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

// passwords are never trimmed — Laravel TrimStrings skips password fields, so the server sees them as typed
function toPasswordText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue)
}

function buildRequiredMessage(fieldKey) {
  return `${EMPLOYEE_FIELD_LABELS[fieldKey]} is required.`
}

function findPasswordError(password) {
  if (password === '') return buildRequiredMessage('password')
  if (password.length < PASSWORD_MIN_LENGTH) return PASSWORD_LENGTH_MESSAGE
  return ''
}

function filterKnownRoles(selectedRoles) {
  if (!Array.isArray(selectedRoles)) return []
  return EMPLOYEE_ROLE_VALUES.filter((roleValue) => selectedRoles.includes(roleValue))
}

export function createEmptyEmployeeForm() {
  return { name: '', email: '', contact: '', roles: [], password: '', password_confirmation: '' }
}

export function createEmptyPasswordForm() {
  return { password: '', password_confirmation: '' }
}

export function buildFormFromEmployee(employee) {
  if (employee === null || typeof employee !== 'object') return createEmptyEmployeeForm()
  return {
    name: employee.name ?? '',
    email: employee.email ?? '',
    contact: employee.contact ?? '',
    roles: filterKnownRoles(employee.roles),
    password: '',
    password_confirmation: '',
  }
}

export function findEmployeeFormErrors(formValues, isCreating) {
  const formErrors = {}
  for (const fieldKey of REQUIRED_TEXT_FIELDS) {
    if (toTrimmedText(formValues?.[fieldKey]) === '') formErrors[fieldKey] = [buildRequiredMessage(fieldKey)]
  }
  if (filterKnownRoles(formValues?.roles).length === 0) formErrors.roles = [ROLES_REQUIRED_MESSAGE]
  if (!isCreating) return formErrors
  return { ...formErrors, ...findPasswordFormErrors(formValues) }
}

export function findPasswordFormErrors(passwordValues) {
  const passwordErrors = {}
  const password = toPasswordText(passwordValues?.password)
  const passwordError = findPasswordError(password)
  if (passwordError !== '') passwordErrors.password = [passwordError]
  if (toPasswordText(passwordValues?.password_confirmation) !== password) {
    passwordErrors.password_confirmation = [PASSWORD_MISMATCH_MESSAGE]
  }
  return passwordErrors
}

export function buildEmployeePayload(formValues, isCreating) {
  const trimmedContact = toTrimmedText(formValues?.contact)
  const employeePayload = {
    name: toTrimmedText(formValues?.name),
    email: toTrimmedText(formValues?.email),
    contact: trimmedContact === '' ? null : trimmedContact,
    roles: filterKnownRoles(formValues?.roles),
  }
  if (!isCreating) return employeePayload
  return { ...employeePayload, ...buildPasswordPayload(formValues) }
}

export function buildPasswordPayload(passwordValues) {
  return {
    password: toPasswordText(passwordValues?.password),
    password_confirmation: toPasswordText(passwordValues?.password_confirmation),
  }
}

export function toggleRole(selectedRoles, roleValue) {
  const currentRoles = filterKnownRoles(selectedRoles)
  if (currentRoles.includes(roleValue)) return currentRoles.filter((currentRole) => currentRole !== roleValue)
  return filterKnownRoles([...currentRoles, roleValue])
}

export function buildAuthUserFromEmployee(employee) {
  if (employee === null || typeof employee !== 'object') return null
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    roles: Array.isArray(employee.roles) ? [...employee.roles] : [],
  }
}
