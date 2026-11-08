<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import ProgramFilterBar from '@/components/ProgramFilterBar.vue'
import ProgramFormFields from '@/components/ProgramFormFields.vue'
import ProgramRowActions from '@/components/ProgramRowActions.vue'
import { getStatusChip } from '@/utils/employeeDisplay.js'
import {
  buildProgramDeactivateMessage,
  buildProgramDeleteMessage,
  buildProgramReactivateMessage,
  getStageLabel,
} from '@/utils/programDisplay.js'
import {
  createProgram,
  deactivateProgram,
  deleteProgram,
  fetchPrograms,
  reactivateProgram,
  updateProgram,
} from '@/services/programService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import { applyStatusChange } from '@/utils/employeeSearch.js'
import { applyStageChange, buildProgramListParams, createProgramFilters } from '@/utils/programSearch.js'
import {
  buildFormFromProgram,
  buildProgramPayload,
  createEmptyProgramForm,
  findProgramFormErrors,
} from '@/utils/programForm.js'

const PROGRAM_COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'stage', label: 'Stage' },
  { key: 'is_active', label: 'Status' },
]
const PROGRAM_ROW_KEY = 'id'
const PROGRAM_FORM_ID = 'program-form'
const EMPTY_TEXT = 'No programs yet.'
const NO_MATCH_TEXT = 'No programs match the search or filters.'
const ADD_TITLE = 'Add program'
const EDIT_TITLE = 'Edit program'
const DEACTIVATE_TITLE = 'Deactivate program'
const REACTIVATE_TITLE = 'Reactivate program'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const DELETE_TITLE = 'Delete program'
const DELETE_CONFIRM_LABEL = 'Delete'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load programs.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Program added.'
const UPDATE_SUCCESS_MESSAGE = 'Program updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the program.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Program deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Program reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the program status.'
const DELETE_SUCCESS_MESSAGE = 'Program deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the program.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const programs = ref([])
const pageMeta = ref(createEmptyPageMeta())
const programFilters = ref(createProgramFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingProgram = ref(null)
const formValues = ref(createEmptyProgramForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const statusChangeProgram = ref(null)
const isChangingStatus = ref(false)
const deletingProgram = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const isCreating = computed(() => editingProgram.value === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const isStatusConfirmOpen = computed(() => statusChangeProgram.value !== null)
const isDeactivating = computed(() => statusChangeProgram.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildProgramDeactivateMessage(statusChangeProgram.value)
  return buildProgramReactivateMessage(statusChangeProgram.value)
})
const isDeleteConfirmOpen = computed(() => deletingProgram.value !== null)
const deleteMessage = computed(() => buildProgramDeleteMessage(deletingProgram.value))
const emptyText = computed(() => {
  const { search, stage, status } = programFilters.value
  const hasActiveFilter = search !== '' || stage !== '' || status !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadPrograms() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchPrograms(buildProgramListParams(programFilters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      programFilters.value = applyPageChange(programFilters.value, listResponse.meta.last_page)
      loadPrograms()
      return
    }
    programs.value = listResponse?.programs ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === programFilters.value.search) return
  programFilters.value = applySearchChange(programFilters.value, searchInput.value)
  loadPrograms()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeStage(nextStage) {
  programFilters.value = applyStageChange(programFilters.value, nextStage)
  loadPrograms()
}

function changeStatus(nextStatus) {
  programFilters.value = applyStatusChange(programFilters.value, nextStatus)
  loadPrograms()
}

function changePage(nextPage) {
  programFilters.value = applyPageChange(programFilters.value, nextPage)
  loadPrograms()
}

function openCreateForm() {
  editingProgram.value = null
  formValues.value = createEmptyProgramForm()
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(program) {
  editingProgram.value = program
  formValues.value = buildFormFromProgram(program)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function resetForm() {
  isFormOpen.value = false
  editingProgram.value = null
  formValues.value = createEmptyProgramForm()
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitProgramForm() {
  const programPayload = buildProgramPayload(formValues.value)
  if (!isCreating.value) return updateProgram(editingProgram.value.id, programPayload)
  return createProgram(programPayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadPrograms()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveProgram() {
  if (isSaving.value) return
  fieldErrors.value = findProgramFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitProgramForm()
    resetForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    if (wasCreating) programFilters.value = applyPageChange(programFilters.value, FIRST_PAGE)
    loadPrograms()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestStatusChange(program) {
  statusChangeProgram.value = program
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangeProgram.value = null
}

function submitStatusChange(program) {
  if (program.is_active) return deactivateProgram(program.id)
  return reactivateProgram(program.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangeProgram.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangeProgram.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangeProgram.value = null
    loadPrograms()
  }
}

function requestDelete(program) {
  deletingProgram.value = program
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingProgram.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingProgram.value) return
  isDeleting.value = true
  try {
    await deleteProgram(deletingProgram.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingProgram.value = null
    loadPrograms()
  }
}

onMounted(loadPrograms)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Programs</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add
      </button>
    </div>
    <ProgramFilterBar
      :search="searchInput"
      :stage="programFilters.stage"
      :status="programFilters.status"
      @update:search="updateSearchInput"
      @update:stage="changeStage"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="PROGRAM_COLUMNS"
      :rows="programs"
      :row-key="PROGRAM_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-code="{ value }">
        <span class="whitespace-nowrap font-mono text-xs font-semibold">{{ value }}</span>
      </template>
      <template #cell-name="{ row }">
        <span class="block max-w-80 truncate" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-stage="{ value }">
        <span class="whitespace-nowrap">{{ getStageLabel(value) }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
          {{ getStatusChip(value).label }}
        </span>
      </template>
      <template #actions="{ row }">
        <ProgramRowActions
          :program="row"
          @edit="openEditForm(row)"
          @deactivate="requestStatusChange(row)"
          @reactivate="requestStatusChange(row)"
          @delete="requestDelete(row)"
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

  <Modal :is-open="isFormOpen" :title="formTitle" @close="closeForm">
    <form :id="PROGRAM_FORM_ID" novalidate @submit.prevent="saveProgram">
      <ProgramFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeForm">
        Cancel
      </button>
      <button type="submit" :form="PROGRAM_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>

  <ConfirmDialog
    :is-open="isStatusConfirmOpen"
    :title="statusTitle"
    :message="statusMessage"
    :confirm-label="statusConfirmLabel"
    :is-destructive="isDeactivating"
    :is-loading="isChangingStatus"
    @confirm="confirmStatusChange"
    @cancel="cancelStatusChange"
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
