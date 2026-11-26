import { describe, it, expect } from 'vitest'
import {
  buildBalanceSheetCsv,
  buildBalanceSheetParams,
  buildBalanceSheetPrintItems,
  buildBalanceSheetSections,
  buildBalanceSheetTotals,
  createBalanceSheetFilters,
} from '@/utils/balanceSheetDisplay.js'

const BALANCE_SHEET = {
  as_of: '2026-11-26',
  current_year_start: '2026-01-01',
  assets: {
    groups: [
      {
        subtype: 'current_asset',
        rows: [
          { id: 1, code: '1010', name: 'Cash', is_contra: false, is_active: true, amount: '1500.00' },
          { id: 2, code: '1190', name: 'Allowance', is_contra: true, is_active: false, amount: '-50.00' },
        ],
        subtotal: '1450.00',
      },
      { subtype: 'non_current_asset', rows: [], subtotal: '0.00' },
    ],
    total: '1450.00',
  },
  liabilities: {
    groups: [
      { subtype: 'current_liability', rows: [{ id: 3, code: '2010', name: 'Payables', is_contra: false, is_active: true, amount: '200.00' }], subtotal: '200.00' },
      { subtype: 'non_current_liability', rows: [], subtotal: '0.00' },
    ],
    total: '200.00',
  },
  equity: {
    groups: [{ subtype: 'equity', rows: [{ id: 4, code: '3010', name: 'Capital', is_contra: false, is_active: true, amount: '1000.00' }], subtotal: '1000.00' }],
    net_income_current_year: '300.00',
    net_income_prior_years: '-50.00',
    total: '1250.00',
  },
  total_liabilities_and_equity: '1450.00',
  is_balanced: true,
}

describe('createBalanceSheetFilters', () => {
  it('defaults to today', () => {
    expect(createBalanceSheetFilters('2026-11-26')).toEqual({ asOf: '2026-11-26' })
  })
})

describe('buildBalanceSheetParams', () => {
  it('builds as_of', () => {
    expect(buildBalanceSheetParams({ asOf: '2026-11-26' })).toEqual({ as_of: '2026-11-26' })
  })

  it('returns null for an invalid date', () => {
    expect(buildBalanceSheetParams({ asOf: '' })).toBeNull()
  })
})

describe('buildBalanceSheetSections', () => {
  it('lists Assets, Liabilities and Equity in order with their totals', () => {
    const sections = buildBalanceSheetSections(BALANCE_SHEET)
    expect(sections.map((section) => section.title)).toEqual(['Assets', 'Liabilities', 'Equity'])
    expect(sections.map((section) => section.totalText)).toEqual(['₱1,450.00', '₱200.00', '₱1,250.00'])
    expect(sections[0].totalLabel).toBe('Total assets')
  })

  it('titles groups by subtype and reads the group subtotal', () => {
    const [assetsSection] = buildBalanceSheetSections(BALANCE_SHEET)
    expect(assetsSection.groups[0]).toMatchObject({
      key: 'current_asset',
      title: 'Current asset',
      subtotalLabel: 'Total current asset',
      subtotalText: '₱1,450.00',
    })
  })

  it('skips groups with no rows', () => {
    const [assetsSection, liabilitiesSection] = buildBalanceSheetSections(BALANCE_SHEET)
    expect(assetsSection.groups.map((group) => group.key)).toEqual(['current_asset'])
    expect(liabilitiesSection.groups.map((group) => group.key)).toEqual(['current_liability'])
  })

  it('shows a contra row with a minus sign and flags an inactive row', () => {
    const [assetsSection] = buildBalanceSheetSections(BALANCE_SHEET)
    expect(assetsSection.groups[0].rows[1]).toEqual({
      key: 'account-2',
      code: '1190',
      name: 'Allowance',
      amountText: '−₱50.00',
      isInactive: true,
    })
    expect(assetsSection.groups[0].rows[0].isInactive).toBe(false)
  })

  it('adds the two net income lines to equity only', () => {
    const [assetsSection, , equitySection] = buildBalanceSheetSections(BALANCE_SHEET)
    expect(assetsSection.extraLines).toEqual([])
    expect(equitySection.extraLines.map((extraLine) => extraLine.label)).toEqual([
      'Net income — current year',
      'Net income — prior years',
    ])
    expect(equitySection.extraLines[0]).toMatchObject({ text: '₱300.00', isNegative: false })
  })

  it('shows negative prior-years net income in parentheses', () => {
    const [, , equitySection] = buildBalanceSheetSections(BALANCE_SHEET)
    expect(equitySection.extraLines[1]).toMatchObject({ text: '(₱50.00)', isNegative: true })
  })

  it('returns an empty list for a non-object', () => {
    expect(buildBalanceSheetSections(null)).toEqual([])
  })
})

describe('buildBalanceSheetTotals', () => {
  it('reads the assets total, the liabilities and equity total and the balanced flag', () => {
    expect(buildBalanceSheetTotals(BALANCE_SHEET)).toEqual({
      assetsText: '₱1,450.00',
      liabilitiesAndEquityText: '₱1,450.00',
      isBalanced: true,
    })
  })

  it('reports out of balance', () => {
    expect(buildBalanceSheetTotals({ ...BALANCE_SHEET, is_balanced: false }).isBalanced).toBe(false)
  })
})

describe('buildBalanceSheetPrintItems', () => {
  it('shows the as-of date', () => {
    expect(buildBalanceSheetPrintItems({ asOf: '2026-11-26' })).toEqual([
      { key: 'As of', label: 'As of', text: 'Nov 26, 2026' },
    ])
  })
})

describe('buildBalanceSheetCsv', () => {
  it('writes groups, subtotals, net income lines, totals and the grand total', () => {
    const csvLines = buildBalanceSheetCsv(BALANCE_SHEET).split('\r\n')
    expect(csvLines[0]).toBe('Section,Group,Code,Account,Amount')
    expect(csvLines[1]).toBe('Assets,Current asset,1010,Cash,1500.00')
    expect(csvLines[2]).toBe('Assets,Current asset,1190,Allowance,-50.00')
    expect(csvLines[3]).toBe('Assets,Current asset,,Total current asset,1450.00')
    expect(csvLines).toContain('Equity,,,Net income — prior years,-50.00')
    expect(csvLines[csvLines.length - 1]).toBe(
      'Total liabilities and equity,,,Total liabilities and equity,1450.00',
    )
  })
})
