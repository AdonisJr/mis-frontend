import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { getAllowedTermNumbers } from '@/utils/termForm.js'

const SCHOOL_YEAR_PARAM = 'school_year_id'
const TERM_PARAM = 'term_number'
const TEACHER_PARAM = 'teacher_id'
const FIRST_TERM_TEXT = '1'

function isRecordObject(record) {
  return record !== null && typeof record === 'object'
}

export function createClassListFilters() {
  return { schoolYearId: '', termNumber: '', teacherId: '' }
}

export function pickDefaultTermNumber(schoolYear, activeTerm) {
  if (!isRecordObject(schoolYear)) return ''
  const allowedTerms = getAllowedTermNumbers(schoolYear.term_type)
  if (allowedTerms.length === 0) return ''
  const isActiveTermOfYear = isRecordObject(activeTerm) && activeTerm.school_year_id === schoolYear.id
  if (isActiveTermOfYear && allowedTerms.includes(activeTerm.term_number)) return String(activeTerm.term_number)
  return FIRST_TERM_TEXT
}

export function applyClassListSchoolYearChange(classListFilters, schoolYear) {
  return {
    ...classListFilters,
    schoolYearId: toIdText(schoolYear?.id),
    termNumber: pickDefaultTermNumber(schoolYear, null),
  }
}

export function applyClassListTermChange(classListFilters, nextTermNumber) {
  return { ...classListFilters, termNumber: toIdText(nextTermNumber) }
}

export function applyClassListTeacherChange(classListFilters, nextTeacherId) {
  return { ...classListFilters, teacherId: toIdText(nextTeacherId) }
}

export function buildClassListParams(classListFilters, canPickTeacher) {
  const schoolYearId = toRecordId(classListFilters?.schoolYearId)
  if (schoolYearId === null) return null
  const teacherId = toRecordId(classListFilters.teacherId)
  if (canPickTeacher && teacherId === null) return null
  const classListParams = { [SCHOOL_YEAR_PARAM]: schoolYearId }
  const termNumber = toRecordId(classListFilters.termNumber)
  if (termNumber !== null) classListParams[TERM_PARAM] = termNumber
  if (canPickTeacher) classListParams[TEACHER_PARAM] = teacherId
  return classListParams
}

export function readClassListQuery(routeQuery) {
  return {
    schoolYearId: toIdText(routeQuery?.[SCHOOL_YEAR_PARAM]),
    termNumber: toIdText(routeQuery?.[TERM_PARAM]),
    teacherId: toIdText(routeQuery?.[TEACHER_PARAM]),
  }
}

export function buildClassListQuery(classListFilters) {
  const classListQuery = {}
  if (classListFilters?.schoolYearId) classListQuery[SCHOOL_YEAR_PARAM] = classListFilters.schoolYearId
  if (classListFilters?.termNumber) classListQuery[TERM_PARAM] = classListFilters.termNumber
  if (classListFilters?.teacherId) classListQuery[TEACHER_PARAM] = classListFilters.teacherId
  return classListQuery
}
