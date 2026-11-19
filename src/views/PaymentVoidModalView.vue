<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import { voidPayment } from '@/services/paymentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { buildVoidPromptText } from '@/utils/paymentDisplay.js'
import { VOID_REASON_MAX_LENGTH, findVoidReasonError } from '@/utils/paymentForm.js'

const FORM_ID = 'payment-void-form'
const REASON_ID = 'payment-void-reason'
const REASON_ERROR_ID = 'payment-void-reason-error'
const MODAL_TITLE = 'Void payment'
const REASON_LABEL = 'Reason'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404
const REASON_FIELD = 'void_reason'

const VOID_SUCCESS_MESSAGE = 'Payment voided.'
const VOID_FAILED_MESSAGE = 'Could not void the payment.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const DESTRUCTIVE_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  payment: { type: Object, default: null },
})

const emit = defineEmits(['close', 'changed'])

const reasonText = ref('')
const reasonError = ref('')
const isVoiding = ref(false)

const toast = useToast()

const promptText = computed(() => buildVoidPromptText(props.payment))

function resetModal() {
  reasonText.value = ''
  reasonError.value = ''
  isVoiding.value = false
}

function closeModal() {
  if (isVoiding.value) return
  emit('close')
}

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function applyVoidError(error) {
  const status = error.response?.status
  const reasonMessages = error.response?.data?.errors?.[REASON_FIELD]
  if (status === HTTP_UNPROCESSABLE_ENTITY && reasonMessages) reasonError.value = reasonMessages[0]
  toastRequestError(error, VOID_FAILED_MESSAGE)
  if (reasonError.value !== '') return
  const isStateChange = status === HTTP_UNPROCESSABLE_ENTITY || status === HTTP_NOT_FOUND || status === HTTP_FORBIDDEN
  if (isStateChange) emit('changed')
}

async function confirmVoid() {
  if (isVoiding.value || !props.payment) return
  reasonError.value = findVoidReasonError(reasonText.value)
  if (reasonError.value !== '') return
  isVoiding.value = true
  try {
    await voidPayment(props.payment.id, { [REASON_FIELD]: reasonText.value.trim() })
    toast.success(VOID_SUCCESS_MESSAGE)
    emit('changed')
  } catch (error) {
    applyVoidError(error)
  } finally {
    isVoiding.value = false
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
    <form :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="confirmVoid">
      <p class="text-sm text-ink">{{ promptText }}</p>
      <div>
        <label :for="REASON_ID" class="mb-1 block text-sm font-semibold text-ink">{{ REASON_LABEL }}</label>
        <textarea
          :id="REASON_ID"
          v-model="reasonText"
          rows="3"
          required
          :maxlength="VOID_REASON_MAX_LENGTH"
          class="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page"
          :disabled="isVoiding"
          :aria-invalid="reasonError !== ''"
          :aria-describedby="reasonError !== '' ? REASON_ERROR_ID : undefined"
        ></textarea>
        <p v-if="reasonError !== ''" :id="REASON_ERROR_ID" role="alert" class="mt-1 text-xs text-red-700">
          {{ reasonError }}
        </p>
      </div>
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isVoiding" @click="closeModal">Cancel</button>
      <button type="submit" :form="FORM_ID" :class="DESTRUCTIVE_BUTTON_CLASS" :disabled="isVoiding">
        <template v-if="isVoiding">Voiding…</template>
        <template v-else>Void payment</template>
      </button>
    </template>
  </Modal>
</template>
