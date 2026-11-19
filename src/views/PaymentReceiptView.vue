<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Printer } from '@lucide/vue'
import PaymentReceiptSheet from '@/components/PaymentReceiptSheet.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchPaymentReceipt } from '@/services/paymentService.js'
import { PAYMENTS_ROUTE_NAME, STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { buildStatementSchoolName } from '@/utils/assessmentDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const NOT_FOUND_TEXT = 'This receipt does not exist.'
const LOADING_TEXT = 'Loading…'
const BACK_TO_PAYMENTS_LABEL = 'Back to payments'
const BACK_TO_LEDGER_LABEL = 'Back to ledger'
const LOAD_FAILED_MESSAGE = 'Could not load the receipt.'

const LINK_CLASS =
  'text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const route = useRoute()
const toast = useToast()

const receipt = ref(null)
const isReceiptLoading = ref(false)
const isNotFound = ref(false)
let receiptRequestId = 0

const paymentId = computed(() => toRecordId(route.params.paymentId))
const schoolName = buildStatementSchoolName(import.meta.env.VITE_SCHOOL_NAME)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadReceipt() {
  const requestId = ++receiptRequestId
  receipt.value = null
  isNotFound.value = false
  if (paymentId.value === null) {
    isNotFound.value = true
    return
  }
  isReceiptLoading.value = true
  try {
    const receiptResponse = await fetchPaymentReceipt(paymentId.value)
    if (requestId !== receiptRequestId) return
    receipt.value = receiptResponse?.receipt ?? null
  } catch (error) {
    if (requestId !== receiptRequestId) return
    isNotFound.value = error.response?.status === HTTP_NOT_FOUND
    if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === receiptRequestId) isReceiptLoading.value = false
  }
}

function printReceipt() {
  window.print()
}

watch(paymentId, loadReceipt, { immediate: true })
</script>

<template>
  <p v-if="isReceiptLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section v-if="isNotFound" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ NOT_FOUND_TEXT }}</p>
    <RouterLink :to="{ name: PAYMENTS_ROUTE_NAME }" :class="LINK_CLASS" class="mt-2 inline-block">
      {{ BACK_TO_PAYMENTS_LABEL }}
    </RouterLink>
  </section>

  <template v-if="receipt">
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <RouterLink
        :to="{
          name: STUDENT_LEDGER_ROUTE_NAME,
          params: { schoolYearId: receipt.school_year.id, studentId: receipt.student.id },
        }"
        :class="LINK_CLASS"
      >
        {{ BACK_TO_LEDGER_LABEL }}
      </RouterLink>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="printReceipt">
        <Printer :size="16" aria-hidden="true" />
        Print
      </button>
    </div>
    <PaymentReceiptSheet :receipt="receipt" :school-name="schoolName" />
  </template>
</template>
