import {
  ENROLLMENT_STATUS_COMPLETED,
  ENROLLMENT_STATUS_DROPPED,
  ENROLLMENT_STATUS_ENROLLED,
  ENROLLMENT_STATUS_MOVED,
  ENROLLMENT_STATUS_TRANSFERRED,
  getEnrollmentStatusChip,
} from '@/utils/enrollmentStatus.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { STUDENT_GENDER_OPTIONS } from '@/utils/studentForm.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const ROSTER_BASE_COLUMNS = Object.freeze(
  [
    { key: 'number', label: 'No.' },
    { key: 'name', label: 'Name' },
    { key: 'lrn', label: 'LRN' },
    { key: 'gender', label: 'Gender' },
    { key: 'status', label: 'Status' },
  ].map((column) => Object.freeze(column)),
)

export const GUARDIAN_COLUMNS = Object.freeze(
  [
    { key: 'guardian_name', label: 'Guardian' },
    { key: 'guardian_relationship', label: 'Relationship' },
    { key: 'guardian_contact', label: 'Contact' },
  ].map((column) => Object.freeze(column)),
)

export const LISTED_STATUSES = Object.freeze([ENROLLMENT_STATUS_ENROLLED, ENROLLMENT_STATUS_COMPLETED])
export const LEFT_STATUSES = Object.freeze([
  ENROLLMENT_STATUS_MOVED,
  ENROLLMENT_STATUS_DROPPED,
  ENROLLMENT_STATUS_TRANSFERRED,
])

const GUARDIAN_PROBE_KEY = 'guardian_name'
const SORT_OPTIONS = Object.freeze({ sensitivity: 'base' })

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function listRows(rowList) {
  return Array.isArray(rowList) ? rowList.filter(isRecordObject) : []
}

export function hasGuardianFields(rosterGroups) {
  if (!isRecordObject(rosterGroups)) return false
  const allRows = [...listRows(rosterGroups.listedRows), ...listRows(rosterGroups.leftRows)]
  return allRows.some((rosterRow) => Object.hasOwn(rosterRow, GUARDIAN_PROBE_KEY))
}

export function buildRosterColumns(isGuardianVisible) {
  if (!isGuardianVisible) return [...ROSTER_BASE_COLUMNS]
  return [...ROSTER_BASE_COLUMNS, ...GUARDIAN_COLUMNS]
}

function compareNames(firstRow, secondRow) {
  const nameKeys = ['last_name', 'first_name', 'middle_name']
  for (const nameKey of nameKeys) {
    const comparison = String(firstRow[nameKey] ?? '').localeCompare(String(secondRow[nameKey] ?? ''), undefined, SORT_OPTIONS)
    if (comparison !== 0) return comparison
  }
  return 0
}

function buildGenderText(gender) {
  const genderOption = STUDENT_GENDER_OPTIONS.find((option) => option.value === gender)
  return genderOption ? genderOption.label : NO_VALUE_LABEL
}

function copyGuardianFields(sourceRow, displayRow) {
  for (const guardianColumn of GUARDIAN_COLUMNS) {
    if (Object.hasOwn(sourceRow, guardianColumn.key)) displayRow[guardianColumn.key] = sourceRow[guardianColumn.key] ?? NO_VALUE_LABEL
  }
  return displayRow
}

function buildRosterRow(sourceRow, rowIndex) {
  const displayRow = {
    key: sourceRow.enrollment_id,
    number: rowIndex + 1,
    name: formatEnrollmentStudentName(sourceRow),
    lrn: sourceRow.lrn || NO_VALUE_LABEL,
    gender: buildGenderText(sourceRow.gender),
    statusChip: getEnrollmentStatusChip(sourceRow.status),
  }
  return copyGuardianFields(sourceRow, displayRow)
}

function buildRowGroup(sourceRows) {
  return [...sourceRows].sort(compareNames).map(buildRosterRow)
}

export function buildRosterGroups(rosterSource) {
  if (!isRecordObject(rosterSource)) return { listedRows: [], leftRows: [] }
  const allRows = [...listRows(rosterSource.students), ...listRows(rosterSource.left_the_class)]
  const leftSourceRows = allRows.filter((sourceRow) => LEFT_STATUSES.includes(sourceRow.status))
  const listedSourceRows = allRows.filter((sourceRow) => !LEFT_STATUSES.includes(sourceRow.status))
  return { listedRows: buildRowGroup(listedSourceRows), leftRows: buildRowGroup(leftSourceRows) }
}
