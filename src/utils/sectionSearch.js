import { FIRST_PAGE, applyPageChange, normalizeSearchText } from '@/utils/studentSearch.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'

const PAGE_PARAM = 'page'
const SEARCH_PARAM = 'search'
const SCHOOL_YEAR_PARAM = 'school_year_id'
const GRADE_LEVEL_PARAM = 'grade_level_id'
const PROGRAM_PARAM = 'program_id'

export function createSectionFilters() {
  return { schoolYearId: '', gradeLevelId: '', programId: '', search: '', page: FIRST_PAGE }
}

export function buildSectionListParams(sectionFilters) {
  const schoolYearId = toRecordId(sectionFilters?.schoolYearId)
  // the API requires school_year_id, so no request is built without one
  if (schoolYearId === null) return null
  // applyPageChange returns its input unchanged for an invalid page, so the page falls back to 1
  const listPage = applyPageChange({ page: FIRST_PAGE }, sectionFilters.page).page
  const sectionListParams = { [SCHOOL_YEAR_PARAM]: schoolYearId, [PAGE_PARAM]: listPage }
  const gradeLevelId = toRecordId(sectionFilters.gradeLevelId)
  const programId = toRecordId(sectionFilters.programId)
  const normalizedSearch = normalizeSearchText(sectionFilters.search)
  if (gradeLevelId !== null) sectionListParams[GRADE_LEVEL_PARAM] = gradeLevelId
  if (programId !== null) sectionListParams[PROGRAM_PARAM] = programId
  if (normalizedSearch !== '') sectionListParams[SEARCH_PARAM] = normalizedSearch
  return sectionListParams
}

export function applySectionSchoolYearChange(sectionFilters, nextSchoolYearId) {
  return { ...sectionFilters, schoolYearId: toIdText(nextSchoolYearId), page: FIRST_PAGE }
}

export function applySectionGradeLevelChange(sectionFilters, nextGradeLevelId) {
  return { ...sectionFilters, gradeLevelId: toIdText(nextGradeLevelId), page: FIRST_PAGE }
}

export function applySectionProgramChange(sectionFilters, nextProgramId) {
  return { ...sectionFilters, programId: toIdText(nextProgramId), page: FIRST_PAGE }
}

export function clearUnfitProgramFilter(sectionFilters, programOptions) {
  if (sectionFilters.programId === '') return sectionFilters
  const programId = toRecordId(sectionFilters.programId)
  const availablePrograms = Array.isArray(programOptions) ? programOptions : []
  if (availablePrograms.some((program) => program.id === programId)) return sectionFilters
  return { ...sectionFilters, programId: '', page: FIRST_PAGE }
}

// GET /school-years orders by start_date desc, so the first row is the newest year
export function pickDefaultSchoolYearId(schoolYears, activeSchoolYear) {
  if (!Array.isArray(schoolYears) || schoolYears.length === 0) return ''
  const activeId = toRecordId(activeSchoolYear?.id)
  const isActiveListed = schoolYears.some((schoolYear) => schoolYear.id === activeId)
  if (activeId !== null && isActiveListed) return String(activeId)
  return toIdText(schoolYears[0].id)
}
