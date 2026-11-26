import http from '@/services/http.js'

const GENERAL_LEDGER_PATH = '/general-ledger'

export async function fetchGeneralLedger(ledgerParams) {
  const response = await http.get(GENERAL_LEDGER_PATH, { params: ledgerParams })
  return response.data
}
