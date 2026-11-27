<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Download } from '@lucide/vue'
import { useToast } from 'vue-toastification'
import AttendanceRecordFilterBar from '@/components/AttendanceRecordFilterBar.vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import { fetchAllAttendanceRecords, fetchAttendanceRecords } from '@/services/attendanceService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import {
  ATTENDANCE_RECORD_COLUMNS,
  buildAttendanceCsv,
  buildAttendanceRows,
  formatAttendanceGradeSection,
  formatAttendanceTime,
  getManilaTodayIso,
  listAttendanceStatusChips,
} from '@/utils/attendanceDisplay.js'
import {
  applyAttendanceGradeLevelChange,
  applyAttendanceSectionChange,
  applyAttendanceStatusChange,
  applyRecordDateFromChange,
  applyRecordDateToChange,
  applyRecordStudentChange,
  buildAttendanceSectionOptions,
  buildRecordParams,
  clearRecordStudent,
  createRecordFilters,
  findRecordRangeError,
} from '@/utils/attendanceSearch.js'
import { buildCsvFileName, downloadCsvFile } from '@/utils/csvExport.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'
import {
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const PAGE_TITLE = 'Records'
const ROW_KEY = 'key'
const CSV_SLUG = 'attendance'
const EMPTY_TEXT = 'No attendance for these dates.'
const NO_MATCH_TEXT = 'No attendance matches the search or filters.'
const LOAD_FAILED_MESSAGE = 'Could not load attendance records.'
const OPTIONS_FAILED_MESSAGE = 'Could not load the filter options.'
const EXPORT_FAILED_MESSAGE = 'Could not export attendance records.'
const EXPORT_EMPTY_MESSAGE = 'No records to export.'
const EXPORT_LABEL = 'Download CSV'
const EXPORTING_LABEL = 'Exporting…'
const SEARCH_DEBOUNCE_MS = 300
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const STUDENT_BUTTON_CLASS =
  'block max-w-60 truncate rounded-md text-left font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const todayIso = getManilaTodayIso(new Date())
const filters = ref(createRecordFilters(todayIso))
const attendanceRows = ref([])
const pageMeta = ref(createEmptyPageMeta())
const searchInput = ref('')
const isListLoading = ref(false)
const isExporting = ref(false)
const gradeLevels = ref([])
const filterSections = ref([])
let listRequestId = 0
let sectionRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const rangeError = computed(() => findRecordRangeError(filters.value))
const sectionOptions = computed(() => buildAttendanceSectionOptions(filterSections.value, filters.value.gradeLevelId))
const emptyText = computed(() => {
  const { studentId, gradeLevelId, sectionId, status, search } = filters.value
  const hasFilter = studentId !== '' || gradeLevelId !== '' || sectionId !== '' || status !== '' || search !== ''
  return hasFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})
const isExportDisabled = computed(
  () => isExporting.value || isListLoading.value || rangeError.value !== '' || pageMeta.value.total === 0,
)

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

async function loadRecords() {
  const recordParams = buildRecordParams(filters.value)
  // an invalid range shows its inline error and keeps the old rows
  if (!recordParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const recordResponse = await fetchAttendanceRecords(recordParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(recordResponse?.meta)) {
      filters.value = applyPageChange(filters.value, recordResponse.meta.last_page)
      loadRecords()
      return
    }
    attendanceRows.value = buildAttendanceRows(recordResponse?.attendances, filters.value.dateFrom)
    pageMeta.value = recordResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    // a 422 carries the server message (for example the 31-day bound)
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function changeDateFrom(nextDate) {
  filters.value = applyRecordDateFromChange(filters.value, nextDate)
  loadRecords()
}

function changeDateTo(nextDate) {
  filters.value = applyRecordDateToChange(filters.value, nextDate)
  loadRecords()
}

function changeGradeLevel(nextId) {
  filters.value = applyAttendanceGradeLevelChange(filters.value, nextId)
  loadRecords()
}

function changeSection(nextId) {
  filters.value = applyAttendanceSectionChange(filters.value, nextId)
  loadRecords()
}

function changeStatus(nextStatus) {
  filters.value = applyAttendanceStatusChange(filters.value, nextStatus)
  loadRecords()
}

function filterByStudent(student) {
  filters.value = applyRecordStudentChange(filters.value, student)
  loadRecords()
}

function clearStudent() {
  filters.value = clearRecordStudent(filters.value)
  loadRecords()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadRecords()
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
  loadRecords()
}

async function exportRecordsCsv() {
  if (isExportDisabled.value) return
  // the params are a snapshot taken at click, so later filter changes do not touch the export
  const exportParams = buildRecordParams(filters.value)
  if (!exportParams) return
  isExporting.value = true
  try {
    const { page: _unusedPage, ...rangeParams } = exportParams
    const exportResponse = await fetchAllAttendanceRecords(rangeParams)
    if (exportResponse.attendances.length === 0) {
      toast.info(EXPORT_EMPTY_MESSAGE)
      return
    }
    const dateLabel = `${rangeParams.date_from}-to-${rangeParams.date_to}`
    downloadCsvFile(buildCsvFileName(CSV_SLUG, dateLabel), buildAttendanceCsv(exportResponse.attendances))
  } catch (error) {
    toastRequestError(error, EXPORT_FAILED_MESSAGE)
  } finally {
    isExporting.value = false
  }
}

watch(() => schoolYearStore.activeSchoolYear?.id, loadSectionOptions, { immediate: true })

onMounted(() => {
  loadGradeLevels()
  loadRecords()
})
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-line bg-surface">
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">{{ PAGE_TITLE }}</h2>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isExportDisabled" @click="exportRecordsCsv">
          <Download :size="16" aria-hidden="true" />
          {{ isExporting ? EXPORTING_LABEL : EXPORT_LABEL }}
        </button>
      </div>
      <AttendanceRecordFilterBar
        :date-from="filters.dateFrom"
        :date-to="filters.dateTo"
        :max-date="todayIso"
        :student-label="filters.studentLabel"
        :grade-level-id="filters.gradeLevelId"
        :section-id="filters.sectionId"
        :status="filters.status"
        :search="searchInput"
        :grade-levels="gradeLevels"
        :section-options="sectionOptions"
        @update:date-from="changeDateFrom"
        @update:date-to="changeDateTo"
        @update:grade-level-id="changeGradeLevel"
        @update:section-id="changeSection"
        @update:status="changeStatus"
        @update:search="updateSearchInput"
        @clear-student="clearStudent"
      />
      <p v-if="rangeError" role="alert" class="border-b border-line px-4 py-2 text-xs text-red-700">{{ rangeError }}</p>
      <DataTable
        :columns="ATTENDANCE_RECORD_COLUMNS"
        :rows="attendanceRows"
        :row-key="ROW_KEY"
        :empty-text="emptyText"
        :is-loading="isListLoading"
      >
        <template #cell-date="{ row }">
          <span class="tabular-nums">{{ formatDisplayDate(row.date) }}</span>
        </template>
        <template #cell-lrn="{ row }">
          <span class="font-mono text-xs tabular-nums">{{ row.student?.lrn }}</span>
        </template>
        <template #cell-student="{ row }">
          <button
            type="button"
            :class="STUDENT_BUTTON_CLASS"
            :aria-label="`Show only the records of ${formatEnrollmentStudentName(row.student)}`"
            @click="filterByStudent(row.student)"
          >
            {{ formatEnrollmentStudentName(row.student) }}
          </button>
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
