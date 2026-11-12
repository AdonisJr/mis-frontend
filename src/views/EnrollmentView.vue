<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import EnrollmentFilterBar from '@/components/EnrollmentFilterBar.vue'
import EnrollmentRowActions from '@/components/EnrollmentRowActions.vue'
import EnrollmentEnrollModalView from '@/views/EnrollmentEnrollModalView.vue'
import EnrollmentMoveModalView from '@/views/EnrollmentMoveModalView.vue'
import {
  completeEnrollment,
  dropEnrollment,
  fetchEnrollments,
  transferEnrollment,
} from '@/services/enrollmentService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { fetchActiveTerm, fetchTerms } from '@/services/termService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { applyPageChange, applySearchChange, isPageBeyondLast, normalizeSearchText } from '@/utils/studentSearch.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import { toRecordId } from '@/utils/sectionForm.js'
import {
  applyEnrollmentGradeLevelChange,
  applyEnrollmentSchoolYearChange,
  applyEnrollmentSectionChange,
  applyEnrollmentStatusChange,
  applyEnrollmentTermChange,
  buildEnrollmentListParams,
  clearUnfitSectionFilter,
  createEnrollmentFilters,
  listGradeLevelSections,
  pickDefaultTermId,
} from '@/utils/enrollmentSearch.js'
import {
  ENROLLMENT_COLUMNS,
  formatEnrollmentGradeLevel,
  formatEnrollmentSection,
  formatEnrollmentStudentName,
  formatEnrollmentTerm,
} from '@/utils/enrollmentDisplay.js'
import {
  ENROLLMENT_ACTION_COMPLETE,
  ENROLLMENT_ACTION_DROP,
  ENROLLMENT_ACTION_TRANSFER,
  buildClosingConfirm,
  getEnrollmentStatusChip,
} from '@/utils/enrollmentStatus.js'
import { buildSectionOptionLabel } from '@/utils/enrollmentForm.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'

const ENROLLMENT_ROW_KEY = 'id'
const EMPTY_TEXT = 'No enrollments for these filters yet.'
const NO_MATCH_TEXT = 'No enrollments match the search or filters.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first: enrollments belong to a school year.'
const OPTIONS_FAILED_TEXT = 'The filters could not be loaded. Reload the page to try again.'
const SEARCH_DEBOUNCE_MS = 300

const LOAD_FAILED_MESSAGE = 'Could not load enrollments.'
const OPTIONS_FAILED_MESSAGE = 'Could not load school years, grade levels or the active term.'
const YEAR_OPTIONS_FAILED_MESSAGE = 'Could not load the terms and sections of this school year.'
const CLOSE_FAILED_MESSAGE = 'Could not update the enrollment.'
const CLOSE_SUCCESS_MESSAGES = Object.freeze({
  [ENROLLMENT_ACTION_DROP]: 'Enrollment dropped.',
  [ENROLLMENT_ACTION_TRANSFER]: 'Student marked as transferred.',
  [ENROLLMENT_ACTION_COMPLETE]: 'Enrollment completed.',
})
const CLOSING_SERVICES = Object.freeze({
  [ENROLLMENT_ACTION_DROP]: dropEnrollment,
  [ENROLLMENT_ACTION_TRANSFER]: transferEnrollment,
  [ENROLLMENT_ACTION_COMPLETE]: completeEnrollment,
})

const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const CHIP_CLASS = 'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const enrollments = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createEnrollmentFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const schoolYears = ref([])
const gradeLevels = ref([])
const terms = ref([])
const filterSections = ref([])
const activeTerm = ref(null)
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isFilterReady = ref(false)
const isEnrollOpen = ref(false)
const movingEnrollment = ref(null)
const closingRequest = ref(null)
const isClosing = ref(false)
let listRequestId = 0
let yearRequestId = 0
let searchDebounceTimer = null
let hasInitStarted = false

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const hasSchoolYears = computed(() => schoolYears.value.length > 0)
const canEnroll = computed(() => isFilterReady.value && filters.value.schoolYearId !== '')
const isClosingConfirmOpen = computed(() => closingRequest.value !== null)
const closingConfirm = computed(() => {
  if (closingRequest.value === null) return null
  return buildClosingConfirm(closingRequest.value.action, closingRequest.value.enrollment)
})
const isClosingDestructive = computed(() => closingRequest.value?.action !== ENROLLMENT_ACTION_COMPLETE)
const sectionFilterOptions = computed(() =>
  listGradeLevelSections(filterSections.value, filters.value.gradeLevelId).map((section) => ({
    id: section.id,
    // seat counts are not loaded for the filter list, so the label carries no seats suffix
    label: buildSectionOptionLabel({ ...section, enrolled_count: null }, ''),
  })),
)
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && !hasSchoolYears.value) return NO_SCHOOL_YEAR_TEXT
  const { termId, sectionId, gradeLevelId, status, search } = filters.value
  const hasActiveFilter = [termId, sectionId, gradeLevelId, status, search].some((filterValue) => filterValue !== '')
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadEnrollments() {
  const listParams = buildEnrollmentListParams(filters.value)
  // the API requires a school year; without one there is nothing to list
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchEnrollments(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadEnrollments()
      return
    }
    enrollments.value = listResponse?.enrollments ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

async function loadOptions() {
  try {
    const [schoolYearResponse, gradeLevelResponse, activeTermResponse] = await Promise.all([fetchSchoolYears(), fetchGradeLevels(), fetchActiveTerm()])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    gradeLevels.value = gradeLevelResponse?.grade_levels ?? []
    activeTerm.value = activeTermResponse?.term ?? null
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  } finally {
    isOptionsLoading.value = false
  }
}

async function loadYearOptions() {
  const schoolYearId = toRecordId(filters.value.schoolYearId)
  if (schoolYearId === null) return
  const requestId = ++yearRequestId
  try {
    const [termResponse, sectionResponse] = await Promise.all([
      fetchTerms(schoolYearId),
      fetchAllSections({ school_year_id: schoolYearId }),
    ])
    if (requestId !== yearRequestId) return
    terms.value = termResponse?.terms ?? []
    filterSections.value = sectionResponse?.sections ?? []
  } catch (error) {
    if (requestId !== yearRequestId) return
    terms.value = []
    filterSections.value = []
    toastRequestError(error, YEAR_OPTIONS_FAILED_MESSAGE)
  }
  filters.value = applyEnrollmentTermChange(filters.value, pickDefaultTermId(terms.value, activeTerm.value))
  loadEnrollments()
}

async function initFilters() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (hasInitStarted || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  hasInitStarted = true
  const defaultSchoolYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  filters.value = applyEnrollmentSchoolYearChange(filters.value, defaultSchoolYearId)
  await loadYearOptions()
  isFilterReady.value = true
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadEnrollments()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyEnrollmentSchoolYearChange(filters.value, nextSchoolYearId)
  loadYearOptions()
}

function changeTerm(nextTermId) {
  filters.value = applyEnrollmentTermChange(filters.value, nextTermId)
  loadEnrollments()
}

function changeGradeLevel(nextGradeLevelId) {
  filters.value = applyEnrollmentGradeLevelChange(filters.value, nextGradeLevelId)
  filters.value = clearUnfitSectionFilter(filters.value, sectionFilterOptions.value)
  loadEnrollments()
}

function changeSection(nextSectionId) {
  filters.value = applyEnrollmentSectionChange(filters.value, nextSectionId)
  loadEnrollments()
}

function changeStatus(nextStatus) {
  filters.value = applyEnrollmentStatusChange(filters.value, nextStatus)
  loadEnrollments()
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadEnrollments()
}

function openEnroll() {
  if (!canEnroll.value) return
  isEnrollOpen.value = true
}

function requestMove(enrollment) {
  movingEnrollment.value = enrollment
}

function requestClose(action, enrollment) {
  closingRequest.value = { action, enrollment }
}

function cancelClose() {
  if (isClosing.value) return
  closingRequest.value = null
}

async function confirmClose() {
  const request = closingRequest.value
  if (isClosing.value || request === null) return
  isClosing.value = true
  try {
    await CLOSING_SERVICES[request.action](request.enrollment.id)
    toast.success(CLOSE_SUCCESS_MESSAGES[request.action])
  } catch (error) {
    toastRequestError(error, CLOSE_FAILED_MESSAGE)
  } finally {
    isClosing.value = false
    closingRequest.value = null
    loadEnrollments()
  }
}

function handleSaved() {
  isEnrollOpen.value = false
  movingEnrollment.value = null
  loadEnrollments()
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initFilters)
onMounted(loadOptions)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Enrollments</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canEnroll" @click="openEnroll">
        <Plus :size="16" aria-hidden="true" />
        Enroll
      </button>
    </div>
    <EnrollmentFilterBar
      :search="searchInput"
      :school-year-id="filters.schoolYearId"
      :term-id="filters.termId"
      :section-id="filters.sectionId"
      :grade-level-id="filters.gradeLevelId"
      :status="filters.status"
      :school-years="schoolYears"
      :terms="terms"
      :section-options="sectionFilterOptions"
      :grade-levels="gradeLevels"
      :is-disabled="!areOptionsLoaded"
      @update:search="updateSearchInput"
      @update:school-year-id="changeSchoolYear"
      @update:term-id="changeTerm"
      @update:section-id="changeSection"
      @update:grade-level-id="changeGradeLevel"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="ENROLLMENT_COLUMNS"
      :rows="enrollments"
      :row-key="ENROLLMENT_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading || isOptionsLoading"
    >
      <template #cell-lrn="{ row }">
        <span class="whitespace-nowrap font-mono text-xs tabular-nums">{{ row.student?.lrn }}</span>
      </template>
      <template #cell-student="{ row }">
        <span class="block max-w-64 truncate font-semibold" :title="formatEnrollmentStudentName(row.student)">
          {{ formatEnrollmentStudentName(row.student) }}
        </span>
      </template>
      <template #cell-grade_level="{ row }">
        <span class="whitespace-nowrap">{{ formatEnrollmentGradeLevel(row) }}</span>
      </template>
      <template #cell-section="{ row }">
        <span class="whitespace-nowrap">{{ formatEnrollmentSection(row) }}</span>
      </template>
      <template #cell-term="{ row }">
        <span class="whitespace-nowrap">{{ formatEnrollmentTerm(row) }}</span>
      </template>
      <template #cell-status="{ row }">
        <span :class="[CHIP_CLASS, getEnrollmentStatusChip(row.status).colorClass]">
          {{ getEnrollmentStatusChip(row.status).label }}
        </span>
      </template>
      <template #cell-enrolled_at="{ row }">
        <span class="whitespace-nowrap tabular-nums">{{ formatDisplayDate(row.enrolled_at) }}</span>
      </template>
      <template #actions="{ row }">
        <EnrollmentRowActions
          :enrollment="row"
          @move="requestMove(row)"
          @drop="requestClose(ENROLLMENT_ACTION_DROP, row)"
          @transfer="requestClose(ENROLLMENT_ACTION_TRANSFER, row)"
          @complete="requestClose(ENROLLMENT_ACTION_COMPLETE, row)"
        />
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

  <EnrollmentEnrollModalView
    :is-open="isEnrollOpen"
    :school-year-id="filters.schoolYearId"
    :terms="terms"
    :default-term-id="filters.termId"
    @close="isEnrollOpen = false"
    @enrolled="handleSaved"
  />

  <EnrollmentMoveModalView
    :enrollment="movingEnrollment"
    :school-year-id="filters.schoolYearId"
    @close="movingEnrollment = null"
    @moved="handleSaved"
  />

  <ConfirmDialog
    :is-open="isClosingConfirmOpen"
    :title="closingConfirm?.title ?? ''"
    :message="closingConfirm?.message ?? ''"
    :confirm-label="closingConfirm?.confirmLabel"
    :is-destructive="isClosingDestructive"
    :is-loading="isClosing"
    @confirm="confirmClose"
    @cancel="cancelClose"
  />
</template>
