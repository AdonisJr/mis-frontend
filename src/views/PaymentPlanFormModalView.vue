<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import PaymentPlanDueDateEditor from '@/components/PaymentPlanDueDateEditor.vue'
import PaymentPlanFormFields from '@/components/PaymentPlanFormFields.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { createPaymentPlan, fetchPaymentPlan, updatePaymentPlan } from '@/services/paymentPlanService.js'
import {
  buildFormFromPaymentPlan,
  buildPaymentPlanPayload,
  clearUnfitPlanFields,
  createEmptyPaymentPlanForm,
  findPaymentPlanFormErrors,
} from '@/utils/paymentPlanForm.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const FORM_ID = 'payment-plan-form'
const ADD_TITLE = 'Add payment plan'
const EDIT_TITLE = 'Edit payment plan'
const LOADING_TEXT = 'Loading…'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load the payment plan.'
const SAVE_FAILED_MESSAGE = 'Could not save the payment plan.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Payment plan added.'
const UPDATE_SUCCESS_MESSAGE = 'Payment plan updated.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  paymentPlan: { type: Object, default: null },
  schoolYears: { type: Array, required: true },
  defaultSchoolYearId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createEmptyPaymentPlanForm(''))
const fieldErrors = ref({})
const isLoading = ref(false)
const isSaving = ref(false)
let loadRequestId = 0

const toast = useToast()

const isCreating = computed(() => props.paymentPlan === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const isBusy = computed(() => isLoading.value || isSaving.value)
const formSchoolYear = computed(
  () =>
    props.schoolYears.find((schoolYear) => toRecordId(schoolYear.id) === toRecordId(formValues.value.school_year_id)) ??
    null,
)
const schoolYearLabel = computed(() => formSchoolYear.value?.name ?? NO_VALUE_LABEL)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function applyLoadError(error) {
  toastRequestError(error, LOAD_FAILED_MESSAGE)
  if (error.response?.status !== HTTP_NOT_FOUND) return
  emit('saved')
  emit('close')
}

async function loadPaymentPlanForm() {
  if (isCreating.value) return
  const requestId = ++loadRequestId
  isLoading.value = true
  try {
    const planResponse = await fetchPaymentPlan(props.paymentPlan.id)
    if (requestId !== loadRequestId) return
    formValues.value = buildFormFromPaymentPlan(planResponse?.payment_plan)
  } catch (error) {
    if (requestId !== loadRequestId) return
    applyLoadError(error)
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

function resetModal() {
  formValues.value = createEmptyPaymentPlanForm(props.defaultSchoolYearId)
  fieldErrors.value = {}
  isSaving.value = false
  loadPaymentPlanForm()
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  formValues.value = clearUnfitPlanFields(nextFormValues)
}

function updateDueDates(nextDueDates) {
  updateFormValues({ ...formValues.value, due_dates: nextDueDates })
}

function submitPaymentPlanForm() {
  const paymentPlanPayload = buildPaymentPlanPayload(formValues.value)
  if (!isCreating.value) return updatePaymentPlan(props.paymentPlan.id, paymentPlanPayload)
  return createPaymentPlan(paymentPlanPayload)
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

async function savePaymentPlan() {
  if (isBusy.value) return
  fieldErrors.value = findPaymentPlanFormErrors(formValues.value, formSchoolYear.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitPaymentPlanForm()
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
    <form v-else :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="savePaymentPlan">
      <PaymentPlanFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :school-year-label="schoolYearLabel"
        @update:model-value="updateFormValues"
      >
        <template #due-dates>
          <PaymentPlanDueDateEditor
            :model-value="formValues.due_dates"
            :field-errors="fieldErrors"
            :is-disabled="isSaving"
            :min-date="formSchoolYear?.start_date ?? ''"
            :max-date="formSchoolYear?.end_date ?? ''"
            @update:model-value="updateDueDates"
          />
        </template>
      </PaymentPlanFormFields>
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
