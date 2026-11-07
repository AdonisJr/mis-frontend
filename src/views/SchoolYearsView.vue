<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { CircleCheck, Pencil, Plus, Trash2 } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import SchoolYearFormFields from '@/components/SchoolYearFormFields.vue'
import {
  activateSchoolYear,
  createSchoolYear,
  deleteSchoolYear,
  fetchSchoolYears,
  updateSchoolYear,
} from '@/services/schoolYearService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'

const SCHOOL_YEAR_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
  { key: 'description', label: 'Description' },
  { key: 'is_active', label: 'Status' },
]
const MISSING_DESCRIPTION_TEXT = '—'
const SCHOOL_YEAR_ROW_KEY = 'id'
const SCHOOL_YEAR_FORM_ID = 'school-year-form'
const EMPTY_TEXT = 'No school years yet.'
const ADD_TITLE = 'Add school year'
const EDIT_TITLE = 'Edit school year'
const DELETE_TITLE = 'Delete school year'
const DELETE_CONFIRM_LABEL = 'Delete'
const ACTIVE_CHIP = { label: 'Active', colorClass: 'bg-green-100 text-green-800' }
const INACTIVE_CHIP = { label: 'Inactive', colorClass: 'bg-slate-200 text-slate-700' }
const DATE_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/
const DISPLAY_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load school years.'
const REQUIRED_FIELDS_MESSAGE = 'Fill in the required fields.'
const NAME_REQUIRED_MESSAGE = 'Name is required.'
const START_DATE_REQUIRED_MESSAGE = 'Start date is required.'
const END_DATE_REQUIRED_MESSAGE = 'End date is required.'
const CREATE_SUCCESS_MESSAGE = 'School year added.'
const UPDATE_SUCCESS_MESSAGE = 'School year updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the school year.'
const DELETE_SUCCESS_MESSAGE = 'School year deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the school year.'
const ACTIVATE_SUCCESS_MESSAGE = 'Active school year updated.'
const ACTIVATE_FAILED_MESSAGE = 'Could not set the active school year.'
const ACTIVE_DELETE_BLOCKED_MESSAGE = 'The active school year cannot be deleted.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptySchoolYearForm() {
  return { name: '', start_date: '', end_date: '', description: '' }
}

function buildFormFromSchoolYear(schoolYear) {
  return {
    name: schoolYear.name,
    start_date: schoolYear.start_date,
    end_date: schoolYear.end_date,
    description: schoolYear.description ?? '',
  }
}

function findMissingRequiredFields(formValues) {
  const missingFieldErrors = {}
  if (!formValues.name.trim()) missingFieldErrors.name = [NAME_REQUIRED_MESSAGE]
  if (!formValues.start_date) missingFieldErrors.start_date = [START_DATE_REQUIRED_MESSAGE]
  if (!formValues.end_date) missingFieldErrors.end_date = [END_DATE_REQUIRED_MESSAGE]
  return missingFieldErrors
}

function buildSchoolYearPayload(formValues) {
  const trimmedDescription = formValues.description.trim()
  return {
    name: formValues.name.trim(),
    start_date: formValues.start_date,
    end_date: formValues.end_date,
    description: trimmedDescription || null,
  }
}

function formatSchoolYearDate(isoDate) {
  const dateParts = isoDate?.match(DATE_PATTERN)?.groups
  if (!dateParts) return isoDate
  const utcTimestamp = Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day))
  return DISPLAY_DATE_FORMAT.format(utcTimestamp)
}

function getStatusChip(isActive) {
  if (isActive) return ACTIVE_CHIP
  return INACTIVE_CHIP
}

const schoolYears = ref([])
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingSchoolYear = ref(null)
const formValues = ref(createEmptySchoolYearForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const deletingSchoolYear = ref(null)
const isDeleting = ref(false)
const activatingSchoolYearId = ref(null)

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const formTitle = computed(() => (editingSchoolYear.value ? EDIT_TITLE : ADD_TITLE))
const isConfirmOpen = computed(() => deletingSchoolYear.value !== null)
const deleteMessage = computed(() => {
  if (!deletingSchoolYear.value) return ''
  return `Delete "${deletingSchoolYear.value.name}"? This cannot be undone.`
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadSchoolYears() {
  isListLoading.value = true
  try {
    const listResponse = await fetchSchoolYears()
    schoolYears.value = listResponse?.school_years ?? []
  } catch (error) {
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    isListLoading.value = false
  }
}

function openCreateForm() {
  editingSchoolYear.value = null
  formValues.value = createEmptySchoolYearForm()
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(schoolYear) {
  editingSchoolYear.value = schoolYear
  formValues.value = buildFormFromSchoolYear(schoolYear)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function resetForm() {
  isFormOpen.value = false
  editingSchoolYear.value = null
  formValues.value = createEmptySchoolYearForm()
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitSchoolYearForm() {
  const schoolYearPayload = buildSchoolYearPayload(formValues.value)
  if (editingSchoolYear.value) return updateSchoolYear(editingSchoolYear.value.id, schoolYearPayload)
  return createSchoolYear(schoolYearPayload)
}

function syncActiveSchoolYear(savedSchoolYear) {
  if (!savedSchoolYear?.is_active) return
  schoolYearStore.replaceActiveSchoolYear(savedSchoolYear)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadSchoolYears()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveSchoolYear() {
  if (isSaving.value) return
  fieldErrors.value = findMissingRequiredFields(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(REQUIRED_FIELDS_MESSAGE)
    return
  }
  const isEditing = Boolean(editingSchoolYear.value)
  isSaving.value = true
  try {
    const saveResponse = await submitSchoolYearForm()
    syncActiveSchoolYear(saveResponse?.school_year)
    resetForm()
    toast.success(isEditing ? UPDATE_SUCCESS_MESSAGE : CREATE_SUCCESS_MESSAGE)
    loadSchoolYears()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestDelete(schoolYear) {
  if (schoolYear.is_active) return
  deletingSchoolYear.value = schoolYear
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingSchoolYear.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingSchoolYear.value) return
  isDeleting.value = true
  try {
    await deleteSchoolYear(deletingSchoolYear.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingSchoolYear.value = null
    loadSchoolYears()
  }
}

async function activateRow(schoolYear) {
  if (activatingSchoolYearId.value !== null || schoolYear.is_active) return
  activatingSchoolYearId.value = schoolYear.id
  try {
    const activateResponse = await activateSchoolYear(schoolYear.id)
    schoolYearStore.replaceActiveSchoolYear(activateResponse?.school_year)
    toast.success(ACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, ACTIVATE_FAILED_MESSAGE)
  } finally {
    activatingSchoolYearId.value = null
    loadSchoolYears()
  }
}

onMounted(loadSchoolYears)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">School years</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add
      </button>
    </div>
    <DataTable
      :columns="SCHOOL_YEAR_COLUMNS"
      :rows="schoolYears"
      :row-key="SCHOOL_YEAR_ROW_KEY"
      :empty-text="EMPTY_TEXT"
      :is-loading="isListLoading"
    >
      <template #cell-name="{ value }">
        <span class="block max-w-64 truncate font-semibold" :title="value">{{ value }}</span>
      </template>
      <template #cell-start_date="{ value }">
        <span class="whitespace-nowrap tabular-nums">{{ formatSchoolYearDate(value) }}</span>
      </template>
      <template #cell-end_date="{ value }">
        <span class="whitespace-nowrap tabular-nums">{{ formatSchoolYearDate(value) }}</span>
      </template>
      <template #cell-description="{ value }">
        <span v-if="value" class="block max-w-80 truncate text-ink-muted" :title="value">{{ value }}</span>
        <span v-else class="text-ink-muted" aria-label="No description">{{ MISSING_DESCRIPTION_TEXT }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
          {{ getStatusChip(value).label }}
        </span>
      </template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-2">
          <button
            v-if="!row.is_active"
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-ink"
            :aria-label="`Set ${row.name} as the active school year`"
            :disabled="activatingSchoolYearId !== null"
            @click="activateRow(row)"
          >
            <CircleCheck :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">{{ activatingSchoolYearId === row.id ? 'Setting…' : 'Set active' }}</span>
          </button>
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-ink"
            :aria-label="`Edit ${row.name}`"
            @click="openEditForm(row)"
          >
            <Pencil :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-red-700"
            :aria-label="`Delete ${row.name}`"
            :disabled="row.is_active"
            :title="row.is_active ? ACTIVE_DELETE_BLOCKED_MESSAGE : undefined"
            @click="requestDelete(row)"
          >
            <Trash2 :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Delete</span>
          </button>
        </div>
      </template>
    </DataTable>
  </section>

  <Modal :is-open="isFormOpen" :title="formTitle" @close="closeForm">
    <form :id="SCHOOL_YEAR_FORM_ID" novalidate @submit.prevent="saveSchoolYear">
      <SchoolYearFormFields
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
      <button type="submit" :form="SCHOOL_YEAR_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
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
