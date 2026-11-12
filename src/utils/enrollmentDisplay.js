import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

export const WHOLE_YEAR_LABEL = 'Whole year'
export const NOT_ENROLLED_LABEL = 'Not enrolled'

export const ENROLLMENT_COLUMNS = Object.freeze(
  [
    { key: 'lrn', label: 'LRN' },
    { key: 'student', label: 'Student' },
    { key: 'grade_level', label: 'Grade level' },
    { key: 'section', label: 'Section' },
    { key: 'term', label: 'Term' },
    { key: 'status', label: 'Status' },
    { key: 'enrolled_at', label: 'Enrolled' },
  ].map((column) => Object.freeze(column)),
)

const NAME_SEPARATOR = ', '
const GRADE_LEVEL_SECTION_SEPARATOR = ' · '

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function formatEnrollmentStudentName(student) {
  if (!isRecordObject(student)) return NO_VALUE_LABEL
  const fullName = `${student.last_name}${NAME_SEPARATOR}${student.first_name}`
  const middleName = (student.middle_name ?? '').trim()
  if (!middleName) return fullName
  return `${fullName} ${middleName.charAt(0).toUpperCase()}.`
}

export function formatEnrollmentGradeLevel(enrollment) {
  return enrollment?.section?.grade_level?.name ?? NO_VALUE_LABEL
}

export function formatEnrollmentSection(enrollment) {
  const section = enrollment?.section
  if (!isRecordObject(section)) return NO_VALUE_LABEL
  if (!isRecordObject(section.program)) return section.name
  return `${section.name} (${section.program.code})`
}

export function formatEnrollmentTerm(enrollment) {
  if (!isRecordObject(enrollment?.term)) return WHOLE_YEAR_LABEL
  return enrollment.term.label
}

export function formatCurrentEnrollment(student) {
  const currentEnrollment = student?.current_enrollment
  if (!isRecordObject(currentEnrollment)) return NOT_ENROLLED_LABEL
  const gradeLevelName = currentEnrollment.grade_level?.name
  const sectionName = currentEnrollment.section?.name
  return `${gradeLevelName}${GRADE_LEVEL_SECTION_SEPARATOR}${sectionName}`
}
