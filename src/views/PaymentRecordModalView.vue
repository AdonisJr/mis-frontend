<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ReceiptText } from '@lucide/vue'
import PaymentFormFields from '@/components/PaymentFormFields.vue'
import Modal from '@/components/modal/Modal.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { recordPayment } from '@/services/paymentService.js'
import { PAYMENT_RECEIPT_ROUTE_NAME } from '@/routeNames.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import {
  buildPaymentPayload,
  buildPaymentRules,
  createPaymentForm,
  findPaymentFormErrors,
} from '@/utils/paymentForm.js'

const FORM_ID = 'payment-form'
const RECORD_TITLE = 'Record payment'
const RECORDED_TITLE = 'Payment recorded'
const HTTP_UNPROCESSABLE_ENTITY = 422

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SAVE_FAILED_MESSAGE = 'Could not record the payment.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  assessmentId: { type: Number, required: true },
  balance: { type: String, required: true },
  nextAmountDue: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createPaymentForm('', ''))
const fieldErrors = ref({})
const savedPayment = ref(null)
const isSaving = ref(false)
const todayIso = ref('')

const toast = useToast()

const modalTitle = computed(() => (savedPayment.value ? RECORDED_TITLE : RECORD_TITLE))
const balanceText = computed(() => formatPeso(props.balance))

function resetModal() {
  todayIso.value = toIsoDate(new Date())
  formValues.value = createPaymentForm(props.nextAmountDue, todayIso.value)
  fieldErrors.value = {}
  savedPayment.value = null
  isSaving.value = false
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
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
  const paymentRules = buildPaymentRules(props.balance, todayIso.value)
  fieldErrors.value = findPaymentFormErrors(formValues.value, paymentRules)
  if (Object.keys(fieldErrors.value).length === 0) return true
  toast.error(INVALID_FIELDS_MESSAGE)
  return false
}

async function savePayment() {
  if (isSaving.value || savedPayment.value || !validateForm()) return
  isSaving.value = true
  try {
    const saveResponse = await recordPayment(buildPaymentPayload(formValues.value, props.assessmentId))
    savedPayment.value = saveResponse.payment
    toast.success(`Payment recorded: ${saveResponse.payment.ar_number}.`)
    emit('saved', saveResponse.payment)
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
  <Modal :is-open="isOpen" :title="modalTitle" @close="closeModal">
    <div v-if="savedPayment" class="space-y-3 text-sm">
      <dl class="space-y-2">
        <div class="flex gap-3">
          <dt class="w-32 shrink-0 text-ink-muted">AR no.</dt>
          <dd class="font-mono font-semibold tabular-nums text-ink">{{ savedPayment.ar_number }}</dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-32 shrink-0 text-ink-muted">Amount</dt>
          <dd class="font-semibold tabular-nums text-ink">{{ formatPeso(savedPayment.amount) }}</dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-32 shrink-0 text-ink-muted">Balance after</dt>
          <dd class="font-semibold tabular-nums text-ink">{{ formatPeso(savedPayment.balance_after) }}</dd>
        </div>
      </dl>
    </div>
    <form v-else :id="FORM_ID" novalidate @submit.prevent="savePayment">
      <PaymentFormFields
        v-model="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :balance-text="balanceText"
        :max-date="todayIso"
      />
    </form>
    <template #footer>
      <template v-if="savedPayment">
        <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="closeModal">Done</button>
        <RouterLink
          :to="{ name: PAYMENT_RECEIPT_ROUTE_NAME, params: { paymentId: savedPayment.id } }"
          :class="PRIMARY_BUTTON_CLASS"
        >
          <ReceiptText :size="16" aria-hidden="true" />
          Print receipt
        </RouterLink>
      </template>
      <template v-else>
        <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving" @click="closeModal">Cancel</button>
        <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
          <template v-if="isSaving">Saving…</template>
          <template v-else>Save payment</template>
        </button>
      </template>
    </template>
  </Modal>
</template>
