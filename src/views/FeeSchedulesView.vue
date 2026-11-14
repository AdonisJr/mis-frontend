<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Copy, Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import TabList from '@/components/TabList.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import FeeScheduleFilterBar from '@/components/FeeScheduleFilterBar.vue'
import FeeScheduleRowActions from '@/components/FeeScheduleRowActions.vue'
import FeeItemsPanelView from '@/views/FeeItemsPanelView.vue'
import FeeScheduleCopyModalView from '@/views/FeeScheduleCopyModalView.vue'
import FeeScheduleFormModalView from '@/views/FeeScheduleFormModalView.vue'
import { deleteFeeSchedule, fetchFeeSchedules } from '@/services/feeScheduleService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { fetchAllPrograms } from '@/services/programService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { FIRST_PAGE, applyPageChange, isPageBeyondLast } from '@/utils/studentSearch.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import { findGradeLevel } from '@/utils/sectionForm.js'
import {
  applyFeeScheduleGradeLevelChange,
  applyFeeScheduleProgramChange,
  applyFeeScheduleSchoolYearChange,
  buildFeeScheduleListParams,
  clearUnfitScheduleProgramFilter,
  createFeeScheduleFilters,
  listScheduleFilterPrograms,
} from '@/utils/feeScheduleSearch.js'
import { listBillableGradeLevels } from '@/utils/feeScheduleForm.js'
import {
  FEE_SCHEDULE_COLUMNS,
  buildFeeScheduleDeleteMessage,
  formatScheduleGradeLevel,
  formatScheduleProgram,
} from '@/utils/feeScheduleDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'

const TAB_SCHEDULES = 'schedules'
const TAB_FEE_ITEMS = 'fee-items'
const TAB_ID_PREFIX = 'fee-schedules'
const TABS = [
  { key: TAB_SCHEDULES, label: 'Schedules' },
  { key: TAB_FEE_ITEMS, label: 'Fee items' },
]
const FEE_SCHEDULE_ROW_KEY = 'id'
const EMPTY_TEXT = 'No fee schedules in this school year yet.'
const NO_MATCH_TEXT = 'No fee schedules match the filters.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first: fee schedules belong to a school year.'
const OPTIONS_FAILED_TEXT = 'The filters could not be loaded. Reload the page to try again.'
const DELETE_TITLE = 'Delete fee schedule'
const DELETE_CONFIRM_LABEL = 'Delete'
const ALL_PROGRAMS_DEFAULT_CLASS = 'text-ink-muted'

const LOAD_FAILED_MESSAGE = 'Could not load fee schedules.'
const OPTIONS_FAILED_MESSAGE = 'Could not load school years, grade levels or programs.'
const DELETE_SUCCESS_MESSAGE = 'Fee schedule deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the fee schedule.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const activeTab = ref(TAB_SCHEDULES)
const feeSchedules = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createFeeScheduleFilters())
const isListLoading = ref(false)
const schoolYears = ref([])
const gradeLevels = ref([])
const programs = ref([])
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const isFormOpen = ref(false)
const editingSchedule = ref(null)
const isCopyOpen = ref(false)
const deletingSchedule = ref(null)
const isDeleting = ref(false)
let listRequestId = 0

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const hasSchoolYears = computed(() => schoolYears.value.length > 0)
const canAddSchedule = computed(() => areOptionsLoaded.value && hasSchoolYears.value && filters.value.schoolYearId !== '')
const isDeleteConfirmOpen = computed(() => deletingSchedule.value !== null)
const deleteMessage = computed(() => buildFeeScheduleDeleteMessage(deletingSchedule.value))
const filterGradeLevel = computed(() => findGradeLevel(gradeLevels.value, filters.value.gradeLevelId))
const filterPrograms = computed(() => listScheduleFilterPrograms(programs.value, filterGradeLevel.value))
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && !hasSchoolYears.value) return NO_SCHOOL_YEAR_TEXT
  const { gradeLevelId, programId } = filters.value
  return gradeLevelId !== '' || programId !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadFeeSchedules() {
  const listParams = buildFeeScheduleListParams(filters.value)
  // the API requires a school year; without one there is nothing to list
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchFeeSchedules(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadFeeSchedules()
      return
    }
    feeSchedules.value = listResponse?.fee_schedules ?? []
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
    const [schoolYearResponse, gradeLevelResponse, programResponse] = await Promise.all([fetchSchoolYears(), fetchGradeLevels(), fetchAllPrograms()])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    gradeLevels.value = listBillableGradeLevels(gradeLevelResponse?.grade_levels)
    programs.value = programResponse?.programs ?? []
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  } finally {
    isOptionsLoading.value = false
  }
}

function initSchoolYearFilter() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (isSchoolYearFilterReady.value || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  const defaultSchoolYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  filters.value = applyFeeScheduleSchoolYearChange(filters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadFeeSchedules()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyFeeScheduleSchoolYearChange(filters.value, nextSchoolYearId)
  loadFeeSchedules()
}

function changeGradeLevel(nextGradeLevelId) {
  filters.value = applyFeeScheduleGradeLevelChange(filters.value, nextGradeLevelId)
  filters.value = clearUnfitScheduleProgramFilter(filters.value, filterPrograms.value)
  loadFeeSchedules()
}

function changeProgram(nextProgramId) {
  filters.value = applyFeeScheduleProgramChange(filters.value, nextProgramId)
  loadFeeSchedules()
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadFeeSchedules()
}

function openCreateForm() {
  if (!canAddSchedule.value) return
  editingSchedule.value = null
  isFormOpen.value = true
}

function openEditForm(feeSchedule) {
  if (!areOptionsLoaded.value) return
  editingSchedule.value = feeSchedule
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function handleSaved() {
  const wasCreating = editingSchedule.value === null
  isFormOpen.value = false
  if (wasCreating) filters.value = applyPageChange(filters.value, FIRST_PAGE)
  loadFeeSchedules()
}

function openCopy() {
  if (!canAddSchedule.value) return
  isCopyOpen.value = true
}

function closeCopy() {
  isCopyOpen.value = false
}

function requestDelete(feeSchedule) {
  deletingSchedule.value = feeSchedule
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingSchedule.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingSchedule.value) return
  isDeleting.value = true
  try {
    await deleteFeeSchedule(deletingSchedule.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingSchedule.value = null
    loadFeeSchedules()
  }
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <TabList v-model="activeTab" :tabs="TABS" :id-prefix="TAB_ID_PREFIX" />

    <div
      v-show="activeTab === TAB_SCHEDULES"
      :id="`${TAB_ID_PREFIX}-panel-${TAB_SCHEDULES}`"
      role="tabpanel"
      :aria-labelledby="`${TAB_ID_PREFIX}-tab-${TAB_SCHEDULES}`"
    >
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">Fee schedules</h2>
        <div class="flex gap-2">
          <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="!canAddSchedule" @click="openCopy">
            <Copy :size="16" aria-hidden="true" />
            Copy from year
          </button>
          <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canAddSchedule" @click="openCreateForm">
            <Plus :size="16" aria-hidden="true" />
            Add schedule
          </button>
        </div>
      </div>
      <FeeScheduleFilterBar
        :school-year-id="filters.schoolYearId"
        :grade-level-id="filters.gradeLevelId"
        :program-id="filters.programId"
        :school-years="schoolYears"
        :grade-levels="gradeLevels"
        :programs="filterPrograms"
        :is-disabled="!areOptionsLoaded"
        @update:school-year-id="changeSchoolYear"
        @update:grade-level-id="changeGradeLevel"
        @update:program-id="changeProgram"
      />
      <DataTable
        :columns="FEE_SCHEDULE_COLUMNS"
        :rows="feeSchedules"
        :row-key="FEE_SCHEDULE_ROW_KEY"
        :empty-text="emptyText"
        :is-loading="isListLoading || isOptionsLoading"
      >
        <template #cell-grade_level="{ row }">
          <span class="whitespace-nowrap font-semibold">{{ formatScheduleGradeLevel(row) }}</span>
        </template>
        <template #cell-program="{ row }">
          <span class="whitespace-nowrap" :class="row.program ? 'font-mono text-xs font-semibold' : ALL_PROGRAMS_DEFAULT_CLASS">
            {{ formatScheduleProgram(row) }}
          </span>
        </template>
        <template #cell-lines_count="{ value }">
          <span class="tabular-nums">{{ value }}</span>
        </template>
        <template #cell-total="{ row }">
          <span class="block text-right tabular-nums">{{ formatPeso(row.total) }}</span>
        </template>
        <template #actions="{ row }">
          <FeeScheduleRowActions :fee-schedule="row" @edit="openEditForm(row)" @delete="requestDelete(row)" />
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
    </div>

    <div
      v-if="activeTab === TAB_FEE_ITEMS"
      :id="`${TAB_ID_PREFIX}-panel-${TAB_FEE_ITEMS}`"
      role="tabpanel"
      :aria-labelledby="`${TAB_ID_PREFIX}-tab-${TAB_FEE_ITEMS}`"
    >
      <FeeItemsPanelView />
    </div>
  </section>

  <FeeScheduleFormModalView
    :is-open="isFormOpen"
    :fee-schedule="editingSchedule"
    :school-years="schoolYears"
    :grade-levels="gradeLevels"
    :programs="programs"
    :default-school-year-id="filters.schoolYearId"
    @close="closeForm"
    @saved="handleSaved"
  />

  <FeeScheduleCopyModalView
    :is-open="isCopyOpen"
    :school-years="schoolYears"
    :target-school-year-id="filters.schoolYearId"
    @close="closeCopy"
    @copied="loadFeeSchedules"
  />

  <ConfirmDialog
    :is-open="isDeleteConfirmOpen"
    :title="DELETE_TITLE"
    :message="deleteMessage"
    :confirm-label="DELETE_CONFIRM_LABEL"
    is-destructive
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>
