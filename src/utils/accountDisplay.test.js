import { describe, it, expect } from 'vitest'
import {
  ACCOUNT_COLUMNS,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_OPTIONS,
  CONTRA_CHIP,
  NO_VALUE_TEXT,
  buildAccountDeactivateMessage,
  buildAccountDeleteMessage,
  buildAccountReactivateMessage,
  getAccountTypeLabel,
  getContraChip,
  getNormalBalanceLabel,
  getSubtypeLabel,
  groupAccountsByType,
  isSubtypeFit,
  listSubtypeOptions,
} from '@/utils/accountDisplay.js'

describe('catalog', () => {
  it('lists the five types in group order with labels', () => {
    expect(ACCOUNT_TYPES).toEqual(['asset', 'liability', 'equity', 'revenue', 'expense'])
    expect(ACCOUNT_TYPE_OPTIONS.map((option) => option.label)).toEqual(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'])
    expect(ACCOUNT_COLUMNS.map((column) => column.key)).toEqual(['code', 'name', 'subtype', 'normal_balance', 'is_active'])
  })

  it('labels types and subtypes, keeps unknown values and blanks non-strings', () => {
    expect(getAccountTypeLabel('revenue')).toBe('Revenue')
    expect(getAccountTypeLabel('other')).toBe('other')
    expect(getAccountTypeLabel(null)).toBe('')
    expect(getSubtypeLabel('non_current_asset')).toBe('Non-current asset')
    expect(getSubtypeLabel('mystery')).toBe('mystery')
    expect(getSubtypeLabel(5)).toBe('')
  })
})

describe('subtype options', () => {
  it('limits the options to the chosen type', () => {
    expect(listSubtypeOptions('revenue')).toEqual([
      { value: 'operating_revenue', label: 'Operating revenue' },
      { value: 'other_income', label: 'Other income' },
    ])
    expect(listSubtypeOptions('equity')).toEqual([{ value: 'equity', label: 'Equity' }])
  })

  it('returns no options for an unknown type', () => {
    expect(listSubtypeOptions('')).toEqual([])
    expect(listSubtypeOptions('nope')).toEqual([])
  })

  it('tells whether a subtype fits a type', () => {
    expect(isSubtypeFit('asset', 'current_asset')).toBe(true)
    expect(isSubtypeFit('asset', 'other_income')).toBe(false)
    expect(isSubtypeFit('', 'equity')).toBe(false)
  })
})

describe('normal balance and contra chip', () => {
  it('shows the server normal balance and a dash for anything else', () => {
    expect(getNormalBalanceLabel('debit')).toBe('Debit')
    expect(getNormalBalanceLabel('credit')).toBe('Credit')
    expect(getNormalBalanceLabel(undefined)).toBe(NO_VALUE_TEXT)
    expect(getNormalBalanceLabel('left')).toBe(NO_VALUE_TEXT)
  })

  it('gives the Contra chip only when is_contra is true', () => {
    expect(getContraChip({ is_contra: true })).toBe(CONTRA_CHIP)
    expect(getContraChip({ is_contra: false })).toBeNull()
    expect(getContraChip(null)).toBeNull()
  })
})

describe('groupAccountsByType', () => {
  it('groups in type order, omits empty groups and drops unknown types', () => {
    const accounts = [
      { id: 1, code: '5010', type: 'expense' },
      { id: 2, code: '1010', type: 'asset' },
      { id: 3, code: '9999', type: 'mystery' },
    ]
    const accountGroups = groupAccountsByType(accounts)
    expect(accountGroups.map((accountGroup) => accountGroup.type)).toEqual(['asset', 'expense'])
    expect(accountGroups.map((accountGroup) => accountGroup.label)).toEqual(['Assets', 'Expenses'])
    expect(groupAccountsByType([])).toEqual([])
    expect(groupAccountsByType(null)).toEqual([])
  })

  it('sorts by plain string code, so 10100 comes before 1020, without mutating the input', () => {
    const accounts = [
      { id: 1, code: '1020', type: 'asset' },
      { id: 2, code: '10100', type: 'asset' },
      { id: 3, code: '1010', type: 'asset' },
    ]
    const [assetGroup] = groupAccountsByType(accounts)
    expect(assetGroup.accounts.map((account) => account.code)).toEqual(['1010', '10100', '1020'])
    expect(accounts.map((account) => account.id)).toEqual([1, 2, 3])
  })
})

describe('dialog messages', () => {
  it('builds the three texts', () => {
    const account = { code: '1010', name: 'Cash' }
    expect(buildAccountDeactivateMessage(account)).toBe('Deactivate 1010 Cash? It stays in the chart but is marked inactive.')
    expect(buildAccountReactivateMessage(account)).toBe('Reactivate 1010 Cash?')
    expect(buildAccountDeleteMessage(account)).toBe('Delete 1010 Cash? This cannot be undone.')
  })

  it('returns an empty string for a non-object', () => {
    expect(buildAccountDeactivateMessage(null)).toBe('')
    expect(buildAccountReactivateMessage('x')).toBe('')
    expect(buildAccountDeleteMessage(undefined)).toBe('')
  })
})
