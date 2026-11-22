import { describe, it, expect } from 'vitest'
import {
  buildFormFromSection,
  buildSectionPayload,
  buildSectionProgramRule,
  clearUnfitProgram,
  createEmptySectionForm,
  findGradeLevel,
  findSectionFormErrors,
  getFirstFieldError,
  listSelectableAdvisers,
  listSelectablePrograms,
  listSelectableRooms,
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
  room: { id: 3, name: 'Rm 101', building: 'Main' },
  adviser: { id: 12, name: 'Ana Cruz' },
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
  adviser: null,
  grade_level: { id: 1, name: 'Grade 7', stage: 'jhs' },
  program: null,
}

const VALID_SHS_FORM = { school_year_id: '4', grade_level_id: '5', program_id: '1', name: ' STEM 11-A ', capacity: '40', room_id: '', adviser_id: '' }

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
    const expectedForm = { school_year_id: '4', grade_level_id: '', program_id: '', name: '', capacity: '', room_id: '', adviser_id: '' }
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
      room_id: '3',
      adviser_id: '12',
    })
    const jhsForm = buildFormFromSection(JHS_SECTION)
    expect(jhsForm.program_id).toBe('')
    expect(jhsForm.room_id).toBe('')
    expect(jhsForm.adviser_id).toBe('')
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

  it('rejects a name longer than 255 characters', () => {
    const tooLongForm = { ...VALID_SHS_FORM, name: 'a'.repeat(256) }
    const formErrors = findSectionFormErrors(tooLongForm, ruleFor(GRADE_11, null))
    expect(formErrors.name).toEqual(['Name must be at most 255 characters.'])
    const maxLengthForm = { ...VALID_SHS_FORM, name: 'a'.repeat(255) }
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
  it('sends ids and capacity as numbers, a trimmed name and null for an empty room and adviser', () => {
    const sectionPayload = buildSectionPayload(VALID_SHS_FORM)
    expect(sectionPayload).toEqual({
      school_year_id: 4,
      grade_level_id: 5,
      program_id: 1,
      name: 'STEM 11-A',
      capacity: 40,
      room_id: null,
      adviser_id: null,
    })
    expect(Object.keys(sectionPayload)).toEqual([
      'school_year_id',
      'grade_level_id',
      'program_id',
      'name',
      'capacity',
      'room_id',
      'adviser_id',
    ])
  })

  it('sends the chosen room and adviser ids as numbers', () => {
    const sectionPayload = buildSectionPayload({ ...VALID_SHS_FORM, room_id: '3', adviser_id: '12' })
    expect(sectionPayload.room_id).toBe(3)
    expect(sectionPayload.adviser_id).toBe(12)
  })

  it('sends program_id null for a JHS section', () => {
    expect(buildSectionPayload({ ...VALID_SHS_FORM, program_id: '' }).program_id).toBeNull()
  })
})

describe('buildFormFromSection without room and adviser', () => {
  it('uses empty strings when the section has no room or adviser keys', () => {
    const { room, adviser, ...bareSection } = SHS_SECTION
    const bareForm = buildFormFromSection(bareSection)
    expect(bareForm.room_id).toBe('')
    expect(bareForm.adviser_id).toBe('')
  })
})

describe('listSelectableRooms', () => {
  const ROOM_A = { id: 1, name: 'A', building: null, is_active: true }
  const ROOM_B = { id: 2, name: 'B', building: 'Main', is_active: true }

  it('appends the section room as inactive when it is not among the active rooms', () => {
    const activeRooms = [ROOM_A, ROOM_B]
    const selectableRooms = listSelectableRooms(activeRooms, { id: 9, name: 'Old', building: null })
    expect(selectableRooms).toEqual([ROOM_A, ROOM_B, { id: 9, name: 'Old', building: null, is_active: false }])
    expect(activeRooms).toEqual([ROOM_A, ROOM_B])
  })

  it('does not duplicate a listed room and tolerates missing input', () => {
    expect(listSelectableRooms([ROOM_A, ROOM_B], ROOM_B)).toEqual([ROOM_A, ROOM_B])
    expect(listSelectableRooms([ROOM_A], null)).toEqual([ROOM_A])
    expect(listSelectableRooms('x', null)).toEqual([])
  })
})

describe('listSelectableAdvisers', () => {
  const ANA = { id: 12, name: 'Ana Cruz' }
  const BEN = { id: 13, name: 'Ben Reyes' }

  it('appends a stale adviser flagged as unavailable', () => {
    const activeTeachers = [ANA]
    const selectableAdvisers = listSelectableAdvisers(activeTeachers, BEN)
    expect(selectableAdvisers).toEqual([ANA, { ...BEN, isUnavailable: true }])
    expect(activeTeachers).toEqual([ANA])
  })

  it('does not duplicate a listed adviser and tolerates missing input', () => {
    expect(listSelectableAdvisers([ANA, BEN], BEN)).toEqual([ANA, BEN])
    expect(listSelectableAdvisers([ANA], null)).toEqual([ANA])
    expect(listSelectableAdvisers(undefined, null)).toEqual([])
  })
})

describe('getFirstFieldError', () => {
  const ADVISER_MESSAGE = 'Ana Cruz already advises Grade 7 - Rizal in this school year.'

  it('returns the first message of a field', () => {
    expect(getFirstFieldError({ adviser_id: [ADVISER_MESSAGE] }, 'adviser_id')).toBe(ADVISER_MESSAGE)
    expect(getFirstFieldError({ room_id: ['The selected room is inactive.', 'x'] }, 'room_id')).toBe(
      'The selected room is inactive.',
    )
  })

  it('returns an empty string when there is no message', () => {
    expect(getFirstFieldError({ name: ['x'] }, 'room_id')).toBe('')
    expect(getFirstFieldError({}, 'room_id')).toBe('')
    expect(getFirstFieldError(null, 'room_id')).toBe('')
    expect(getFirstFieldError({ room_id: [] }, 'room_id')).toBe('')
  })
})
