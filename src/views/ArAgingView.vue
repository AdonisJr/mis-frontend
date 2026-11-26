<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import ArAgingFilterBar from '@/components/ArAgingFilterBar.vue'
import ArAgingTieOutPanel from '@/components/ArAgingTieOutPanel.vue'
import DataTable from '@/components/DataTable.vue'
import ReportActions from '@/components/ReportActions.vue'
import ReportPrintHeader from '@/components/ReportPrintHeader.vue'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchArAging } from '@/services/reportService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import {
  AGING_BUCKET_KEYS,
  AR_AGING_COLUMNS,
  buildArAgingCsv,
  buildArAgingFooter,
  buildArAgingParams,
  buildArAgingRows,
  buildStudentLedgerLink,
  buildTieOutPanel,
  createArAgingFilters,
} from '@/utils/arAgingDisplay.js'
import { buildCsvFileName, downloadCsvFile } from '@/utils/csvExport.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { listBillableGradeLevels } from '@/utils/feeScheduleForm.js'
import { buildPrintItem, findAsOfError, findOptionLabel } from '@/utils/reportDisplay.js'
import { normalizeSearchText } from '@/utils/studentSearch.js'

const REPORT_TITLE = 'AR aging'
const REPORT_SLUG = 'ar-aging'
const ROW_KEY = 'key'
const EMPTY_TEXT = 'No outstanding balances on this date.'
const SEARCH_DEBOUNCE_MS = 300
const LOAD_FAILED_MESSAGE = 'Could not load the AR aging report.'
const OPTIONS_FAILED_MESSAGE = 'Could not load the filter options.'
const TOTAL_KEY = 'total'
const FOOTER_KEYS = [...AGING_BUCKET_KEYS, TOTAL_KEY]
const FOOTER_COLUMNS = AR_AGING_COLUMNS.filter((column) => FOOTER_KEYS.includes(column.key))
const AMOUNT_CELL_CLASS = 'block text-right tabular-nums'

const filters = ref(createArAgingFilters(toIsoDate(new Date())))
const arAging = ref(null)
const schoolYears = ref([])
const gradeLevels = ref([])
const isLoading = ref(false)
let arAgingRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const asOfError = computed(() => findAsOfError(filters.value.asOf))
const billableGradeLevels = computed(() => listBillableGradeLevels(gradeLevels.value))
const arAgingRows = computed(() => buildArAgingRows(arAging.value))
const arAgingFooter = computed(() => buildArAgingFooter(arAging.value))
const tieOutPanel = computed(() => buildTieOutPanel(arAging.value?.tie_out))
const isActionsDisabled = computed(() => isLoading.value || arAging.value === null)
const printItems = computed(() => [
  buildPrintItem('As of', formatDisplayDate(filters.value.asOf)),
  buildPrintItem('School year', findOptionLabel(schoolYears.value, filters.value.schoolYearId)),
  buildPrintItem('Grade level', findOptionLabel(gradeLevels.value, filters.value.gradeLevelId)),
  buildPrintItem('Search', normalizeSearchText(filters.value.search)),
])

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadArAging() {
  const arAgingParams = buildArAgingParams(filters.value)
  const requestId = ++arAgingRequestId
  if (!arAgingParams) {
    arAging.value = null
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const arAgingResponse = await fetchArAging(arAgingParams)
    if (requestId !== arAgingRequestId) return
    arAging.value = arAgingResponse?.ar_aging ?? null
  } catch (error) {
    if (requestId !== arAgingRequestId) return
    arAging.value = null
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === arAgingRequestId) isLoading.value = false
  }
}

async function loadOptions() {
  try {
    const [schoolYearResponse, gradeLevelResponse] = await Promise.all([fetchSchoolYears(), fetchGradeLevels()])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    gradeLevels.value = gradeLevelResponse?.grade_levels ?? []
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  }
}

function changeFilter(filterKey, nextValue) {
  filters.value = { ...filters.value, [filterKey]: nextValue }
  loadArAging()
}

function changeSearch(nextSearch) {
  filters.value = { ...filters.value, search: nextSearch }
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(loadArAging, SEARCH_DEBOUNCE_MS)
}

function printReport() {
  window.print()
}

function downloadReportCsv() {
  downloadCsvFile(buildCsvFileName(REPORT_SLUG, filters.value.asOf), buildArAgingCsv(arAging.value))
}

onMounted(() => {
  loadOptions()
  loadArAging()
})

onBeforeUnmount(() => clearTimeout(searchDebounceTimer))
</script>

<template>
  <section class="print-page-class-record rounded-lg border border-line bg-surface print:border-0">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 print:hidden">
      <h2 class="text-sm font-bold text-ink">{{ REPORT_TITLE }}</h2>
      <ReportActions :is-disabled="isActionsDisabled" @print="printReport" @download-csv="downloadReportCsv" />
    </div>
    <ArAgingFilterBar
      :as-of="filters.asOf"
      :school-year-id="filters.schoolYearId"
      :grade-level-id="filters.gradeLevelId"
      :search="filters.search"
      :school-years="schoolYears"
      :grade-levels="billableGradeLevels"
      :as-of-error="asOfError"
      @update:as-of="changeFilter('asOf', $event)"
      @update:school-year-id="changeFilter('schoolYearId', $event)"
      @update:grade-level-id="changeFilter('gradeLevelId', $event)"
      @update:search="changeSearch"
    />
    <ReportPrintHeader :title="REPORT_TITLE" :items="printItems" />

    <DataTable
      :columns="AR_AGING_COLUMNS"
      :rows="arAgingRows"
      :row-key="ROW_KEY"
      :empty-text="EMPTY_TEXT"
      :is-loading="isLoading"
    >
      <template #cell-student="{ row }">
        <RouterLink
          :to="buildStudentLedgerLink(row)"
          class="rounded-md font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
        >
          {{ row.student_name }}
        </RouterLink>
        <span v-if="row.lrn" class="block text-xs text-ink-muted">{{ row.lrn }}</span>
      </template>
      <template v-for="bucketKey in FOOTER_KEYS" :key="bucketKey" #[`cell-${bucketKey}`]="{ row }">
        <span :class="AMOUNT_CELL_CLASS">{{ row[bucketKey] }}</span>
      </template>
    </DataTable>

    <dl
      v-if="arAging"
      class="grid grid-cols-2 gap-3 border-t border-line px-4 py-3 text-sm tabular-nums sm:grid-cols-3 lg:grid-cols-6"
    >
      <div v-for="footerColumn in FOOTER_COLUMNS" :key="footerColumn.key">
        <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{{ footerColumn.label }}</dt>
        <dd class="font-bold text-ink">{{ arAgingFooter[footerColumn.key] }}</dd>
      </div>
    </dl>
    <ArAgingTieOutPanel v-if="tieOutPanel" :tie-out="tieOutPanel" />
  </section>
</template>
