<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Plus } from '@lucide/vue'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/DataTable.vue'
import JournalEntryFilterBar from '@/components/JournalEntryFilterBar.vue'
import TablePagination from '@/components/TablePagination.vue'
import { JOURNAL_ENTRY_CREATE_ROUTE_NAME, JOURNAL_ENTRY_DETAIL_ROUTE_NAME } from '@/routeNames.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllAccounts } from '@/services/accountService.js'
import { fetchJournalEntries } from '@/services/journalEntryService.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import {
  JOURNAL_ENTRY_COLUMNS,
  formatJournalNumber,
  getJournalStatusChip,
  listAccountOptions,
} from '@/utils/journalEntryDisplay.js'
import {
  applyJournalAccountChange,
  applyJournalDateFromChange,
  applyJournalDateToChange,
  applyJournalStatusChange,
  buildJournalEntryListParams,
  createJournalEntryFilters,
  findJournalDateRangeError,
} from '@/utils/journalEntrySearch.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import {
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const ENTRY_ROW_KEY = 'id'
const EMPTY_TEXT = 'No journal entries yet.'
const NO_MATCH_TEXT = 'No journal entries match the search or filters.'
const SEARCH_DEBOUNCE_MS = 300
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const PRIMARY_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const LOAD_FAILED_MESSAGE = 'Could not load journal entries.'
const ACCOUNTS_FAILED_MESSAGE = 'Could not load accounts.'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const journalEntries = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createJournalEntryFilters())
const searchInput = ref('')
const accountOptions = ref([])
const isListLoading = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const dateRangeError = computed(() => findJournalDateRangeError(filters.value))
const emptyText = computed(() => {
  const { status, dateFrom, dateTo, accountId, search } = filters.value
  const isFiltered = [status, dateFrom, dateTo, accountId, search].some((filterValue) => filterValue !== '')
  return isFiltered ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadJournalEntries() {
  const listParams = buildJournalEntryListParams(filters.value)
  // an invalid date range shows its inline error and keeps the old rows
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchJournalEntries(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadJournalEntries()
      return
    }
    journalEntries.value = listResponse?.journal_entries ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
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

function changeStatus(nextStatus) {
  filters.value = applyJournalStatusChange(filters.value, nextStatus)
  loadJournalEntries()
}

function changeDateFrom(nextDate) {
  filters.value = applyJournalDateFromChange(filters.value, nextDate)
  loadJournalEntries()
}

function changeDateTo(nextDate) {
  filters.value = applyJournalDateToChange(filters.value, nextDate)
  loadJournalEntries()
}

function changeAccount(nextAccountId) {
  filters.value = applyJournalAccountChange(filters.value, nextAccountId)
  loadJournalEntries()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadJournalEntries()
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
  loadJournalEntries()
}

onMounted(() => {
  loadJournalEntries()
  loadAccountOptions()
})
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-line bg-surface">
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">Journal entries</h2>
        <RouterLink :to="{ name: JOURNAL_ENTRY_CREATE_ROUTE_NAME }" :class="PRIMARY_LINK_CLASS">
          <Plus :size="16" aria-hidden="true" />
          New entry
        </RouterLink>
      </div>
      <JournalEntryFilterBar
        :status="filters.status"
        :date-from="filters.dateFrom"
        :date-to="filters.dateTo"
        :account-id="filters.accountId"
        :search="searchInput"
        :account-options="accountOptions"
        :date-range-error="dateRangeError"
        @update:status="changeStatus"
        @update:date-from="changeDateFrom"
        @update:date-to="changeDateTo"
        @update:account-id="changeAccount"
        @update:search="updateSearchInput"
      />
      <DataTable
        :columns="JOURNAL_ENTRY_COLUMNS"
        :rows="journalEntries"
        :row-key="ENTRY_ROW_KEY"
        :empty-text="emptyText"
        :is-loading="isListLoading"
      >
        <template #cell-number="{ row }">
          <RouterLink
            :to="{ name: JOURNAL_ENTRY_DETAIL_ROUTE_NAME, params: { entryId: row.id } }"
            class="rounded-md font-mono text-xs font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
          >
            {{ formatJournalNumber(row) }}
          </RouterLink>
        </template>
        <template #cell-entry_date="{ row }">
          <span class="tabular-nums">{{ formatDisplayDate(row.entry_date) }}</span>
        </template>
        <template #cell-description="{ row }">
          <span class="block max-w-80 truncate">{{ row.description }}</span>
        </template>
        <template #cell-reference="{ row }">{{ row.reference ?? NO_VALUE_LABEL }}</template>
        <template #cell-debit_total="{ row }">
          <span class="block text-right tabular-nums">{{ formatPeso(row.debit_total) }}</span>
        </template>
        <template #cell-display_status="{ row }">
          <span v-if="getJournalStatusChip(row.display_status)" :class="[CHIP_CLASS, getJournalStatusChip(row.display_status).colorClass]">
            {{ getJournalStatusChip(row.display_status).label }}
          </span>
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
  </div>
</template>
