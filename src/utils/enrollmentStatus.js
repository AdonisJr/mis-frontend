import { formatEnrollmentSection, formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'

export const ENROLLMENT_STATUS_ENROLLED = 'enrolled'
export const ENROLLMENT_STATUS_MOVED = 'moved'
export const ENROLLMENT_STATUS_DROPPED = 'dropped'
export const ENROLLMENT_STATUS_TRANSFERRED = 'transferred'
export const ENROLLMENT_STATUS_COMPLETED = 'completed'

export const ENROLLMENT_STATUSES = Object.freeze([
  ENROLLMENT_STATUS_ENROLLED,
  ENROLLMENT_STATUS_MOVED,
  ENROLLMENT_STATUS_DROPPED,
  ENROLLMENT_STATUS_TRANSFERRED,
  ENROLLMENT_STATUS_COMPLETED,
])

export const ENROLLMENT_STATUS_OPTIONS = Object.freeze(
  [
    { value: ENROLLMENT_STATUS_ENROLLED, label: 'Enrolled' },
    { value: ENROLLMENT_STATUS_MOVED, label: 'Moved' },
    { value: ENROLLMENT_STATUS_DROPPED, label: 'Dropped' },
    { value: ENROLLMENT_STATUS_TRANSFERRED, label: 'Transferred' },
    { value: ENROLLMENT_STATUS_COMPLETED, label: 'Completed' },
  ].map((statusOption) => Object.freeze(statusOption)),
)

export const ENROLLMENT_ACTION_MOVE = 'move'
export const ENROLLMENT_ACTION_DROP = 'drop'
export const ENROLLMENT_ACTION_TRANSFER = 'transfer'
export const ENROLLMENT_ACTION_COMPLETE = 'complete'

const NEUTRAL_CHIP_CLASS = 'bg-slate-200 text-slate-700'
const STATUS_CHIP_CLASSES = Object.freeze({
  [ENROLLMENT_STATUS_ENROLLED]: 'bg-green-100 text-green-800',
  [ENROLLMENT_STATUS_DROPPED]: 'bg-red-100 text-red-800',
  [ENROLLMENT_STATUS_TRANSFERRED]: 'bg-amber-100 text-amber-800',
  [ENROLLMENT_STATUS_MOVED]: NEUTRAL_CHIP_CLASS,
  [ENROLLMENT_STATUS_COMPLETED]: NEUTRAL_CHIP_CLASS,
})
const STATUS_LABELS = Object.freeze(
  Object.fromEntries(ENROLLMENT_STATUS_OPTIONS.map((statusOption) => [statusOption.value, statusOption.label])),
)

export function getEnrollmentStatusChip(status) {
  if (typeof status !== 'string' || !Object.hasOwn(STATUS_LABELS, status)) {
    // an unexpected status stays visible as its raw text instead of a blank cell
    return { label: typeof status === 'string' ? status : '', colorClass: NEUTRAL_CHIP_CLASS }
  }
  return { label: STATUS_LABELS[status], colorClass: STATUS_CHIP_CLASSES[status] }
}

export function listEnrollmentActions(enrollment) {
  if (enrollment?.status !== ENROLLMENT_STATUS_ENROLLED) return []
  return [ENROLLMENT_ACTION_MOVE, ENROLLMENT_ACTION_DROP, ENROLLMENT_ACTION_TRANSFER, ENROLLMENT_ACTION_COMPLETE]
}

const CLOSING_CONFIRM_BUILDERS = Object.freeze({
  [ENROLLMENT_ACTION_DROP]: (studentName, sectionName) => ({
    title: 'Drop student',
    confirmLabel: 'Drop',
    message: `Drop ${studentName} from ${sectionName}? The record closes as dropped and cannot be changed.`,
  }),
  [ENROLLMENT_ACTION_TRANSFER]: (studentName, sectionName) => ({
    title: 'Transfer out',
    confirmLabel: 'Transfer',
    message: `Mark ${studentName} as transferred out of the school? The record in ${sectionName} closes and cannot be changed.`,
  }),
  [ENROLLMENT_ACTION_COMPLETE]: (studentName, sectionName) => ({
    title: 'Complete enrollment',
    confirmLabel: 'Complete',
    message: `Mark ${studentName} as completed in ${sectionName}? The record closes and cannot be changed.`,
  }),
})

export function buildClosingConfirm(action, enrollment) {
  if (!Object.hasOwn(CLOSING_CONFIRM_BUILDERS, action)) return null
  const studentName = formatEnrollmentStudentName(enrollment?.student)
  const sectionName = formatEnrollmentSection(enrollment)
  return CLOSING_CONFIRM_BUILDERS[action](studentName, sectionName)
}
