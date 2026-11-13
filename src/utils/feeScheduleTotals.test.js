import { describe, it, expect } from 'vitest'
import { listCategoryTotals, sumScheduleLines } from '@/utils/feeScheduleTotals.js'

const feeItems = [
  { id: 1, category: 'tuition' },
  { id: 2, category: 'tuition' },
  { id: 3, category: 'miscellaneous' },
  { id: 4, category: 'other' },
]

describe('sumScheduleLines', () => {
  it('returns zeros with every category key for empty or non-array input', () => {
    const zeroTotals = { subtotals: { tuition: 0, miscellaneous: 0, other: 0 }, total: 0 }
    expect(sumScheduleLines([], feeItems)).toEqual(zeroTotals)
    expect(sumScheduleLines(null, feeItems)).toEqual(zeroTotals)
  })

  it('sums subtotals per category and a total equal to their sum', () => {
    const lines = [
      { fee_item_id: '1', amount: '1000' },
      { fee_item_id: '2', amount: '500.50' },
      { fee_item_id: '3', amount: '200' },
      { fee_item_id: '4', amount: '50' },
    ]
    const lineTotals = sumScheduleLines(lines, feeItems)
    expect(lineTotals.subtotals).toEqual({ tuition: 150050, miscellaneous: 20000, other: 5000 })
    expect(lineTotals.total).toBe(175050)
  })

  it('has no float drift for 0.10 + 0.20', () => {
    const lines = [
      { fee_item_id: '1', amount: '0.10' },
      { fee_item_id: '2', amount: '0.20' },
    ]
    expect(sumScheduleLines(lines, feeItems).total).toBe(30)
  })

  it('skips a line with an invalid amount or an unknown item', () => {
    const lines = [
      { fee_item_id: '1', amount: 'abc' },
      { fee_item_id: '2', amount: '0' },
      { fee_item_id: '99', amount: '100' },
      { fee_item_id: '3', amount: '10' },
    ]
    expect(sumScheduleLines(lines, feeItems).total).toBe(1000)
  })

  it('matches string form ids against numeric item ids', () => {
    expect(sumScheduleLines([{ fee_item_id: '4', amount: '1' }], feeItems).subtotals.other).toBe(100)
  })
})

describe('listCategoryTotals', () => {
  it('lists the categories in order with labels and cents', () => {
    const lineTotals = { subtotals: { tuition: 100, miscellaneous: 0, other: 5 }, total: 105 }
    expect(listCategoryTotals(lineTotals)).toEqual([
      { category: 'tuition', label: 'Tuition', cents: 100 },
      { category: 'miscellaneous', label: 'Miscellaneous', cents: 0 },
      { category: 'other', label: 'Other', cents: 5 },
    ])
  })
})
