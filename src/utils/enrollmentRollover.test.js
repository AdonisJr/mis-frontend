import { describe, it, expect } from 'vitest'
import {
  ALREADY_ENROLLED_FALLBACK,
  NOTHING_TICKED_MESSAGE,
  NO_NEXT_TERM_MESSAGE,
  buildRolloverPayload,
  buildSeatsLeftText,
  createRolloverSelection,
  findRolloverBlockReason,
  listRolloverSections,
  normalizeRolloverPreview,
  normalizeRolloverResult,
  pickListedRecordId,
  toggleRolloverSelection,
} from '@/utils/enrollmentRollover.js'

const TARGET_TERM = { id: 2, term_number: 2, label: 'Term 2' }
const STUDENT = { id: 11, lrn: '123456789012', first_name: 'Ana', middle_name: 'Reyes', last_name: 'Cruz' }

function buildRows() {
  return [
    { id: 1, studentName: 'A', lrn: '1', isLocked: false, lockReason: '' },
    { id: 2, studentName: 'B', lrn: '2', isLocked: true, lockReason: 'Already' },
    { id: 3, studentName: 'C', lrn: '3', isLocked: false, lockReason: '' },
  ]
}

function buildPreview(targetTerm, seatsLeft) {
  return { targetTerm, seatsLeft, rows: buildRows() }
}

describe('listRolloverSections', () => {
  it('keeps SHS and college sections, drops JHS, and tolerates a non-array', () => {
    const sections = [
      { id: 1, grade_level: { stage: 'jhs' } },
      { id: 2, grade_level: { stage: 'shs' } },
      { id: 3, grade_level: { stage: 'college' } },
    ]
    expect(listRolloverSections(sections).map((section) => section.id)).toEqual([2, 3])
    expect(listRolloverSections(null)).toEqual([])
  })
})

describe('pickListedRecordId', () => {
  it('returns the listed id as text, else an empty string', () => {
    const records = [{ id: 7 }, { id: 8 }]
    expect(pickListedRecordId(records, '7')).toBe('7')
    expect(pickListedRecordId(records, '9')).toBe('')
    expect(pickListedRecordId(records, '')).toBe('')
    expect(pickListedRecordId(null, '7')).toBe('')
  })
})

describe('normalizeRolloverPreview', () => {
  it('maps the keys, names, LRN and lock reasons', () => {
    const previewResponse = {
      target_term: TARGET_TERM,
      seats_left: 4,
      enrollments: [
        { id: 1, student: STUDENT, is_enrolled_in_target: false, skip_reason: null },
        { id: 2, student: STUDENT, is_enrolled_in_target: true, skip_reason: 'Already in term 2.' },
        { id: 3, student: STUDENT, is_enrolled_in_target: true, skip_reason: null },
      ],
    }
    const preview = normalizeRolloverPreview(previewResponse)
    expect(preview.targetTerm).toEqual(TARGET_TERM)
    expect(preview.seatsLeft).toBe(4)
    expect(preview.rows[0]).toEqual({
      id: 1,
      studentName: 'Cruz, Ana R.',
      lrn: '123456789012',
      isLocked: false,
      lockReason: '',
    })
    expect(preview.rows[1].lockReason).toBe('Already in term 2.')
    expect(preview.rows[2].lockReason).toBe(ALREADY_ENROLLED_FALLBACK)
  })

  it('falls back to null and empty values when keys are missing', () => {
    expect(normalizeRolloverPreview({})).toEqual({ targetTerm: null, seatsLeft: null, rows: [] })
    expect(normalizeRolloverPreview(undefined)).toEqual({ targetTerm: null, seatsLeft: null, rows: [] })
  })
})

describe('createRolloverSelection', () => {
  it('ticks every unlocked row and never a locked one', () => {
    expect(createRolloverSelection(buildRows())).toEqual([1, 3])
  })
})

describe('toggleRolloverSelection', () => {
  it('removes a listed id or appends an unlisted one without mutating the input', () => {
    const selectedIds = [1, 3]
    const rows = buildRows()
    expect(toggleRolloverSelection(selectedIds, rows[0])).toEqual([3])
    expect(toggleRolloverSelection([3], rows[0])).toEqual([3, 1])
    expect(selectedIds).toEqual([1, 3])
  })

  it('leaves the selection unchanged for a locked row', () => {
    const selectedIds = [1]
    expect(toggleRolloverSelection(selectedIds, buildRows()[1])).toBe(selectedIds)
  })
})

describe('findRolloverBlockReason', () => {
  it('allows ticked students within the seats left', () => {
    expect(findRolloverBlockReason(buildPreview(TARGET_TERM, 3), [1, 2, 3])).toBe('')
  })

  it('blocks more ticked students than seats left', () => {
    expect(findRolloverBlockReason(buildPreview(TARGET_TERM, 3), [1, 2, 3, 4])).toBe(
      'Too many students ticked: 4 ticked, 3 seats left. Untick students to continue.',
    )
    expect(findRolloverBlockReason(buildPreview(TARGET_TERM, 0), [1])).toContain('1 ticked, 0 seats left')
  })

  it('blocks when there is no next term, and stays silent for a null preview', () => {
    expect(findRolloverBlockReason(buildPreview(null, null), [1])).toBe(NO_NEXT_TERM_MESSAGE)
    expect(findRolloverBlockReason(null, [1])).toBe('')
  })

  it('blocks when no student is ticked', () => {
    expect(findRolloverBlockReason(buildPreview(TARGET_TERM, 5), [])).toBe(NOTHING_TICKED_MESSAGE)
  })
})

describe('buildRolloverPayload', () => {
  it('sends a numeric term id and a copy of the ticked ids', () => {
    const selectedIds = [3, 9]
    const rolloverPayload = buildRolloverPayload('5', selectedIds)
    expect(rolloverPayload).toEqual({ term_id: 5, enrollment_ids: [3, 9] })
    expect(rolloverPayload.enrollment_ids).not.toBe(selectedIds)
  })
})

describe('normalizeRolloverResult and buildSeatsLeftText', () => {
  it('builds the copied text and the skipped list', () => {
    expect(normalizeRolloverResult({ copied_count: 1, skipped: [] }).copiedText).toBe('1 student rolled over.')
    expect(normalizeRolloverResult({ copied_count: 3 }).copiedText).toBe('3 students rolled over.')
    expect(normalizeRolloverResult({ copied_count: 0 }).copiedText).toBe('0 students rolled over.')
    const rolloverResult = normalizeRolloverResult({
      copied_count: 1,
      skipped: [
        { student: STUDENT, skip_reason: 'Already in term 2.' },
        { student: STUDENT, skip_reason: null },
      ],
    })
    expect(rolloverResult.skipped).toEqual([
      { id: 11, studentName: 'Cruz, Ana R.', reason: 'Already in term 2.' },
      { id: 11, studentName: 'Cruz, Ana R.', reason: ALREADY_ENROLLED_FALLBACK },
    ])
    expect(buildSeatsLeftText(0)).toBe('Full')
    expect(buildSeatsLeftText(1)).toBe('1 seat left')
    expect(buildSeatsLeftText(5)).toBe('5 seats left')
    expect(buildSeatsLeftText(null)).toBe('')
  })
})
