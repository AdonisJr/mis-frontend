import { formatAccountLabel, INACTIVE_SUFFIX, listAccountOptions } from '@/utils/journalEntryDisplay.js'
import { getFirstFieldError, toIdText, toRecordId } from '@/utils/sectionForm.js'

export const MAPPING_ERROR_PREFIX = 'mappings.'
export const NOT_MAPPED_LABEL = 'Not mapped'
export const NO_CHANGES_MESSAGE = 'No changes to save.'
export const OTHER_TYPE_SUFFIX = ' (other type)'

export const POSTING_GROUP_LABELS = Object.freeze({
  receivables: 'Receivables',
  revenue: 'Revenue',
  discounts_adjustments: 'Discounts & adjustments',
  cash: 'Cash by payment method',
})

function addGroupIfMissing(groupsByCode, postingMapping) {
  if (groupsByCode.has(postingMapping.group)) return
  const label = POSTING_GROUP_LABELS[postingMapping.group] ?? postingMapping.group
  groupsByCode.set(postingMapping.group, { group: postingMapping.group, label, mappings: [] })
}

export function groupPostingMappings(postingMappings) {
  if (!Array.isArray(postingMappings)) return []
  const groupsByCode = new Map()
  for (const postingMapping of postingMappings) {
    addGroupIfMissing(groupsByCode, postingMapping)
    groupsByCode.get(postingMapping.group).mappings.push(postingMapping)
  }
  return [...groupsByCode.values()]
}

export function createMappingSelections(postingMappings) {
  const mappingSelections = {}
  if (!Array.isArray(postingMappings)) return mappingSelections
  for (const postingMapping of postingMappings) {
    mappingSelections[postingMapping.purpose] = toIdText(postingMapping.account?.id)
  }
  return mappingSelections
}

function buildStaleOption(mappedAccount) {
  const suffix = mappedAccount.is_active === false ? INACTIVE_SUFFIX : OTHER_TYPE_SUFFIX
  return { value: String(mappedAccount.id), label: formatAccountLabel(mappedAccount) + suffix }
}

export function buildPurposeAccountOptions(postingMapping, activeAccounts) {
  const accountList = Array.isArray(activeAccounts) ? activeAccounts : []
  const fittingAccounts = accountList.filter((account) => account.type === postingMapping.account_type)
  const accountOptions = listAccountOptions(fittingAccounts)
  const mappedAccount = postingMapping.account
  if (!mappedAccount) return accountOptions
  const isListed = accountOptions.some((accountOption) => accountOption.value === String(mappedAccount.id))
  if (isListed) return accountOptions
  return [...accountOptions, buildStaleOption(mappedAccount)]
}

function isChangedSelection(postingMapping, mappingSelections) {
  const selectedId = mappingSelections?.[postingMapping.purpose] ?? ''
  if (selectedId === '') return false
  return selectedId !== toIdText(postingMapping.account?.id)
}

export function buildMappingPayload(postingMappings, mappingSelections) {
  if (!Array.isArray(postingMappings)) return null
  const changedMappings = {}
  for (const postingMapping of postingMappings) {
    if (!isChangedSelection(postingMapping, mappingSelections)) continue
    changedMappings[postingMapping.purpose] = toRecordId(mappingSelections[postingMapping.purpose])
  }
  return Object.keys(changedMappings).length === 0 ? null : { mappings: changedMappings }
}

export function getPurposeError(fieldErrors, purpose) {
  return getFirstFieldError(fieldErrors, MAPPING_ERROR_PREFIX + purpose)
}
