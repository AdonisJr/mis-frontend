<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import PromissoryNoteFormFields from '@/components/PromissoryNoteFormFields.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { createPromissoryNote } from '@/services/paymentHoldService.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import {
  applyNoteYearChange,
  buildNotePayload,
  buildNoteRules,
  createNoteForm,
  findBalanceYear,
  findNoteFormErrors,
} from '@/utils/promissoryNoteForm.js'

const FORM_ID = 'promissory-note-grant-form'
const MODAL_TITLE = 'Grant promissory note'
const HTTP_UNPROCESSABLE_ENTITY = 422

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SAVE_SUCCESS_MESSAGE = 'Promissory note granted.'
const SAVE_FAILED_MESSAGE = 'Could not grant the promissory note.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  studentId: { type: Number, required: true },
  balanceYears: { type: Array, required: true },
  schoolYearId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'granted'])

const formValues = ref(createNoteForm([], ''))
const fieldErrors = ref({})
const isSaving = ref(false)
const todayIso = ref('')

const toast = useToast()

function resetModal() {
  todayIso.value = toIsoDate(new Date())
  formValues.value = createNoteForm(props.balanceYears, props.schoolYearId)
  fieldErrors.value = {}
  isSaving.value = false
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  const isYearChanged = nextFormValues.school_year_id !== formValues.value.school_year_id
  formValues.value = isYearChanged ? applyNoteYearChange(nextFormValues, props.balanceYears) : nextFormValues
}

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function applySaveError(error) {
  if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY) fieldErrors.value = error.response.data?.errors ?? {}
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

function validateForm() {
  const selectedYear = findBalanceYear(props.balanceYears, formValues.value.school_year_id)
  fieldErrors.value = findNoteFormErrors(formValues.value, buildNoteRules(selectedYear?.balance, todayIso.value))
  if (Object.keys(fieldErrors.value).length === 0) return true
  toast.error(INVALID_FIELDS_MESSAGE)
  return false
}

async function saveNote() {
  if (isSaving.value || !validateForm()) return
  isSaving.value = true
  try {
    const saveResponse = await createPromissoryNote(buildNotePayload(formValues.value, props.studentId))
    toast.success(SAVE_SUCCESS_MESSAGE)
    emit('granted', saveResponse.promissory_note)
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (isNowOpen) resetModal()
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="MODAL_TITLE" @close="closeModal">
    <form :id="FORM_ID" novalidate @submit.prevent="saveNote">
      <PromissoryNoteFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :balance-years="balanceYears"
        :min-date="todayIso"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving" @click="closeModal">Cancel</button>
      <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Grant note' }}
      </button>
    </template>
  </Modal>
</template>
