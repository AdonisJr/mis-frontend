import { ACTIVE_CHIP, INACTIVE_CHIP } from '@/utils/employeeDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'

// mirrors the backend mobile-account status values
export const MOBILE_ACCOUNT_STATUS_NONE = 'none'
export const MOBILE_ACCOUNT_STATUS_ACTIVE = 'active'
export const MOBILE_ACCOUNT_STATUS_INACTIVE = 'inactive'
export const MOBILE_ACCOUNT_STATUS_MUST_CHANGE = 'must_change_password'

export const MOBILE_ACCOUNT_ACTION_CREATE = 'create'
export const MOBILE_ACCOUNT_ACTION_RESET = 'reset'
export const MOBILE_ACCOUNT_ACTION_DEACTIVATE = 'deactivate'
export const MOBILE_ACCOUNT_ACTION_REACTIVATE = 'reactivate'

export const ONE_TIME_PASSWORD_NOTE =
  'This password is shown only once. Copy or print it now; a lost password is replaced with Reset password.'
export const SLIP_TITLE = 'MIS student app — login slip'
export const SLIP_INSTRUCTIONS = Object.freeze([
  'Install the MIS student app on your phone.',
  'Log in with your LRN as the username and the temporary password on this slip.',
  'You must change this password the first time you log in.',
])
export const GENERATE_PICK_SECTION_HINT = 'Pick a section in the filters to generate its mobile accounts.'
export const GENERATE_ACTIVE_YEAR_HINT = 'Mobile accounts can be generated only for sections of the active school year.'

const NEUTRAL_CLASS = 'bg-slate-200 text-slate-700'
const STATUS_CHIPS = Object.freeze({
  [MOBILE_ACCOUNT_STATUS_NONE]: Object.freeze({ label: 'No account', colorClass: NEUTRAL_CLASS }),
  [MOBILE_ACCOUNT_STATUS_ACTIVE]: ACTIVE_CHIP,
  [MOBILE_ACCOUNT_STATUS_INACTIVE]: INACTIVE_CHIP,
  [MOBILE_ACCOUNT_STATUS_MUST_CHANGE]: Object.freeze({
    label: 'Must change password',
    colorClass: 'bg-amber-100 text-amber-800',
  }),
})
const UNKNOWN_CHIP = Object.freeze({ label: 'Unknown', colorClass: NEUTRAL_CLASS })

const RESET_AND_DEACTIVATE = Object.freeze([MOBILE_ACCOUNT_ACTION_RESET, MOBILE_ACCOUNT_ACTION_DEACTIVATE])
const STATUS_ACTIONS = Object.freeze({
  [MOBILE_ACCOUNT_STATUS_NONE]: Object.freeze([MOBILE_ACCOUNT_ACTION_CREATE]),
  [MOBILE_ACCOUNT_STATUS_ACTIVE]: RESET_AND_DEACTIVATE,
  [MOBILE_ACCOUNT_STATUS_MUST_CHANGE]: RESET_AND_DEACTIVATE,
  [MOBILE_ACCOUNT_STATUS_INACTIVE]: Object.freeze([MOBILE_ACCOUNT_ACTION_RESET, MOBILE_ACCOUNT_ACTION_REACTIVATE]),
})
const NO_ACTIONS = Object.freeze([])

const CONFIRM_BUILDERS = Object.freeze({
  [MOBILE_ACCOUNT_ACTION_RESET]: (studentName) => ({
    title: 'Reset mobile password',
    message: `Give ${studentName} a new temporary password? The old password stops working and the student is signed out of the app.`,
    confirmLabel: 'Reset password',
    isDestructive: false,
  }),
  [MOBILE_ACCOUNT_ACTION_DEACTIVATE]: (studentName) => ({
    title: 'Deactivate mobile account',
    message: `Deactivate the mobile account of ${studentName}? The student is signed out and cannot log in until it is reactivated.`,
    confirmLabel: 'Deactivate',
    isDestructive: true,
  }),
  [MOBILE_ACCOUNT_ACTION_REACTIVATE]: (studentName) => ({
    title: 'Reactivate mobile account',
    message: `Reactivate the mobile account of ${studentName}? The student can log in again with the current password.`,
    confirmLabel: 'Reactivate',
    isDestructive: false,
  }),
})

function isNonBlankText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function formatCountNoun(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function readCount(count) {
  return Number.isInteger(count) ? count : 0
}

export function getMobileAccountStatusChip(status) {
  return STATUS_CHIPS[status] ?? UNKNOWN_CHIP
}

export function listMobileAccountActions(status) {
  return STATUS_ACTIONS[status] ?? NO_ACTIONS
}

export function buildMobileAccountConfirm(action, studentName) {
  const confirmBuilder = CONFIRM_BUILDERS[action]
  if (!confirmBuilder) return null
  return confirmBuilder(studentName)
}

export function buildStudentAccountEntry(student, temporaryPassword) {
  return { lrn: student.lrn, name: formatEnrollmentStudentName(student), temporary_password: temporaryPassword }
}

export function buildSlipContext(sectionLabel, schoolYearName) {
  return {
    sectionLabel: isNonBlankText(sectionLabel) ? sectionLabel : NO_VALUE_LABEL,
    schoolYearName: isNonBlankText(schoolYearName) ? schoolYearName : NO_VALUE_LABEL,
  }
}

export function buildSlipRows(accounts, slipContext) {
  if (!Array.isArray(accounts)) return []
  return accounts
    .filter((account) => isNonBlankText(account?.temporary_password))
    .map((account) => ({
      key: account.lrn,
      lrn: account.lrn,
      name: account.name,
      temporaryPassword: account.temporary_password,
      sectionLabel: slipContext.sectionLabel,
      schoolYearName: slipContext.schoolYearName,
    }))
}

export function buildSlipFieldLines(slipRow) {
  return [
    { label: 'Student', value: slipRow.name },
    { label: 'Username (LRN)', value: slipRow.lrn },
    { label: 'Temporary password', value: slipRow.temporaryPassword },
    { label: 'Section', value: slipRow.sectionLabel },
    { label: 'School year', value: slipRow.schoolYearName },
  ]
}

export function buildGenerateConfirmMessage(sectionLabel) {
  return `Create mobile accounts for every student currently enrolled in ${sectionLabel} who has none? Each temporary password is shown only once.`
}

export function buildGenerateResultText(generateResponse) {
  const createdCount = readCount(generateResponse?.created_count)
  const skippedCount = readCount(generateResponse?.skipped_count)
  const skippedText = `Skipped ${formatCountNoun(skippedCount, 'student')} with an existing account.`
  if (createdCount === 0 && skippedCount === 0) return 'No students are currently enrolled in this section.'
  if (createdCount === 0) return `No new accounts. ${skippedText}`
  const createdText = `Created ${formatCountNoun(createdCount, 'account')}.`
  return skippedCount > 0 ? `${createdText} ${skippedText}` : createdText
}

export function getGenerateAvailability(section, activeSchoolYearId) {
  if (section === null) return { isEnabled: false, hint: GENERATE_PICK_SECTION_HINT }
  if (section.school_year_id !== activeSchoolYearId) return { isEnabled: false, hint: GENERATE_ACTIVE_YEAR_HINT }
  return { isEnabled: true, hint: '' }
}
