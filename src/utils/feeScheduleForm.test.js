import { describe, it, expect } from 'vitest'
import {
  AMOUNT_INVALID,
  AMOUNT_REQUIRED,
  AMOUNT_TOO_LARGE,
  COPY_SAME_YEAR,
  COPY_SOURCE_REQUIRED,
  GRADE_LEVEL_NOT_BILLABLE,
  LINES_REQUIRED,
  LINE_ITEM_DUPLICATE,
  LINE_ITEM_REQUIRED,
  PROGRAM_SHS_ONLY,
  appendLine,
  buildCopyPayload,
  buildFeeSchedulePayload,
  buildFormFromFeeSchedule,
  buildLineItemOptions,
  clearUnfitScheduleProgram,
  createEmptyFeeScheduleForm,
  findCopyFormErrors,
  findFeeScheduleFormErrors,
  isProgramAllowed,
  listBillableGradeLevels,
  listScheduleProgramOptions,
  removeLineAt,
} from '@/utils/feeScheduleForm.js'

const jhsGradeLevel = { id: 1, stage: 'jhs' }
const shsGradeLevel = { id: 2, stage: 'shs' }
const collegeGradeLevel = { id: 3, stage: 'college' }
const validShsForm = {
  school_year_id: '5',
  grade_level_id: '2',
  program_id: '',
  lines: [{ fee_item_id: '4', amount: '1500' }],
}
const feeItems = [
  { id: 4, name: 'Tuition', category: 'tuition', is_active: true },
  { id: 5, name: 'Lab', category: 'miscellaneous', is_active: true },
  { id: 6, name: 'Old', category: 'other', is_active: false },
]

function withLines(lines) {
  return { ...validShsForm, lines }
}

function findAmountErrors(amountText) {
  return findFeeScheduleFormErrors(withLines([{ fee_item_id: '4', amount: amountText }]), shsGradeLevel)
}

describe('grade level and program options', () => {
  it('lists only JHS and SHS grade levels', () => {
    expect(listBillableGradeLevels([jhsGradeLevel, shsGradeLevel, collegeGradeLevel])).toEqual([
      jhsGradeLevel,
      shsGradeLevel,
    ])
    expect(listBillableGradeLevels(null)).toEqual([])
  })

  it('allows a program only for SHS', () => {
    expect(isProgramAllowed(shsGradeLevel)).toBe(true)
    expect(isProgramAllowed(jhsGradeLevel)).toBe(false)
    expect(isProgramAllowed(collegeGradeLevel)).toBe(false)
    expect(isProgramAllowed(null)).toBe(false)
  })

  it('offers no programs for JHS or no grade level and only active SHS programs for SHS', () => {
    const programs = [
      { id: 7, stage: 'shs', is_active: true },
      { id: 8, stage: 'shs', is_active: false },
      { id: 9, stage: 'college', is_active: true },
    ]
    expect(listScheduleProgramOptions(programs, jhsGradeLevel)).toEqual([])
    expect(listScheduleProgramOptions(programs, null)).toEqual([])
    expect(listScheduleProgramOptions(programs, shsGradeLevel)).toEqual([programs[0]])
  })
})

describe('form building', () => {
  it('creates an empty form with one blank line and normalizes the year id', () => {
    const emptyLine = { fee_item_id: '', amount: '' }
    expect(createEmptyFeeScheduleForm('3')).toEqual({
      school_year_id: '3',
      grade_level_id: '',
      program_id: '',
      lines: [emptyLine],
    })
    expect(createEmptyFeeScheduleForm(5).school_year_id).toBe('5')
  })

  it('maps a schedule from the API into strings, and a non-object into an empty form', () => {
    const feeSchedule = {
      school_year_id: 5,
      grade_level_id: 2,
      program_id: null,
      lines: [{ fee_item_id: 4, amount: '1500.00' }],
    }
    expect(buildFormFromFeeSchedule(feeSchedule)).toEqual({
      school_year_id: '5',
      grade_level_id: '2',
      program_id: '',
      lines: [{ fee_item_id: '4', amount: '1500.00' }],
    })
    expect(buildFormFromFeeSchedule(null)).toEqual(createEmptyFeeScheduleForm(''))
  })

  it('appends a blank line without mutating', () => {
    expect(appendLine(validShsForm).lines).toHaveLength(2)
    expect(validShsForm.lines).toHaveLength(1)
  })

  it('removes a line without mutating and ignores a bad index', () => {
    const appendedForm = appendLine(validShsForm)
    expect(removeLineAt(appendedForm, 0).lines).toEqual([{ fee_item_id: '', amount: '' }])
    expect(removeLineAt(appendedForm, 5)).toBe(appendedForm)
    expect(removeLineAt(appendedForm, 1.5)).toBe(appendedForm)
  })
})

describe('findFeeScheduleFormErrors', () => {
  it('returns nothing for a valid SHS default schedule', () => {
    expect(findFeeScheduleFormErrors(validShsForm, shsGradeLevel)).toEqual({})
  })

  it('requires a school year and a grade level', () => {
    const emptyForm = createEmptyFeeScheduleForm('')
    const formErrors = findFeeScheduleFormErrors(emptyForm, null)
    expect(formErrors.school_year_id).toEqual(['School year is required.'])
    expect(formErrors.grade_level_id).toEqual(['Grade level is required.'])
  })

  it('rejects a college grade level as not billable', () => {
    const formErrors = findFeeScheduleFormErrors({ ...validShsForm, grade_level_id: '3' }, collegeGradeLevel)
    expect(formErrors.grade_level_id).toEqual([GRADE_LEVEL_NOT_BILLABLE])
  })

  it('refuses a program on a JHS schedule (Task 72) and accepts it on SHS', () => {
    const jhsForm = { ...validShsForm, grade_level_id: '1', program_id: '7' }
    expect(findFeeScheduleFormErrors(jhsForm, jhsGradeLevel).program_id).toEqual([PROGRAM_SHS_ONLY])
    expect(findFeeScheduleFormErrors({ ...validShsForm, program_id: '7' }, shsGradeLevel)).toEqual({})
  })

  it('requires at least one line (Task 73)', () => {
    expect(findFeeScheduleFormErrors(withLines([]), shsGradeLevel)).toEqual({ lines: [LINES_REQUIRED] })
  })

  it('flags only the later line of a duplicated fee item (Task 74)', () => {
    const duplicateLines = [
      { fee_item_id: '4', amount: '10' },
      { fee_item_id: '4', amount: '20' },
    ]
    expect(findFeeScheduleFormErrors(withLines(duplicateLines), shsGradeLevel)).toEqual({
      'lines.1.fee_item_id': [LINE_ITEM_DUPLICATE],
    })
  })

  it('requires a fee item on every line', () => {
    const formErrors = findFeeScheduleFormErrors(withLines([{ fee_item_id: '', amount: '10' }]), shsGradeLevel)
    expect(formErrors).toEqual({ 'lines.0.fee_item_id': [LINE_ITEM_REQUIRED] })
  })

  it('refuses zero and negative amounts (Task 75)', () => {
    for (const amountText of ['0', '0.00', '-5']) {
      expect(findAmountErrors(amountText)['lines.0.amount']).toEqual([AMOUNT_INVALID])
    }
  })

  it('refuses malformed amounts', () => {
    for (const amountText of ['1.234', 'abc', '1,500']) {
      expect(findAmountErrors(amountText)['lines.0.amount']).toEqual([AMOUNT_INVALID])
    }
  })

  it('requires an amount on a blank line', () => {
    expect(findAmountErrors('')['lines.0.amount']).toEqual([AMOUNT_REQUIRED])
  })

  it('caps the amount at 9,999,999,999.99', () => {
    expect(findAmountErrors('10000000000.00')['lines.0.amount']).toEqual([AMOUNT_TOO_LARGE])
    expect(findAmountErrors('9999999999.99')).toEqual({})
  })
})

describe('clearUnfitScheduleProgram', () => {
  it('clears the program for JHS and no grade level, keeps it for SHS', () => {
    const formValues = { ...validShsForm, program_id: '7' }
    expect(clearUnfitScheduleProgram(formValues, jhsGradeLevel).program_id).toBe('')
    expect(clearUnfitScheduleProgram(formValues, null).program_id).toBe('')
    expect(clearUnfitScheduleProgram(formValues, shsGradeLevel)).toBe(formValues)
  })
})

describe('buildLineItemOptions', () => {
  it('excludes inactive and used-elsewhere items, keeps the own item and labels an own inactive one', () => {
    const lines = [
      { fee_item_id: 4, amount: '1' },
      { fee_item_id: 6, amount: '1' },
      { fee_item_id: null, amount: '' },
    ]
    const [firstOptions, secondOptions, thirdOptions] = buildLineItemOptions(feeItems, lines)
    expect(firstOptions.map((option) => option.id)).toEqual([4, 5])
    expect(secondOptions.map((option) => option.id)).toEqual([5, 6])
    expect(secondOptions[1].label).toBe('Old · Other (inactive)')
    expect(thirdOptions.map((option) => option.id)).toEqual([5])
    expect(firstOptions[0].label).toBe('Tuition · Tuition')
  })

  it('matches string form ids against numeric item ids', () => {
    const lines = [
      { fee_item_id: '4', amount: '1' },
      { fee_item_id: '6', amount: '1' },
      { fee_item_id: '', amount: '' },
    ]
    const [firstOptions, secondOptions, thirdOptions] = buildLineItemOptions(feeItems, lines)
    expect(firstOptions.map((option) => option.id)).toEqual([4, 5])
    expect(secondOptions.map((option) => option.id)).toEqual([5, 6])
    expect(secondOptions[1].label).toBe('Old · Other (inactive)')
    expect(thirdOptions.map((option) => option.id)).toEqual([5])
  })
})

describe('buildFeeSchedulePayload', () => {
  it('sends numeric ids, a null program and two-decimal amount strings', () => {
    const formValues = withLines([
      { fee_item_id: '4', amount: '1500' },
      { fee_item_id: '5', amount: '12.5' },
    ])
    expect(buildFeeSchedulePayload(formValues)).toEqual({
      school_year_id: 5,
      grade_level_id: 2,
      program_id: null,
      lines: [
        { fee_item_id: 4, amount: '1500.00' },
        { fee_item_id: 5, amount: '12.50' },
      ],
    })
  })
})

describe('copy helpers', () => {
  it('requires a source year different from the target', () => {
    expect(findCopyFormErrors('', '5')).toEqual({ source_school_year_id: [COPY_SOURCE_REQUIRED] })
    expect(findCopyFormErrors('5', '5')).toEqual({ source_school_year_id: [COPY_SAME_YEAR] })
    expect(findCopyFormErrors('4', '5')).toEqual({})
  })

  it('builds the copy payload with numeric ids', () => {
    expect(buildCopyPayload('4', '5')).toEqual({ source_school_year_id: 4, target_school_year_id: 5 })
  })
})
