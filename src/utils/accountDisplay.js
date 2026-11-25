export const ACCOUNT_TYPE_ASSET = 'asset'
export const ACCOUNT_TYPE_LIABILITY = 'liability'
export const ACCOUNT_TYPE_EQUITY = 'equity'
export const ACCOUNT_TYPE_REVENUE = 'revenue'
export const ACCOUNT_TYPE_EXPENSE = 'expense'

export const NO_VALUE_TEXT = '—'

const NORMAL_BALANCE_DEBIT = 'debit'
const NORMAL_BALANCE_CREDIT = 'credit'

// group order on screen
export const ACCOUNT_TYPES = Object.freeze([
  ACCOUNT_TYPE_ASSET,
  ACCOUNT_TYPE_LIABILITY,
  ACCOUNT_TYPE_EQUITY,
  ACCOUNT_TYPE_REVENUE,
  ACCOUNT_TYPE_EXPENSE,
])

export const ACCOUNT_TYPE_LABELS = Object.freeze({
  [ACCOUNT_TYPE_ASSET]: 'Asset',
  [ACCOUNT_TYPE_LIABILITY]: 'Liability',
  [ACCOUNT_TYPE_EQUITY]: 'Equity',
  [ACCOUNT_TYPE_REVENUE]: 'Revenue',
  [ACCOUNT_TYPE_EXPENSE]: 'Expense',
})

export const ACCOUNT_TYPE_GROUP_LABELS = Object.freeze({
  [ACCOUNT_TYPE_ASSET]: 'Assets',
  [ACCOUNT_TYPE_LIABILITY]: 'Liabilities',
  [ACCOUNT_TYPE_EQUITY]: 'Equity',
  [ACCOUNT_TYPE_REVENUE]: 'Revenue',
  [ACCOUNT_TYPE_EXPENSE]: 'Expenses',
})

export const ACCOUNT_TYPE_OPTIONS = Object.freeze(
  ACCOUNT_TYPES.map((accountType) => Object.freeze({ value: accountType, label: ACCOUNT_TYPE_LABELS[accountType] })),
)

// mirrors the backend Account type/subtype catalog
export const ACCOUNT_TYPE_SUBTYPES = Object.freeze({
  [ACCOUNT_TYPE_ASSET]: Object.freeze(['current_asset', 'non_current_asset']),
  [ACCOUNT_TYPE_LIABILITY]: Object.freeze(['current_liability', 'non_current_liability']),
  [ACCOUNT_TYPE_EQUITY]: Object.freeze(['equity']),
  [ACCOUNT_TYPE_REVENUE]: Object.freeze(['operating_revenue', 'other_income']),
  [ACCOUNT_TYPE_EXPENSE]: Object.freeze(['operating_expense', 'other_expense']),
})

export const ACCOUNT_SUBTYPE_LABELS = Object.freeze({
  current_asset: 'Current asset',
  non_current_asset: 'Non-current asset',
  current_liability: 'Current liability',
  non_current_liability: 'Non-current liability',
  equity: 'Equity',
  operating_revenue: 'Operating revenue',
  other_income: 'Other income',
  operating_expense: 'Operating expense',
  other_expense: 'Other expense',
})

export const ACCOUNT_COLUMNS = Object.freeze([
  Object.freeze({ key: 'code', label: 'Code' }),
  Object.freeze({ key: 'name', label: 'Name' }),
  Object.freeze({ key: 'subtype', label: 'Subtype' }),
  Object.freeze({ key: 'normal_balance', label: 'Normal balance' }),
  Object.freeze({ key: 'is_active', label: 'Status' }),
])

export const CONTRA_CHIP = Object.freeze({ label: 'Contra', colorClass: 'bg-slate-200 text-slate-700' })

function isAccountObject(account) {
  return account !== null && typeof account === 'object'
}

function getLabelOrRaw(labels, value) {
  if (typeof value !== 'string') return ''
  return labels[value] ?? value
}

export function getAccountTypeLabel(accountType) {
  return getLabelOrRaw(ACCOUNT_TYPE_LABELS, accountType)
}

export function getSubtypeLabel(subtype) {
  return getLabelOrRaw(ACCOUNT_SUBTYPE_LABELS, subtype)
}

export function listSubtypeOptions(accountType) {
  const subtypes = ACCOUNT_TYPE_SUBTYPES[accountType] ?? []
  return subtypes.map((subtype) => ({ value: subtype, label: ACCOUNT_SUBTYPE_LABELS[subtype] }))
}

export function isSubtypeFit(accountType, subtype) {
  return (ACCOUNT_TYPE_SUBTYPES[accountType] ?? []).includes(subtype)
}

export function getNormalBalanceLabel(normalBalance) {
  if (normalBalance === NORMAL_BALANCE_DEBIT) return 'Debit'
  if (normalBalance === NORMAL_BALANCE_CREDIT) return 'Credit'
  return NO_VALUE_TEXT
}

export function getContraChip(account) {
  return account?.is_contra === true ? CONTRA_CHIP : null
}

export function isAccountUsed(account) {
  return account?.is_used === true
}

// plain string order, the same as the server's ORDER BY code
export function compareAccountCodes(firstAccount, secondAccount) {
  const firstCode = String(firstAccount?.code ?? '')
  const secondCode = String(secondAccount?.code ?? '')
  if (firstCode < secondCode) return -1
  return firstCode > secondCode ? 1 : 0
}

export function groupAccountsByType(accounts) {
  if (!Array.isArray(accounts)) return []
  return ACCOUNT_TYPES.map((accountType) => ({
    type: accountType,
    label: ACCOUNT_TYPE_GROUP_LABELS[accountType],
    accounts: accounts.filter((account) => account?.type === accountType).sort(compareAccountCodes),
  })).filter((accountGroup) => accountGroup.accounts.length > 0)
}

export function buildAccountDeactivateMessage(account) {
  if (!isAccountObject(account)) return ''
  return `Deactivate ${account.code} ${account.name}? It stays in the chart but is marked inactive.`
}

export function buildAccountReactivateMessage(account) {
  if (!isAccountObject(account)) return ''
  return `Reactivate ${account.code} ${account.name}?`
}

export function buildAccountDeleteMessage(account) {
  if (!isAccountObject(account)) return ''
  return `Delete ${account.code} ${account.name}? This cannot be undone.`
}
