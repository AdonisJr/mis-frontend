<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import FeeScheduleFormFields from '@/components/FeeScheduleFormFields.vue'
import FeeScheduleLineEditor from '@/components/FeeScheduleLineEditor.vue'
import FeeScheduleTotals from '@/components/FeeScheduleTotals.vue'
import { fetchAllFeeItems } from '@/services/feeItemService.js'
import {
  createFeeSchedule,
  fetchFeeSchedule,
  updateFeeSchedule,
} from '@/services/feeScheduleService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  buildFeeSchedulePayload,
  buildFormFromFeeSchedule,
  buildLineItemOptions,
  clearUnfitScheduleProgram,
  createEmptyFeeScheduleForm,
  findFeeScheduleFormErrors,
  isProgramAllowed,
  listScheduleProgramOptions,
} from '@/utils/feeScheduleForm.js'
import { sumScheduleLines } from '@/utils/feeScheduleTotals.js'
import { findGradeLevel } from '@/utils/sectionForm.js'

const FORM_ID = 'fee-schedule-form'
const ADD_TITLE = 'Add fee schedule'
const EDIT_TITLE = 'Edit fee schedule'
const LOADING_TEXT = 'Loading…'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load the fee schedule or fee items.'
const SAVE_FAILED_MESSAGE = 'Could not save the fee schedule.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Fee schedule added.'
const UPDATE_SUCCESS_MESSAGE = 'Fee schedule updated.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  feeSchedule: { type: Object, default: null },
  schoolYears: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  programs: { type: Array, required: true },
  defaultSchoolYearId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createEmptyFeeScheduleForm(''))
const feeItems = ref([])
const fieldErrors = ref({})
const isLoading = ref(false)
const isSaving = ref(false)
let loadRequestId = 0

const toast = useToast()

const isCreating = computed(() => props.feeSchedule === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const isBusy = computed(() => isLoading.value || isSaving.value)
const formGradeLevel = computed(() => findGradeLevel(props.gradeLevels, formValues.value.grade_level_id))
const programOptions = computed(() => listScheduleProgramOptions(props.programs, formGradeLevel.value))
const isProgramVisible = computed(() => isProgramAllowed(formGradeLevel.value))
const lineItemOptions = computed(() => buildLineItemOptions(feeItems.value, formValues.value.lines))
const lineTotals = computed(() => sumScheduleLines(formValues.value.lines, feeItems.value))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function fetchCurrentSchedule() {
  if (isCreating.value) return null
  return fetchFeeSchedule(props.feeSchedule.id)
}

function applyLoadedForm(scheduleResponse) {
  if (isCreating.value) {
    formValues.value = createEmptyFeeScheduleForm(props.defaultSchoolYearId)
    return
  }
  formValues.value = buildFormFromFeeSchedule(scheduleResponse?.fee_schedule)
}

function applyLoadError(error) {
  toastRequestError(error, LOAD_FAILED_MESSAGE)
  if (error.response?.status !== HTTP_NOT_FOUND) return
  emit('saved')
  emit('close')
}

async function loadModalData() {
  const requestId = ++loadRequestId
  isLoading.value = true
  try {
    const [feeItemResponse, scheduleResponse] = await Promise.all([fetchAllFeeItems(), fetchCurrentSchedule()])
    if (requestId !== loadRequestId) return
    feeItems.value = feeItemResponse?.fee_items ?? []
    applyLoadedForm(scheduleResponse)
  } catch (error) {
    if (requestId !== loadRequestId) return
    applyLoadError(error)
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

function resetModal() {
  formValues.value = createEmptyFeeScheduleForm(props.defaultSchoolYearId)
  feeItems.value = []
  fieldErrors.value = {}
  isSaving.value = false
  loadModalData()
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  const nextGradeLevel = findGradeLevel(props.gradeLevels, nextFormValues.grade_level_id)
  formValues.value = clearUnfitScheduleProgram(nextFormValues, nextGradeLevel)
}

function updateLines(nextLines) {
  formValues.value = { ...formValues.value, lines: nextLines }
}

function submitFeeScheduleForm() {
  const feeSchedulePayload = buildFeeSchedulePayload(formValues.value)
  if (!isCreating.value) return updateFeeSchedule(props.feeSchedule.id, feeSchedulePayload)
  return createFeeSchedule(feeSchedulePayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
  if (status !== HTTP_NOT_FOUND) return
  emit('saved')
  emit('close')
}

async function saveFeeSchedule() {
  if (isBusy.value) return
  fieldErrors.value = findFeeScheduleFormErrors(formValues.value, formGradeLevel.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitFeeScheduleForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    emit('saved')
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (isNowOpen) {
      resetModal()
      return
    }
    // a load still in flight belongs to the closed modal
    loadRequestId += 1
    isLoading.value = false
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="formTitle" @close="closeModal">
    <p v-if="isLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
    <form v-else :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="saveFeeSchedule">
      <FeeScheduleFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :is-key-locked="!isCreating"
        :school-years="schoolYears"
        :grade-levels="gradeLevels"
        :program-options="programOptions"
        :is-program-visible="isProgramVisible"
        @update:model-value="updateFormValues"
      />
      <FeeScheduleLineEditor
        :model-value="formValues.lines"
        :line-item-options="lineItemOptions"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:model-value="updateLines"
      />
      <FeeScheduleTotals :line-totals="lineTotals" />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isBusy">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>
</template>
