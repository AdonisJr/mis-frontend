<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ReopenReasonFields from '@/components/ReopenReasonFields.vue'
import { reopenQuarter } from '@/services/gradingService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { buildReopenPayload, findReopenReasonError } from '@/utils/classRecordForm.js'

const REOPEN_FORM_ID = 'class-record-reopen-form'
const REOPEN_TITLE = 'Reopen quarter'
const HTTP_UNPROCESSABLE_ENTITY = 422
const REASON_FIELD = 'reason'
const SAVE_FAILED_MESSAGE = 'Could not reopen the quarter.'
const SAVE_SUCCESS_MESSAGE = 'Quarter reopened.'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  classId: { type: Number, default: null },
  quarter: { type: Number, default: null },
})

const emit = defineEmits(['close', 'reopened'])

const toast = useToast()

const reasonText = ref('')
const errorText = ref('')
const isSaving = ref(false)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function applySaveError(error) {
  const validationErrors = error.response?.data?.errors
  if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors?.[REASON_FIELD]) {
    errorText.value = validationErrors[REASON_FIELD][0]
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveReopen() {
  if (isSaving.value) return
  errorText.value = findReopenReasonError(reasonText.value)
  if (errorText.value !== '') return
  isSaving.value = true
  try {
    await reopenQuarter({ classId: props.classId, quarter: props.quarter }, buildReopenPayload(reasonText.value))
    toast.success(SAVE_SUCCESS_MESSAGE)
    emit('reopened')
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (!isNowOpen) return
    reasonText.value = ''
    errorText.value = ''
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="REOPEN_TITLE" @close="closeModal">
    <form :id="REOPEN_FORM_ID" novalidate @submit.prevent="saveReopen">
      <ReopenReasonFields v-model="reasonText" :error-text="errorText" :is-disabled="isSaving" />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving" @click="closeModal">Cancel</button>
      <button type="submit" :form="REOPEN_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Reopening…' : 'Reopen' }}
      </button>
    </template>
  </Modal>
</template>
