import { describe, it, expect } from 'vitest'
import {
  CURRICULUM_STAGES,
  buildAddEntryPayload,
  buildCurriculumAddRule,
  buildCurriculumGroupFields,
  clearNonShsFields,
  clearUnfitTermNumber,
  createCurriculumFilters,
  excludeUsedSubjects,
  findAddEntryErrors,
  isCurriculumGroupComplete,
  isShsGradeLevel,
  isSubjectTypeAllowed,
  listCurriculumGradeLevels,
  listCurriculumPrograms,
  listPickableSubjects,
  pickPreviousSchoolYearId,
} from '@/utils/curriculumForm.js'

const JHS_GRADE = { id: 4, name: 'Grade 7', stage: 'jhs' }
const SHS_GRADE = { id: 5, name: 'Grade 11', stage: 'shs' }
const COLLEGE_GRADE = { id: 6, name: 'First year', stage: 'college' }

describe('listCurriculumGradeLevels', () => {
  it('keeps JHS and SHS, drops college, and returns [] for a non-array', () => {
    expect(CURRICULUM_STAGES).toEqual(['jhs', 'shs'])
    expect(listCurriculumGradeLevels([JHS_GRADE, SHS_GRADE, COLLEGE_GRADE])).toEqual([JHS_GRADE, SHS_GRADE])
    expect(listCurriculumGradeLevels(null)).toEqual([])
  })
})

describe('isShsGradeLevel', () => {
  it('is true only for an SHS grade level', () => {
    expect(isShsGradeLevel(SHS_GRADE)).toBe(true)
    expect(isShsGradeLevel(JHS_GRADE)).toBe(false)
    expect(isShsGradeLevel(COLLEGE_GRADE)).toBe(false)
    expect(isShsGradeLevel(null)).toBe(false)
  })
})

describe('isSubjectTypeAllowed', () => {
  it('matches JHS types to JHS grade levels and each SHS type to SHS grade levels only', () => {
    expect(isSubjectTypeAllowed('jhs_learning_area', JHS_GRADE)).toBe(true)
    expect(isSubjectTypeAllowed('shs_core', JHS_GRADE)).toBe(false)
    expect(isSubjectTypeAllowed('shs_core', SHS_GRADE)).toBe(true)
    expect(isSubjectTypeAllowed('shs_applied', SHS_GRADE)).toBe(true)
    expect(isSubjectTypeAllowed('shs_specialized', SHS_GRADE)).toBe(true)
    expect(isSubjectTypeAllowed('jhs_learning_area', SHS_GRADE)).toBe(false)
    expect(isSubjectTypeAllowed('shs_core', COLLEGE_GRADE)).toBe(false)
    expect(isSubjectTypeAllowed('unknown', SHS_GRADE)).toBe(false)
  })
})

describe('listCurriculumPrograms', () => {
  it('keeps SHS strands including inactive ones and drops college programs', () => {
    const programs = [
      { id: 1, stage: 'shs', is_active: true },
      { id: 2, stage: 'shs', is_active: false },
      { id: 3, stage: 'college', is_active: true },
    ]
    expect(listCurriculumPrograms(programs).map((program) => program.id)).toEqual([1, 2])
  })
})

describe('createCurriculumFilters', () => {
  it('starts with blank strings', () => {
    expect(createCurriculumFilters()).toEqual({ schoolYearId: '', gradeLevelId: '', programId: '', termNumber: '' })
  })
})

describe('clearNonShsFields', () => {
  const filters = { schoolYearId: '1', gradeLevelId: '4', programId: '2', termNumber: '1' }

  it('clears the program and term for JHS without changing the input and keeps them for SHS', () => {
    expect(clearNonShsFields(filters, JHS_GRADE)).toEqual({ ...filters, programId: '', termNumber: '' })
    expect(filters.programId).toBe('2')
    expect(clearNonShsFields(filters, SHS_GRADE)).toEqual(filters)
  })
})

describe('clearUnfitTermNumber', () => {
  const filters = { schoolYearId: '1', gradeLevelId: '5', programId: '2', termNumber: '3' }

  it('clears term 3 when the school year is a semester year and keeps it for a trimester year', () => {
    expect(clearUnfitTermNumber(filters, { term_type: 'semester' }).termNumber).toBe('')
    expect(clearUnfitTermNumber(filters, { term_type: 'trimester' }).termNumber).toBe('3')
    expect(clearUnfitTermNumber({ ...filters, termNumber: '1' }, { term_type: 'semester' }).termNumber).toBe('1')
  })
})

describe('isCurriculumGroupComplete', () => {
  it('needs a school year and grade level for JHS, plus a program and a term for SHS', () => {
    const jhsFilters = { schoolYearId: '1', gradeLevelId: '4', programId: '', termNumber: '' }
    expect(isCurriculumGroupComplete(jhsFilters, JHS_GRADE)).toBe(true)
    expect(isCurriculumGroupComplete({ ...jhsFilters, schoolYearId: '' }, JHS_GRADE)).toBe(false)
    expect(isCurriculumGroupComplete(jhsFilters, null)).toBe(false)
    const shsFilters = { schoolYearId: '1', gradeLevelId: '5', programId: '2', termNumber: '1' }
    expect(isCurriculumGroupComplete(shsFilters, SHS_GRADE)).toBe(true)
    expect(isCurriculumGroupComplete({ ...shsFilters, programId: '' }, SHS_GRADE)).toBe(false)
    expect(isCurriculumGroupComplete({ ...shsFilters, termNumber: '' }, SHS_GRADE)).toBe(false)
    expect(isCurriculumGroupComplete(shsFilters, COLLEGE_GRADE)).toBe(false)
  })
})

describe('buildCurriculumGroupFields', () => {
  it('leaves program and term out for JHS, adds them as numbers for SHS and returns null when incomplete', () => {
    const jhsFilters = { schoolYearId: '1', gradeLevelId: '4', programId: '2', termNumber: '1' }
    expect(buildCurriculumGroupFields(jhsFilters, JHS_GRADE)).toEqual({ school_year_id: 1, grade_level_id: 4 })
    const shsFilters = { schoolYearId: '1', gradeLevelId: '5', programId: '2', termNumber: '1' }
    expect(buildCurriculumGroupFields(shsFilters, SHS_GRADE)).toEqual({
      school_year_id: 1,
      grade_level_id: 5,
      program_id: 2,
      term_number: 1,
    })
    expect(buildCurriculumGroupFields({ ...shsFilters, programId: '' }, SHS_GRADE)).toBeNull()
  })
})

describe('listPickableSubjects', () => {
  it('keeps active subjects whose type fits the grade level stage', () => {
    const subjects = [
      { id: 1, type: 'jhs_learning_area', is_active: true },
      { id: 2, type: 'shs_core', is_active: true },
      { id: 3, type: 'jhs_learning_area', is_active: false },
    ]
    expect(listPickableSubjects(subjects, JHS_GRADE).map((subject) => subject.id)).toEqual([1])
  })
})

describe('buildCurriculumAddRule', () => {
  const groupFields = { school_year_id: 1, grade_level_id: 4 }

  it('numbers the next entry after the highest order or the entry count and collects used subject ids', () => {
    const usedEntries = [{ subject: { id: 7 }, sort_order: 1 }, { subject: { id: 9 }, sort_order: 2 }]
    expect(buildCurriculumAddRule(groupFields, usedEntries).usedSubjectIds).toEqual([7, 9])
    const buildOrders = (sortOrders) => sortOrders.map((sortOrder, index) => ({ subject: { id: index + 1 }, sort_order: sortOrder }))
    expect(buildCurriculumAddRule(groupFields, buildOrders([1, 2])).nextSortOrder).toBe(3)
    expect(buildCurriculumAddRule(groupFields, buildOrders([5, null])).nextSortOrder).toBe(6)
    expect(buildCurriculumAddRule(groupFields, buildOrders([null, null])).nextSortOrder).toBe(3)
    expect(buildCurriculumAddRule(groupFields, []).nextSortOrder).toBe(1)
  })
})

describe('excludeUsedSubjects', () => {
  it('drops the subjects already in the group', () => {
    const addRule = { groupFields: {}, usedSubjectIds: [7], nextSortOrder: 2 }
    expect(excludeUsedSubjects([{ id: 7 }, { id: 8 }], addRule)).toEqual([{ id: 8 }])
  })
})

describe('findAddEntryErrors', () => {
  it('asks for a subject when none is chosen', () => {
    expect(findAddEntryErrors('')).toEqual({ subject_id: ['Choose a subject.'] })
    expect(findAddEntryErrors('5')).toEqual({})
  })
})

describe('buildAddEntryPayload', () => {
  it('leaves program and term out for JHS and keeps them for SHS', () => {
    const jhsRule = { groupFields: { school_year_id: 1, grade_level_id: 4 }, usedSubjectIds: [], nextSortOrder: 3 }
    expect(buildAddEntryPayload(jhsRule, '9')).toEqual({
      school_year_id: 1,
      grade_level_id: 4,
      subject_id: 9,
      sort_order: 3,
    })
    const shsRule = {
      groupFields: { school_year_id: 1, grade_level_id: 5, program_id: 2, term_number: 1 },
      usedSubjectIds: [],
      nextSortOrder: 1,
    }
    expect(buildAddEntryPayload(shsRule, '9')).toEqual({
      school_year_id: 1,
      grade_level_id: 5,
      program_id: 2,
      term_number: 1,
      subject_id: 9,
      sort_order: 1,
    })
  })
})

describe('pickPreviousSchoolYearId', () => {
  const schoolYears = [{ id: 3 }, { id: 2 }, { id: 1 }]

  it('returns the year after the target in the newest-first list', () => {
    expect(pickPreviousSchoolYearId(schoolYears, '3')).toBe('2')
  })

  it('returns an empty text for the oldest year or an unlisted one', () => {
    expect(pickPreviousSchoolYearId(schoolYears, '1')).toBe('')
    expect(pickPreviousSchoolYearId(schoolYears, '9')).toBe('')
  })
})
