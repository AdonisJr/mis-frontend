<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import BalancedIndicator from '@/components/BalancedIndicator.vue'
import DataTable from '@/components/DataTable.vue'
import ReportActions from '@/components/ReportActions.vue'
import ReportPrintHeader from '@/components/ReportPrintHeader.vue'
import TrialBalanceFilterBar from '@/components/TrialBalanceFilterBar.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchTrialBalance } from '@/services/reportService.js'
import { buildCsvFileName, downloadCsvFile } from '@/utils/csvExport.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { findAsOfError } from '@/utils/reportDisplay.js'
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

const REPORT_TITLE = 'Trial balance'
const REPORT_SLUG = 'trial-balance'
const ROW_KEY = 'key'
const EMPTY_TEXT = 'No accounts with a balance on this date.'
const INACTIVE_SUFFIX = ' (inactive)'
const LOAD_FAILED_MESSAGE = 'Could not load the trial balance.'

const filters = ref(createTrialBalanceFilters(toIsoDate(new Date())))
const trialBalance = ref(null)
const isLoading = ref(false)
let trialBalanceRequestId = 0

const toast = useToast()

const asOfError = computed(() => findAsOfError(filters.value.asOf))
const trialBalanceRows = computed(() => buildTrialBalanceRows(trialBalance.value))
const trialBalanceTotals = computed(() => buildTrialBalanceTotals(trialBalance.value))
const printItems = computed(() => buildTrialBalancePrintItems(filters.value))
const isActionsDisabled = computed(() => isLoading.value || trialBalance.value === null)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadTrialBalance() {
  const trialBalanceParams = buildTrialBalanceParams(filters.value)
  const requestId = ++trialBalanceRequestId
  if (!trialBalanceParams) {
    trialBalance.value = null
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const trialBalanceResponse = await fetchTrialBalance(trialBalanceParams)
    if (requestId !== trialBalanceRequestId) return
    trialBalance.value = trialBalanceResponse?.trial_balance ?? null
  } catch (error) {
    if (requestId !== trialBalanceRequestId) return
    trialBalance.value = null
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === trialBalanceRequestId) isLoading.value = false
  }
}

function changeFilter(filterKey, nextValue) {
  filters.value = { ...filters.value, [filterKey]: nextValue }
  loadTrialBalance()
}

function printReport() {
  window.print()
}

function downloadReportCsv() {
  const csvFileName = buildCsvFileName(REPORT_SLUG, filters.value.asOf)
  downloadCsvFile(csvFileName, buildTrialBalanceCsv(trialBalance.value))
}

onMounted(loadTrialBalance)
</script>

<template>
  <section class="print-page-statement rounded-lg border border-line bg-surface print:border-0">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 print:hidden">
      <h2 class="text-sm font-bold text-ink">{{ REPORT_TITLE }}</h2>
      <ReportActions :is-disabled="isActionsDisabled" @print="printReport" @download-csv="downloadReportCsv" />
    </div>
    <TrialBalanceFilterBar
      :as-of="filters.asOf"
      :type="filters.type"
      :is-zero-included="filters.isZeroIncluded"
      :as-of-error="asOfError"
      @update:as-of="changeFilter('asOf', $event)"
      @update:type="changeFilter('type', $event)"
      @update:is-zero-included="changeFilter('isZeroIncluded', $event)"
    />
    <ReportPrintHeader :title="REPORT_TITLE" :items="printItems" />

    <DataTable
      :columns="TRIAL_BALANCE_COLUMNS"
      :rows="trialBalanceRows"
      :row-key="ROW_KEY"
      :empty-text="EMPTY_TEXT"
      :is-loading="isLoading"
    >
      <template #cell-code="{ row }">
        <RouterLink
          :to="buildLedgerLinkTarget(row.accountId, filters.asOf)"
          class="rounded-md font-mono text-xs font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
        >
          {{ row.code }}
        </RouterLink>
      </template>
      <template #cell-name="{ row }">
        {{ row.name }}<span v-if="row.isInactive" class="text-ink-muted">{{ INACTIVE_SUFFIX }}</span>
      </template>
      <template #cell-type="{ row }">{{ row.typeLabel }}</template>
      <template #cell-debit="{ row }">
        <span class="block text-right tabular-nums">{{ row.debit }}</span>
      </template>
      <template #cell-credit="{ row }">
        <span class="block text-right tabular-nums">{{ row.credit }}</span>
      </template>
    </DataTable>

    <div
      v-if="trialBalance"
      class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm tabular-nums"
    >
      <dl class="flex flex-wrap gap-x-6 gap-y-1">
        <div class="flex gap-2">
          <dt class="font-semibold text-ink-muted">Total debits</dt>
          <dd class="font-bold text-ink">{{ trialBalanceTotals.debitText }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="font-semibold text-ink-muted">Total credits</dt>
          <dd class="font-bold text-ink">{{ trialBalanceTotals.creditText }}</dd>
        </div>
      </dl>
      <BalancedIndicator :is-balanced="trialBalanceTotals.isBalanced" />
    </div>
  </section>
</template>
