import { STAGE_JHS, STAGE_SHS } from '@/utils/programDisplay.js'
import { listStagePrograms, toIdText, toRecordId } from '@/utils/sectionForm.js'
import { FIRST_PAGE, applyPageChange } from '@/utils/studentSearch.js'

export const FEE_SCHEDULE_DEFAULT_ONLY_FILTER = 'default'
// the only place that names the wire value for "default schedules only"
export const FEE_SCHEDULE_DEFAULT_ONLY_PARAM = 'none'

const PAGE_PARAM = 'page'
const SCHOOL_YEAR_PARAM = 'school_year_id'
const GRADE_LEVEL_PARAM = 'grade_level_id'
const PROGRAM_PARAM = 'program_id'

export function createFeeScheduleFilters() {
  return { schoolYearId: '', gradeLevelId: '', programId: '', page: FIRST_PAGE }
}

function buildProgramParam(programFilter) {
  if (programFilter === FEE_SCHEDULE_DEFAULT_ONLY_FILTER) return FEE_SCHEDULE_DEFAULT_ONLY_PARAM
  return toRecordId(programFilter)
}

export function buildFeeScheduleListParams(feeScheduleFilters) {
  const schoolYearId = toRecordId(feeScheduleFilters?.schoolYearId)
  // the API requires school_year_id, so no request is built without one
  if (schoolYearId === null) return null
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, feeScheduleFilters.page).page
  const listParams = { [SCHOOL_YEAR_PARAM]: schoolYearId, [PAGE_PARAM]: listPage }
  const gradeLevelId = toRecordId(feeScheduleFilters.gradeLevelId)
  const programParam = buildProgramParam(feeScheduleFilters.programId)
  if (gradeLevelId !== null) listParams[GRADE_LEVEL_PARAM] = gradeLevelId
  if (programParam !== null) listParams[PROGRAM_PARAM] = programParam
  return listParams
}

export function applyFeeScheduleSchoolYearChange(feeScheduleFilters, nextSchoolYearId) {
  return { ...feeScheduleFilters, schoolYearId: toIdText(nextSchoolYearId), page: FIRST_PAGE }
}

export function applyFeeScheduleGradeLevelChange(feeScheduleFilters, nextGradeLevelId) {
  return { ...feeScheduleFilters, gradeLevelId: toIdText(nextGradeLevelId), page: FIRST_PAGE }
}

export function applyFeeScheduleProgramChange(feeScheduleFilters, nextProgramId) {
  const programFilter =
    nextProgramId === FEE_SCHEDULE_DEFAULT_ONLY_FILTER ? FEE_SCHEDULE_DEFAULT_ONLY_FILTER : toIdText(nextProgramId)
  return { ...feeScheduleFilters, programId: programFilter, page: FIRST_PAGE }
}

export function listScheduleFilterPrograms(programs, gradeLevel) {
  if (gradeLevel?.stage === STAGE_JHS) return []
  return listStagePrograms(programs, STAGE_SHS)
}

export function clearUnfitScheduleProgramFilter(feeScheduleFilters, programOptions) {
  const programFilter = feeScheduleFilters.programId
  if (programFilter === '' || programFilter === FEE_SCHEDULE_DEFAULT_ONLY_FILTER) return feeScheduleFilters
  const programId = toRecordId(programFilter)
  const availablePrograms = Array.isArray(programOptions) ? programOptions : []
  if (availablePrograms.some((program) => program.id === programId)) return feeScheduleFilters
  return { ...feeScheduleFilters, programId: '', page: FIRST_PAGE }
}
