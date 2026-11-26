import { describe, it, expect } from 'vitest'
import { GENERAL_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import {
  TRIAL_BALANCE_COLUMNS,
  buildLedgerLinkTarget,
  buildTrialBalanceCsv,
  buildTrialBalanceParams,
  buildTrialBalancePrintItems,
  buildTrialBalanceRows,
  buildTrialBalanceTotals,
  createTrialBalanceFilters,
} from '@/utils/trialBalanceDisplay.js'

const TRIAL_BALANCE = {
  as_of: '2026-11-26',
  type: null,
  include_zero: false,
  rows: [
    { id: 4, code: '1010', name: 'Cash', type: 'asset', subtype: 'current_asset', is_contra: false, is_active: true, debit: '1500.00', credit: '0.00' },
    { id: 9, code: '4010', name: 'Tuition, net', type: 'revenue', subtype: 'operating_revenue', is_contra: false, is_active: false, debit: '0.00', credit: '1500.00' },
  ],
  totals: { debit: '1500.00', credit: '1500.00' },
  is_balanced: true,
}

describe('createTrialBalanceFilters', () => {
  it('starts as of today with all types and zero accounts hidden', () => {
    expect(createTrialBalanceFilters('2026-11-26')).toEqual({ asOf: '2026-11-26', type: '', isZeroIncluded: false })
  })
})

describe('buildTrialBalanceParams', () => {
  it('sends only as_of by default', () => {
    expect(buildTrialBalanceParams(createTrialBalanceFilters('2026-11-26'))).toEqual({ as_of: '2026-11-26' })
  })

  it('keeps a known type', () => {
    const trialBalanceFilters = { asOf: '2026-11-26', type: 'asset', isZeroIncluded: false }
    expect(buildTrialBalanceParams(trialBalanceFilters)).toEqual({ as_of: '2026-11-26', type: 'asset' })
  })

  it('drops an unknown type', () => {
    const trialBalanceFilters = { asOf: '2026-11-26', type: 'bogus', isZeroIncluded: false }
    expect(buildTrialBalanceParams(trialBalanceFilters)).toEqual({ as_of: '2026-11-26' })
  })

  it('sends include_zero as the number 1 when on and omits it when off', () => {
    const onFilters = { asOf: '2026-11-26', type: '', isZeroIncluded: true }
    const offFilters = { asOf: '2026-11-26', type: '', isZeroIncluded: false }
    expect(buildTrialBalanceParams(onFilters)).toEqual({ as_of: '2026-11-26', include_zero: 1 })
    expect(buildTrialBalanceParams(offFilters)).not.toHaveProperty('include_zero')
  })

  it('returns null for an invalid as-of date', () => {
    expect(buildTrialBalanceParams({ asOf: '', type: '', isZeroIncluded: false })).toBeNull()
  })
})

describe('buildTrialBalanceRows', () => {
  it('maps rows with blank zero cells', () => {
    const [cashRow, tuitionRow] = buildTrialBalanceRows(TRIAL_BALANCE)
    expect(cashRow).toMatchObject({
      key: 'account-4',
      accountId: 4,
      code: '1010',
      typeLabel: 'Asset',
      debit: '₱1,500.00',
      credit: '',
    })
    expect(tuitionRow).toMatchObject({ debit: '', credit: '₱1,500.00' })
  })

  it('shows a negative cell with the minus sign', () => {
    const negativeRow = { ...TRIAL_BALANCE.rows[0], debit: '-20.00' }
    expect(buildTrialBalanceRows({ rows: [negativeRow] })[0].debit).toBe('−₱20.00')
  })

  it('flags an inactive account', () => {
    const [cashRow, tuitionRow] = buildTrialBalanceRows(TRIAL_BALANCE)
    expect(cashRow.isInactive).toBe(false)
    expect(tuitionRow.isInactive).toBe(true)
  })

  it('returns an empty list for a non-object', () => {
    expect(buildTrialBalanceRows(null)).toEqual([])
  })
})

describe('buildTrialBalanceTotals', () => {
  it('reads totals.debit and totals.credit and the balanced flag', () => {
    expect(buildTrialBalanceTotals(TRIAL_BALANCE)).toEqual({
      debitText: '₱1,500.00',
      creditText: '₱1,500.00',
      isBalanced: true,
    })
  })

  it('reports out of balance', () => {
    expect(buildTrialBalanceTotals({ ...TRIAL_BALANCE, is_balanced: false }).isBalanced).toBe(false)
  })
})

describe('buildLedgerLinkTarget', () => {
  it('opens the general ledger from 1 January to the as-of date', () => {
    expect(buildLedgerLinkTarget(4, '2026-11-26')).toEqual({
      name: GENERAL_LEDGER_ROUTE_NAME,
      query: { account_id: '4', from: '2026-01-01', to: '2026-11-26' },
    })
  })

  it('uses a one-day range when the as-of date is 1 January', () => {
    expect(buildLedgerLinkTarget(4, '2026-01-01').query).toMatchObject({ from: '2026-01-01', to: '2026-01-01' })
  })
})

describe('buildTrialBalancePrintItems', () => {
  it('lists the as-of date, type and zero-balance toggle', () => {
    const printItems = buildTrialBalancePrintItems({ asOf: '2026-11-26', type: 'asset', isZeroIncluded: true })
    expect(printItems.map((printItem) => printItem.text)).toEqual(['Nov 26, 2026', 'Asset', 'Shown'])
    expect(buildTrialBalancePrintItems(createTrialBalanceFilters('2026-11-26'))[1].text).toBe('All')
  })
})

describe('buildTrialBalanceCsv', () => {
  it('writes the rows and a Total row with plain amounts', () => {
    const csvLines = buildTrialBalanceCsv(TRIAL_BALANCE).split('\r\n')
    expect(csvLines[0]).toBe(TRIAL_BALANCE_COLUMNS.map((column) => column.label).join(','))
    expect(csvLines[1]).toBe('1010,Cash,Asset,1500.00,0.00')
    expect(csvLines[2]).toBe('4010,"Tuition, net",Revenue,0.00,1500.00')
    expect(csvLines[3]).toBe(',Total,,1500.00,1500.00')
  })
})
