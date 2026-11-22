import { describe, it, expect } from 'vitest'
import {
  buildCellErrors,
  buildCellKey,
  buildScoreDraft,
  createCellNavigator,
  findScoreError,
  listBlankScoreLines,
  listChangedScores,
} from '@/utils/scoreGrid.js'

function buildStudent(studentId, lastName, scores) {
  return {
    enrollment_id: studentId * 10,
    student_id: studentId,
    last_name: lastName,
    first_name: 'Ana',
    middle_name: 'Bautista',
    status: 'enrolled',
    scores,
  }
}

function buildRecord() {
  return {
    activities: [
      { id: 1, component: 'ww', title: 'Quiz 1', highest_possible_score: 20 },
      { id: 2, component: 'ww', title: 'Quiz 2', highest_possible_score: 50 },
    ],
    students: [
      buildStudent(7, 'Cruz', [
        { activity_id: 1, score: '15.5' },
        { activity_id: 2, score: null },
      ]),
      buildStudent(8, 'Reyes', [
        { activity_id: 1, score: 10 },
        { activity_id: 2, score: '40' },
      ]),
    ],
    left_the_class: [buildStudent(9, 'Lopez', [{ activity_id: 1, score: '3' }])],
  }
}

describe('findScoreError', () => {
  it('(1) validates the text against the highest score', () => {
    expect(findScoreError('7.25', 50)).toBe('Use at most one decimal.')
    expect(findScoreError('-1', 50)).toBe('Enter a number.')
    expect(findScoreError('abc', 50)).toBe('Enter a number.')
    expect(findScoreError('51', 50)).toBe('Enter 0 to 50.')
    expect(findScoreError(' 7.5 ', 50)).toBe('')
    expect(findScoreError('0', 50)).toBe('')
    expect(findScoreError('50', 50)).toBe('')
    expect(findScoreError('', 50)).toBe('')
  })
})

describe('buildScoreDraft', () => {
  it('(2) turns server scores into text for listed students only', () => {
    expect(buildScoreDraft(buildRecord())).toEqual({
      [buildCellKey(7, 1)]: '15.5',
      [buildCellKey(7, 2)]: '',
      [buildCellKey(8, 1)]: '10',
      [buildCellKey(8, 2)]: '40',
    })
  })
})

describe('listChangedScores', () => {
  it('(3) lists edits in roster by activity order without mutating the draft', () => {
    const scoreDraft = buildScoreDraft(buildRecord())
    scoreDraft[buildCellKey(8, 1)] = ' 7.5 '
    scoreDraft[buildCellKey(7, 2)] = '12'
    scoreDraft[buildCellKey(7, 1)] = ''
    const draftBefore = JSON.stringify(scoreDraft)
    expect(listChangedScores(buildRecord(), scoreDraft)).toEqual([
      { student_id: 7, activity_id: 1, score: null },
      { student_id: 7, activity_id: 2, score: 12 },
      { student_id: 8, activity_id: 1, score: 7.5 },
    ])
    expect(JSON.stringify(scoreDraft)).toBe(draftBefore)
    expect(listChangedScores(buildRecord(), buildScoreDraft(buildRecord()))).toEqual([])
  })
})

describe('buildCellErrors', () => {
  it('(4) keys only the invalid cells', () => {
    const scoreDraft = buildScoreDraft(buildRecord())
    scoreDraft[buildCellKey(7, 1)] = '21'
    scoreDraft[buildCellKey(8, 2)] = 'x'
    expect(buildCellErrors(buildRecord(), scoreDraft)).toEqual({
      [buildCellKey(7, 1)]: 'Enter 0 to 20.',
      [buildCellKey(8, 2)]: 'Enter a number.',
    })
  })
})

describe('listBlankScoreLines', () => {
  it('(5) lists listed students with blanks in roster order', () => {
    const scoreDraft = buildScoreDraft(buildRecord())
    expect(listBlankScoreLines(buildRecord(), scoreDraft)).toEqual(['Cruz, Ana B.: Quiz 2'])
    scoreDraft[buildCellKey(7, 1)] = ' '
    scoreDraft[buildCellKey(8, 2)] = ''
    expect(listBlankScoreLines(buildRecord(), scoreDraft)).toEqual([
      'Cruz, Ana B.: Quiz 1, Quiz 2',
      'Reyes, Ana B.: Quiz 2',
    ])
    expect(listBlankScoreLines(buildRecord(), { ...scoreDraft, [buildCellKey(7, 1)]: '1', [buildCellKey(7, 2)]: '1', [buildCellKey(8, 2)]: '1' })).toEqual([])
  })
})

describe('createCellNavigator', () => {
  const moveCell = createCellNavigator(3, 2)

  it('(6) moves one step with the arrows and stops at the edges', () => {
    expect(moveCell({ rowIndex: 1, columnIndex: 0 }, 'ArrowDown')).toEqual({ rowIndex: 2, columnIndex: 0 })
    expect(moveCell({ rowIndex: 1, columnIndex: 0 }, 'ArrowUp')).toEqual({ rowIndex: 0, columnIndex: 0 })
    expect(moveCell({ rowIndex: 1, columnIndex: 0 }, 'ArrowRight')).toEqual({ rowIndex: 1, columnIndex: 1 })
    expect(moveCell({ rowIndex: 0, columnIndex: 0 }, 'ArrowUp')).toBeNull()
    expect(moveCell({ rowIndex: 0, columnIndex: 0 }, 'ArrowLeft')).toBeNull()
  })

  it('(7) uses Enter for down, Tab and Shift+Tab along the row', () => {
    expect(moveCell({ rowIndex: 0, columnIndex: 1 }, 'Enter')).toEqual({ rowIndex: 1, columnIndex: 1 })
    expect(moveCell({ rowIndex: 2, columnIndex: 1 }, 'Enter')).toBeNull()
    expect(moveCell({ rowIndex: 0, columnIndex: 0 }, 'Tab')).toEqual({ rowIndex: 0, columnIndex: 1 })
    expect(moveCell({ rowIndex: 0, columnIndex: 1 }, 'Tab')).toBeNull()
    expect(moveCell({ rowIndex: 0, columnIndex: 1 }, 'Shift+Tab')).toEqual({ rowIndex: 0, columnIndex: 0 })
    expect(moveCell({ rowIndex: 0, columnIndex: 0 }, 'Shift+Tab')).toBeNull()
    expect(moveCell({ rowIndex: 0, columnIndex: 0 }, 'a')).toBeNull()
  })
})
