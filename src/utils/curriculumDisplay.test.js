import { describe, it, expect } from 'vitest'
import {
  CURRICULUM_COLUMNS,
  buildCopyToastText,
  buildRemoveEntryMessage,
  buildSubjectOptionLabel,
  normalizeCurriculumCopyResult,
} from '@/utils/curriculumDisplay.js'

describe('CURRICULUM_COLUMNS', () => {
  it('lists the column keys in order', () => {
    expect(CURRICULUM_COLUMNS.map((column) => column.key)).toEqual(['position', 'code', 'name', 'type', 'weekly_hours'])
  })
})

describe('buildSubjectOptionLabel', () => {
  it('shows code, name, type and hours', () => {
    const subject = { code: 'MATH7', name: 'Mathematics 7', type: 'jhs_learning_area', weekly_hours: '4.0' }
    expect(buildSubjectOptionLabel(subject)).toBe('MATH7 — Mathematics 7 · JHS learning area · 4 h')
  })
})

describe('buildRemoveEntryMessage', () => {
  it('names the subject and returns an empty text for a non-object', () => {
    const entry = { subject: { code: 'MATH7', name: 'Mathematics 7' } }
    expect(buildRemoveEntryMessage(entry)).toBe(
      'Remove MATH7 (Mathematics 7) from this curriculum group? You can add it again later.',
    )
    expect(buildRemoveEntryMessage(null)).toBe('')
  })
})

describe('normalizeCurriculumCopyResult', () => {
  it('words plural and singular counts, counts a skipped array and falls back to zero for junk', () => {
    expect(normalizeCurriculumCopyResult({ copied_count: 12, skipped_count: 2 })).toEqual({
      copiedText: '12 entries copied.',
      skippedText: '2 entries skipped.',
    })
    expect(normalizeCurriculumCopyResult({ copied_count: 1, skipped_count: 1 })).toEqual({
      copiedText: '1 entry copied.',
      skippedText: '1 entry skipped.',
    })
    expect(normalizeCurriculumCopyResult({ copied_count: 0, skipped: [{}, {}] })).toEqual({
      copiedText: 'No entries were copied.',
      skippedText: '2 entries skipped.',
    })
    expect(normalizeCurriculumCopyResult({ copied_count: 'x', skipped_count: null })).toEqual({
      copiedText: 'No entries were copied.',
      skippedText: 'No entries were skipped.',
    })
  })
})

describe('buildCopyToastText', () => {
  it('joins the copied and skipped texts', () => {
    const copyResult = normalizeCurriculumCopyResult({ copied_count: 12, skipped_count: 2 })
    expect(buildCopyToastText(copyResult)).toBe('12 entries copied. 2 entries skipped.')
  })
})
