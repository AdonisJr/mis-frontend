<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { cancelPromissoryNote } from '@/services/paymentHoldService.js'
import { buildCancelPromptText } from '@/utils/paymentHoldDisplay.js'
import { CANCEL_REASON_MAX_LENGTH, findCancelReasonError } from '@/utils/promissoryNoteForm.js'

const FORM_ID = 'promissory-note-cancel-form'
const REASON_ID = 'promissory-note-cancel-reason'
const REASON_ERROR_ID = 'promissory-note-cancel-reason-error'
const MODAL_TITLE = 'Cancel promissory note'
const REASON_LABEL = 'Reason'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404
const REASON_FIELD = 'cancel_reason'

const CANCEL_SUCCESS_MESSAGE = 'Promissory note cancelled.'
const CANCEL_FAILED_MESSAGE = 'Could not cancel the promissory note.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const DESTRUCTIVE_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  note: { type: Object, default: null },
})

const emit = defineEmits(['close', 'changed'])

const reasonText = ref('')
const reasonError = ref('')
const isCancelling = ref(false)

const toast = useToast()

const promptText = computed(() => buildCancelPromptText(props.note))

function resetModal() {
  reasonText.value = ''
  reasonError.value = ''
  isCancelling.value = false
}

function closeModal() {
  if (isCancelling.value) return
  emit('close')
}

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function applyCancelError(error) {
  const status = error.response?.status
  const reasonMessages = error.response?.data?.errors?.[REASON_FIELD]
  if (status === HTTP_UNPROCESSABLE_ENTITY && reasonMessages) reasonError.value = reasonMessages[0]
  toastRequestError(error, CANCEL_FAILED_MESSAGE)
  if (reasonError.value !== '') return
  const isStateChange = status === HTTP_UNPROCESSABLE_ENTITY || status === HTTP_NOT_FOUND || status === HTTP_FORBIDDEN
  if (isStateChange) emit('changed')
}

async function confirmCancel() {
  if (isCancelling.value || !props.note) return
  reasonError.value = findCancelReasonError(reasonText.value)
  if (reasonError.value !== '') return
  isCancelling.value = true
  try {
    await cancelPromissoryNote(props.note.id, { [REASON_FIELD]: reasonText.value.trim() })
    toast.success(CANCEL_SUCCESS_MESSAGE)
    emit('changed')
  } catch (error) {
    applyCancelError(error)
  } finally {
    isCancelling.value = false
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
    <form :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="confirmCancel">
      <p class="text-sm text-ink">{{ promptText }}</p>
      <div>
        <label :for="REASON_ID" class="mb-1 block text-sm font-semibold text-ink">{{ REASON_LABEL }}</label>
        <textarea
          :id="REASON_ID"
          v-model="reasonText"
          rows="3"
          required
          :maxlength="CANCEL_REASON_MAX_LENGTH"
          class="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page"
          :disabled="isCancelling"
          :aria-invalid="reasonError !== ''"
          :aria-describedby="reasonError !== '' ? REASON_ERROR_ID : undefined"
        ></textarea>
        <p v-if="reasonError !== ''" :id="REASON_ERROR_ID" role="alert" class="mt-1 text-xs text-red-700">
          {{ reasonError }}
        </p>
      </div>
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isCancelling" @click="closeModal">
        Keep note
      </button>
      <button type="submit" :form="FORM_ID" :class="DESTRUCTIVE_BUTTON_CLASS" :disabled="isCancelling">
        <template v-if="isCancelling">Cancelling…</template>
        <template v-else>Cancel note</template>
      </button>
    </template>
  </Modal>
</template>
