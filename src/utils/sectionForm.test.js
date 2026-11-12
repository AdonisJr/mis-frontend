import { describe, it, expect } from 'vitest'
import {
  buildFormFromSection,
  buildSectionPayload,
  buildSectionProgramRule,
  clearUnfitProgram,
  createEmptySectionForm,
  findGradeLevel,
  findSectionFormErrors,
  listSelectablePrograms,
  listStagePrograms,
  toIdText,
  toRecordId,
} from '@/utils/sectionForm.js'

const GRADE_7 = { id: 1, name: 'Grade 7', stage: 'jhs', sort_order: 1 }
const GRADE_11 = { id: 5, name: 'Grade 11', stage: 'shs', sort_order: 5 }
const GRADE_12 = { id: 6, name: 'Grade 12', stage: 'shs', sort_order: 6 }
const FIRST_YEAR_COLLEGE = { id: 7, name: '1st Year College', stage: 'college', sort_order: 7 }
const GRADE_LEVELS = [GRADE_7, GRADE_11, GRADE_12, FIRST_YEAR_COLLEGE]

const STEM = { id: 1, code: 'STEM', name: 'Science, Technology, Engineering and Mathematics', stage: 'shs', is_active: true }
const ABM = { id: 2, code: 'ABM', name: 'Accountancy, Business and Management', stage: 'shs', is_active: false }
const BSIT = { id: 3, code: 'BSIT', name: 'Bachelor of Science in Information Technology', stage: 'college', is_active: true }
const PROGRAMS = [STEM, ABM, BSIT]

const SHS_SECTION = {
  id: 9,
  school_year_id: 4,
  grade_level_id: 5,
  program_id: 1,
  name: 'STEM 11-A',
  capacity: 40,
  room: 'Rm 101',
  grade_level: { id: 5, name: 'Grade 11', stage: 'shs' },
  program: { id: 1, code: 'STEM', name: 'Science, Technology, Engineering and Mathematics' },
}
const JHS_SECTION = {
  id: 10,
  school_year_id: 4,
  grade_level_id: 1,
  program_id: null,
  name: 'A',
  capacity: 35,
  room: null,
  grade_level: { id: 1, name: 'Grade 7', stage: 'jhs' },
  program: null,
}

const VALID_SHS_FORM = { school_year_id: '4', grade_level_id: '5', program_id: '1', name: ' STEM 11-A ', capacity: '40', room: '' }

const WHOLE_CAPACITY_MESSAGE = 'Capacity must be a whole number of at least 1.'
const UNAVAILABLE_PROGRAM_MESSAGE = "Choose an active program of this grade level's stage."

function ruleFor(gradeLevel, currentProgramId) {
  return buildSectionProgramRule(
    gradeLevel,
    listSelectablePrograms(listStagePrograms(PROGRAMS, gradeLevel?.stage ?? ''), currentProgramId),
  )
}

describe('toRecordId', () => {
  it('converts select strings and integers to ids and rejects anything else', () => {
    expect(toRecordId('7')).toBe(7)
    expect(toRecordId(' 7 ')).toBe(7)
    expect(toRecordId(7)).toBe(7)
    for (const invalidId of ['', '0', '-1', '1.5', 'abc', null, 1.5]) {
      expect(toRecordId(invalidId)).toBeNull()
    }
  })
})

describe('toIdText', () => {
  it('turns ids into the strings the selects hold', () => {
    expect(toIdText(7)).toBe('7')
    expect(toIdText('7')).toBe('7')
    expect(toIdText(null)).toBe('')
    expect(toIdText('x')).toBe('')
  })
})

describe('createEmptySectionForm', () => {
  it('defaults the school year to the given id as a string and leaves the rest empty', () => {
    const expectedForm = { school_year_id: '4', grade_level_id: '', program_id: '', name: '', capacity: '', room: '' }
    expect(createEmptySectionForm(4)).toEqual(expectedForm)
    expect(createEmptySectionForm('4')).toEqual(expectedForm)
    expect(createEmptySectionForm('').school_year_id).toBe('')
  })
})

describe('buildFormFromSection', () => {
  it('copies a section as strings the controls hold', () => {
    expect(buildFormFromSection(SHS_SECTION)).toEqual({
      school_year_id: '4',
      grade_level_id: '5',
      program_id: '1',
      name: 'STEM 11-A',
      capacity: '40',
      room: 'Rm 101',
    })
    const jhsForm = buildFormFromSection(JHS_SECTION)
    expect(jhsForm.program_id).toBe('')
    expect(jhsForm.room).toBe('')
  })

  it('returns an empty form for a missing section', () => {
    expect(buildFormFromSection(null)).toEqual(createEmptySectionForm(''))
  })
})

describe('findGradeLevel', () => {
  it('finds the grade level for a select string and returns null otherwise', () => {
    expect(findGradeLevel(GRADE_LEVELS, '5')).toBe(GRADE_11)
    expect(findGradeLevel(GRADE_LEVELS, '')).toBeNull()
    expect(findGradeLevel(GRADE_LEVELS, '99')).toBeNull()
  })
})

describe('listStagePrograms', () => {
  it('keeps the programs of the stage, or all programs without a stage', () => {
    expect(listStagePrograms(PROGRAMS, 'shs')).toEqual([STEM, ABM])
    expect(listStagePrograms(PROGRAMS, 'college')).toEqual([BSIT])
    expect(listStagePrograms(PROGRAMS, 'jhs')).toEqual([])
    expect(listStagePrograms(PROGRAMS, '')).toEqual(PROGRAMS)
  })
})

describe('listSelectablePrograms', () => {
  it('keeps only active programs when adding', () => {
    expect(listSelectablePrograms([STEM, ABM], null)).toEqual([STEM])
  })

  it("keeps the section's current inactive program on edit", () => {
    expect(listSelectablePrograms([STEM, ABM], 2)).toEqual([STEM, ABM])
    expect(listSelectablePrograms([STEM, ABM], '2')).toEqual([STEM, ABM])
  })
})

describe('buildSectionProgramRule', () => {
  it('forbids a program for JHS, lists selectable ids otherwise and marks a missing grade level', () => {
    expect(ruleFor(GRADE_7, null)).toEqual({ isGradeLevelChosen: true, isProgramForbidden: true, programIds: [] })
    const shsRule = ruleFor(GRADE_11, null)
    expect(shsRule.programIds).toEqual([1])
    expect(shsRule.isProgramForbidden).toBe(false)
    expect(buildSectionProgramRule(null, []).isGradeLevelChosen).toBe(false)
  })
})

describe('findSectionFormErrors', () => {
  it('returns no errors for a valid SHS section entered as strings', () => {
    expect(findSectionFormErrors(VALID_SHS_FORM, ruleFor(GRADE_11, null))).toEqual({})
  })

  it('returns no errors for a JHS section without a program', () => {
    const jhsForm = { ...VALID_SHS_FORM, grade_level_id: '1', program_id: '' }
    expect(findSectionFormErrors(jhsForm, ruleFor(GRADE_7, null))).toEqual({})
  })

  it('flags a blank school year, grade level, name and capacity', () => {
    const formErrors = findSectionFormErrors(createEmptySectionForm(''), buildSectionProgramRule(null, []))
    expect(formErrors).toEqual({
      school_year_id: ['School year is required.'],
      grade_level_id: ['Grade level is required.'],
      name: ['Name is required.'],
      capacity: ['Capacity is required.'],
    })
    expect(formErrors).not.toHaveProperty('program_id')
  })

  it('rejects a program on a JHS section', () => {
    const jhsForm = { ...VALID_SHS_FORM, grade_level_id: '1', program_id: '1' }
    expect(findSectionFormErrors(jhsForm, ruleFor(GRADE_7, null)).program_id).toEqual(['JHS sections have no program.'])
  })

  it('requires a program for SHS and college sections', () => {
    const noProgramForm = { ...VALID_SHS_FORM, program_id: '' }
    const requiredMessage = ['Program is required for this grade level.']
    expect(findSectionFormErrors(noProgramForm, ruleFor(GRADE_11, null)).program_id).toEqual(requiredMessage)
    expect(findSectionFormErrors(noProgramForm, ruleFor(FIRST_YEAR_COLLEGE, null)).program_id).toEqual(requiredMessage)
  })

  it('rejects a program from another stage', () => {
    const collegeProgramForm = { ...VALID_SHS_FORM, program_id: '3' }
    expect(findSectionFormErrors(collegeProgramForm, ruleFor(GRADE_11, null)).program_id).toEqual([
      UNAVAILABLE_PROGRAM_MESSAGE,
    ])
  })

  it('rejects an inactive program when adding', () => {
    const inactiveProgramForm = { ...VALID_SHS_FORM, program_id: '2' }
    expect(findSectionFormErrors(inactiveProgramForm, ruleFor(GRADE_11, null)).program_id).toEqual([
      UNAVAILABLE_PROGRAM_MESSAGE,
    ])
  })

  it("accepts the section's current inactive program on edit", () => {
    const inactiveProgramForm = { ...VALID_SHS_FORM, program_id: '2' }
    expect(findSectionFormErrors(inactiveProgramForm, ruleFor(GRADE_11, 2))).toEqual({})
  })

  it('rejects a capacity of 0, a negative, a decimal or text', () => {
    const invalidCapacities = [
      { capacity: '0' },
      { capacity: '-5' },
      { capacity: '1.5' },
      { capacity: '2.0' },
      { capacity: 'abc' },
      { capacity: '1e3' },
    ]
    for (const invalidCapacity of invalidCapacities) {
      const formErrors = findSectionFormErrors({ ...VALID_SHS_FORM, ...invalidCapacity }, ruleFor(GRADE_11, null))
      expect(formErrors.capacity).toEqual([WHOLE_CAPACITY_MESSAGE])
    }
  })

  it('rejects an empty capacity', () => {
    for (const capacity of ['', '   ']) {
      const formErrors = findSectionFormErrors({ ...VALID_SHS_FORM, capacity }, ruleFor(GRADE_11, null))
      expect(formErrors.capacity).toEqual(['Capacity is required.'])
    }
  })

  it('accepts capacity 1 and the maximum and rejects one above it', () => {
    for (const capacity of ['1', ' 40 ', '2147483647']) {
      const formErrors = findSectionFormErrors({ ...VALID_SHS_FORM, capacity }, ruleFor(GRADE_11, null))
      expect(formErrors).not.toHaveProperty('capacity')
    }
    const tooLargeErrors = findSectionFormErrors({ ...VALID_SHS_FORM, capacity: '2147483648' }, ruleFor(GRADE_11, null))
    expect(tooLargeErrors.capacity).toEqual(['Capacity must be at most 2147483647.'])
  })

  it('rejects a name or room longer than 255 characters', () => {
    const tooLongForm = { ...VALID_SHS_FORM, name: 'a'.repeat(256), room: 'a'.repeat(256) }
    const formErrors = findSectionFormErrors(tooLongForm, ruleFor(GRADE_11, null))
    expect(formErrors.name).toEqual(['Name must be at most 255 characters.'])
    expect(formErrors.room).toEqual(['Room must be at most 255 characters.'])
    const maxLengthForm = { ...VALID_SHS_FORM, name: 'a'.repeat(255), room: 'a'.repeat(255) }
    expect(findSectionFormErrors(maxLengthForm, ruleFor(GRADE_11, null))).toEqual({})
  })
})

describe('clearUnfitProgram', () => {
  it('clears the program when the new grade level is JHS', () => {
    const jhsForm = { ...VALID_SHS_FORM, grade_level_id: '1' }
    expect(clearUnfitProgram(jhsForm, ruleFor(GRADE_7, null))).toEqual({ ...jhsForm, program_id: '' })
  })

  it('clears the program when the new grade level has another stage', () => {
    const collegeForm = { ...VALID_SHS_FORM, grade_level_id: '7' }
    expect(clearUnfitProgram(collegeForm, ruleFor(FIRST_YEAR_COLLEGE, null)).program_id).toBe('')
  })

  it('keeps a program that still fits, including the current inactive one on edit', () => {
    const grade12Form = { ...VALID_SHS_FORM, grade_level_id: '6' }
    expect(clearUnfitProgram(grade12Form, ruleFor(GRADE_12, null))).toBe(grade12Form)
    const inactiveProgramForm = { ...grade12Form, program_id: '2' }
    expect(clearUnfitProgram(inactiveProgramForm, ruleFor(GRADE_12, 2))).toBe(inactiveProgramForm)
    const noProgramForm = { ...grade12Form, program_id: '' }
    expect(clearUnfitProgram(noProgramForm, ruleFor(GRADE_12, null))).toBe(noProgramForm)
  })
})

describe('buildSectionPayload', () => {
  it('sends ids and capacity as numbers, a trimmed name and null for an empty room', () => {
    const sectionPayload = buildSectionPayload(VALID_SHS_FORM)
    expect(sectionPayload).toEqual({
      school_year_id: 4,
      grade_level_id: 5,
      program_id: 1,
      name: 'STEM 11-A',
      capacity: 40,
      room: null,
    })
    expect(Object.keys(sectionPayload)).toEqual(['school_year_id', 'grade_level_id', 'program_id', 'name', 'capacity', 'room'])
    expect(buildSectionPayload({ ...VALID_SHS_FORM, room: ' Rm 101 ' }).room).toBe('Rm 101')
  })

  it('sends program_id null for a JHS section', () => {
    expect(buildSectionPayload({ ...VALID_SHS_FORM, program_id: '' }).program_id).toBeNull()
  })
})
