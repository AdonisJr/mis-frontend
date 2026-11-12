<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import SectionFilterBar from '@/components/SectionFilterBar.vue'
import SectionFormFields from '@/components/SectionFormFields.vue'
import SectionRowActions from '@/components/SectionRowActions.vue'
import { createSection, deleteSection, fetchSections, updateSection } from '@/services/sectionService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { fetchAllPrograms } from '@/services/programService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import {
  applySectionGradeLevelChange,
  applySectionProgramChange,
  applySectionSchoolYearChange,
  buildSectionListParams,
  clearUnfitProgramFilter,
  createSectionFilters,
  pickDefaultSchoolYearId,
} from '@/utils/sectionSearch.js'
import {
  buildFormFromSection,
  buildSectionPayload,
  buildSectionProgramRule,
  clearUnfitProgram,
  createEmptySectionForm,
  findGradeLevel,
  findSectionFormErrors,
  listSelectablePrograms,
  listStagePrograms,
} from '@/utils/sectionForm.js'
import {
  SECTION_COLUMNS,
  buildSectionDeleteMessage,
  formatSectionProgramCode,
  formatSectionRoom,
} from '@/utils/sectionDisplay.js'

const SECTION_ROW_KEY = 'id'
const SECTION_FORM_ID = 'section-form'
const EMPTY_TEXT = 'No sections in this school year yet.'
const NO_MATCH_TEXT = 'No sections match the search or filters.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first: sections belong to a school year.'
const OPTIONS_FAILED_TEXT = 'The filters could not be loaded. Reload the page to try again.'
const ADD_TITLE = 'Add section'
const EDIT_TITLE = 'Edit section'
const DELETE_TITLE = 'Delete section'
const DELETE_CONFIRM_LABEL = 'Delete'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load sections.'
const OPTIONS_FAILED_MESSAGE = 'Could not load school years, grade levels or programs.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Section added.'
const UPDATE_SUCCESS_MESSAGE = 'Section updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the section.'
const DELETE_SUCCESS_MESSAGE = 'Section deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the section.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const sections = ref([])
const pageMeta = ref(createEmptyPageMeta())
const sectionFilters = ref(createSectionFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const schoolYears = ref([])
const gradeLevels = ref([])
const programs = ref([])
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const isFormOpen = ref(false)
const editingSection = ref(null)
const formValues = ref(createEmptySectionForm(''))
const fieldErrors = ref({})
const isSaving = ref(false)
const deletingSection = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const isCreating = computed(() => editingSection.value === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const hasSchoolYears = computed(() => schoolYears.value.length > 0)
const canAddSection = computed(() => areOptionsLoaded.value && hasSchoolYears.value)
const isDeleteConfirmOpen = computed(() => deletingSection.value !== null)
const deleteMessage = computed(() => buildSectionDeleteMessage(deletingSection.value))
const filterGradeLevel = computed(() => findGradeLevel(gradeLevels.value, sectionFilters.value.gradeLevelId))
const filterProgramOptions = computed(() => listStagePrograms(programs.value, filterGradeLevel.value?.stage ?? ''))
const formGradeLevel = computed(() => findGradeLevel(gradeLevels.value, formValues.value.grade_level_id))
const formProgramOptions = computed(() => {
  // without a grade level there is no stage to offer programs for
  if (!formGradeLevel.value) return []
  const stagePrograms = listStagePrograms(programs.value, formGradeLevel.value.stage)
  return listSelectablePrograms(stagePrograms, editingSection.value?.program_id ?? null)
})
const formProgramRule = computed(() => buildSectionProgramRule(formGradeLevel.value, formProgramOptions.value))
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && !hasSchoolYears.value) return NO_SCHOOL_YEAR_TEXT
  const { gradeLevelId, programId, search } = sectionFilters.value
  const hasActiveFilter = gradeLevelId !== '' || programId !== '' || search !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadSections() {
  const listParams = buildSectionListParams(sectionFilters.value)
  // the API requires a school year; without one there is nothing to list
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchSections(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      sectionFilters.value = applyPageChange(sectionFilters.value, listResponse.meta.last_page)
      loadSections()
      return
    }
    sections.value = listResponse?.sections ?? []
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
    gradeLevels.value = gradeLevelResponse?.grade_levels ?? []
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
  sectionFilters.value = applySectionSchoolYearChange(sectionFilters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadSections()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === sectionFilters.value.search) return
  sectionFilters.value = applySearchChange(sectionFilters.value, searchInput.value)
  loadSections()
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
  sectionFilters.value = applySectionSchoolYearChange(sectionFilters.value, nextSchoolYearId)
  loadSections()
}

function changeGradeLevel(nextGradeLevelId) {
  sectionFilters.value = applySectionGradeLevelChange(sectionFilters.value, nextGradeLevelId)
  sectionFilters.value = clearUnfitProgramFilter(sectionFilters.value, filterProgramOptions.value)
  loadSections()
}

function changeProgram(nextProgramId) {
  sectionFilters.value = applySectionProgramChange(sectionFilters.value, nextProgramId)
  loadSections()
}

function changePage(nextPage) {
  sectionFilters.value = applyPageChange(sectionFilters.value, nextPage)
  loadSections()
}

function openForm(section) {
  editingSection.value = section
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openCreateForm() {
  if (!canAddSection.value) return
  formValues.value = createEmptySectionForm(sectionFilters.value.schoolYearId)
  openForm(null)
}

function openEditForm(section) {
  if (!areOptionsLoaded.value) return
  formValues.value = buildFormFromSection(section)
  openForm(section)
}

function resetForm() {
  isFormOpen.value = false
  editingSection.value = null
  formValues.value = createEmptySectionForm('')
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
  // formProgramRule follows the new grade level only after the assignment above
  formValues.value = clearUnfitProgram(formValues.value, formProgramRule.value)
}

function submitSectionForm() {
  const sectionPayload = buildSectionPayload(formValues.value)
  if (!isCreating.value) return updateSection(editingSection.value.id, sectionPayload)
  return createSection(sectionPayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadSections()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveSection() {
  if (isSaving.value) return
  fieldErrors.value = findSectionFormErrors(formValues.value, formProgramRule.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitSectionForm()
    resetForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    if (wasCreating) sectionFilters.value = applyPageChange(sectionFilters.value, FIRST_PAGE)
    loadSections()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestDelete(section) {
  deletingSection.value = section
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingSection.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingSection.value) return
  isDeleting.value = true
  try {
    await deleteSection(deletingSection.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingSection.value = null
    loadSections()
  }
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Sections</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canAddSection" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add
      </button>
    </div>
    <SectionFilterBar
      :search="searchInput"
      :school-year-id="sectionFilters.schoolYearId"
      :grade-level-id="sectionFilters.gradeLevelId"
      :program-id="sectionFilters.programId"
      :school-years="schoolYears"
      :grade-levels="gradeLevels"
      :programs="filterProgramOptions"
      :is-disabled="!areOptionsLoaded"
      @update:search="updateSearchInput"
      @update:school-year-id="changeSchoolYear"
      @update:grade-level-id="changeGradeLevel"
      @update:program-id="changeProgram"
    />
    <DataTable
      :columns="SECTION_COLUMNS"
      :rows="sections"
      :row-key="SECTION_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading || isOptionsLoading"
    >
      <template #cell-name="{ row }">
        <span class="block max-w-60 truncate font-semibold" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-grade_level="{ row }">
        <span class="whitespace-nowrap">{{ row.grade_level?.name ?? '' }}</span>
      </template>
      <template #cell-program="{ row }">
        <span class="whitespace-nowrap font-mono text-xs font-semibold">{{ formatSectionProgramCode(row) }}</span>
      </template>
      <template #cell-capacity="{ value }">
        <span class="tabular-nums">{{ value }}</span>
      </template>
      <template #cell-room="{ row }">
        <span class="block max-w-40 truncate" :title="formatSectionRoom(row)">{{ formatSectionRoom(row) }}</span>
      </template>
      <template #actions="{ row }">
        <SectionRowActions :section="row" @edit="openEditForm(row)" @delete="requestDelete(row)" />
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

  <Modal :is-open="isFormOpen" :title="formTitle" @close="closeForm">
    <form :id="SECTION_FORM_ID" novalidate @submit.prevent="saveSection">
      <SectionFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :school-years="schoolYears"
        :grade-levels="gradeLevels"
        :program-options="formProgramOptions"
        :is-program-forbidden="formProgramRule.isProgramForbidden"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeForm">
        Cancel
      </button>
      <button type="submit" :form="SECTION_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>

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
