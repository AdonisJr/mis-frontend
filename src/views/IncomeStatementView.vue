<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import ReportActions from '@/components/ReportActions.vue'
import ReportAmountLine from '@/components/ReportAmountLine.vue'
import ReportPrintHeader from '@/components/ReportPrintHeader.vue'
import ReportSectionTable from '@/components/ReportSectionTable.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchIncomeStatement } from '@/services/reportService.js'
import { buildCsvFileName, downloadCsvFile } from '@/utils/csvExport.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import {
  buildIncomeStatementBlocks,
  buildIncomeStatementCsv,
  buildIncomeStatementParams,
  buildIncomeStatementPrintItems,
  buildNetIncomeLine,
} from '@/utils/incomeStatementDisplay.js'
import { createReportRange, findReportRangeError } from '@/utils/reportDisplay.js'

const REPORT_TITLE = 'Income statement'
const REPORT_SLUG = 'income-statement'
const FROM_ID = 'income-from'
const TO_ID = 'income-to'
const RANGE_ERROR_ID = 'income-range-error'
const EMPTY_TEXT = 'Pick a valid period to see the income statement.'
const LOADING_TEXT = 'Loading…'
const LOAD_FAILED_MESSAGE = 'Could not load the income statement.'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const reportRange = ref(createReportRange(toIsoDate(new Date())))
const incomeStatement = ref(null)
const isLoading = ref(false)
let incomeStatementRequestId = 0

const toast = useToast()

const rangeError = computed(() => findReportRangeError(reportRange.value))
const incomeBlocks = computed(() => buildIncomeStatementBlocks(incomeStatement.value))
const netIncomeLine = computed(() => buildNetIncomeLine(incomeStatement.value?.net_income))
const printItems = computed(() => buildIncomeStatementPrintItems(reportRange.value))
const isActionsDisabled = computed(() => isLoading.value || incomeStatement.value === null)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadIncomeStatement() {
  const incomeStatementParams = buildIncomeStatementParams(reportRange.value)
  const requestId = ++incomeStatementRequestId
  if (!incomeStatementParams) {
    incomeStatement.value = null
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const incomeStatementResponse = await fetchIncomeStatement(incomeStatementParams)
    if (requestId !== incomeStatementRequestId) return
    incomeStatement.value = incomeStatementResponse?.income_statement ?? null
  } catch (error) {
    if (requestId !== incomeStatementRequestId) return
    incomeStatement.value = null
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === incomeStatementRequestId) isLoading.value = false
  }
}

function changeRange(rangeKey, nextDate) {
  reportRange.value = { ...reportRange.value, [rangeKey]: nextDate }
  loadIncomeStatement()
}

function printReport() {
  window.print()
}

function downloadReportCsv() {
  const dateLabel = `${reportRange.value.from}-to-${reportRange.value.to}`
  downloadCsvFile(buildCsvFileName(REPORT_SLUG, dateLabel), buildIncomeStatementCsv(incomeStatement.value))
}

onMounted(loadIncomeStatement)
</script>

<template>
  <section class="print-page-statement rounded-lg border border-line bg-surface print:border-0">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 print:hidden">
      <h2 class="text-sm font-bold text-ink">{{ REPORT_TITLE }}</h2>
      <ReportActions :is-disabled="isActionsDisabled" @print="printReport" @download-csv="downloadReportCsv" />
    </div>
    <div class="border-b border-line px-4 py-3 print:hidden">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="sm:w-40">
          <label :for="FROM_ID" :class="LABEL_CLASS">From</label>
          <input
            :id="FROM_ID"
            type="date"
            :value="reportRange.from"
            :class="INPUT_CLASS"
            :aria-invalid="rangeError !== ''"
            :aria-describedby="rangeError !== '' ? RANGE_ERROR_ID : undefined"
            @input="changeRange('from', $event.target.value)"
          />
        </div>
        <div class="sm:w-40">
          <label :for="TO_ID" :class="LABEL_CLASS">To</label>
          <input
            :id="TO_ID"
            type="date"
            :value="reportRange.to"
            :class="INPUT_CLASS"
            :aria-invalid="rangeError !== ''"
            :aria-describedby="rangeError !== '' ? RANGE_ERROR_ID : undefined"
            @input="changeRange('to', $event.target.value)"
          />
        </div>
      </div>
      <p v-if="rangeError" :id="RANGE_ERROR_ID" role="alert" class="mt-2 text-xs text-red-700">{{ rangeError }}</p>
    </div>
    <ReportPrintHeader :title="REPORT_TITLE" :items="printItems" />

    <p v-if="isLoading && !incomeStatement" class="px-4 py-8 text-center text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
    <p v-else-if="!incomeStatement" class="px-4 py-8 text-center text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>

    <template v-if="incomeStatement">
      <template v-for="incomeBlock in incomeBlocks" :key="incomeBlock.key">
        <ReportSectionTable
          v-if="incomeBlock.kind === 'section'"
          :title="incomeBlock.title"
          :rows="incomeBlock.rows"
          :subtotal-label="incomeBlock.subtotalLabel"
          :subtotal-text="incomeBlock.subtotalText"
        />
        <ReportAmountLine v-else :label="incomeBlock.label" :text="incomeBlock.text" is-emphasized />
      </template>
      <ReportAmountLine
        :label="netIncomeLine.label"
        :text="netIncomeLine.text"
        :is-negative="netIncomeLine.isNegative"
        is-emphasized
      />
    </template>
  </section>
</template>
