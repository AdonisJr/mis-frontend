<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RefreshCw } from '@lucide/vue'
import { useToast } from 'vue-toastification'
import AttendanceSummaryChips from '@/components/AttendanceSummaryChips.vue'
import AttendanceTodayFilterBar from '@/components/AttendanceTodayFilterBar.vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import { fetchAttendanceToday } from '@/services/attendanceService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import {
  ATTENDANCE_TODAY_COLUMNS,
  buildAttendanceRows,
  buildAttendanceSummaryChips,
  formatAttendanceGradeSection,
  formatAttendanceTime,
  getManilaTodayIso,
  listAttendanceStatusChips,
} from '@/utils/attendanceDisplay.js'
import {
  applyAttendanceGradeLevelChange,
  applyAttendanceSectionChange,
  applyAttendanceStatusChange,
  applyTodayDateChange,
  buildAttendanceSectionOptions,
  buildTodayParams,
  createTodayFilters,
  findTodayDateError,
} from '@/utils/attendanceSearch.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'
import {
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const PAGE_TITLE = 'Today'
const ROW_KEY = 'key'
const EMPTY_TEXT = 'No enrolled students for this date.'
const NO_MATCH_TEXT = 'No students match the search or filters.'
const LOAD_FAILED_MESSAGE = "Could not load today's attendance."
const OPTIONS_FAILED_MESSAGE = 'Could not load the filter options.'
const REFRESH_LABEL = 'Refresh'
const AUTO_REFRESH_MS = 30000
const VISIBLE_STATE = 'visible'
const SEARCH_DEBOUNCE_MS = 300
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const todayIso = ref(getManilaTodayIso(new Date()))
const filters = ref(createTodayFilters(todayIso.value))
const attendanceRows = ref([])
const summaryChips = ref(buildAttendanceSummaryChips(null))
const pageMeta = ref(createEmptyPageMeta())
const searchInput = ref('')
const isListLoading = ref(false)
const gradeLevels = ref([])
const filterSections = ref([])
let listRequestId = 0
let sectionRequestId = 0
let searchDebounceTimer = null
let autoRefreshTimer = null

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const dateError = computed(() => findTodayDateError(filters.value.date, todayIso.value))
const sectionOptions = computed(() => buildAttendanceSectionOptions(filterSections.value, filters.value.gradeLevelId))
const emptyText = computed(() => {
  const { gradeLevelId, sectionId, status, search } = filters.value
  return gradeLevelId !== '' || sectionId !== '' || status !== '' || search !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadGradeLevels() {
  try {
    const gradeLevelResponse = await fetchGradeLevels()
    gradeLevels.value = gradeLevelResponse?.grade_levels ?? []
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  }
}

async function loadSectionOptions(schoolYearId) {
  const requestId = ++sectionRequestId
  if (toRecordId(schoolYearId) === null) {
    filterSections.value = []
    return
  }
  try {
    const sectionResponse = await fetchAllSections({ school_year_id: schoolYearId })
    if (requestId !== sectionRequestId) return
    filterSections.value = sectionResponse?.sections ?? []
  } catch (error) {
    if (requestId !== sectionRequestId) return
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  }
}

async function loadToday(isQuietRefresh) {
  const todayParams = buildTodayParams(filters.value, todayIso.value)
  // a bad date shows its inline error and keeps the old rows
  if (!todayParams) return
  const requestId = ++listRequestId
  if (!isQuietRefresh) isListLoading.value = true
  try {
    const todayResponse = await fetchAttendanceToday(todayParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(todayResponse?.meta)) {
      filters.value = applyPageChange(filters.value, todayResponse.meta.last_page)
      loadToday(isQuietRefresh)
      return
    }
    // Today rows carry no date, so the response date keys the rows with no scan
    attendanceRows.value = buildAttendanceRows(todayResponse?.attendances, todayResponse?.date ?? filters.value.date)
    summaryChips.value = buildAttendanceSummaryChips(todayResponse?.summary)
    pageMeta.value = todayResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    // a quiet tick keeps the rows and stays silent, so an outage does not toast every 30 s
    if (isQuietRefresh) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function refreshQuietly() {
  if (document.visibilityState !== VISIBLE_STATE || isListLoading.value) return
  // keeps `max` following Manila midnight; the chosen date is never moved
  todayIso.value = getManilaTodayIso(new Date())
  loadToday(true)
}

function refreshNow() {
  loadToday(false)
}

function changeDate(nextDate) {
  filters.value = applyTodayDateChange(filters.value, nextDate)
  loadToday(false)
}

function changeGradeLevel(nextId) {
  filters.value = applyAttendanceGradeLevelChange(filters.value, nextId)
  loadToday(false)
}

function changeSection(nextId) {
  filters.value = applyAttendanceSectionChange(filters.value, nextId)
  loadToday(false)
}

function changeStatus(nextStatus) {
  filters.value = applyAttendanceStatusChange(filters.value, nextStatus)
  loadToday(false)
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadToday(false)
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
  loadToday(false)
}

watch(() => schoolYearStore.activeSchoolYear?.id, loadSectionOptions, { immediate: true })

onMounted(() => {
  loadGradeLevels()
  loadToday(false)
  autoRefreshTimer = setInterval(refreshQuietly, AUTO_REFRESH_MS)
})
onBeforeUnmount(() => {
  clearInterval(autoRefreshTimer)
  cancelPendingSearch()
})
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-line bg-surface">
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">{{ PAGE_TITLE }}</h2>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isListLoading" @click="refreshNow">
          <RefreshCw :size="16" aria-hidden="true" />
          {{ REFRESH_LABEL }}
        </button>
      </div>
      <AttendanceTodayFilterBar
        :date="filters.date"
        :max-date="todayIso"
        :grade-level-id="filters.gradeLevelId"
        :section-id="filters.sectionId"
        :status="filters.status"
        :search="searchInput"
        :grade-levels="gradeLevels"
        :section-options="sectionOptions"
        @update:date="changeDate"
        @update:grade-level-id="changeGradeLevel"
        @update:section-id="changeSection"
        @update:status="changeStatus"
        @update:search="updateSearchInput"
      />
      <p v-if="dateError" role="alert" class="border-b border-line px-4 py-2 text-xs text-red-700">{{ dateError }}</p>
      <AttendanceSummaryChips :chips="summaryChips" :is-loading="isListLoading" />
      <DataTable
        :columns="ATTENDANCE_TODAY_COLUMNS"
        :rows="attendanceRows"
        :row-key="ROW_KEY"
        :empty-text="emptyText"
        :is-loading="isListLoading"
      >
        <template #cell-lrn="{ row }">
          <span class="font-mono text-xs tabular-nums">{{ row.student?.lrn }}</span>
        </template>
        <template #cell-student="{ row }">
          <span class="block max-w-60 truncate font-semibold">{{ formatEnrollmentStudentName(row.student) }}</span>
        </template>
        <template #cell-grade_section="{ row }">{{ formatAttendanceGradeSection(row) }}</template>
        <template #cell-time_in="{ row }">
          <span class="tabular-nums">{{ formatAttendanceTime(row.time_in) }}</span>
        </template>
        <template #cell-time_out="{ row }">
          <span class="tabular-nums">{{ formatAttendanceTime(row.time_out) }}</span>
        </template>
        <template #cell-status="{ row }">
          <span class="flex flex-wrap gap-1">
            <span
              v-for="statusChip in listAttendanceStatusChips(row)"
              :key="statusChip.label"
              :class="[CHIP_CLASS, statusChip.colorClass]"
            >
              {{ statusChip.label }}
            </span>
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
