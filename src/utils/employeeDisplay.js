export const NO_CONTACT_TEXT = '—'
export const ROLE_CHIP_CLASS = 'rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent'
export const ACTIVE_CHIP = Object.freeze({ label: 'Active', colorClass: 'bg-green-100 text-green-800' })
export const INACTIVE_CHIP = Object.freeze({ label: 'Inactive', colorClass: 'bg-slate-200 text-slate-700' })

function isEmployeeObject(employee) {
  return employee !== null && typeof employee === 'object'
}

export function getStatusChip(isActive) {
  if (isActive === true) return ACTIVE_CHIP
  return INACTIVE_CHIP
}

export function buildDeactivateMessage(employee) {
  if (!isEmployeeObject(employee)) return ''
  return `Deactivate ${employee.name} (${employee.email})? They are signed out at once and cannot log in until reactivated.`
}

export function buildReactivateMessage(employee) {
  if (!isEmployeeObject(employee)) return ''
  return `Reactivate ${employee.name} (${employee.email})? They can log in again.`
}

export function buildPasswordResetMessage(employee) {
  if (!isEmployeeObject(employee)) return ''
  return `Set a new password for ${employee.name}. They are signed out of every session and must log in with the new password.`
}
