import { describe, it, expect } from 'vitest'
import {
  ASSESSMENT_COLUMNS,
  MINUS_SIGN,
  PLUS_SIGN,
  REASSESS_ASSIGN_PROMPT,
  REASSESS_REMOVE_PROMPT,
  buildCategoryTotalRows,
  buildDiscountRows,
  buildReassessConfirmMessage,
  buildReassessDiscountMessage,
  buildScheduleRows,
  buildStatementSchoolName,
  buildTotalsRows,
  formatAdjustmentLabel,
  formatAssessmentGradeLevel,
  formatAssessmentPlan,
  formatSignedPeso,
  formatStatementDate,
  formatSupersededText,
  getAssessmentStatusChip,
  groupFeeLinesByCategory,
} from '@/utils/assessmentDisplay.js'

const STUDENT = { id: 9, lrn: '123', first_name: 'Ana', middle_name: 'Lopez', last_name: 'Cruz' }
const DISCOUNT_ADJUSTMENT = { kind: 'discount', type: 'percent', value: '5.00', amount: '500.00' }
const SURCHARGE_ADJUSTMENT = { kind: 'surcharge', type: 'fixed', value: '500.00', amount: '500.00' }

describe('assessmentDisplay', () => {
  it('lists the table columns', () => {
    expect(ASSESSMENT_COLUMNS.map((column) => column.key)).toEqual(['student', 'grade_level', 'plan', 'net_total', 'created_at'])
  })

  it('formats the grade level with the program when there is one', () => {
    expect(formatAssessmentGradeLevel({ grade_level: { name: 'Grade 11' }, program: { code: 'STEM' } })).toBe('Grade 11 · STEM')
    expect(formatAssessmentGradeLevel({ grade_level: { name: 'Grade 7' }, program: null })).toBe('Grade 7')
    expect(formatAssessmentGradeLevel({})).toBe('—')
  })

  it('formats the plan name of a row, a detail or nothing', () => {
    expect(formatAssessmentPlan({ plan_name: 'Monthly' })).toBe('Monthly')
    expect(formatAssessmentPlan({ plan: { name: 'Cash' } })).toBe('Cash')
    expect(formatAssessmentPlan({})).toBe('—')
  })

  it('formats signed pesos', () => {
    expect(formatSignedPeso('1000.00', MINUS_SIGN)).toBe('−₱1,000.00')
    expect(formatSignedPeso('0.00', MINUS_SIGN)).toBe('₱0.00')
    expect(formatSignedPeso('250.50', PLUS_SIGN)).toBe('+₱250.50')
    expect(formatSignedPeso('abc', MINUS_SIGN)).toBe('—')
  })

  it('builds the category totals in order with a dash for a missing total', () => {
    const rows = buildCategoryTotalRows({ subtotals: { other: '10.00', tuition: '1000.00' } })
    expect(rows.map((row) => row.label)).toEqual(['Tuition', 'Miscellaneous', 'Other'])
    expect(rows.map((row) => row.amountText)).toEqual(['₱1,000.00', '—', '₱10.00'])
  })

  it('builds the totals rows with the adjustment sign and an emphasized net', () => {
    const baseAssessment = { gross_total: '1000.00', discount_total: '100.00', net_total: '850.00' }
    const discountRows = buildTotalsRows({ ...baseAssessment, plan: { adjustment: DISCOUNT_ADJUSTMENT } })
    expect(discountRows.map((row) => row.key)).toEqual(['gross', 'discounts', 'adjustment', 'net'])
    expect(discountRows[1].amountText).toBe('−₱100.00')
    expect(discountRows[2]).toMatchObject({ label: 'Plan discount (5%)', amountText: '−₱500.00' })
    expect(discountRows[3]).toMatchObject({ amountText: '₱850.00', isEmphasized: true })
    const surchargeRows = buildTotalsRows({ ...baseAssessment, plan: { adjustment: SURCHARGE_ADJUSTMENT } })
    expect(surchargeRows[2].amountText).toBe('+₱500.00')
    expect(buildTotalsRows({ ...baseAssessment, plan: { adjustment: null } }).map((row) => row.key)).toEqual([
      'gross',
      'discounts',
      'net',
    ])
  })

  it('groups the fee lines by category and skips empty or unknown ones', () => {
    const feeLines = [
      { name: 'Lab', category: 'other', amount: '50.00' },
      { name: 'Tuition fee', category: 'tuition', amount: '900.00' },
      { name: 'Mystery', category: 'unknown', amount: '1.00' },
    ]
    const groups = groupFeeLinesByCategory(feeLines, { tuition: '900.00', miscellaneous: '0.00', other: '50.00' })
    expect(groups.map((group) => group.category)).toEqual(['tuition', 'other'])
    expect(groups[0].lines[0]).toMatchObject({ itemName: 'Tuition fee', amountText: '₱900.00' })
    expect(groups[1].subtotalText).toBe('₱50.00')
    expect(groupFeeLinesByCategory(null, {})).toEqual([])
  })

  it('builds discount rows and flags a capped discount', () => {
    const discounts = [
      {
        name: 'ESC',
        source: 'government',
        value_type: 'percent',
        value: '10',
        base: 'tuition',
        reference_no: ' R-1 ',
        computed_amount: '200.00',
        applied_amount: '150.00',
      },
      {
        name: 'Sibling',
        source: 'school',
        value_type: 'fixed',
        value: '100.00',
        base: 'total',
        reference_no: null,
        computed_amount: '100.00',
        applied_amount: '100.00',
      },
    ]
    const rows = buildDiscountRows(discounts)
    expect(rows[0]).toMatchObject({
      typeName: 'ESC',
      valueText: '10%',
      baseText: 'Tuition',
      referenceText: 'R-1',
      amountText: '−₱150.00',
      cappedText: 'Capped from ₱200.00',
    })
    expect(rows[0].sourceChip.label).toBe('Government')
    expect(rows[1]).toMatchObject({ referenceText: '—', cappedText: '' })
    expect(buildDiscountRows(undefined)).toEqual([])
  })

  it('builds the schedule rows', () => {
    const rows = buildScheduleRows([{ sequence: 1, label: 'Down payment', due_date: '2026-11-14', amount: '1500.00' }])
    expect(rows).toEqual([{ key: 1, label: 'Down payment', dueDateText: 'Nov 14, 2026', amountText: '₱1,500.00' }])
    expect(buildScheduleRows(null)).toEqual([])
  })

  it('formats adjustment labels', () => {
    expect(formatAdjustmentLabel(DISCOUNT_ADJUSTMENT)).toBe('Plan discount (5%)')
    expect(formatAdjustmentLabel(SURCHARGE_ADJUSTMENT)).toBe('Plan surcharge (₱500.00)')
    expect(formatAdjustmentLabel(null)).toBe('')
    expect(formatAdjustmentLabel({ kind: 'bonus', type: 'fixed', value: '1.00' })).toBe('')
  })

  it('builds status chips and the superseded text', () => {
    expect(getAssessmentStatusChip('current').label).toBe('Current')
    expect(getAssessmentStatusChip('superseded').label).toBe('Superseded')
    const supersededAssessment = { superseded_at: new Date(2026, 10, 14, 12).toISOString(), superseded_by: { name: 'Reg Ina' } }
    expect(formatSupersededText(supersededAssessment)).toBe('Superseded Nov 14, 2026 by Reg Ina')
    expect(formatSupersededText({ ...supersededAssessment, superseded_by: null })).toBe('Superseded Nov 14, 2026')
    expect(formatSupersededText({ superseded_at: null })).toBe('')
  })

  it('builds the re-assess confirm message', () => {
    expect(buildReassessConfirmMessage({ student: STUDENT }, { name: 'Monthly' })).toBe(
      'Re-assess Cruz, Ana L. with Monthly? The current assessment becomes read-only history.',
    )
    expect(buildReassessConfirmMessage(null, { name: 'Monthly' })).toBe('')
  })

  it('builds the school name with a fallback', () => {
    expect(buildStatementSchoolName(' Saint X ')).toBe('Saint X')
    expect(buildStatementSchoolName('')).toBe('MIS')
    expect(buildStatementSchoolName(undefined)).toBe('MIS')
  })

  it('formats the statement date', () => {
    expect(formatStatementDate(new Date(2026, 10, 14))).toBe('Nov 14, 2026')
    expect(formatStatementDate(new Date('nope'))).toBe('—')
  })

  it('builds the discount re-assess prompts', () => {
    expect(buildReassessDiscountMessage('A current assessment exists.', 'assign')).toBe(
      `A current assessment exists. ${REASSESS_ASSIGN_PROMPT}`,
    )
    expect(buildReassessDiscountMessage('A current assessment exists.', 'remove')).toBe(
      `A current assessment exists. ${REASSESS_REMOVE_PROMPT}`,
    )
    expect(buildReassessDiscountMessage('  ', 'remove')).toBe(REASSESS_REMOVE_PROMPT)
  })
})
