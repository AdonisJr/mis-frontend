import { describe, it, expect } from 'vitest'
import {
  INCOME_SECTIONS,
  buildIncomeStatementBlocks,
  buildIncomeStatementCsv,
  buildIncomeStatementParams,
  buildIncomeStatementPrintItems,
  buildNetIncomeLine,
} from '@/utils/incomeStatementDisplay.js'

const INCOME_STATEMENT = {
  from: '2026-01-01',
  to: '2026-11-26',
  revenue: {
    rows: [
      { id: 7, code: '4010', name: 'Tuition, net', is_contra: false, is_active: true, amount: '1000.00' },
      { id: 8, code: '4020', name: 'Old fees', is_contra: false, is_active: false, amount: '50.00' },
    ],
    subtotal: '1050.00',
  },
  contra_revenue: {
    rows: [{ id: 9, code: '4090', name: 'Discounts', is_contra: true, is_active: true, amount: '-100.00' }],
    subtotal: '-100.00',
  },
  net_revenue: '950.00',
  other_income: { rows: [], subtotal: '0.00' },
  operating_expenses: { rows: [{ id: 12, code: '5010', name: 'Salaries', is_contra: false, is_active: true, amount: '400.00' }], subtotal: '400.00' },
  other_expenses: { rows: [], subtotal: '0.00' },
  net_income: '550.00',
}

describe('buildIncomeStatementParams', () => {
  it('returns from and to for a valid range', () => {
    expect(buildIncomeStatementParams({ from: '2026-01-01', to: '2026-11-26' })).toEqual({
      from: '2026-01-01',
      to: '2026-11-26',
    })
  })

  it('accepts from equal to to', () => {
    expect(buildIncomeStatementParams({ from: '2026-05-01', to: '2026-05-01' })).not.toBeNull()
  })

  it('returns null for a reversed or blank range', () => {
    expect(buildIncomeStatementParams({ from: '2026-05-02', to: '2026-05-01' })).toBeNull()
    expect(buildIncomeStatementParams({ from: '', to: '2026-05-01' })).toBeNull()
  })
})

describe('buildIncomeStatementBlocks', () => {
  it('orders the sections with the Net revenue line after contra revenue', () => {
    const blocks = buildIncomeStatementBlocks(INCOME_STATEMENT)
    expect(blocks.map((block) => block.key)).toEqual([
      'revenue',
      'contra_revenue',
      'net_revenue',
      'other_income',
      'operating_expenses',
      'other_expenses',
    ])
    expect(blocks[2]).toEqual({ kind: 'line', key: 'net_revenue', label: 'Net revenue', text: '₱950.00' })
  })

  it('reads section rows and the subtotal key', () => {
    const [revenueBlock] = buildIncomeStatementBlocks(INCOME_STATEMENT)
    expect(revenueBlock.subtotalText).toBe('₱1,050.00')
    expect(revenueBlock.subtotalLabel).toBe('Total revenue')
    expect(revenueBlock.rows[0]).toEqual({
      key: 'account-7',
      code: '4010',
      name: 'Tuition, net',
      amountText: '₱1,000.00',
      isInactive: false,
    })
  })

  it('flags an inactive account row', () => {
    const [revenueBlock] = buildIncomeStatementBlocks(INCOME_STATEMENT)
    expect(revenueBlock.rows[1].isInactive).toBe(true)
  })

  it('keeps an empty section with no rows', () => {
    const otherIncomeBlock = buildIncomeStatementBlocks(INCOME_STATEMENT)[3]
    expect(otherIncomeBlock.rows).toEqual([])
    expect(otherIncomeBlock.subtotalText).toBe('₱0.00')
  })

  it('titles the contra block Less: contra revenue and shows its minus sign', () => {
    const contraBlock = buildIncomeStatementBlocks(INCOME_STATEMENT)[1]
    expect(contraBlock.title).toBe('Less: contra revenue')
    expect(contraBlock.rows[0].amountText).toBe('−₱100.00')
    expect(INCOME_SECTIONS[1].title).toBe('Less: contra revenue')
  })

  it('returns an empty list for a non-object', () => {
    expect(buildIncomeStatementBlocks(null)).toEqual([])
  })
})

describe('buildNetIncomeLine', () => {
  it('labels a positive amount Net income', () => {
    expect(buildNetIncomeLine('550.00')).toEqual({ label: 'Net income', text: '₱550.00', isNegative: false })
  })

  it('labels a negative amount Net loss in parentheses', () => {
    expect(buildNetIncomeLine('-1234.50')).toEqual({ label: 'Net loss', text: '(₱1,234.50)', isNegative: true })
  })

  it('labels zero Net income', () => {
    expect(buildNetIncomeLine('0.00').label).toBe('Net income')
  })
})

describe('buildIncomeStatementPrintItems', () => {
  it('shows the period', () => {
    expect(buildIncomeStatementPrintItems({ from: '2026-01-01', to: '2026-11-26' })).toEqual([
      { key: 'Period', label: 'Period', text: 'Jan 1, 2026 – Nov 26, 2026' },
    ])
  })
})

describe('buildIncomeStatementCsv', () => {
  it('writes accounts, subtotals, Net revenue and Net income', () => {
    const csvLines = buildIncomeStatementCsv(INCOME_STATEMENT).split('\r\n')
    expect(csvLines[0]).toBe('Section,Code,Account,Amount')
    expect(csvLines[1]).toBe('Revenue,4010,"Tuition, net",1000.00')
    expect(csvLines[3]).toBe('Revenue,,Total revenue,1050.00')
    expect(csvLines[4]).toBe('Less: contra revenue,4090,Discounts,-100.00')
    expect(csvLines[6]).toBe('Net revenue,,Net revenue,950.00')
    expect(csvLines[csvLines.length - 1]).toBe('Net income,,Net income,550.00')
  })
})
