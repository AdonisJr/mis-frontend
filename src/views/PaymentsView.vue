<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import PaymentFilterBar from '@/components/PaymentFilterBar.vue'
import PaymentRowActions from '@/components/PaymentRowActions.vue'
import TablePagination from '@/components/TablePagination.vue'
import PaymentStudentSearchView from '@/views/PaymentStudentSearchView.vue'
import PaymentVoidModalView from '@/views/PaymentVoidModalView.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchPaymentRecorders, fetchPayments } from '@/services/paymentService.js'
import { PAYMENT_RECEIPT_ROUTE_NAME, STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import {
  PAYMENT_COLUMNS,
  formatPaymentReference,
  getMethodLabel,
  getPaymentStatusChip,
  isPaymentVoided,
} from '@/utils/paymentDisplay.js'
import {
  applyDateFromChange,
  applyDateToChange,
  applyMethodChange,
  applyRecorderChange,
  applyStatusChange,
  buildPaymentListParams,
  createPaymentFilters,
  findDateRangeError,
} from '@/utils/paymentSearch.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import {
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const PAYMENT_ROW_KEY = 'id'
const EMPTY_TEXT = 'No payments for these dates.'
const NO_MATCH_TEXT = 'No payments match the search or filters.'
const COLLECTION_TOTAL_LABEL = 'Collection total'
const COLLECTION_TOTAL_CAPTION = 'Non-voided payments for the filter.'
const SEARCH_DEBOUNCE_MS = 300
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

const LOAD_FAILED_MESSAGE = 'Could not load payments.'
const RECORDERS_FAILED_MESSAGE = 'Could not load the cashier list.'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const payments = ref([])
const pageMeta = ref(createEmptyPageMeta())
const collectionTotal = ref('0.00')
const filters = ref(createPaymentFilters(toIsoDate(new Date())))
const searchInput = ref('')
const isListLoading = ref(false)
const recorders = ref([])
const voidingPayment = ref(null)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const router = useRouter()

const dateRangeError = computed(() => findDateRangeError(filters.value))
const isVoidOpen = computed(() => voidingPayment.value !== null)
const emptyText = computed(() => {
  const { method, recordedBy, status, search } = filters.value
  return method !== '' || recordedBy !== '' || status !== '' || search !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadPayments() {
  const listParams = buildPaymentListParams(filters.value)
  // an invalid date range shows its inline error and keeps the old rows
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchPayments(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadPayments()
      return
    }
    payments.value = listResponse?.payments ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
    collectionTotal.value = listResponse?.collection_total ?? '0.00'
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

async function loadRecorders() {
  try {
    const recorderResponse = await fetchPaymentRecorders()
    recorders.value = recorderResponse?.recorders ?? []
  } catch (error) {
    toastRequestError(error, RECORDERS_FAILED_MESSAGE)
  }
}

function changeDateFrom(nextDate) {
  filters.value = applyDateFromChange(filters.value, nextDate)
  loadPayments()
}

function changeDateTo(nextDate) {
  filters.value = applyDateToChange(filters.value, nextDate)
  loadPayments()
}

function changeMethod(nextMethod) {
  filters.value = applyMethodChange(filters.value, nextMethod)
  loadPayments()
}

function changeRecorder(nextRecorderId) {
  filters.value = applyRecorderChange(filters.value, nextRecorderId)
  loadPayments()
}

function changeStatus(nextStatus) {
  filters.value = applyStatusChange(filters.value, nextStatus)
  loadPayments()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadPayments()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadPayments()
}

function openReceipt(paymentId) {
  router.push({ name: PAYMENT_RECEIPT_ROUTE_NAME, params: { paymentId } })
}

function openVoid(payment) {
  voidingPayment.value = payment
}

function closeVoid() {
  voidingPayment.value = null
}

function handleVoidChanged() {
  voidingPayment.value = null
  loadPayments()
}

onMounted(() => {
  loadPayments()
  loadRecorders()
})
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <div class="space-y-4">
    <PaymentStudentSearchView />

    <section class="rounded-lg border border-line bg-surface">
      <div class="border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">Payments</h2>
      </div>
      <PaymentFilterBar
        :date-from="filters.dateFrom"
        :date-to="filters.dateTo"
        :method="filters.method"
        :recorded-by="filters.recordedBy"
        :status="filters.status"
        :search="searchInput"
        :recorders="recorders"
        @update:date-from="changeDateFrom"
        @update:date-to="changeDateTo"
        @update:method="changeMethod"
        @update:recorded-by="changeRecorder"
        @update:status="changeStatus"
        @update:search="updateSearchInput"
      />
      <p v-if="dateRangeError" role="alert" class="border-b border-line px-4 py-2 text-xs text-red-700">
        {{ dateRangeError }}
      </p>
      <div class="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{{ COLLECTION_TOTAL_LABEL }}</p>
          <p class="text-xs text-ink-muted">{{ COLLECTION_TOTAL_CAPTION }}</p>
        </div>
        <p class="text-lg font-bold tabular-nums text-ink">{{ formatPeso(collectionTotal) }}</p>
      </div>
      <DataTable
        :columns="PAYMENT_COLUMNS"
        :rows="payments"
        :row-key="PAYMENT_ROW_KEY"
        :empty-text="emptyText"
        :is-loading="isListLoading"
      >
        <template #cell-ar_number="{ row }">
          <span class="font-mono text-xs tabular-nums">{{ row.ar_number }}</span>
        </template>
        <template #cell-payment_date="{ row }">
          <span class="tabular-nums">{{ formatDisplayDate(row.payment_date) }}</span>
        </template>
        <template #cell-student="{ row }">
          <RouterLink
            :to="{ name: STUDENT_LEDGER_ROUTE_NAME, params: { schoolYearId: row.school_year_id, studentId: row.student.id } }"
            class="block rounded-md focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
          >
            <span class="block max-w-60 truncate font-semibold text-accent hover:underline">
              {{ formatEnrollmentStudentName(row.student) }}
            </span>
            <span class="block font-mono text-xs tabular-nums text-ink-muted">{{ row.student?.lrn }}</span>
          </RouterLink>
        </template>
        <template #cell-amount="{ row }">
          <span class="block text-right tabular-nums" :class="isPaymentVoided(row) ? 'text-ink-muted line-through' : ''">
            {{ formatPeso(row.amount) }}
          </span>
        </template>
        <template #cell-method="{ row }">{{ getMethodLabel(row.method) }}</template>
        <template #cell-reference_no="{ row }">{{ formatPaymentReference(row.reference_no) }}</template>
        <template #cell-recorded_by="{ row }">{{ row.recorded_by?.name ?? NO_VALUE_LABEL }}</template>
        <template #cell-status="{ row }">
          <span :class="[CHIP_CLASS, getPaymentStatusChip(row).colorClass]">{{ getPaymentStatusChip(row).label }}</span>
        </template>
        <template #actions="{ row }">
          <PaymentRowActions :payment="row" @receipt="openReceipt(row.id)" @void="openVoid(row)" />
        </template>
      </DataTable>
      <TablePagination
        v-if="pageMeta.total > 0"
        :current-page="pageMeta.current_page"
        :last-page="pageMeta.last_page"
        :per-page="pageMeta.per_page"
        :total="pageMeta.total"
        :is-disabled="isListLoading"
        @change-page="changePage"
      />
    </section>

    <PaymentVoidModalView :is-open="isVoidOpen" :payment="voidingPayment" @close="closeVoid" @changed="handleVoidChanged" />
  </div>
</template>
