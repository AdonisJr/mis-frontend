import { STAGE_JHS, STAGE_SHS } from '@/utils/programDisplay.js'
import { listStagePrograms, toIdText, toRecordId } from '@/utils/sectionForm.js'
import { getSubjectTypeStage } from '@/utils/subjectDisplay.js'
import { getAllowedTermNumbers } from '@/utils/termForm.js'

export const CURRICULUM_STAGES = Object.freeze([STAGE_JHS, STAGE_SHS])

const SUBJECT_REQUIRED_MESSAGE = 'Choose a subject.'

function isCurriculumStage(gradeLevel) {
  return CURRICULUM_STAGES.includes(gradeLevel?.stage)
}

function findMaxSortOrder(entries) {
  const sortOrders = entries.map((entry) => entry.sort_order).filter((sortOrder) => Number.isInteger(sortOrder))
  return Math.max(0, ...sortOrders)
}

export function listCurriculumGradeLevels(gradeLevels) {
  if (!Array.isArray(gradeLevels)) return []
  return gradeLevels.filter((gradeLevel) => CURRICULUM_STAGES.includes(gradeLevel.stage))
}

export function isShsGradeLevel(gradeLevel) {
  return gradeLevel?.stage === STAGE_SHS
}

export function isSubjectTypeAllowed(subjectType, gradeLevel) {
  if (!isCurriculumStage(gradeLevel)) return false
  return getSubjectTypeStage(subjectType) === gradeLevel.stage
}

export function listCurriculumPrograms(programs) {
  return listStagePrograms(programs, STAGE_SHS)
}

export function createCurriculumFilters() {
  return { schoolYearId: '', gradeLevelId: '', programId: '', termNumber: '' }
}

export function applyCurriculumSchoolYearChange(curriculumFilters, nextSchoolYearId) {
  return { ...curriculumFilters, schoolYearId: toIdText(nextSchoolYearId) }
}

export function applyCurriculumGradeLevelChange(curriculumFilters, nextGradeLevelId) {
  return { ...curriculumFilters, gradeLevelId: toIdText(nextGradeLevelId) }
}

export function applyCurriculumProgramChange(curriculumFilters, nextProgramId) {
  return { ...curriculumFilters, programId: toIdText(nextProgramId) }
}

export function applyCurriculumTermChange(curriculumFilters, nextTermNumber) {
  return { ...curriculumFilters, termNumber: toIdText(nextTermNumber) }
}

export function clearNonShsFields(curriculumFilters, gradeLevel) {
  if (isShsGradeLevel(gradeLevel)) return curriculumFilters
  return { ...curriculumFilters, programId: '', termNumber: '' }
}

// filters hold the term as text, the allowed term numbers are numbers
export function clearUnfitTermNumber(curriculumFilters, schoolYear) {
  const termNumber = toRecordId(curriculumFilters.termNumber)
  if (termNumber === null) return curriculumFilters
  if (getAllowedTermNumbers(schoolYear?.term_type).includes(termNumber)) return curriculumFilters
  return { ...curriculumFilters, termNumber: '' }
}

export function isCurriculumGroupComplete(curriculumFilters, gradeLevel) {
  if (toRecordId(curriculumFilters?.schoolYearId) === null) return false
  if (!isCurriculumStage(gradeLevel)) return false
  if (!isShsGradeLevel(gradeLevel)) return true
  return toRecordId(curriculumFilters.programId) !== null && toRecordId(curriculumFilters.termNumber) !== null
}

export function buildCurriculumGroupFields(curriculumFilters, gradeLevel) {
  if (!isCurriculumGroupComplete(curriculumFilters, gradeLevel)) return null
  const groupFields = {
    school_year_id: toRecordId(curriculumFilters.schoolYearId),
    grade_level_id: gradeLevel.id,
  }
  if (!isShsGradeLevel(gradeLevel)) return groupFields
  groupFields.program_id = toRecordId(curriculumFilters.programId)
  groupFields.term_number = toRecordId(curriculumFilters.termNumber)
  return groupFields
}

export function listPickableSubjects(activeSubjects, gradeLevel) {
  if (!Array.isArray(activeSubjects)) return []
  return activeSubjects.filter(
    (subject) => subject.is_active === true && isSubjectTypeAllowed(subject.type, gradeLevel),
  )
}

export function buildCurriculumAddRule(groupFields, entries) {
  const entryList = Array.isArray(entries) ? entries : []
  return {
    groupFields,
    usedSubjectIds: entryList.map((entry) => entry.subject?.id),
    nextSortOrder: Math.max(findMaxSortOrder(entryList), entryList.length) + 1,
  }
}

export function excludeUsedSubjects(subjects, addRule) {
  if (!Array.isArray(subjects)) return []
  const usedSubjectIds = addRule?.usedSubjectIds ?? []
  return subjects.filter((subject) => !usedSubjectIds.includes(subject.id))
}

export function findAddEntryErrors(subjectIdText) {
  if (toRecordId(subjectIdText) === null) return { subject_id: [SUBJECT_REQUIRED_MESSAGE] }
  return {}
}

export function buildAddEntryPayload(addRule, subjectIdText) {
  return {
    ...addRule.groupFields,
    subject_id: toRecordId(subjectIdText),
    sort_order: addRule.nextSortOrder,
  }
}

// GET /school-years orders by start_date desc, so the row after the target is the previous year
export function pickPreviousSchoolYearId(schoolYears, targetSchoolYearId) {
  const targetId = toRecordId(targetSchoolYearId)
  if (!Array.isArray(schoolYears) || targetId === null) return ''
  const targetIndex = schoolYears.findIndex((schoolYear) => schoolYear.id === targetId)
  if (targetIndex === -1) return ''
  return toIdText(schoolYears[targetIndex + 1]?.id)
}
