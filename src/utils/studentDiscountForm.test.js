import { describe, it, expect } from 'vitest'
import {
  DISCOUNT_TYPE_INACTIVE_MESSAGE,
  DISCOUNT_TYPE_REQUIRED_MESSAGE,
  GOVERNMENT_ALREADY_HELD_MESSAGE,
  REFERENCE_NO_TOO_LONG_MESSAGE,
  REMARKS_TOO_LONG_MESSAGE,
  STAGE_MISMATCH_MESSAGE,
  STUDENT_REQUIRED_MESSAGE,
  TYPE_ALREADY_HELD_MESSAGE,
  buildAssignPayload,
  buildAssignRule,
  buildNoteFormFromStudentDiscount,
  buildNotePayload,
  createEmptyAssignForm,
  findAssignFormErrors,
  findAssignTypeError,
  findDiscountType,
  findStudentDiscountNoteErrors,
  hasMoreCandidates,
  listAssignableDiscountTypes,
  mergeEnrollmentCandidates,
} from '@/utils/studentDiscountForm.js'

function buildEnrollment(studentId, lastName, stage) {
  return {
    student: { id: studentId, lrn: `LRN${studentId}`, first_name: 'Ana', middle_name: null, last_name: lastName },
    section: { grade_level: { name: stage === 'jhs' ? 'Grade 8' : 'Grade 11', stage } },
  }
}

function buildType(id, overrides) {
  return { id, name: `Type ${id}`, source: 'school', is_active: true, stages: ['jhs', 'shs'], ...overrides }
}

const JHS_RULE = { stage: 'jhs', heldTypeIds: [], hasGovernmentType: false }

describe('studentDiscountForm', () => {
  it('merges enrolled and completed rows of one student, enrolled first, sorted by name', () => {
    const enrolled = { enrollments: [buildEnrollment(2, 'Zamora', 'jhs'), buildEnrollment(1, 'Cruz', 'jhs')] }
    const completed = { enrollments: [buildEnrollment(1, 'Cruz', 'shs'), buildEnrollment(3, 'Bautista', 'shs')] }
    const candidates = mergeEnrollmentCandidates(enrolled, completed)
    expect(candidates.map((candidate) => candidate.studentId)).toEqual([3, 1, 2])
    expect(candidates.find((candidate) => candidate.studentId === 1).stage).toBe('jhs')
  })

  it('keeps one candidate for an SHS student with two term rows', () => {
    const enrolled = { enrollments: [buildEnrollment(4, 'Reyes', 'shs'), buildEnrollment(4, 'Reyes', 'shs')] }
    expect(mergeEnrollmentCandidates(enrolled, null)).toHaveLength(1)
  })

  it('skips unusable rows and tolerates missing responses', () => {
    expect(mergeEnrollmentCandidates(null, undefined)).toEqual([])
    expect(mergeEnrollmentCandidates({ enrollments: 'x' }, {})).toEqual([])
    const badRows = { enrollments: [{ student: {}, section: {} }, { section: { grade_level: { stage: 'jhs' } } }] }
    expect(mergeEnrollmentCandidates(badRows, null)).toEqual([])
  })

  it('detects more candidate pages in either response', () => {
    const more = { meta: { current_page: 1, last_page: 2 } }
    const single = { meta: { current_page: 1, last_page: 1 } }
    expect(hasMoreCandidates(more, single)).toBe(true)
    expect(hasMoreCandidates(single, more)).toBe(true)
    expect(hasMoreCandidates(single, single)).toBe(false)
    expect(hasMoreCandidates({}, null)).toBe(false)
  })

  it('creates empty and note forms', () => {
    expect(createEmptyAssignForm('5')).toEqual({
      school_year_id: '5',
      student_id: '',
      discount_type_id: '',
      reference_no: '',
      remarks: '',
    })
    expect(createEmptyAssignForm(5).school_year_id).toBe('5')
    expect(buildNoteFormFromStudentDiscount({ reference_no: null, remarks: null })).toEqual({
      reference_no: '',
      remarks: '',
    })
  })

  it('builds an assign rule from the candidate and held discounts', () => {
    const held = [
      { discount_type: { id: 3, source: 'school' } },
      { discount_type: { id: 4, source: 'government' } },
      { discount_type: null },
    ]
    expect(buildAssignRule({ stage: 'shs' }, held)).toEqual({
      stage: 'shs',
      heldTypeIds: [3, 4],
      hasGovernmentType: true,
    })
    expect(buildAssignRule(null, 'x')).toEqual({ stage: '', heldTypeIds: [], hasGovernmentType: false })
  })

  it('lists only active types that apply to the stage', () => {
    const types = [
      buildType(1),
      buildType(2, { stages: ['shs'] }),
      buildType(3, { is_active: false }),
      buildType(4, { stages: ['jhs'] }),
    ]
    expect(listAssignableDiscountTypes(types, JHS_RULE).map((type) => type.id)).toEqual([1, 4])
    expect(listAssignableDiscountTypes(types, { stage: '' })).toEqual([])
    expect(listAssignableDiscountTypes('x', JHS_RULE)).toEqual([])
  })

  it('reports a missing or inactive type', () => {
    expect(findAssignTypeError(null, JHS_RULE)).toBe(DISCOUNT_TYPE_REQUIRED_MESSAGE)
    expect(findAssignTypeError(buildType(1, { is_active: false }), JHS_RULE)).toBe(DISCOUNT_TYPE_INACTIVE_MESSAGE)
  })

  it('reports a stage mismatch and accepts a matching stage', () => {
    expect(findAssignTypeError(buildType(1, { stages: ['shs'] }), JHS_RULE)).toBe(STAGE_MISMATCH_MESSAGE)
    expect(findAssignTypeError(buildType(1, { stages: ['jhs'] }), JHS_RULE)).toBe('')
  })

  it('reports a type already held but lets a second school type stack', () => {
    const rule = { stage: 'jhs', heldTypeIds: [1], hasGovernmentType: false }
    expect(findAssignTypeError(buildType(1), rule)).toBe(TYPE_ALREADY_HELD_MESSAGE)
    expect(findAssignTypeError(buildType(2), rule)).toBe('')
  })

  it('reports a second government type only while one is held', () => {
    const government = buildType(5, { source: 'government' })
    const heldGovernment = { stage: 'jhs', heldTypeIds: [9], hasGovernmentType: true }
    const heldSchool = { stage: 'jhs', heldTypeIds: [9], hasGovernmentType: false }
    expect(findAssignTypeError(government, heldGovernment)).toBe(GOVERNMENT_ALREADY_HELD_MESSAGE)
    expect(findAssignTypeError(government, heldSchool)).toBe('')
  })

  it('finds a discount type by string id', () => {
    const types = [buildType(3)]
    expect(findDiscountType(types, '3')).toBe(types[0])
    expect(findDiscountType(types, '9')).toBeNull()
    expect(findDiscountType(types, '')).toBeNull()
  })

  it('validates the assign form', () => {
    const valid = { student_id: '1', reference_no: 'a'.repeat(50), remarks: 'b'.repeat(500) }
    expect(findAssignFormErrors(valid, '')).toEqual({})
    expect(findAssignFormErrors({ ...valid, student_id: '' }, '').student_id).toEqual([STUDENT_REQUIRED_MESSAGE])
    expect(findAssignFormErrors({ ...valid, student_id: null }, '').student_id).toEqual([STUDENT_REQUIRED_MESSAGE])
    expect(findAssignFormErrors(valid, TYPE_ALREADY_HELD_MESSAGE).discount_type_id).toEqual([TYPE_ALREADY_HELD_MESSAGE])
    const tooLong = { ...valid, reference_no: 'a'.repeat(51), remarks: 'b'.repeat(501) }
    expect(findAssignFormErrors(tooLong, '').reference_no).toEqual([REFERENCE_NO_TOO_LONG_MESSAGE])
    expect(findStudentDiscountNoteErrors(tooLong).remarks).toEqual([REMARKS_TOO_LONG_MESSAGE])
  })

  it('builds the assign payload with numeric ids and trimmed notes', () => {
    const payload = buildAssignPayload({
      school_year_id: '5',
      student_id: '7',
      discount_type_id: '3',
      reference_no: '  R-1 ',
      remarks: '   ',
    })
    expect(payload).toEqual({ student_id: 7, school_year_id: 5, discount_type_id: 3, reference_no: 'R-1', remarks: null })
  })

  it('builds a note payload with only two keys', () => {
    const payload = buildNotePayload({ student_id: '7', reference_no: ' R-2 ', remarks: '' })
    expect(payload).toEqual({ reference_no: 'R-2', remarks: null })
  })
})
