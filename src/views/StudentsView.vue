<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import StudentFilterBar from '@/components/StudentFilterBar.vue'
import StudentFormFields from '@/components/StudentFormFields.vue'
import TablePagination from '@/components/TablePagination.vue'
import { createStudent, deleteStudent, fetchStudents, updateStudent } from '@/services/studentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  FIRST_PAGE,
  applyGradeLevelChange,
  applyPageChange,
  applySearchChange,
  buildStudentListParams,
  createStudentFilters,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import {
  buildFormFromStudent,
  buildStudentPayload,
  createEmptyStudentForm,
  findStudentFormErrors,
} from '@/utils/studentForm.js'

const STUDENT_COLUMNS = [
  { key: 'lrn', label: 'LRN' },
  { key: 'name', label: 'Name' },
  { key: 'level_section', label: 'Level & section' },
  { key: 'guardian_contact', label: 'Guardian contact' },
  { key: 'rfid', label: 'RFID' },
]
const STUDENT_ROW_KEY = 'id'
const STUDENT_FORM_ID = 'student-form'
const EMPTY_TEXT = 'No students yet.'
const NO_MATCH_TEXT = 'No students match the search or level.'
const NO_CARD_TEXT = 'No card'
const NAME_SEPARATOR = ', '
const LEVEL_SECTION_SEPARATOR = ' · '
const ADD_TITLE = 'Add student'
const EDIT_TITLE = 'Edit student'
const DELETE_TITLE = 'Delete student'
const DELETE_CONFIRM_LABEL = 'Delete'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load students.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Student added.'
const UPDATE_SUCCESS_MESSAGE = 'Student updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the student.'
const DELETE_SUCCESS_MESSAGE = 'Student deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the student.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

function formatStudentName(student) {
  const fullName = `${student.last_name}${NAME_SEPARATOR}${student.first_name}`
  const middleName = (student.middle_name ?? '').trim()
  if (!middleName) return fullName
  return `${fullName} ${middleName.charAt(0).toUpperCase()}.`
}

function formatLevelAndSection(student) {
  if (!(student.section ?? '').trim()) return student.grade_level
  return `${student.grade_level}${LEVEL_SECTION_SEPARATOR}${student.section}`
}

const students = ref([])
const pageMeta = ref(createEmptyPageMeta())
const studentFilters = ref(createStudentFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingStudent = ref(null)
const formValues = ref(createEmptyStudentForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const deletingStudent = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const formTitle = computed(() => (editingStudent.value ? EDIT_TITLE : ADD_TITLE))
const isConfirmOpen = computed(() => deletingStudent.value !== null)
const deleteMessage = computed(() => {
  const student = deletingStudent.value
  if (!student) return ''
  return `Delete ${formatStudentName(student)} (LRN ${student.lrn})? This cannot be undone.`
})
const emptyText = computed(() => {
  const hasActiveFilter = studentFilters.value.search !== '' || studentFilters.value.gradeLevel !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

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
    const listResponse = await fetchStudents(buildStudentListParams(studentFilters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      studentFilters.value = applyPageChange(studentFilters.value, listResponse.meta.last_page)
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
  if (normalizeSearchText(searchInput.value) === studentFilters.value.search) return
  studentFilters.value = applySearchChange(studentFilters.value, searchInput.value)
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

function changeGradeLevel(nextGradeLevel) {
  studentFilters.value = applyGradeLevelChange(studentFilters.value, nextGradeLevel)
  loadStudents()
}

function changePage(nextPage) {
  studentFilters.value = applyPageChange(studentFilters.value, nextPage)
  loadStudents()
}

function openCreateForm() {
  editingStudent.value = null
  formValues.value = createEmptyStudentForm()
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(student) {
  editingStudent.value = student
  formValues.value = buildFormFromStudent(student)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function resetForm() {
  isFormOpen.value = false
  editingStudent.value = null
  formValues.value = createEmptyStudentForm()
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitStudentForm() {
  const studentPayload = buildStudentPayload(formValues.value)
  if (editingStudent.value) return updateStudent(editingStudent.value.id, studentPayload)
  return createStudent(studentPayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadStudents()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveStudent() {
  if (isSaving.value) return
  fieldErrors.value = findStudentFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const isEditing = Boolean(editingStudent.value)
  isSaving.value = true
  try {
    await submitStudentForm()
    resetForm()
    toast.success(isEditing ? UPDATE_SUCCESS_MESSAGE : CREATE_SUCCESS_MESSAGE)
    if (!isEditing) studentFilters.value = applyPageChange(studentFilters.value, FIRST_PAGE)
    loadStudents()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestDelete(student) {
  deletingStudent.value = student
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingStudent.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingStudent.value) return
  isDeleting.value = true
  try {
    await deleteStudent(deletingStudent.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingStudent.value = null
    loadStudents()
  }
}

onMounted(loadStudents)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Students</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add
      </button>
    </div>
    <StudentFilterBar
      :search="searchInput"
      :grade-level="studentFilters.gradeLevel"
      @update:search="updateSearchInput"
      @update:grade-level="changeGradeLevel"
    />
    <DataTable
      :columns="STUDENT_COLUMNS"
      :rows="students"
      :row-key="STUDENT_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-lrn="{ value }">
        <span class="whitespace-nowrap font-mono text-xs tabular-nums">{{ value }}</span>
      </template>
      <template #cell-name="{ row }">
        <span class="block max-w-64 truncate font-semibold" :title="formatStudentName(row)">
          {{ formatStudentName(row) }}
        </span>
      </template>
      <template #cell-level_section="{ row }">
        <span class="whitespace-nowrap">{{ formatLevelAndSection(row) }}</span>
      </template>
      <template #cell-guardian_contact="{ value }">
        <span class="whitespace-nowrap tabular-nums">{{ value }}</span>
      </template>
      <template #cell-rfid="{ value }">
        <span v-if="value" class="font-mono text-xs">{{ value }}</span>
        <span v-else class="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          {{ NO_CARD_TEXT }}
        </span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-ink"
            :aria-label="`Edit ${formatStudentName(row)}`"
            @click="openEditForm(row)"
          >
            <Pencil :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-red-700"
            :aria-label="`Delete ${formatStudentName(row)}`"
            @click="requestDelete(row)"
          >
            <Trash2 :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Delete</span>
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

  <Modal :is-open="isFormOpen" :title="formTitle" @close="closeForm">
    <form :id="STUDENT_FORM_ID" novalidate @submit.prevent="saveStudent">
      <StudentFormFields
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
      <button type="submit" :form="STUDENT_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>

  <ConfirmDialog
    :is-open="isConfirmOpen"
    :title="DELETE_TITLE"
    :message="deleteMessage"
    :confirm-label="DELETE_CONFIRM_LABEL"
    is-destructive
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>
