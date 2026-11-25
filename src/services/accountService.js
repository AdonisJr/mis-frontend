import http from '@/services/http.js'

const ACCOUNTS_PATH = '/accounts'
const DEACTIVATE_SEGMENT = '/deactivate'
const REACTIVATE_SEGMENT = '/reactivate'
const INVALID_ACCOUNT_ID_MESSAGE = 'A valid account id is required.'
const FIRST_ACCOUNT_PAGE = 1
const SECOND_ACCOUNT_PAGE = 2

function assertAccountId(accountId) {
  if (Number.isInteger(accountId) && accountId > 0) return
  throw new Error(INVALID_ACCOUNT_ID_MESSAGE)
}

function buildAccountPath(accountId) {
  assertAccountId(accountId)
  return `${ACCOUNTS_PATH}/${accountId}`
}

export async function fetchAccounts(accountListParams) {
  const response = await http.get(ACCOUNTS_PATH, { params: accountListParams })
  return response.data
}

export async function fetchAllAccounts(accountListParams) {
  const firstPageResponse = await fetchAccounts({ ...accountListParams, page: FIRST_ACCOUNT_PAGE })
  const lastPage = firstPageResponse?.meta?.last_page
  const laterPageNumbers = Number.isInteger(lastPage)
    ? Array.from(
        { length: Math.max(lastPage - FIRST_ACCOUNT_PAGE, 0) },
        (_unused, index) => index + SECOND_ACCOUNT_PAGE,
      )
    : []
  const laterPageResponses = await Promise.all(
    laterPageNumbers.map((pageNumber) => fetchAccounts({ ...accountListParams, page: pageNumber })),
  )
  const pageResponses = [firstPageResponse, ...laterPageResponses]
  return { accounts: pageResponses.flatMap((accountPage) => accountPage?.accounts ?? []) }
}

export async function fetchAccount(accountId) {
  const response = await http.get(buildAccountPath(accountId))
  return response.data
}

export async function createAccount(accountPayload) {
  const response = await http.post(ACCOUNTS_PATH, accountPayload)
  return response.data
}

export async function updateAccount(accountId, accountPayload) {
  const response = await http.put(buildAccountPath(accountId), accountPayload)
  return response.data
}

export async function deactivateAccount(accountId) {
  const response = await http.put(buildAccountPath(accountId) + DEACTIVATE_SEGMENT)
  return response.data
}

export async function reactivateAccount(accountId) {
  const response = await http.put(buildAccountPath(accountId) + REACTIVATE_SEGMENT)
  return response.data
}

export async function deleteAccount(accountId) {
  const response = await http.delete(buildAccountPath(accountId))
  return response.data
}
