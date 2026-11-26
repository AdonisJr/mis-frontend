import http from '@/services/http.js'

const TRIAL_BALANCE_PATH = '/reports/trial-balance'
const INCOME_STATEMENT_PATH = '/reports/income-statement'
const BALANCE_SHEET_PATH = '/reports/balance-sheet'
const AR_AGING_PATH = '/reports/ar-aging'

export async function fetchTrialBalance(trialBalanceParams) {
  const response = await http.get(TRIAL_BALANCE_PATH, { params: trialBalanceParams })
  return response.data
}

export async function fetchIncomeStatement(incomeStatementParams) {
  const response = await http.get(INCOME_STATEMENT_PATH, { params: incomeStatementParams })
  return response.data
}

export async function fetchBalanceSheet(balanceSheetParams) {
  const response = await http.get(BALANCE_SHEET_PATH, { params: balanceSheetParams })
  return response.data
}

export async function fetchArAging(arAgingParams) {
  const response = await http.get(AR_AGING_PATH, { params: arAgingParams })
  return response.data
}
