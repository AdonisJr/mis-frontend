<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import BalancedIndicator from '@/components/BalancedIndicator.vue'
import ReportActions from '@/components/ReportActions.vue'
import ReportAmountLine from '@/components/ReportAmountLine.vue'
import ReportPrintHeader from '@/components/ReportPrintHeader.vue'
import ReportSectionTable from '@/components/ReportSectionTable.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchBalanceSheet } from '@/services/reportService.js'
import {
  TOTAL_LIABILITIES_AND_EQUITY_LABEL,
  buildBalanceSheetCsv,
  buildBalanceSheetParams,
  buildBalanceSheetPrintItems,
  buildBalanceSheetSections,
  buildBalanceSheetTotals,
  createBalanceSheetFilters,
} from '@/utils/balanceSheetDisplay.js'
import { buildCsvFileName, downloadCsvFile } from '@/utils/csvExport.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { findAsOfError } from '@/utils/reportDisplay.js'

const REPORT_TITLE = 'Balance sheet'
const REPORT_SLUG = 'balance-sheet'
const AS_OF_ID = 'balance-sheet-as-of'
const AS_OF_ERROR_ID = 'balance-sheet-as-of-error'
const EMPTY_TEXT = 'Pick a valid date to see the balance sheet.'
const LOADING_TEXT = 'Loading…'
const LOAD_FAILED_MESSAGE = 'Could not load the balance sheet.'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const filters = ref(createBalanceSheetFilters(toIsoDate(new Date())))
const balanceSheet = ref(null)
const isLoading = ref(false)
let balanceSheetRequestId = 0

const toast = useToast()

const asOfError = computed(() => findAsOfError(filters.value.asOf))
const balanceSheetSections = computed(() => buildBalanceSheetSections(balanceSheet.value))
const balanceSheetTotals = computed(() => buildBalanceSheetTotals(balanceSheet.value))
const printItems = computed(() => buildBalanceSheetPrintItems(filters.value))
const isActionsDisabled = computed(() => isLoading.value || balanceSheet.value === null)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadBalanceSheet() {
  const balanceSheetParams = buildBalanceSheetParams(filters.value)
  const requestId = ++balanceSheetRequestId
  if (!balanceSheetParams) {
    balanceSheet.value = null
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const balanceSheetResponse = await fetchBalanceSheet(balanceSheetParams)
    if (requestId !== balanceSheetRequestId) return
    balanceSheet.value = balanceSheetResponse?.balance_sheet ?? null
  } catch (error) {
    if (requestId !== balanceSheetRequestId) return
    balanceSheet.value = null
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === balanceSheetRequestId) isLoading.value = false
  }
}

function changeAsOf(nextDate) {
  filters.value = { ...filters.value, asOf: nextDate }
  loadBalanceSheet()
}

function printReport() {
  window.print()
}

function downloadReportCsv() {
  downloadCsvFile(buildCsvFileName(REPORT_SLUG, filters.value.asOf), buildBalanceSheetCsv(balanceSheet.value))
}

onMounted(loadBalanceSheet)
</script>

<template>
  <section class="print-page-statement rounded-lg border border-line bg-surface print:border-0">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 print:hidden">
      <h2 class="text-sm font-bold text-ink">{{ REPORT_TITLE }}</h2>
      <ReportActions :is-disabled="isActionsDisabled" @print="printReport" @download-csv="downloadReportCsv" />
    </div>
    <div class="border-b border-line px-4 py-3 print:hidden">
      <div class="sm:w-40">
        <label :for="AS_OF_ID" :class="LABEL_CLASS">As of</label>
        <input
          :id="AS_OF_ID"
          type="date"
          :value="filters.asOf"
          :class="INPUT_CLASS"
          :aria-invalid="asOfError !== ''"
          :aria-describedby="asOfError !== '' ? AS_OF_ERROR_ID : undefined"
          @input="changeAsOf($event.target.value)"
        />
      </div>
      <p v-if="asOfError" :id="AS_OF_ERROR_ID" role="alert" class="mt-2 text-xs text-red-700">{{ asOfError }}</p>
    </div>
    <ReportPrintHeader :title="REPORT_TITLE" :items="printItems" />

    <p v-if="isLoading && !balanceSheet" class="px-4 py-8 text-center text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
    <p v-else-if="!balanceSheet" class="px-4 py-8 text-center text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>

    <template v-if="balanceSheet">
      <div v-for="sheetSection in balanceSheetSections" :key="sheetSection.key" class="border-t border-line pt-3">
        <h3 class="px-4 text-base font-bold text-ink">{{ sheetSection.title }}</h3>
        <ReportSectionTable
          v-for="sheetGroup in sheetSection.groups"
          :key="sheetGroup.key"
          :title="sheetGroup.title"
          :rows="sheetGroup.rows"
          :subtotal-label="sheetGroup.subtotalLabel"
          :subtotal-text="sheetGroup.subtotalText"
        />
        <ReportAmountLine
          v-for="extraLine in sheetSection.extraLines"
          :key="extraLine.key"
          :label="extraLine.label"
          :text="extraLine.text"
          :is-negative="extraLine.isNegative"
        />
        <ReportAmountLine :label="sheetSection.totalLabel" :text="sheetSection.totalText" is-emphasized />
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line">
        <ReportAmountLine
          :label="TOTAL_LIABILITIES_AND_EQUITY_LABEL"
          :text="balanceSheetTotals.liabilitiesAndEquityText"
          class="flex-1 font-bold"
        />
        <div class="px-4 py-2">
          <BalancedIndicator :is-balanced="balanceSheetTotals.isBalanced" />
        </div>
      </div>
    </template>
  </section>
</template>
