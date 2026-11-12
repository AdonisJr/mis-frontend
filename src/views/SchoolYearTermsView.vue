<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import TermFormFields from '@/components/TermFormFields.vue'
import TermRowActions from '@/components/TermRowActions.vue'
import { activateTerm, createTerm, deleteTerm, fetchTerms, updateTerm } from '@/services/termService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { ACTIVE_CHIP } from '@/utils/employeeDisplay.js'
import { buildTermActivateMessage, buildTermDeleteMessage } from '@/utils/termDisplay.js'
import {
  buildFormFromTerm,
  buildTermPayload,
  canReplaceTermDates,
  createEmptyTermForm,
  createSuggestedTermForm,
  findTermConflictErrors,
  findTermFormErrors,
  getAllowedTermNumbers,
  hasTermChanged,
  listOtherTerms,
  suggestTermDates,
  withTermDates,
} from '@/utils/termForm.js'

const TERM_FORM_ID = 'term-form'
const LIST_TITLE_PREFIX = 'Terms — '
const ADD_TITLE = 'Add term'
const EDIT_TITLE = 'Edit term'
const DELETE_TITLE = 'Delete term'
const DELETE_CONFIRM_LABEL = 'Delete'
const ACTIVATE_TITLE = 'Set active term'
const ACTIVATE_CONFIRM_LABEL = 'Set active'
const ADD_LABEL = 'Add term'
const CLOSE_LABEL = 'Close'
const LOADING_TEXT = 'Loading…'
const EMPTY_TEXT = 'No terms yet.'
const INACTIVE_YEAR_HINT = 'Only terms of the active school year can be set active.'
const ALL_TERMS_ADDED_TITLE = 'Every term of this school year is already added.'
const DATE_RANGE_SEPARATOR = ' – '
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load the terms.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Term added.'
const UPDATE_SUCCESS_MESSAGE = 'Term updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the term.'
const DELETE_SUCCESS_MESSAGE = 'Term deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the term.'
const ACTIVATE_SUCCESS_MESSAGE = 'Active term updated.'
const ACTIVATE_FAILED_MESSAGE = 'Could not set the active term.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({ schoolYear: { type: Object, default: null } })
const emit = defineEmits(['close', 'terms-changed'])

const terms = ref([])
const isTermsLoading = ref(false)
const isFormOpen = ref(false)
const editingTerm = ref(null)
const formValues = ref(createEmptyTermForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const deletingTerm = ref(null)
const isDeleting = ref(false)
const activatingTerm = ref(null)
const isActivating = ref(false)
let termsRequestId = 0

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const termType = computed(() => props.schoolYear?.term_type ?? '')
const listTitle = computed(() => LIST_TITLE_PREFIX + (props.schoolYear?.name ?? ''))
const canSetActive = computed(() => props.schoolYear?.is_active === true)
const isAllTermsAdded = computed(() => terms.value.length >= getAllowedTermNumbers(termType.value).length)
const isDeleteConfirmOpen = computed(() => deletingTerm.value !== null)
const isActivateConfirmOpen = computed(() => activatingTerm.value !== null)
const isListOpen = computed(
  () => props.schoolYear !== null && !isFormOpen.value && !isDeleteConfirmOpen.value && !isActivateConfirmOpen.value,
)
const formTitle = computed(() => (editingTerm.value ? EDIT_TITLE : ADD_TITLE))
const deleteMessage = computed(() => buildTermDeleteMessage(deletingTerm.value, props.schoolYear))
const activateMessage = computed(() => buildTermActivateMessage(activatingTerm.value, props.schoolYear))

function formatTermDates(term) {
  return formatDisplayDate(term.start_date) + DATE_RANGE_SEPARATOR + formatDisplayDate(term.end_date)
}

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadTerms() {
  const requestId = ++termsRequestId
  isTermsLoading.value = true
  try {
    const listResponse = await fetchTerms(props.schoolYear.id)
    // the modal was closed or reopened for another year while this request ran
    if (requestId !== termsRequestId) return
    terms.value = listResponse?.terms ?? []
  } catch (error) {
    if (requestId !== termsRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === termsRequestId) isTermsLoading.value = false
  }
}

function reloadTermsAndCounts() {
  loadTerms()
  emit('terms-changed')
}

function resetForm() {
  isFormOpen.value = false
  editingTerm.value = null
  formValues.value = createEmptyTermForm()
  fieldErrors.value = {}
}

function resetTermsState() {
  termsRequestId += 1
  terms.value = []
  isTermsLoading.value = false
  resetForm()
  deletingTerm.value = null
  activatingTerm.value = null
}

function openCreateForm() {
  editingTerm.value = null
  formValues.value = createSuggestedTermForm(props.schoolYear, terms.value)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(term) {
  editingTerm.value = term
  formValues.value = buildFormFromTerm(term)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  const previousValues = formValues.value
  formValues.value = nextFormValues
  if (editingTerm.value || !hasTermChanged(previousValues, nextFormValues)) return
  if (!canReplaceTermDates(nextFormValues, suggestTermDates(props.schoolYear, previousValues.term_number))) return
  formValues.value = withTermDates(nextFormValues, suggestTermDates(props.schoolYear, nextFormValues.term_number))
}

function findTermErrors() {
  const formErrors = findTermFormErrors(formValues.value, props.schoolYear)
  if (Object.keys(formErrors).length > 0) return formErrors
  return findTermConflictErrors(formValues.value, listOtherTerms(terms.value, editingTerm.value))
}

function submitTermForm() {
  const termPayload = buildTermPayload(formValues.value)
  if (editingTerm.value) return updateTerm(editingTerm.value.id, termPayload)
  return createTerm(props.schoolYear.id, termPayload)
}

function syncActiveTerm(savedTerm) {
  if (!savedTerm?.is_active) return
  schoolYearStore.replaceActiveTerm(savedTerm)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    reloadTermsAndCounts()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveTerm() {
  if (isSaving.value) return
  fieldErrors.value = findTermErrors()
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const isEditing = Boolean(editingTerm.value)
  isSaving.value = true
  try {
    const saveResponse = await submitTermForm()
    syncActiveTerm(saveResponse?.term)
    resetForm()
    toast.success(isEditing ? UPDATE_SUCCESS_MESSAGE : CREATE_SUCCESS_MESSAGE)
    reloadTermsAndCounts()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestDelete(term) {
  if (term.is_active) return
  deletingTerm.value = term
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingTerm.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingTerm.value) return
  isDeleting.value = true
  try {
    await deleteTerm(deletingTerm.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingTerm.value = null
    reloadTermsAndCounts()
  }
}

function requestActivate(term) {
  if (term.is_active || !canSetActive.value) return
  activatingTerm.value = term
}

function cancelActivate() {
  if (isActivating.value) return
  activatingTerm.value = null
}

async function confirmActivate() {
  if (isActivating.value || !activatingTerm.value) return
  isActivating.value = true
  try {
    const activateResponse = await activateTerm(activatingTerm.value.id)
    schoolYearStore.replaceActiveTerm(activateResponse?.term)
    toast.success(ACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, ACTIVATE_FAILED_MESSAGE)
  } finally {
    isActivating.value = false
    activatingTerm.value = null
    loadTerms()
  }
}

watch(
  () => props.schoolYear,
  (nextSchoolYear) => {
    resetTermsState()
    if (nextSchoolYear !== null) loadTerms()
  },
)
</script>

<template>
  <Modal :is-open="isListOpen" :title="listTitle" @close="emit('close')">
    <p v-if="!canSetActive" class="mb-3 text-xs text-ink-muted">{{ INACTIVE_YEAR_HINT }}</p>
    <p v-if="isTermsLoading && terms.length === 0" class="py-6 text-center text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
    <p v-else-if="terms.length === 0" class="py-6 text-center text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>
    <ul v-else :aria-busy="isTermsLoading">
      <li
        v-for="term in terms"
        :key="term.id"
        class="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0"
      >
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            {{ term.label }}
            <span v-if="term.is_active" class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="ACTIVE_CHIP.colorClass">
              {{ ACTIVE_CHIP.label }}
            </span>
          </p>
          <p class="text-xs text-ink-muted tabular-nums">{{ formatTermDates(term) }}</p>
        </div>
        <TermRowActions
          :term="term"
          :can-set-active="canSetActive"
          @edit="openEditForm(term)"
          @delete="requestDelete(term)"
          @activate="requestActivate(term)"
        />
      </li>
    </ul>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" @click="emit('close')">
        {{ CLOSE_LABEL }}
      </button>
      <button
        type="button"
        :class="PRIMARY_BUTTON_CLASS"
        :disabled="isTermsLoading || isAllTermsAdded"
        :title="isAllTermsAdded ? ALL_TERMS_ADDED_TITLE : undefined"
        @click="openCreateForm"
      >
        <Plus :size="16" aria-hidden="true" />
        {{ ADD_LABEL }}
      </button>
    </template>
  </Modal>

  <Modal :is-open="isFormOpen" :title="formTitle" @close="closeForm">
    <form :id="TERM_FORM_ID" novalidate @submit.prevent="saveTerm">
      <TermFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :term-type="termType"
        :is-disabled="isSaving"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeForm">
        Cancel
      </button>
      <button type="submit" :form="TERM_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
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

  <ConfirmDialog
    :is-open="isActivateConfirmOpen"
    :title="ACTIVATE_TITLE"
    :message="activateMessage"
    :confirm-label="ACTIVATE_CONFIRM_LABEL"
    :is-loading="isActivating"
    @confirm="confirmActivate"
    @cancel="cancelActivate"
  />
</template>
