import { SOURCE_GOVERNMENT } from '@/utils/discountTypeForm.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

export const REFERENCE_NO_MAX_LENGTH = 50
export const REMARKS_MAX_LENGTH = 500

export const STUDENT_REQUIRED_MESSAGE = 'Choose a student.'
export const DISCOUNT_TYPE_REQUIRED_MESSAGE = 'Choose a discount type.'
export const DISCOUNT_TYPE_INACTIVE_MESSAGE = 'This discount type is inactive.'
export const STAGE_MISMATCH_MESSAGE = "This discount type does not apply to the student's stage."
export const TYPE_ALREADY_HELD_MESSAGE = 'The student already holds this discount type this school year.'
export const GOVERNMENT_ALREADY_HELD_MESSAGE = 'The student already holds a government discount type this school year.'
export const REFERENCE_NO_TOO_LONG_MESSAGE = `Reference no. must be at most ${REFERENCE_NO_MAX_LENGTH} characters.`
export const REMARKS_TOO_LONG_MESSAGE = `Remarks must be at most ${REMARKS_MAX_LENGTH} characters.`

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

function toText(fieldValue) {
  if (fieldValue === null || fieldValue === undefined) return ''
  return String(fieldValue).trim()
}

function toNullableText(fieldValue) {
  const text = toText(fieldValue)
  return text === '' ? null : text
}

function listEnrollments(enrollmentResponse) {
  const enrollments = enrollmentResponse?.enrollments
  return Array.isArray(enrollments) ? enrollments : []
}

function isCandidateRow(enrollment) {
  const studentId = toRecordId(enrollment?.student?.id)
  return studentId !== null && typeof enrollment?.section?.grade_level?.stage === 'string'
}

function toCandidate(enrollment) {
  const gradeLevel = enrollment.section.grade_level
  return { studentId: toRecordId(enrollment.student.id), student: enrollment.student, gradeLevel, stage: gradeLevel.stage }
}

function compareCandidates(firstCandidate, secondCandidate) {
  const byName = formatEnrollmentStudentName(firstCandidate.student).localeCompare(
    formatEnrollmentStudentName(secondCandidate.student),
  )
  if (byName !== 0) return byName
  return toText(firstCandidate.student.lrn).localeCompare(toText(secondCandidate.student.lrn))
}

// AMB-9: enrolled rows come first, so the first row per student wins
export function mergeEnrollmentCandidates(enrolledResponse, completedResponse) {
  const candidatesByStudent = new Map()
  const rows = [...listEnrollments(enrolledResponse), ...listEnrollments(completedResponse)]
  rows.forEach((enrollment) => {
    if (!isCandidateRow(enrollment)) return
    const studentId = toRecordId(enrollment.student.id)
    if (!candidatesByStudent.has(studentId)) candidatesByStudent.set(studentId, toCandidate(enrollment))
  })
  return [...candidatesByStudent.values()].sort(compareCandidates)
}

function hasLaterPage(enrollmentResponse) {
  const currentPage = enrollmentResponse?.meta?.current_page
  const lastPage = enrollmentResponse?.meta?.last_page
  return Number.isInteger(currentPage) && Number.isInteger(lastPage) && lastPage > currentPage
}

export function hasMoreCandidates(enrolledResponse, completedResponse) {
  return hasLaterPage(enrolledResponse) || hasLaterPage(completedResponse)
}

export function createEmptyAssignForm(schoolYearId) {
  return { school_year_id: toIdText(schoolYearId), student_id: '', discount_type_id: '', reference_no: '', remarks: '' }
}

export function buildNoteFormFromStudentDiscount(studentDiscount) {
  return { reference_no: studentDiscount?.reference_no ?? '', remarks: studentDiscount?.remarks ?? '' }
}

export function buildAssignRule(candidate, heldStudentDiscounts) {
  const heldList = Array.isArray(heldStudentDiscounts) ? heldStudentDiscounts : []
  const heldTypes = heldList.map((held) => held?.discount_type)
  return {
    stage: candidate?.stage ?? '',
    heldTypeIds: heldTypes.map((heldType) => toRecordId(heldType?.id)).filter((typeId) => typeId !== null),
    hasGovernmentType: heldTypes.some((heldType) => heldType?.source === SOURCE_GOVERNMENT),
  }
}

export function findDiscountType(discountTypes, discountTypeId) {
  const recordId = toRecordId(discountTypeId)
  if (recordId === null || !Array.isArray(discountTypes)) return null
  return discountTypes.find((discountType) => toRecordId(discountType?.id) === recordId) ?? null
}

function appliesToStage(discountType, stage) {
  return Array.isArray(discountType?.stages) && discountType.stages.includes(stage)
}

export function listAssignableDiscountTypes(discountTypes, assignRule) {
  const stage = assignRule?.stage
  if (typeof stage !== 'string' || stage === '' || !Array.isArray(discountTypes)) return []
  return discountTypes.filter((discountType) => discountType?.is_active === true && appliesToStage(discountType, stage))
}

export function findAssignTypeError(discountType, assignRule) {
  if (!isRecordObject(discountType)) return DISCOUNT_TYPE_REQUIRED_MESSAGE
  if (discountType.is_active !== true) return DISCOUNT_TYPE_INACTIVE_MESSAGE
  if (!appliesToStage(discountType, assignRule?.stage)) return STAGE_MISMATCH_MESSAGE
  if (assignRule?.heldTypeIds?.includes(toRecordId(discountType.id))) return TYPE_ALREADY_HELD_MESSAGE
  if (discountType.source === SOURCE_GOVERNMENT && assignRule?.hasGovernmentType === true) {
    return GOVERNMENT_ALREADY_HELD_MESSAGE
  }
  return ''
}

export function findStudentDiscountNoteErrors(formValues) {
  const noteErrors = {}
  if (toText(formValues?.reference_no).length > REFERENCE_NO_MAX_LENGTH) {
    noteErrors.reference_no = [REFERENCE_NO_TOO_LONG_MESSAGE]
  }
  if (toText(formValues?.remarks).length > REMARKS_MAX_LENGTH) noteErrors.remarks = [REMARKS_TOO_LONG_MESSAGE]
  return noteErrors
}

export function findAssignFormErrors(formValues, typeError) {
  const assignErrors = {}
  // the picker holds '' when empty and the plan says null; both count as missing
  if (toRecordId(formValues?.student_id) === null) assignErrors.student_id = [STUDENT_REQUIRED_MESSAGE]
  if (typeError !== '') assignErrors.discount_type_id = [typeError]
  return { ...assignErrors, ...findStudentDiscountNoteErrors(formValues) }
}

export function buildAssignPayload(formValues) {
  return {
    student_id: toRecordId(formValues.student_id),
    school_year_id: toRecordId(formValues.school_year_id),
    discount_type_id: toRecordId(formValues.discount_type_id),
    reference_no: toNullableText(formValues.reference_no),
    remarks: toNullableText(formValues.remarks),
  }
}

export function buildNotePayload(formValues) {
  return { reference_no: toNullableText(formValues.reference_no), remarks: toNullableText(formValues.remarks) }
}
