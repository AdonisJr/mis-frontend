<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { BookOpenText, FilePen } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import PaymentHoldFilterBar from '@/components/PaymentHoldFilterBar.vue'
import PromissoryNoteStatusBadge from '@/components/PromissoryNoteStatusBadge.vue'
import TablePagination from '@/components/TablePagination.vue'
import PromissoryNoteGrantModalView from '@/views/PromissoryNoteGrantModalView.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchPaymentHolds } from '@/services/paymentHoldService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { PAYMENT_RECORDER_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { formatPeso, toCents } from '@/utils/moneyDisplay.js'
import { HOLD_COLUMNS, NOTE_STATUS_ACTIVE } from '@/utils/paymentHoldDisplay.js'
import {
  applyHoldSchoolYearChange,
  applyHoldStatusChange,
  buildHoldListParams,
  createHoldFilters,
} from '@/utils/paymentHoldSearch.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import {
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const HOLD_ROW_KEY = 'key'
const EMPTY_TEXT = 'No students are on hold or have promissory notes.'
const NO_MATCH_TEXT = 'No rows match the search or filters.'
const SEARCH_DEBOUNCE_MS = 300

const LOAD_FAILED_MESSAGE = 'Could not load payment holds.'
const SCHOOL_YEARS_FAILED_MESSAGE = 'Could not load the school years.'

const SECONDARY_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const holds = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createHoldFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const schoolYears = ref([])
const grantingRow = ref(null)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const authStore = useAuthStore()

const canGrant = computed(() => authStore.hasAnyRole(PAYMENT_RECORDER_ROLES))
const isGrantOpen = computed(() => grantingRow.value !== null)
const grantYears = computed(() => {
  if (grantingRow.value === null) return []
  return [{ school_year: grantingRow.value.school_year, balance: grantingRow.value.balance }]
})
const emptyText = computed(() => {
  const { noteStatus, schoolYearId, search } = filters.value
  return noteStatus !== '' || schoolYearId !== '' || search !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})
const holdRows = computed(() =>
  holds.value.map((holdRow) => ({ ...holdRow, key: `${holdRow.student?.id}-${holdRow.school_year?.id}` })),
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadHolds() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchPaymentHolds(buildHoldListParams(filters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadHolds()
      return
    }
    holds.value = listResponse?.payment_holds ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

async function loadSchoolYears() {
  try {
    const schoolYearResponse = await fetchSchoolYears()
    schoolYears.value = schoolYearResponse?.school_years ?? []
  } catch (error) {
    toastRequestError(error, SCHOOL_YEARS_FAILED_MESSAGE)
  }
}

function changeNoteStatus(nextStatus) {
  filters.value = applyHoldStatusChange(filters.value, nextStatus)
  loadHolds()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyHoldSchoolYearChange(filters.value, nextSchoolYearId)
  loadHolds()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadHolds()
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
  loadHolds()
}

function isGrantable(holdRow) {
  return canGrant.value && toCents(holdRow.balance) > 0 && holdRow.note_status !== NOTE_STATUS_ACTIVE
}

function openGrant(holdRow) {
  grantingRow.value = holdRow
}

function closeGrant() {
  grantingRow.value = null
}

function handleGranted() {
  grantingRow.value = null
  loadHolds()
}

onMounted(() => {
  loadHolds()
  loadSchoolYears()
})
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-line bg-surface">
      <div class="border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">Payment holds</h2>
      </div>
      <PaymentHoldFilterBar
        :note-status="filters.noteStatus"
        :school-year-id="filters.schoolYearId"
        :search="searchInput"
        :school-years="schoolYears"
        @update:note-status="changeNoteStatus"
        @update:school-year-id="changeSchoolYear"
        @update:search="updateSearchInput"
      />
      <DataTable
        :columns="HOLD_COLUMNS"
        :rows="holdRows"
        :row-key="HOLD_ROW_KEY"
        :empty-text="emptyText"
        :is-loading="isListLoading"
      >
        <template #cell-student="{ row }">
          <RouterLink
            :to="{ name: STUDENT_LEDGER_ROUTE_NAME, params: { schoolYearId: row.school_year.id, studentId: row.student.id } }"
            class="block rounded-md focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
          >
            <span class="block max-w-60 truncate font-bold text-accent hover:underline">
              {{ formatEnrollmentStudentName(row.student) }}
            </span>
          </RouterLink>
        </template>
        <template #cell-lrn="{ row }">
          <span class="font-mono text-xs tabular-nums">{{ row.student?.lrn ?? NO_VALUE_LABEL }}</span>
        </template>
        <template #cell-school_year="{ row }">{{ row.school_year?.name ?? NO_VALUE_LABEL }}</template>
        <template #cell-balance="{ row }">
          <span class="block text-right tabular-nums">{{ formatPeso(row.balance) }}</span>
        </template>
        <template #cell-note_status="{ row }">
          <PromissoryNoteStatusBadge :status="row.note_status" />
        </template>
        <template #cell-promise_date="{ row }">
          <span class="tabular-nums">{{ row.note ? formatDisplayDate(row.note.promise_date) : NO_VALUE_LABEL }}</span>
        </template>
        <template #cell-promised_amount="{ row }">
          <span class="tabular-nums">{{ row.note ? formatPeso(row.note.promised_amount) : NO_VALUE_LABEL }}</span>
        </template>
        <template #cell-granted_by="{ row }">{{ row.note?.granted_by?.name ?? NO_VALUE_LABEL }}</template>
        <template #actions="{ row }">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <RouterLink
              :to="{ name: STUDENT_LEDGER_ROUTE_NAME, params: { schoolYearId: row.school_year.id, studentId: row.student.id } }"
              :class="SECONDARY_LINK_CLASS"
              aria-label="Open ledger"
            >
              <BookOpenText :size="16" aria-hidden="true" />
              <span class="hidden sm:inline">Ledger</span>
            </RouterLink>
            <button v-if="isGrantable(row)" type="button" :class="SECONDARY_LINK_CLASS" @click="openGrant(row)">
              <FilePen :size="16" aria-hidden="true" />
              Grant
            </button>
          </div>
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

    <PromissoryNoteGrantModalView
      :is-open="isGrantOpen"
      :student-id="grantingRow?.student?.id ?? 0"
      :balance-years="grantYears"
      :school-year-id="String(grantingRow?.school_year?.id ?? '')"
      @close="closeGrant"
      @granted="handleGranted"
    />
  </div>
</template>
