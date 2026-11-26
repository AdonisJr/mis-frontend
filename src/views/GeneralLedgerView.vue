<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import GeneralLedgerFilterBar from '@/components/GeneralLedgerFilterBar.vue'
import { JOURNAL_ENTRY_DETAIL_ROUTE_NAME } from '@/routeNames.js'
import { fetchAllAccounts } from '@/services/accountService.js'
import { fetchGeneralLedger } from '@/services/generalLedgerService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { getNormalBalanceLabel } from '@/utils/accountDisplay.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import {
  LEDGER_COLUMNS,
  applyLedgerAccountChange,
  buildLedgerParams,
  buildLedgerRows,
  buildLedgerSummary,
  createLedgerFilters,
  findLedgerRangeError,
  hasLedgerLines,
} from '@/utils/generalLedgerDisplay.js'
import { formatAccountLabel, listAccountOptions } from '@/utils/journalEntryDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

const LEDGER_ROW_KEY = 'key'
const NO_ACCOUNT_TEXT = 'Select an account to see its ledger.'
const NO_LINES_TEXT = 'No posted entries for this account in this period.'
const LOADING_TEXT = 'Loading…'

const LOAD_FAILED_MESSAGE = 'Could not load the general ledger.'
const ACCOUNTS_FAILED_MESSAGE = 'Could not load accounts.'

const filters = ref(createLedgerFilters(toIsoDate(new Date())))
const accountOptions = ref([])
const ledger = ref(null)
const isLoading = ref(false)
let ledgerRequestId = 0

const toast = useToast()

const rangeError = computed(() => findLedgerRangeError(filters.value))
const hasAccount = computed(() => filters.value.accountId !== '')
const ledgerRows = computed(() => buildLedgerRows(ledger.value))
const ledgerSummary = computed(() => buildLedgerSummary(ledger.value))
const accountHeading = computed(() => formatAccountLabel(ledger.value?.account))
const normalBalanceLabel = computed(() => getNormalBalanceLabel(ledger.value?.account?.normal_balance))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadLedger() {
  const ledgerParams = buildLedgerParams(filters.value)
  const requestId = ++ledgerRequestId
  if (!ledgerParams) {
    ledger.value = null
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const ledgerResponse = await fetchGeneralLedger(ledgerParams)
    if (requestId !== ledgerRequestId) return
    ledger.value = ledgerResponse?.ledger ?? null
  } catch (error) {
    if (requestId !== ledgerRequestId) return
    ledger.value = null
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === ledgerRequestId) isLoading.value = false
  }
}

async function loadAccountOptions() {
  try {
    const accountResponse = await fetchAllAccounts({})
    accountOptions.value = listAccountOptions(accountResponse?.accounts)
  } catch (error) {
    toastRequestError(error, ACCOUNTS_FAILED_MESSAGE)
  }
}

function changeAccount(nextAccountId) {
  filters.value = applyLedgerAccountChange(filters.value, nextAccountId)
  loadLedger()
}

function changeFrom(nextDate) {
  filters.value = { ...filters.value, from: nextDate }
  loadLedger()
}

function changeTo(nextDate) {
  filters.value = { ...filters.value, to: nextDate }
  loadLedger()
}

onMounted(loadAccountOptions)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">General ledger</h2>
    </div>
    <GeneralLedgerFilterBar
      :account-id="filters.accountId"
      :from="filters.from"
      :to="filters.to"
      :account-options="accountOptions"
      :range-error="rangeError"
      @update:account-id="changeAccount"
      @update:from="changeFrom"
      @update:to="changeTo"
    />

    <p v-if="!hasAccount" class="px-4 py-8 text-center text-sm text-ink-muted">{{ NO_ACCOUNT_TEXT }}</p>
    <p v-else-if="isLoading && !ledger" class="px-4 py-8 text-center text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

    <template v-if="ledger">
      <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <h3 class="text-sm font-bold text-ink">{{ accountHeading }}</h3>
        <p class="text-xs text-ink-muted">Normal balance: {{ normalBalanceLabel }}</p>
      </div>
      <DataTable :columns="LEDGER_COLUMNS" :rows="ledgerRows" :row-key="LEDGER_ROW_KEY" :is-loading="isLoading">
        <template #cell-entry_date="{ row }">
          <span class="tabular-nums">{{ row.isOpening ? '' : formatDisplayDate(row.entry_date) }}</span>
        </template>
        <template #cell-number="{ row }">
          <RouterLink
            v-if="!row.isOpening"
            :to="{ name: JOURNAL_ENTRY_DETAIL_ROUTE_NAME, params: { entryId: row.entryId } }"
            class="rounded-md font-mono text-xs font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
          >
            {{ row.number }}
          </RouterLink>
        </template>
        <template #cell-description="{ row }">
          <span :class="row.isOpening ? 'font-bold' : ''">{{ row.description }}</span>
        </template>
        <template #cell-memo="{ row }">{{ row.isOpening ? '' : (row.memo ?? NO_VALUE_LABEL) }}</template>
        <template #cell-debit="{ row }">
          <span class="block text-right tabular-nums">{{ row.debit }}</span>
        </template>
        <template #cell-credit="{ row }">
          <span class="block text-right tabular-nums">{{ row.credit }}</span>
        </template>
        <template #cell-running_balance="{ row }">
          <span class="block text-right tabular-nums" :class="row.isOpening ? 'font-bold' : ''">{{ row.running_balance }}</span>
        </template>
      </DataTable>
      <p v-if="!hasLedgerLines(ledger)" class="border-t border-line px-4 py-6 text-center text-sm text-ink-muted">
        {{ NO_LINES_TEXT }}
      </p>
      <dl class="grid gap-3 border-t border-line px-4 py-3 text-sm tabular-nums sm:grid-cols-3">
        <div v-for="summaryRow in ledgerSummary" :key="summaryRow.label">
          <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{{ summaryRow.label }}</dt>
          <dd class="font-bold text-ink">{{ summaryRow.text }}</dd>
        </div>
      </dl>
    </template>
  </section>
</template>
