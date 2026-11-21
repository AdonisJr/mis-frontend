<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import SubjectFilterBar from '@/components/SubjectFilterBar.vue'
import SubjectFormFields from '@/components/SubjectFormFields.vue'
import SubjectRowActions from '@/components/SubjectRowActions.vue'
import { ADMIN_REGISTRAR_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  createSubject,
  deactivateSubject,
  fetchSubjects,
  reactivateSubject,
  updateSubject,
} from '@/services/subjectService.js'
import { getStatusChip } from '@/utils/employeeDisplay.js'
import { applyStatusChange } from '@/utils/employeeSearch.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import {
  SUBJECT_COLUMNS,
  buildSubjectDeactivateMessage,
  buildSubjectReactivateMessage,
  formatWeeklyHours,
  getSubjectTypeLabel,
} from '@/utils/subjectDisplay.js'
import {
  buildFormFromSubject,
  buildSubjectPayload,
  createEmptySubjectForm,
  findSubjectFormErrors,
} from '@/utils/subjectForm.js'
import { applySubjectTypeChange, buildSubjectListParams, createSubjectFilters } from '@/utils/subjectSearch.js'

const SUBJECT_ROW_KEY = 'id'
const SUBJECT_FORM_ID = 'subject-form'
const EMPTY_TEXT = 'No subjects yet.'
const NO_MATCH_TEXT = 'No subjects match the search or filters.'
const ADD_TITLE = 'Add subject'
const EDIT_TITLE = 'Edit subject'
const DEACTIVATE_TITLE = 'Deactivate subject'
const REACTIVATE_TITLE = 'Reactivate subject'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load subjects.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Subject added.'
const UPDATE_SUCCESS_MESSAGE = 'Subject updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the subject.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Subject deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Subject reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the subject status.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const subjects = ref([])
const pageMeta = ref(createEmptyPageMeta())
const subjectFilters = ref(createSubjectFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingSubject = ref(null)
const formValues = ref(createEmptySubjectForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const statusChangeSubject = ref(null)
const isChangingStatus = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const authStore = useAuthStore()

const canEdit = computed(() => authStore.hasAnyRole(ADMIN_REGISTRAR_ROLES))
const isCreating = computed(() => editingSubject.value === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const isStatusConfirmOpen = computed(() => statusChangeSubject.value !== null)
const isDeactivating = computed(() => statusChangeSubject.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildSubjectDeactivateMessage(statusChangeSubject.value)
  return buildSubjectReactivateMessage(statusChangeSubject.value)
})
const emptyText = computed(() => {
  const { search, type, status } = subjectFilters.value
  const hasActiveFilter = search !== '' || type !== '' || status !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadSubjects() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchSubjects(buildSubjectListParams(subjectFilters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      subjectFilters.value = applyPageChange(subjectFilters.value, listResponse.meta.last_page)
      loadSubjects()
      return
    }
    subjects.value = listResponse?.subjects ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === subjectFilters.value.search) return
  subjectFilters.value = applySearchChange(subjectFilters.value, searchInput.value)
  loadSubjects()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeType(nextType) {
  subjectFilters.value = applySubjectTypeChange(subjectFilters.value, nextType)
  loadSubjects()
}

function changeStatus(nextStatus) {
  subjectFilters.value = applyStatusChange(subjectFilters.value, nextStatus)
  loadSubjects()
}

function changePage(nextPage) {
  subjectFilters.value = applyPageChange(subjectFilters.value, nextPage)
  loadSubjects()
}

function openCreateForm() {
  editingSubject.value = null
  formValues.value = createEmptySubjectForm()
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(subject) {
  editingSubject.value = subject
  formValues.value = buildFormFromSubject(subject)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function resetForm() {
  isFormOpen.value = false
  editingSubject.value = null
  formValues.value = createEmptySubjectForm()
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitSubjectForm() {
  const subjectPayload = buildSubjectPayload(formValues.value)
  if (!isCreating.value) return updateSubject(editingSubject.value.id, subjectPayload)
  return createSubject(subjectPayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadSubjects()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveSubject() {
  if (isSaving.value) return
  fieldErrors.value = findSubjectFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitSubjectForm()
    resetForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    if (wasCreating) subjectFilters.value = applyPageChange(subjectFilters.value, FIRST_PAGE)
    loadSubjects()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestStatusChange(subject) {
  statusChangeSubject.value = subject
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangeSubject.value = null
}

function submitStatusChange(subject) {
  if (subject.is_active) return deactivateSubject(subject.id)
  return reactivateSubject(subject.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangeSubject.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangeSubject.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangeSubject.value = null
    loadSubjects()
  }
}

onMounted(loadSubjects)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Subjects</h2>
      <button v-if="canEdit" type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add subject
      </button>
    </div>
    <SubjectFilterBar
      :search="searchInput"
      :type="subjectFilters.type"
      :status="subjectFilters.status"
      @update:search="updateSearchInput"
      @update:type="changeType"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="SUBJECT_COLUMNS"
      :rows="subjects"
      :row-key="SUBJECT_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-xs font-semibold">{{ row.code }}</span>
      </template>
      <template #cell-name="{ row }">
        <span class="block max-w-60 truncate" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-type="{ value }">
        <span class="whitespace-nowrap">{{ getSubjectTypeLabel(value) || NO_VALUE_LABEL }}</span>
      </template>
      <template #cell-weekly_hours="{ value }">
        <span class="tabular-nums">{{ formatWeeklyHours(value) }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
          {{ getStatusChip(value).label }}
        </span>
      </template>
      <template v-if="canEdit" #actions="{ row }">
        <SubjectRowActions
          :subject="row"
          @edit="openEditForm(row)"
          @deactivate="requestStatusChange(row)"
          @reactivate="requestStatusChange(row)"
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
    <form :id="SUBJECT_FORM_ID" novalidate @submit.prevent="saveSubject">
      <SubjectFormFields
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
      <button type="submit" :form="SUBJECT_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
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
</template>
