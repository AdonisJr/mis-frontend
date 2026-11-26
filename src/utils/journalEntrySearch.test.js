import { describe, it, expect } from 'vitest'
import {
  applyJournalAccountChange,
  applyJournalDateFromChange,
  applyJournalDateToChange,
  applyJournalSourceChange,
  applyJournalStatusChange,
  buildJournalEntryListParams,
  createJournalEntryFilters,
  findJournalDateRangeError,
} from '@/utils/journalEntrySearch.js'

describe('createJournalEntryFilters', () => {
  it('starts blank on page 1', () => {
    expect(createJournalEntryFilters()).toEqual({
      status: '',
      source: '',
      dateFrom: '',
      dateTo: '',
      accountId: '',
      search: '',
      page: 1,
    })
  })
})

describe('buildJournalEntryListParams', () => {
  it('omits blank filters and sends the page', () => {
    expect(buildJournalEntryListParams(createJournalEntryFilters())).toEqual({ page: 1 })
  })

  it('sends status, from, to, account_id and search when set', () => {
    const journalFilters = {
      status: 'posted',
      dateFrom: '2026-01-01',
      dateTo: '2026-11-26',
      accountId: '7',
      search: '  JV   12 ',
      page: 3,
    }
    expect(buildJournalEntryListParams(journalFilters)).toEqual({
      page: 3,
      status: 'posted',
      from: '2026-01-01',
      to: '2026-11-26',
      account_id: 7,
      search: 'JV 12',
    })
  })

  it('drops an unknown status', () => {
    expect(buildJournalEntryListParams({ ...createJournalEntryFilters(), status: 'void' })).toEqual({ page: 1 })
  })

  it('allows a one-sided range', () => {
    expect(buildJournalEntryListParams({ ...createJournalEntryFilters(), dateFrom: '2026-01-01' })).toEqual({
      page: 1,
      from: '2026-01-01',
    })
    expect(findJournalDateRangeError({ dateFrom: '', dateTo: '2026-01-01' })).toBe('')
  })

  it('returns null for from > to and allows from = to', () => {
    const backwardsFilters = { ...createJournalEntryFilters(), dateFrom: '2026-02-01', dateTo: '2026-01-01' }
    expect(findJournalDateRangeError(backwardsFilters)).not.toBe('')
    expect(buildJournalEntryListParams(backwardsFilters)).toBeNull()
    const sameDayFilters = { ...createJournalEntryFilters(), dateFrom: '2026-01-01', dateTo: '2026-01-01' }
    expect(buildJournalEntryListParams(sameDayFilters)).toEqual({ page: 1, from: '2026-01-01', to: '2026-01-01' })
  })
})

describe('source filter', () => {
  it('sends a known source, drops an unknown one and resets the page on change', () => {
    const journalFilters = { ...createJournalEntryFilters(), page: 4 }
    expect(buildJournalEntryListParams({ ...journalFilters, source: 'payment' })).toEqual({ page: 4, source: 'payment' })
    expect(buildJournalEntryListParams({ ...journalFilters, source: 'refund' })).toEqual({ page: 4 })
    expect(applyJournalSourceChange(journalFilters, 'assessment')).toMatchObject({ source: 'assessment', page: 1 })
    expect(applyJournalSourceChange(journalFilters, null)).toMatchObject({ source: '', page: 1 })
  })
})

describe('apply*Change', () => {
  it('resets the page and converts the account id', () => {
    const journalFilters = { ...createJournalEntryFilters(), page: 4 }
    expect(applyJournalStatusChange(journalFilters, 'draft')).toMatchObject({ status: 'draft', page: 1 })
    expect(applyJournalDateFromChange(journalFilters, '2026-01-01')).toMatchObject({ dateFrom: '2026-01-01', page: 1 })
    expect(applyJournalDateToChange(journalFilters, '2026-02-01')).toMatchObject({ dateTo: '2026-02-01', page: 1 })
    expect(applyJournalAccountChange(journalFilters, ' 12 ')).toMatchObject({ accountId: '12', page: 1 })
    expect(applyJournalAccountChange(journalFilters, 'abc')).toMatchObject({ accountId: '' })
  })
})
