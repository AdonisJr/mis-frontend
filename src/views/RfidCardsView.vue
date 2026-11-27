<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { IdCard, Unlink } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import StudentRfidModalView from '@/views/StudentRfidModalView.vue'
import { fetchStudents } from '@/services/studentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  buildStudentListParams,
  createStudentFilters,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import {
  CARD_FILTER_ALL,
  CARD_FILTER_OPTIONS,
  RFID_ACTION_SCAN,
  RFID_ACTION_UNASSIGN,
  buildCardFilterParams,
  formatCardUid,
} from '@/utils/rfidDisplay.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const RFID_COLUMNS = [
  { key: 'name', label: 'Student' },
  { key: 'lrn', label: 'LRN' },
  { key: 'rfid', label: 'Card UID' },
]
const ROW_KEY = 'id'
const EMPTY_TEXT = 'No students yet.'
const NO_MATCH_TEXT = 'No students match the search or card filter.'
const LOAD_FAILED_MESSAGE = 'Could not load students.'
const SEARCH_DEBOUNCE_MS = 300
const SEARCH_INPUT_ID = 'rfid-search'
const CARD_FILTER_ID = 'rfid-card-filter'
const SEARCH_LABEL = 'Search'
const CARD_FILTER_LABEL = 'Card'
const SEARCH_PLACEHOLDER = 'LRN or name'
const NO_CARD_CHIP_CLASS = 'rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700'

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const students = ref([])
const pageMeta = ref(createEmptyPageMeta())
const listFilters = ref({ ...createStudentFilters(), cardFilter: CARD_FILTER_ALL })
const searchInput = ref('')
const isListLoading = ref(false)
const rfidStudent = ref(null)
const rfidStartAction = ref(RFID_ACTION_SCAN)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const emptyText = computed(() => {
  const hasActiveFilter = listFilters.value.search !== '' || listFilters.value.cardFilter !== CARD_FILTER_ALL
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function buildListParams() {
  return { ...buildStudentListParams(listFilters.value), ...buildCardFilterParams(listFilters.value.cardFilter) }
}

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadStudents() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchStudents(buildListParams())
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      listFilters.value = applyPageChange(listFilters.value, listResponse.meta.last_page)
      loadStudents()
      return
    }
    students.value = listResponse?.students ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === listFilters.value.search) return
  listFilters.value = applySearchChange(listFilters.value, searchInput.value)
  loadStudents()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeCardFilter(nextCardFilter) {
  listFilters.value = { ...listFilters.value, cardFilter: nextCardFilter, page: FIRST_PAGE }
  loadStudents()
}

function changePage(nextPage) {
  listFilters.value = applyPageChange(listFilters.value, nextPage)
  loadStudents()
}

async function openRfidModal(row, startAction) {
  // reset first so reopening the same row re-fires the modal watcher
  rfidStudent.value = null
  rfidStartAction.value = startAction
  await nextTick()
  rfidStudent.value = row
}

function openAssign(row) {
  return openRfidModal(row, RFID_ACTION_SCAN)
}

function openUnassign(row) {
  return openRfidModal(row, RFID_ACTION_UNASSIGN)
}

onMounted(loadStudents)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">RFID cards</h2>
    </div>
    <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-end">
      <div class="sm:flex-1">
        <label :for="SEARCH_INPUT_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SEARCH_LABEL }}</label>
        <input
          :id="SEARCH_INPUT_ID"
          type="search"
          :value="searchInput"
          :placeholder="SEARCH_PLACEHOLDER"
          :maxlength="TEXT_MAX_LENGTH"
          :class="INPUT_CLASS"
          @input="updateSearchInput($event.target.value)"
        />
      </div>
      <div class="sm:w-56">
        <label :for="CARD_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ CARD_FILTER_LABEL }}</label>
        <select
          :id="CARD_FILTER_ID"
          :value="listFilters.cardFilter"
          :class="INPUT_CLASS"
          @change="changeCardFilter($event.target.value)"
        >
          <option v-for="cardOption in CARD_FILTER_OPTIONS" :key="cardOption.value" :value="cardOption.value">
            {{ cardOption.label }}
          </option>
        </select>
      </div>
    </div>
    <DataTable
      :columns="RFID_COLUMNS"
      :rows="students"
      :row-key="ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-name="{ row }">
        <span class="block max-w-64 truncate font-semibold" :title="formatEnrollmentStudentName(row)">
          {{ formatEnrollmentStudentName(row) }}
        </span>
      </template>
      <template #cell-lrn="{ value }">
        <span class="whitespace-nowrap font-mono text-xs tabular-nums">{{ value }}</span>
      </template>
      <template #cell-rfid="{ value }">
        <span v-if="value" class="font-mono text-xs">{{ value }}</span>
        <span v-else :class="NO_CARD_CHIP_CLASS">{{ formatCardUid(value) }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-ink"
            :aria-label="`Assign RFID card to ${formatEnrollmentStudentName(row)}`"
            @click="openAssign(row)"
          >
            <IdCard :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Assign</span>
          </button>
          <button
            v-if="row.rfid"
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-red-700"
            :aria-label="`Remove RFID card from ${formatEnrollmentStudentName(row)}`"
            @click="openUnassign(row)"
          >
            <Unlink :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Unassign</span>
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

  <StudentRfidModalView
    :student="rfidStudent"
    :start-action="rfidStartAction"
    @close="rfidStudent = null"
    @changed="loadStudents"
  />
</template>
