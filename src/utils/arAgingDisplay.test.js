import { describe, it, expect } from 'vitest'
import { STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import {
  AGING_TOTAL_LABEL,
  AR_AGING_COLUMNS,
  NOT_MAPPED_MESSAGE,
  buildArAgingCsv,
  buildArAgingFooter,
  buildArAgingParams,
  buildArAgingRows,
  buildStudentLedgerLink,
  buildTieOutPanel,
  createArAgingFilters,
} from '@/utils/arAgingDisplay.js'

function buildAgingRow(overrides) {
  return {
    assessment_id: 31,
    student: { id: 5, lrn: '123456789012', first_name: 'Ana', middle_name: 'Reyes', last_name: 'Cruz' },
    school_year: { id: 2, name: '2026-2027' },
    grade_level: { id: 8, name: 'Grade 8' },
    current: '0.00',
    days_1_30: '500.00',
    days_31_60: '0.00',
    days_61_90: '0.00',
    over_90: '250.00',
    total: '750.00',
    ...overrides,
  }
}

const AR_AGING = {
  as_of: '2026-11-26',
  rows: [buildAgingRow()],
  totals: { current: '0.00', days_1_30: '500.00', days_31_60: '0.00', days_61_90: '0.00', over_90: '250.00', total: '750.00' },
  tie_out: { aging_total: '750.00', gl_balance: '750.00', difference: '0.00', is_mapped: true },
}

describe('createArAgingFilters', () => {
  it('starts as of today with every filter empty', () => {
    expect(createArAgingFilters('2026-11-26')).toEqual({
      asOf: '2026-11-26',
      schoolYearId: '',
      gradeLevelId: '',
      search: '',
    })
  })
})

describe('buildArAgingParams', () => {
  it('turns string ids into numbers and keeps the search', () => {
    const arAgingFilters = { asOf: '2026-11-26', schoolYearId: '2', gradeLevelId: '8', search: 'Cruz' }
    expect(buildArAgingParams(arAgingFilters)).toEqual({
      as_of: '2026-11-26',
      school_year_id: 2,
      grade_level_id: 8,
      search: 'Cruz',
    })
  })

  it('leaves out empty filters', () => {
    expect(buildArAgingParams(createArAgingFilters('2026-11-26'))).toEqual({ as_of: '2026-11-26' })
  })

  it('leaves out an id that is not a number', () => {
    const arAgingFilters = { asOf: '2026-11-26', schoolYearId: 'abc', gradeLevelId: '', search: '' }
    expect(buildArAgingParams(arAgingFilters)).toEqual({ as_of: '2026-11-26' })
  })

  it('normalises the search text', () => {
    const arAgingFilters = { asOf: '2026-11-26', schoolYearId: '', gradeLevelId: '', search: '  Ana   Cruz ' }
    expect(buildArAgingParams(arAgingFilters).search).toBe('Ana Cruz')
  })

  it('returns null for an invalid as-of date', () => {
    expect(buildArAgingParams({ asOf: '', schoolYearId: '', gradeLevelId: '', search: '' })).toBeNull()
  })
})

describe('buildArAgingRows', () => {
  it('keys a row by assessment id and formats the buckets', () => {
    const [agingRow] = buildArAgingRows(AR_AGING)
    expect(agingRow).toMatchObject({
      key: '31',
      studentId: 5,
      schoolYearId: 2,
      lrn: '123456789012',
      school_year_name: '2026-2027',
      grade_level_name: 'Grade 8',
      days_1_30: '₱500.00',
      over_90: '₱250.00',
      total: '₱750.00',
    })
  })

  it('builds the name from the nested student with and without a middle name', () => {
    const withMiddle = buildArAgingRows({ rows: [buildAgingRow()] })[0]
    const withoutMiddle = buildArAgingRows({
      rows: [buildAgingRow({ student: { id: 6, lrn: null, first_name: 'Ben', middle_name: null, last_name: 'Lim' } })],
    })[0]
    expect(withMiddle.student_name).toBe('Cruz, Ana Reyes')
    expect(withoutMiddle.student_name).toBe('Lim, Ben')
    expect(withoutMiddle.lrn).toBe('')
  })

  it('blanks a zero bucket and shows a negative bucket with a minus sign', () => {
    const [agingRow] = buildArAgingRows({ rows: [buildAgingRow({ current: '-20.00', total: '-20.00' })] })
    expect(agingRow.days_31_60).toBe('')
    expect(agingRow.current).toBe('−₱20.00')
    expect(agingRow.total).toBe('−₱20.00')
  })

  it('returns an empty list for a non-object', () => {
    expect(buildArAgingRows(null)).toEqual([])
  })
})

describe('buildArAgingFooter', () => {
  it('formats the server totals', () => {
    expect(buildArAgingFooter(AR_AGING)).toEqual({
      current: '₱0.00',
      days_1_30: '₱500.00',
      days_31_60: '₱0.00',
      days_61_90: '₱0.00',
      over_90: '₱250.00',
      total: '₱750.00',
    })
  })
})

describe('buildStudentLedgerLink', () => {
  it('links to the student ledger with string params', () => {
    const [agingRow] = buildArAgingRows(AR_AGING)
    expect(buildStudentLedgerLink(agingRow)).toEqual({
      name: STUDENT_LEDGER_ROUTE_NAME,
      params: { schoolYearId: '2', studentId: '5' },
    })
  })
})

describe('buildTieOutPanel', () => {
  it('shows Tied out when mapped with a zero difference', () => {
    const tieOutPanel = buildTieOutPanel(AR_AGING.tie_out)
    expect(tieOutPanel.chip.label).toBe('Tied out')
    expect(tieOutPanel.hasDifference).toBe(false)
    expect(tieOutPanel.agingTotalLabel).toBe(AGING_TOTAL_LABEL)
    expect(tieOutPanel.glBalanceText).toBe('₱750.00')
  })

  it('shows Difference in red when mapped with a non-zero difference', () => {
    const tieOutPanel = buildTieOutPanel({ ...AR_AGING.tie_out, gl_balance: '700.00', difference: '-50.00' })
    expect(tieOutPanel.chip.label).toBe('Difference')
    expect(tieOutPanel.chip.colorClass).toContain('bg-red-100')
    expect(tieOutPanel.hasDifference).toBe(true)
    expect(tieOutPanel.differenceText).toBe('−₱50.00')
  })

  it('shows Not mapped with dashes and the message when AR is unmapped', () => {
    const tieOutPanel = buildTieOutPanel({ aging_total: '750.00', gl_balance: null, difference: null, is_mapped: false })
    expect(tieOutPanel.chip.label).toBe('Not mapped')
    expect(tieOutPanel.glBalanceText).toBe('—')
    expect(tieOutPanel.differenceText).toBe('—')
    expect(tieOutPanel.message).toBe(NOT_MAPPED_MESSAGE)
    expect(tieOutPanel.hasDifference).toBe(false)
  })

  it('returns null for a missing tie-out', () => {
    expect(buildTieOutPanel(null)).toBeNull()
    expect(buildTieOutPanel(undefined)).toBeNull()
  })
})

describe('buildArAgingCsv', () => {
  it('writes the header, one line per row and a Total row', () => {
    const csvLines = buildArAgingCsv(AR_AGING).split('\r\n')
    expect(csvLines[0]).toBe('Student,LRN,School year,Grade level,Current,1–30,31–60,61–90,Over 90,Total')
    expect(csvLines[1]).toBe('"Cruz, Ana Reyes",123456789012,2026-2027,Grade 8,0.00,500.00,0.00,0.00,250.00,750.00')
    expect(csvLines[2]).toBe('Total,,,,0.00,500.00,0.00,0.00,250.00,750.00')
  })

  it('writes a null LRN as an empty cell', () => {
    const csvRow = buildAgingRow({ student: { id: 6, lrn: null, first_name: 'Ben', middle_name: null, last_name: 'Lim' } })
    expect(buildArAgingCsv({ ...AR_AGING, rows: [csvRow] }).split('\r\n')[1]).toBe(
      '"Lim, Ben",,2026-2027,Grade 8,0.00,500.00,0.00,0.00,250.00,750.00',
    )
  })
})

describe('AR_AGING_COLUMNS', () => {
  it('lists the nine columns in order', () => {
    expect(AR_AGING_COLUMNS.map((column) => column.key)).toEqual([
      'student',
      'school_year_name',
      'grade_level_name',
      'current',
      'days_1_30',
      'days_31_60',
      'days_61_90',
      'over_90',
      'total',
    ])
  })
})
