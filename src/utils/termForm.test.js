import { describe, it, expect } from 'vitest'
import {
  buildFormFromTerm,
  buildTermPayload,
  createEmptyTermForm,
  findTermConflictErrors,
  findTermFormErrors,
  getAllowedTermNumbers,
  getTermNumberOptions,
  listOtherTerms,
} from '@/utils/termForm.js'

const SEMESTER_YEAR = Object.freeze({
  id: 7,
  term_type: 'semester',
  start_date: '2030-06-01',
  end_date: '2031-05-31',
  name: 'SY 2030–2031',
})
const TRIMESTER_YEAR = Object.freeze({ ...SEMESTER_YEAR, id: 8, term_type: 'trimester' })
const FIRST_TERM = Object.freeze({
  id: 1,
  school_year_id: 7,
  term_number: 1,
  label: '1st Semester',
  start_date: '2030-06-01',
  end_date: '2030-10-31',
  is_active: false,
})
const SECOND_TERM = Object.freeze({
  id: 2,
  school_year_id: 7,
  term_number: 2,
  label: '2nd Semester',
  start_date: '2030-11-01',
  end_date: '2031-03-31',
  is_active: false,
})

describe('getAllowedTermNumbers', () => {
  it('allows 1–2 for semester and 1–3 for trimester', () => {
    expect(getAllowedTermNumbers('semester')).toEqual([1, 2])
    expect(getAllowedTermNumbers('trimester')).toEqual([1, 2, 3])
  })

  it('allows no numbers for an unknown or missing type', () => {
    expect(getAllowedTermNumbers('quarter')).toEqual([])
    expect(getAllowedTermNumbers(undefined)).toEqual([])
  })
})

describe('getTermNumberOptions', () => {
  it("labels each allowed number for the year's type", () => {
    expect(getTermNumberOptions('trimester')).toEqual([
      { value: 1, label: '1st Trimester' },
      { value: 2, label: '2nd Trimester' },
      { value: 3, label: '3rd Trimester' },
    ])
  })
})

describe('createEmptyTermForm', () => {
  it('returns an empty term number and dates', () => {
    expect(createEmptyTermForm()).toEqual({ term_number: '', start_date: '', end_date: '' })
  })
})

describe('buildFormFromTerm', () => {
  it('copies term number and dates, never id, label or is_active', () => {
    expect(buildFormFromTerm(FIRST_TERM)).toEqual({ term_number: 1, start_date: '2030-06-01', end_date: '2030-10-31' })
  })

  it('returns an empty form for a missing term', () => {
    expect(buildFormFromTerm(null)).toEqual(createEmptyTermForm())
  })
})

describe('listOtherTerms', () => {
  it('leaves out the edited term and keeps all terms when adding', () => {
    expect(listOtherTerms([FIRST_TERM, SECOND_TERM], FIRST_TERM)).toEqual([SECOND_TERM])
    expect(listOtherTerms([FIRST_TERM, SECOND_TERM], null)).toEqual([FIRST_TERM, SECOND_TERM])
    expect(listOtherTerms(null, null)).toEqual([])
  })
})

describe('findTermFormErrors', () => {
  it('returns no errors for a valid term inside the school year', () => {
    const formValues = { term_number: '2', start_date: '2030-11-01', end_date: '2031-03-31' }
    expect(findTermFormErrors(formValues, SEMESTER_YEAR)).toEqual({})
  })

  it('flags a blank term number and blank dates', () => {
    expect(findTermFormErrors(createEmptyTermForm(), SEMESTER_YEAR)).toEqual({
      term_number: ['Choose a term for this school year.'],
      start_date: ['Start date is required.'],
      end_date: ['End date is required.'],
    })
  })

  it('rejects term 3 in a semester year and accepts it in a trimester year', () => {
    const formValues = { term_number: '3', start_date: '2031-04-01', end_date: '2031-05-31' }
    expect(findTermFormErrors(formValues, SEMESTER_YEAR)).toEqual({ term_number: ['Choose a term for this school year.'] })
    expect(findTermFormErrors(formValues, TRIMESTER_YEAR)).toEqual({})
  })

  it('rejects an end date on or before the start date', () => {
    const sameDayForm = { term_number: 1, start_date: '2030-07-01', end_date: '2030-07-01' }
    const earlierEndForm = { term_number: 1, start_date: '2030-07-01', end_date: '2030-06-30' }
    const expectedErrors = { end_date: ['End date must be after the start date.'] }
    expect(findTermFormErrors(sameDayForm, SEMESTER_YEAR)).toEqual(expectedErrors)
    expect(findTermFormErrors(earlierEndForm, SEMESTER_YEAR)).toEqual(expectedErrors)
  })

  it('rejects a start date before the school year starts', () => {
    const formValues = { term_number: 1, start_date: '2030-05-31', end_date: '2030-10-31' }
    expect(findTermFormErrors(formValues, SEMESTER_YEAR)).toEqual({
      start_date: ['Start date must be within the school year.'],
    })
  })

  it('rejects an end date after the school year ends', () => {
    const formValues = { term_number: 2, start_date: '2030-11-01', end_date: '2031-06-01' }
    expect(findTermFormErrors(formValues, SEMESTER_YEAR)).toEqual({
      end_date: ['End date must be within the school year.'],
    })
  })

  it("accepts dates on the school year's first and last day", () => {
    const formValues = { term_number: 1, start_date: '2030-06-01', end_date: '2031-05-31' }
    expect(findTermFormErrors(formValues, SEMESTER_YEAR)).toEqual({})
  })
})

describe('findTermConflictErrors', () => {
  it('returns no errors when no other term conflicts', () => {
    const formValues = { term_number: 2, start_date: '2030-11-01', end_date: '2031-03-31' }
    expect(findTermConflictErrors(formValues, [FIRST_TERM])).toEqual({})
  })

  it('rejects a term number already used in the school year', () => {
    const formValues = { term_number: '1', start_date: '2031-04-01', end_date: '2031-05-31' }
    expect(findTermConflictErrors(formValues, [FIRST_TERM])).toEqual({
      term_number: ['This term already exists in this school year.'],
    })
  })

  it('rejects dates that overlap an earlier term on the start date', () => {
    const formValues = { term_number: '2', start_date: '2030-10-15', end_date: '2031-03-31' }
    expect(findTermConflictErrors(formValues, [FIRST_TERM])).toEqual({
      start_date: ['The term overlaps the 1st Semester.'],
    })
  })

  it('treats a shared day as an overlap', () => {
    const formValues = { term_number: 2, start_date: '2030-10-31', end_date: '2031-03-31' }
    expect(findTermConflictErrors(formValues, [FIRST_TERM])).toEqual({
      start_date: ['The term overlaps the 1st Semester.'],
    })
  })

  it('rejects dates that overlap a later term on the end date', () => {
    const formValues = { term_number: 1, start_date: '2030-06-01', end_date: '2030-11-15' }
    expect(findTermConflictErrors(formValues, [SECOND_TERM])).toEqual({
      end_date: ['The term overlaps the 2nd Semester.'],
    })
  })

  it('rejects a later term that starts before an earlier term ends', () => {
    const laterFirstTerm = { ...FIRST_TERM, start_date: '2030-11-01', end_date: '2031-03-31' }
    const formValues = { term_number: 2, start_date: '2030-06-01', end_date: '2030-10-31' }
    expect(findTermConflictErrors(formValues, [laterFirstTerm])).toEqual({
      start_date: ['The term must start after the 1st Semester ends.'],
    })
  })

  it('rejects an earlier term that ends after a later term starts', () => {
    const formValues = { term_number: 1, start_date: '2031-04-01', end_date: '2031-05-31' }
    expect(findTermConflictErrors(formValues, [SECOND_TERM])).toEqual({
      end_date: ['The term must end before the 2nd Semester starts.'],
    })
  })

  it('allows adding term 2 before term 1 exists', () => {
    const formValues = { term_number: 2, start_date: '2030-11-01', end_date: '2031-03-31' }
    expect(findTermConflictErrors(formValues, [])).toEqual({})
  })
})

describe('buildTermPayload', () => {
  it('sends term_number as a number and the dates, never is_active', () => {
    const termPayload = buildTermPayload({
      term_number: '2',
      start_date: '2030-11-01',
      end_date: '2031-03-31',
      is_active: true,
    })
    expect(termPayload).toEqual({ term_number: 2, start_date: '2030-11-01', end_date: '2031-03-31' })
    expect(Object.keys(termPayload)).toEqual(['term_number', 'start_date', 'end_date'])
  })
})
