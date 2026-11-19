<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { FileText, Plus } from '@lucide/vue'
import PaymentHistoryList from '@/components/PaymentHistoryList.vue'
import PaymentLedgerSummary from '@/components/PaymentLedgerSummary.vue'
import PaymentRecordModalView from '@/views/PaymentRecordModalView.vue'
import PaymentVoidModalView from '@/views/PaymentVoidModalView.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchStudentLedger } from '@/services/paymentService.js'
import {
  PAYMENTS_ROUTE_NAME,
  PAYMENT_RECEIPT_ROUTE_NAME,
  STATEMENT_OF_ACCOUNT_ROUTE_NAME,
} from '@/routeNames.js'
import { PAYMENT_RECORDER_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import { formatAssessmentGradeLevel } from '@/utils/assessmentDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { isFullyPaid } from '@/utils/paymentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const HTTP_UNPROCESSABLE_ENTITY = 422
const NO_LEDGER_TEXT = 'This student has no current assessment in this school year.'
const FULLY_PAID_TEXT = 'Fully paid.'
const LOADING_TEXT = 'Loading…'
const BACK_LABEL = 'Back to payments'
const HISTORY_TITLE = 'Payment history'
const LOAD_FAILED_MESSAGE = 'Could not load the ledger.'

const LINK_CLASS =
  'text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const SECONDARY_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const ledger = ref(null)
const isLedgerLoading = ref(false)
const isNoLedger = ref(false)
const isRecordOpen = ref(false)
const voidingPayment = ref(null)
let ledgerRequestId = 0

const studentId = computed(() => toRecordId(route.params.studentId))
const schoolYearId = computed(() => toRecordId(route.params.schoolYearId))
const canRecord = computed(() => authStore.hasAnyRole(PAYMENT_RECORDER_ROLES))
const isLedgerPaid = computed(() => ledger.value !== null && isFullyPaid(ledger.value.balance))
const isVoidOpen = computed(() => voidingPayment.value !== null)
const infoText = computed(() => {
  const shownLedger = ledger.value
  return {
    name: formatEnrollmentStudentName(shownLedger.student),
    lrn: shownLedger.student?.lrn ?? NO_VALUE_LABEL,
    schoolYear: shownLedger.school_year?.name ?? NO_VALUE_LABEL,
    gradeLevel: formatAssessmentGradeLevel(shownLedger),
  }
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function isMissingLedgerStatus(status) {
  return status === HTTP_NOT_FOUND || status === HTTP_UNPROCESSABLE_ENTITY
}

async function loadLedger() {
  const requestId = ++ledgerRequestId
  isNoLedger.value = false
  if (studentId.value === null || schoolYearId.value === null) {
    ledger.value = null
    isNoLedger.value = true
    return
  }
  isLedgerLoading.value = true
  try {
    const ledgerResponse = await fetchStudentLedger({
      student_id: studentId.value,
      school_year_id: schoolYearId.value,
    })
    if (requestId !== ledgerRequestId) return
    ledger.value = ledgerResponse?.ledger ?? null
  } catch (error) {
    if (requestId !== ledgerRequestId) return
    ledger.value = null
    isNoLedger.value = isMissingLedgerStatus(error.response?.status)
    if (!isNoLedger.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === ledgerRequestId) isLedgerLoading.value = false
  }
}

function openRecord() {
  if (isLedgerPaid.value) return
  isRecordOpen.value = true
}

function closeRecord() {
  isRecordOpen.value = false
}

function openReceipt(paymentId) {
  router.push({ name: PAYMENT_RECEIPT_ROUTE_NAME, params: { paymentId } })
}

function openVoid(payment) {
  voidingPayment.value = payment
}

function closeVoid() {
  voidingPayment.value = null
}

function handleVoidChanged() {
  voidingPayment.value = null
  loadLedger()
}

watch([studentId, schoolYearId], loadLedger, { immediate: true })
</script>

<template>
  <p v-if="isLedgerLoading && !ledger" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section v-if="isNoLedger" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ NO_LEDGER_TEXT }}</p>
    <RouterLink :to="{ name: PAYMENTS_ROUTE_NAME }" :class="LINK_CLASS" class="mt-2 inline-block">
      {{ BACK_LABEL }}
    </RouterLink>
  </section>

  <template v-if="ledger">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <RouterLink :to="{ name: PAYMENTS_ROUTE_NAME }" :class="LINK_CLASS">{{ BACK_LABEL }}</RouterLink>
      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          :to="{ name: STATEMENT_OF_ACCOUNT_ROUTE_NAME, params: { assessmentId: ledger.assessment_id } }"
          :class="SECONDARY_LINK_CLASS"
        >
          <FileText :size="16" aria-hidden="true" />
          Statement
        </RouterLink>
        <span v-if="canRecord && isLedgerPaid" class="text-sm text-ink-muted">{{ FULLY_PAID_TEXT }}</span>
        <button v-if="canRecord" type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="isLedgerPaid" @click="openRecord">
          <Plus :size="16" aria-hidden="true" />
          Record payment
        </button>
      </div>
    </div>

    <section class="rounded-lg border border-line bg-surface p-4">
      <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div class="flex gap-2">
          <dt class="w-28 shrink-0 text-ink-muted">Student</dt>
          <dd class="min-w-0 font-semibold text-ink">{{ infoText.name }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="w-28 shrink-0 text-ink-muted">LRN</dt>
          <dd class="font-mono font-semibold tabular-nums text-ink">{{ infoText.lrn }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="w-28 shrink-0 text-ink-muted">School year</dt>
          <dd class="font-semibold text-ink">{{ infoText.schoolYear }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="w-28 shrink-0 text-ink-muted">Grade level</dt>
          <dd class="font-semibold text-ink">{{ infoText.gradeLevel }}</dd>
        </div>
      </dl>
    </section>

    <PaymentLedgerSummary :ledger="ledger" />

    <section class="rounded-lg border border-line bg-surface">
      <div class="border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">{{ HISTORY_TITLE }}</h2>
      </div>
      <PaymentHistoryList :payments="ledger.payments ?? []" @receipt="openReceipt" @void="openVoid" />
    </section>

    <PaymentRecordModalView
      :is-open="isRecordOpen"
      :assessment-id="ledger.assessment_id"
      :balance="ledger.balance"
      :next-amount-due="ledger.next_amount_due ?? ''"
      @close="closeRecord"
      @saved="loadLedger"
    />
    <PaymentVoidModalView :is-open="isVoidOpen" :payment="voidingPayment" @close="closeVoid" @changed="handleVoidChanged" />
  </template>
</template>
