import { describe, it, expect } from 'vitest'
import gradeCases from '@/utils/grade-computation.json'
import {
  computeQuarterGrade,
  formatHundredths,
  listEmptyComponents,
  sumComponentTotals,
  toTenths,
  transmuteInitialGrade,
} from '@/utils/gradeComputation.js'

const DEFAULT_WEIGHTS = { ww: 30, pt: 50, qa: 20 }

function toHundredths(decimalText) {
  return Number(decimalText.replace('.', ''))
}

function buildCaseInput(quarterCase) {
  const activities = quarterCase.activities.map((activity, activityIndex) => ({
    id: activityIndex,
    component: activity.component,
    highest_possible_score: activity.highest,
  }))
  const scoreTextByActivityId = {}
  quarterCase.activities.forEach((activity, activityIndex) => {
    scoreTextByActivityId[activityIndex] = activity.score === null ? '' : String(activity.score)
  })
  return { activities, scoreTextByActivityId }
}

describe('computeQuarterGrade on the shared fixture', () => {
  it.each(gradeCases.quarter_cases)('(1-4) matches the expected grades of $name', (quarterCase) => {
    const { activities, scoreTextByActivityId } = buildCaseInput(quarterCase)
    const totals = sumComponentTotals(activities, scoreTextByActivityId)
    const quarterGrade = computeQuarterGrade(totals, quarterCase.weights)
    const { expected } = quarterCase
    expect(formatHundredths(quarterGrade.ww_percentage)).toBe(expected.ww.percentage)
    expect(formatHundredths(quarterGrade.ww_weighted)).toBe(expected.ww.weighted)
    expect(formatHundredths(quarterGrade.pt_percentage)).toBe(expected.pt.percentage)
    expect(formatHundredths(quarterGrade.pt_weighted)).toBe(expected.pt.weighted)
    expect(formatHundredths(quarterGrade.qa_percentage)).toBe(expected.qa.percentage)
    expect(formatHundredths(quarterGrade.qa_weighted)).toBe(expected.qa.weighted)
    expect(formatHundredths(quarterGrade.initial_grade)).toBe(expected.initial_grade)
    expect(quarterGrade.quarterly_grade).toBe(expected.quarterly_grade)
  })
})

describe('transmuteInitialGrade on the shared fixture', () => {
  it.each(gradeCases.transmutation)('(5-14) maps $initial_grade to $quarterly_grade', (transmutationRow) => {
    expect(transmuteInitialGrade(toHundredths(transmutationRow.initial_grade))).toBe(transmutationRow.quarterly_grade)
  })
})

describe('sumComponentTotals', () => {
  it('(15) counts blank and missing scores as 0 and still adds the highest total', () => {
    const activities = [
      { id: 1, component: 'ww', highest_possible_score: 10 },
      { id: 2, component: 'ww', highest_possible_score: 20 },
    ]
    const totals = sumComponentTotals(activities, { 1: '', 2: '7.5' })
    expect(totals.ww).toEqual({ rawTenths: 75, highestTotal: 30 })
    expect(totals.pt).toEqual({ rawTenths: 0, highestTotal: 0 })
    expect(computeQuarterGrade(totals, DEFAULT_WEIGHTS).pt_percentage).toBe(0)
  })
})

describe('listEmptyComponents', () => {
  it('(16) lists components without an activity', () => {
    expect(listEmptyComponents([{ component: 'ww' }, { component: 'pt' }])).toEqual(['qa'])
    expect(listEmptyComponents([{ component: 'ww' }, { component: 'pt' }, { component: 'qa' }])).toEqual([])
  })
})

describe('toTenths', () => {
  it('(17) reads one decimal and rejects everything else', () => {
    expect(toTenths('7.5')).toBe(75)
    expect(toTenths('7')).toBe(70)
    expect(toTenths('7.25')).toBeNull()
    expect(toTenths('x')).toBeNull()
    expect(toTenths('')).toBeNull()
  })
})
