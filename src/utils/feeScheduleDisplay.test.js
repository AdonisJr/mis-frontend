import { describe, it, expect } from 'vitest'
import {
  FEE_SCHEDULE_COLUMNS,
  buildFeeScheduleDeleteMessage,
  buildFeeScheduleTitle,
  formatScheduleGradeLevel,
  formatScheduleProgram,
  normalizeCopyResult,
} from '@/utils/feeScheduleDisplay.js'

const shsSchedule = { grade_level: { name: 'Grade 11' }, program: { code: 'STEM' } }
const defaultSchedule = { grade_level: { name: 'Grade 7' }, program: null }

describe('columns and cells', () => {
  it('lists the columns in order', () => {
    expect(FEE_SCHEDULE_COLUMNS.map((column) => column.key)).toEqual(['grade_level', 'program', 'lines_count', 'total'])
  })

  it('formats the grade level and the program', () => {
    expect(formatScheduleGradeLevel(shsSchedule)).toBe('Grade 11')
    expect(formatScheduleGradeLevel({})).toBe('—')
    expect(formatScheduleProgram(shsSchedule)).toBe('STEM')
    expect(formatScheduleProgram(defaultSchedule)).toBe('All programs')
  })
})

describe('titles and messages', () => {
  it('builds the title and the delete message, blank for a non-object', () => {
    expect(buildFeeScheduleTitle(shsSchedule)).toBe('Grade 11 · STEM')
    expect(buildFeeScheduleDeleteMessage(defaultSchedule)).toBe(
      'Delete the Grade 7 · All programs fee schedule? Its lines are removed. This cannot be undone.',
    )
    expect(buildFeeScheduleDeleteMessage(null)).toBe('')
  })
})

describe('normalizeCopyResult', () => {
  it('words the copied count for 0, 1 and 3', () => {
    expect(normalizeCopyResult({ copied_count: 0, skipped: [] }).copiedText).toBe('No schedules were copied.')
    expect(normalizeCopyResult({ copied_count: 1, skipped: [] }).copiedText).toBe('1 schedule copied.')
    expect(normalizeCopyResult({ copied_count: 3, skipped: [] }).copiedText).toBe('3 schedules copied.')
  })

  it('labels skipped rows with their reasons, a null program meaning All programs', () => {
    const copyResponse = {
      copied_count: 1,
      skipped: [
        { grade_level: { name: 'Grade 7' }, program: null, reason: 'Already exists' },
        { grade_level: { name: 'Grade 11' }, program: { code: 'STEM' } },
      ],
    }
    expect(normalizeCopyResult(copyResponse).skipped).toEqual([
      { key: 0, label: 'Grade 7 · All programs', reason: 'Already exists' },
      { key: 1, label: 'Grade 11 · STEM', reason: '' },
    ])
  })

  it('treats a malformed response as zero copied and nothing skipped', () => {
    expect(normalizeCopyResult(null)).toEqual({ copiedText: 'No schedules were copied.', skipped: [] })
    expect(normalizeCopyResult({ copied_count: 'x', skipped: 'y' })).toEqual({
      copiedText: 'No schedules were copied.',
      skipped: [],
    })
  })
})
