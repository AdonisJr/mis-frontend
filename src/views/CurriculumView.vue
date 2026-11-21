<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Copy, Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import CurriculumFilterBar from '@/components/CurriculumFilterBar.vue'
import CurriculumRowActions from '@/components/CurriculumRowActions.vue'
import CurriculumAddModalView from '@/views/CurriculumAddModalView.vue'
import CurriculumCopyModalView from '@/views/CurriculumCopyModalView.vue'
import { ADMIN_REGISTRAR_ROLES } from '@/routeRoles.js'
import {
  fetchCurriculumEntries,
  removeCurriculumEntry,
  updateCurriculumEntrySortOrder,
} from '@/services/curriculumService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllPrograms } from '@/services/programService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { useAuthStore } from '@/stores/authStore.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import {
  applyCurriculumGradeLevelChange,
  applyCurriculumProgramChange,
  applyCurriculumSchoolYearChange,
  applyCurriculumTermChange,
  buildCurriculumAddRule,
  buildCurriculumGroupFields,
  clearNonShsFields,
  clearUnfitTermNumber,
  createCurriculumFilters,
  isShsGradeLevel,
  listCurriculumGradeLevels,
  listCurriculumPrograms,
} from '@/utils/curriculumForm.js'
import { CURRICULUM_COLUMNS, buildRemoveEntryMessage } from '@/utils/curriculumDisplay.js'
import { buildMoveDownUpdates, buildMoveUpUpdates, isFirstEntry, isLastEntry } from '@/utils/curriculumOrder.js'
import { findGroupTotalHours } from '@/utils/curriculumTotals.js'
import { findGradeLevel, toRecordId } from '@/utils/sectionForm.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import { formatWeeklyHours, getSubjectTypeLabel } from '@/utils/subjectDisplay.js'
import { buildTermLabel } from '@/utils/termDisplay.js'
import { getTermNumberOptions } from '@/utils/termForm.js'

const CURRICULUM_ROW_KEY = 'id'
const GROUP_LABEL_SEPARATOR = ' · '
const MIN_YEARS_TO_COPY = 2
const REMOVE_TITLE = 'Remove subject'
const REMOVE_CONFIRM_LABEL = 'Remove'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first.'
const CHOOSE_GRADE_LEVEL_TEXT = 'Choose a grade level.'
const CHOOSE_STRAND_TERM_TEXT = 'Choose a strand and term.'
const EMPTY_GROUP_TEXT = 'No subjects in this group yet.'
const OPTIONS_FAILED_TEXT = 'The filters could not be loaded. Reload the page to try again.'
const INACTIVE_STRAND_HINT = 'This strand is inactive.'

const OPTIONS_FAILED_MESSAGE = 'Could not load school years, grade levels or strands.'
const LOAD_FAILED_MESSAGE = 'Could not load the curriculum.'
const REMOVE_SUCCESS_MESSAGE = 'Subject removed from the curriculum.'
const REMOVE_FAILED_MESSAGE = 'Could not remove the subject.'
const REORDER_FAILED_MESSAGE = 'Could not reorder the subjects.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const schoolYears = ref([])
const gradeLevels = ref([])
const programs = ref([])
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const filters = ref(createCurriculumFilters())
const entries = ref([])
const groupTotals = ref([])
const isListLoading = ref(false)
const isAddOpen = ref(false)
const isCopyOpen = ref(false)
const removingEntry = ref(null)
const isRemoving = ref(false)
const isMoving = ref(false)
let listRequestId = 0

const toast = useToast()
const authStore = useAuthStore()
const schoolYearStore = useSchoolYearStore()

const canEdit = computed(() => authStore.hasAnyRole(ADMIN_REGISTRAR_ROLES))
const selectedSchoolYear = computed(
  () => schoolYears.value.find((schoolYear) => schoolYear.id === toRecordId(filters.value.schoolYearId)) ?? null,
)
const selectedGradeLevel = computed(() => findGradeLevel(gradeLevels.value, filters.value.gradeLevelId))
const selectedProgram = computed(
  () => programs.value.find((program) => program.id === toRecordId(filters.value.programId)) ?? null,
)
const isShs = computed(() => isShsGradeLevel(selectedGradeLevel.value))
const termOptions = computed(() => getTermNumberOptions(selectedSchoolYear.value?.term_type))
const groupFields = computed(() => buildCurriculumGroupFields(filters.value, selectedGradeLevel.value))
const isGroupComplete = computed(() => groupFields.value !== null)
const addRule = computed(() => {
  if (!isGroupComplete.value) return null
  return buildCurriculumAddRule(groupFields.value, entries.value)
})
const totalHoursText = computed(() => findGroupTotalHours(groupTotals.value, groupFields.value))
const groupLabel = computed(() => {
  const termLabel = buildTermLabel(selectedSchoolYear.value?.term_type, groupFields.value?.term_number)
  const labelParts = [selectedGradeLevel.value?.name, selectedProgram.value?.code, termLabel]
  return labelParts.filter((labelPart) => Boolean(labelPart)).join(GROUP_LABEL_SEPARATOR)
})
const isStrandInactive = computed(() => isShs.value && selectedProgram.value?.is_active === false)
const canCopy = computed(
  () => areOptionsLoaded.value && filters.value.schoolYearId !== '' && schoolYears.value.length >= MIN_YEARS_TO_COPY,
)
const canAdd = computed(() => isGroupComplete.value && !isStrandInactive.value)
const isRemoveConfirmOpen = computed(() => removingEntry.value !== null)
const removeMessage = computed(() => buildRemoveEntryMessage(removingEntry.value))
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && schoolYears.value.length === 0) return NO_SCHOOL_YEAR_TEXT
  if (selectedGradeLevel.value === null) return CHOOSE_GRADE_LEVEL_TEXT
  if (!isGroupComplete.value) return CHOOSE_STRAND_TERM_TEXT
  return EMPTY_GROUP_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadOptions() {
  try {
    const [schoolYearResponse, gradeLevelResponse, programResponse] = await Promise.all([
      fetchSchoolYears(),
      fetchGradeLevels(),
      fetchAllPrograms(),
    ])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    gradeLevels.value = listCurriculumGradeLevels(gradeLevelResponse?.grade_levels)
    programs.value = listCurriculumPrograms(programResponse?.programs)
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  } finally {
    isOptionsLoading.value = false
  }
}

async function loadEntries() {
  const requestId = ++listRequestId
  if (groupFields.value === null) {
    entries.value = []
    groupTotals.value = []
    isListLoading.value = false
    return
  }
  isListLoading.value = true
  try {
    const listResponse = await fetchCurriculumEntries(groupFields.value)
    if (requestId !== listRequestId) return
    entries.value = listResponse?.curriculum_entries ?? []
    groupTotals.value = listResponse?.group_totals ?? []
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function initSchoolYearFilter() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (isSchoolYearFilterReady.value || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  const defaultSchoolYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  filters.value = applyCurriculumSchoolYearChange(filters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadEntries()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyCurriculumSchoolYearChange(filters.value, nextSchoolYearId)
  filters.value = clearUnfitTermNumber(filters.value, selectedSchoolYear.value)
  loadEntries()
}

function changeGradeLevel(nextGradeLevelId) {
  filters.value = applyCurriculumGradeLevelChange(filters.value, nextGradeLevelId)
  filters.value = clearNonShsFields(filters.value, selectedGradeLevel.value)
  loadEntries()
}

function changeProgram(nextProgramId) {
  filters.value = applyCurriculumProgramChange(filters.value, nextProgramId)
  loadEntries()
}

function changeTerm(nextTermNumber) {
  filters.value = applyCurriculumTermChange(filters.value, nextTermNumber)
  loadEntries()
}

function openAdd() {
  if (!canAdd.value) return
  isAddOpen.value = true
}

function closeAdd() {
  isAddOpen.value = false
}

function handleAdded() {
  isAddOpen.value = false
  loadEntries()
}

function openCopy() {
  if (!canCopy.value) return
  isCopyOpen.value = true
}

function closeCopy() {
  isCopyOpen.value = false
}

function handleCopied() {
  loadEntries()
}

function requestRemove(entry) {
  removingEntry.value = entry
}

function cancelRemove() {
  if (isRemoving.value) return
  removingEntry.value = null
}

async function confirmRemove() {
  if (isRemoving.value || !removingEntry.value) return
  isRemoving.value = true
  try {
    await removeCurriculumEntry(removingEntry.value.id)
    toast.success(REMOVE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, REMOVE_FAILED_MESSAGE)
  } finally {
    isRemoving.value = false
    removingEntry.value = null
    loadEntries()
  }
}

// the updates are sequential on purpose: the API has no bulk reorder, a failed second call is repaired by the reload
async function applySortOrderUpdates(sortOrderUpdates) {
  if (isMoving.value || sortOrderUpdates.length === 0) return
  isMoving.value = true
  try {
    for (const sortOrderUpdate of sortOrderUpdates) {
      await updateCurriculumEntrySortOrder(sortOrderUpdate.id, sortOrderUpdate.sort_order)
    }
  } catch (error) {
    toastRequestError(error, REORDER_FAILED_MESSAGE)
  } finally {
    isMoving.value = false
    loadEntries()
  }
}

function moveEntryUp(entry) {
  return applySortOrderUpdates(buildMoveUpUpdates(entries.value, entry.id))
}

function moveEntryDown(entry) {
  return applySortOrderUpdates(buildMoveDownUpdates(entries.value, entry.id))
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 class="text-sm font-bold text-ink">Curriculum</h2>
        <span v-if="groupLabel" class="text-sm text-ink-muted">{{ groupLabel }}</span>
        <span v-if="isGroupComplete" class="text-sm font-semibold tabular-nums text-ink">
          Total weekly hours: {{ totalHoursText }}
        </span>
      </div>
      <div v-if="canEdit" class="flex flex-wrap items-center gap-2">
        <span v-if="isStrandInactive" class="text-xs text-ink-muted">{{ INACTIVE_STRAND_HINT }}</span>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="!canCopy" @click="openCopy">
          <Copy :size="16" aria-hidden="true" />
          Copy from previous year
        </button>
        <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canAdd" @click="openAdd">
          <Plus :size="16" aria-hidden="true" />
          Add subject
        </button>
      </div>
    </div>
    <CurriculumFilterBar
      :school-year-id="filters.schoolYearId"
      :grade-level-id="filters.gradeLevelId"
      :program-id="filters.programId"
      :term-number="filters.termNumber"
      :school-years="schoolYears"
      :grade-levels="gradeLevels"
      :programs="programs"
      :term-options="termOptions"
      :is-shs="isShs"
      :is-disabled="!areOptionsLoaded"
      @update:school-year-id="changeSchoolYear"
      @update:grade-level-id="changeGradeLevel"
      @update:program-id="changeProgram"
      @update:term-number="changeTerm"
    />
    <DataTable
      :columns="CURRICULUM_COLUMNS"
      :rows="entries"
      :row-key="CURRICULUM_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading || isOptionsLoading"
    >
      <template #cell-position="{ row }">
        <span class="tabular-nums">{{ entries.indexOf(row) + 1 }}</span>
      </template>
      <template #cell-code="{ row }">
        <span class="font-mono text-xs font-semibold">{{ row.subject.code }}</span>
      </template>
      <template #cell-name="{ row }">
        <span class="block max-w-60 truncate" :title="row.subject.name">{{ row.subject.name }}</span>
      </template>
      <template #cell-type="{ row }">
        <span class="whitespace-nowrap">{{ getSubjectTypeLabel(row.subject.type) }}</span>
      </template>
      <template #cell-weekly_hours="{ row }">
        <span class="tabular-nums">{{ formatWeeklyHours(row.subject.weekly_hours) }}</span>
      </template>
      <template v-if="canEdit" #actions="{ row }">
        <CurriculumRowActions
          :entry="row"
          :is-first="isFirstEntry(entries, row.id)"
          :is-last="isLastEntry(entries, row.id)"
          :is-disabled="isMoving"
          @move-up="moveEntryUp(row)"
          @move-down="moveEntryDown(row)"
          @remove="requestRemove(row)"
        />
      </template>
    </DataTable>
  </section>

  <CurriculumAddModalView
    v-if="canEdit"
    :is-open="isAddOpen"
    :grade-level="selectedGradeLevel"
    :add-rule="addRule"
    :group-label="groupLabel"
    @close="closeAdd"
    @added="handleAdded"
  />

  <CurriculumCopyModalView
    v-if="canEdit"
    :is-open="isCopyOpen"
    :school-years="schoolYears"
    :target-school-year-id="filters.schoolYearId"
    @close="closeCopy"
    @copied="handleCopied"
  />

  <ConfirmDialog
    v-if="canEdit"
    :is-open="isRemoveConfirmOpen"
    :title="REMOVE_TITLE"
    :message="removeMessage"
    :confirm-label="REMOVE_CONFIRM_LABEL"
    is-destructive
    :is-loading="isRemoving"
    @confirm="confirmRemove"
    @cancel="cancelRemove"
  />
</template>
