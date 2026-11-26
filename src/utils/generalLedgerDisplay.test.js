import { describe, it, expect } from 'vitest'
import {
  LEDGER_COLUMNS,
  buildLedgerParams,
  buildLedgerRows,
  buildLedgerSummary,
  buildYearStartIso,
  createLedgerFilters,
  formatLedgerAmount,
  formatLedgerCell,
  hasLedgerLines,
  readLedgerQuery,
} from '@/utils/generalLedgerDisplay.js'

const LEDGER = {
  account: { id: 3, code: '1010', name: 'Cash', normal_balance: 'debit', is_active: true },
  from: '2026-01-01',
  to: '2026-11-26',
  opening_balance: '100.00',
  lines: [
    {
      id: 11,
      journal_entry_id: 5,
      number: 'JV-000005',
      entry_date: '2026-03-01',
      description: 'Tuition',
      memo: null,
      debit: '50.00',
      credit: '0.00',
      running_balance: '150.00',
    },
    {
      id: 12,
      journal_entry_id: 6,
      number: 'JV-000006',
      entry_date: '2026-03-02',
      description: 'Refund',
      memo: 'm',
      debit: '0.00',
      credit: '400.00',
      running_balance: '-250.00',
    },
  ],
  period_debit_total: '50.00',
  period_credit_total: '400.00',
  closing_balance: '-250.00',
}

describe('default filters', () => {
  it('starts on 1 January of the current year through today', () => {
    expect(buildYearStartIso('2026-11-26')).toBe('2026-01-01')
    expect(createLedgerFilters('2026-11-26')).toEqual({ accountId: '', from: '2026-01-01', to: '2026-11-26' })
    expect(LEDGER_COLUMNS.map((column) => column.key)).toEqual([
      'entry_date',
      'number',
      'description',
      'memo',
      'debit',
      'credit',
      'running_balance',
    ])
  })
})

describe('buildLedgerParams', () => {
  it('returns null without an account or with a range error', () => {
    expect(buildLedgerParams(createLedgerFilters('2026-11-26'))).toBeNull()
    expect(buildLedgerParams({ accountId: '3', from: '2026-12-01', to: '2026-11-26' })).toBeNull()
  })

  it('returns the params with a numeric account id and allows from = to', () => {
    expect(buildLedgerParams({ accountId: '3', from: '2026-01-01', to: '2026-11-26' })).toEqual({
      account_id: 3,
      from: '2026-01-01',
      to: '2026-11-26',
    })
    expect(buildLedgerParams({ accountId: '3', from: '2026-05-05', to: '2026-05-05' })).not.toBeNull()
  })
})

describe('signed amounts', () => {
  it('formats positive, negative and zero balances', () => {
    expect(formatLedgerAmount('1234.50')).toBe('₱1,234.50')
    expect(formatLedgerAmount('-1234.50')).toBe('−₱1,234.50')
    expect(formatLedgerAmount('0.00')).toBe('₱0.00')
    expect(formatLedgerAmount(undefined)).toBe('—')
  })

  it('renders zero debit and credit cells blank', () => {
    expect(formatLedgerCell('0.00')).toBe('')
    expect(formatLedgerCell('50.00')).toBe('₱50.00')
  })
})

describe('buildLedgerRows', () => {
  it('puts the opening row first, then the lines with the entry id', () => {
    const ledgerRows = buildLedgerRows(LEDGER)
    expect(ledgerRows).toHaveLength(3)
    expect(ledgerRows[0]).toEqual({
      key: 'opening',
      isOpening: true,
      description: 'Opening balance',
      running_balance: '₱100.00',
    })
    expect(ledgerRows[1]).toMatchObject({ key: 'line-11', entryId: 5, number: 'JV-000005', debit: '₱50.00', credit: '' })
    expect(ledgerRows[2]).toMatchObject({ key: 'line-12', entryId: 6, debit: '', credit: '₱400.00', running_balance: '−₱250.00' })
  })

  it('returns an empty list for a non-object', () => {
    expect(buildLedgerRows(null)).toEqual([])
    expect(buildLedgerRows('x')).toEqual([])
  })
})

describe('summary', () => {
  it('lists the period totals and closing balance', () => {
    expect(buildLedgerSummary(LEDGER)).toEqual([
      { label: 'Period debits', text: '₱50.00' },
      { label: 'Period credits', text: '₱400.00' },
      { label: 'Closing balance', text: '−₱250.00' },
    ])
    expect(hasLedgerLines(LEDGER)).toBe(true)
    expect(hasLedgerLines({ lines: [] })).toBe(false)
  })
})

describe('readLedgerQuery', () => {
  it('reads the account and range from a full query', () => {
    const routeQuery = { account_id: '4', from: '2026-02-01', to: '2026-03-31' }
    expect(readLedgerQuery(routeQuery, '2026-11-26')).toEqual({ accountId: '4', from: '2026-02-01', to: '2026-03-31' })
  })

  it('falls back to the year-to-date defaults when the query is missing', () => {
    expect(readLedgerQuery({}, '2026-11-26')).toEqual({ accountId: '', from: '2026-01-01', to: '2026-11-26' })
  })

  it('falls back to the defaults for a malformed or reversed range', () => {
    const malformedQuery = { account_id: '4', from: '2026-13-99', to: '2026-03-31' }
    const reversedQuery = { account_id: '4', from: '2026-05-02', to: '2026-05-01' }
    expect(readLedgerQuery(malformedQuery, '2026-11-26')).toEqual({ accountId: '4', from: '2026-01-01', to: '2026-11-26' })
    expect(readLedgerQuery(reversedQuery, '2026-11-26')).toEqual({ accountId: '4', from: '2026-01-01', to: '2026-11-26' })
  })

  it('gives an empty account for a bad account id', () => {
    expect(readLedgerQuery({ account_id: 'abc', from: '2026-02-01', to: '2026-03-31' }, '2026-11-26').accountId).toBe('')
  })
})
