import { describe, it, expect } from 'vitest'
import gradeCases from '@/utils/grade-computation.json'
import {
  buildEmptyComponentText,
  buildGradeRows,
  buildHistoryRows,
  buildLeftRows,
  buildStatusInfo,
  buildWeightsText,
  groupActivityColumns,
} from '@/utils/classRecordDisplay.js'
import { buildCellKey, buildScoreDraft } from '@/utils/scoreGrid.js'

const TYPICAL_CASE = gradeCases.quarter_cases[0]

function buildTypicalRecord() {
  const activities = TYPICAL_CASE.activities.map((activity, activityIndex) => ({
    id: activityIndex + 1,
    component: activity.component,
    title: `Activity ${activityIndex + 1}`,
    highest_possible_score: activity.highest,
  }))
  const scores = TYPICAL_CASE.activities.map((activity, activityIndex) => ({
    activity_id: activityIndex + 1,
    score: activity.score,
  }))
  return {
    weights: TYPICAL_CASE.weights,
    activities,
    students: [
      {
        enrollment_id: 70,
        student_id: 7,
        last_name: 'Cruz',
        first_name: 'Ana',
        middle_name: 'Bautista',
        status: 'enrolled',
        scores,
        ww: { percentage: '81.00', weighted: '24.30' },
        pt: { percentage: '80.00', weighted: '40.00' },
        qa: { percentage: '75.00', weighted: '15.00' },
        initial_grade: '79.30',
        quarterly_grade: 87,
      },
    ],
    left_the_class: [
      { enrollment_id: 90, student_id: 9, last_name: 'Lopez', first_name: 'Jo', status: 'dropped', scores: [] },
    ],
  }
}

describe('groupActivityColumns and weights', () => {
  it('(1) groups WW, PT, QA with the weight and keeps empty groups', () => {
    const groups = groupActivityColumns([{ id: 1, component: 'pt' }], { ww: 30, pt: 50, qa: 20 })
    expect(groups.map((group) => group.component)).toEqual(['ww', 'pt', 'qa'])
    expect(groups.map((group) => group.weightText)).toEqual(['30%', '50%', '20%'])
    expect(groups.map((group) => group.activities.length)).toEqual([0, 1, 0])
    expect(groups[0].label).toBe('Written work')
  })

  it('(2) builds the weights text', () => {
    expect(buildWeightsText({ ww: 30, pt: 50, qa: 20 })).toBe('WW 30% · PT 50% · QA 20%')
    expect(buildWeightsText(null)).toBe('—')
  })
})

describe('buildGradeRows', () => {
  it('(3) computes live grades from the draft like the fixture case', () => {
    const classRecord = buildTypicalRecord()
    const [gradeRow] = buildGradeRows(classRecord, buildScoreDraft(classRecord))
    expect(gradeRow.grades).toEqual({
      ww_weighted: TYPICAL_CASE.expected.ww.weighted,
      pt_weighted: TYPICAL_CASE.expected.pt.weighted,
      qa_weighted: TYPICAL_CASE.expected.qa.weighted,
      initial_grade: TYPICAL_CASE.expected.initial_grade,
      quarterly_grade: String(TYPICAL_CASE.expected.quarterly_grade),
    })
    expect(gradeRow.name).toBe('Cruz, Ana B.')
  })

  it('(4) shows dashes when a draft cell is invalid', () => {
    const classRecord = buildTypicalRecord()
    const scoreDraft = buildScoreDraft(classRecord)
    scoreDraft[buildCellKey(7, 1)] = 'abc'
    const [gradeRow] = buildGradeRows(classRecord, scoreDraft)
    expect(Object.values(gradeRow.grades)).toEqual(['—', '—', '—', '—', '—'])
  })

  it('(5) reads the server grades without a draft', () => {
    const [gradeRow] = buildGradeRows(buildTypicalRecord(), null)
    expect(gradeRow.grades.initial_grade).toBe('79.30')
    expect(gradeRow.grades.quarterly_grade).toBe('87')
    expect(gradeRow.scoreByActivityId[1]).toBe('15.5')
  })

  it('(6) builds left rows read-only from the server', () => {
    const [leftRow] = buildLeftRows(buildTypicalRecord())
    expect(leftRow.name).toBe('Lopez, Jo')
    expect(leftRow.grades.quarterly_grade).toBe('—')
  })
})

describe('status and history', () => {
  it('(7) describes draft and submitted records and the history rows', () => {
    const draftInfo = buildStatusInfo({ status: 'draft' })
    expect(draftInfo).toMatchObject({ isSubmitted: false, label: 'Draft' })
    const submittedInfo = buildStatusInfo({
      status: 'submitted',
      submitted_by: { id: 1, name: 'Ana Cruz' },
      submitted_at: '2026-11-22T08:00:00.000000Z',
    })
    expect(submittedInfo).toMatchObject({
      isSubmitted: true,
      label: 'Submitted',
      text: 'Submitted by Ana Cruz on Nov 22, 2026',
    })
    expect(submittedInfo.chipClass).toContain('green')
    expect(draftInfo.chipClass).toContain('slate')
    const historyRows = buildHistoryRows([
      { id: 1, action: 'submitted', reason: null, user: { name: 'Ana Cruz' }, created_at: '2026-11-22T08:00:00Z' },
      { id: 2, action: 'reopened', reason: 'Typo', user: { name: 'Reg Admin' }, created_at: '2026-11-23T08:00:00Z' },
    ])
    expect(historyRows.map((row) => row.actionLabel)).toEqual(['Submitted', 'Reopened'])
    expect(historyRows.map((row) => row.reasonText)).toEqual(['—', 'Typo'])
    expect(historyRows[1]).toMatchObject({ userName: 'Reg Admin', dateText: 'Nov 23, 2026' })
  })

  it('(8) words the empty-component warning', () => {
    expect(buildEmptyComponentText(['qa'])).toBe('No QA activity yet; QA counts as 0.')
    expect(buildEmptyComponentText([])).toBe('')
  })
})
