<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { BookOpenText, Printer, RefreshCw } from '@lucide/vue'
import AssessmentHistoryList from '@/components/AssessmentHistoryList.vue'
import AssessmentSummary from '@/components/AssessmentSummary.vue'
import AssessmentAssessModalView from '@/views/AssessmentAssessModalView.vue'
import { fetchAssessment, fetchAssessmentHistory } from '@/services/assessmentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllPaymentPlans } from '@/services/paymentPlanService.js'
import { ASSESSMENTS_ROUTE_NAME, STATEMENT_OF_ACCOUNT_ROUTE_NAME, STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { ADMIN_REGISTRAR_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import {
  buildStatementSchoolName,
  formatAssessmentGradeLevel,
  formatAssessmentPlan,
  formatStatementDate,
  formatSupersededText,
  formatTimestampDate,
  getAssessmentStatusChip,
} from '@/utils/assessmentDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { buildStatementPaymentRows } from '@/utils/paymentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const CURRENT_STATUS = 'current'
const NOT_FOUND_TEXT = 'This assessment does not exist.'
const READ_ONLY_TEXT = 'This assessment is read-only.'
const LOADING_TEXT = 'Loading…'
const BACK_LABEL = 'Back to assessments'
const STATEMENT_TITLE = 'Statement of account'
const HISTORY_TITLE = 'Assessment history'
const REASSESS_BLOCKED_TEXT = 'Re-assess is blocked while this assessment has payments. Void them first.'

const LOAD_FAILED_MESSAGE = 'Could not load the assessment.'
const HISTORY_FAILED_MESSAGE = 'Could not load the assessment history.'
const PLANS_FAILED_MESSAGE = 'Could not load the payment plans.'

const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const assessment = ref(null)
const history = ref([])
const paymentPlans = ref([])
const isStatementLoading = ref(false)
const isNotFound = ref(false)
const isPlansLoaded = ref(false)
const isReassessOpen = ref(false)
let statementRequestId = 0

const assessmentId = computed(() => toRecordId(route.params.assessmentId))
const isCurrent = computed(() => assessment.value?.status === CURRENT_STATUS)
const canAssess = computed(() => authStore.hasAnyRole(ADMIN_REGISTRAR_ROLES))
const hasPayments = computed(() => assessment.value?.has_payments === true)
const paymentRows = computed(() => buildStatementPaymentRows(assessment.value))
const statusChip = computed(() => getAssessmentStatusChip(assessment.value?.status))
const schoolName = buildStatementSchoolName(import.meta.env.VITE_SCHOOL_NAME)
const statementDateText = formatStatementDate(new Date())
const otherHistory = computed(() => history.value.filter((historyRow) => historyRow.id !== assessment.value?.id))
const infoRows = computed(() => {
  const shownAssessment = assessment.value
  return [
    { label: 'Student', text: formatEnrollmentStudentName(shownAssessment.student) },
    { label: 'LRN', text: shownAssessment.student?.lrn ?? NO_VALUE_LABEL, isMono: true },
    { label: 'School year', text: shownAssessment.school_year?.name ?? NO_VALUE_LABEL },
    { label: 'Grade level / program', text: formatAssessmentGradeLevel(shownAssessment) },
    { label: 'Plan', text: formatAssessmentPlan(shownAssessment) },
    { label: 'Assessed on', text: formatTimestampDate(shownAssessment.created_at) },
    { label: 'Assessed by', text: shownAssessment.created_by?.name ?? NO_VALUE_LABEL },
  ]
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadHistory(requestId) {
  try {
    const historyResponse = await fetchAssessmentHistory(assessment.value.id)
    if (requestId !== statementRequestId) return
    history.value = historyResponse?.assessments ?? []
  } catch (error) {
    if (requestId !== statementRequestId) return
    toastRequestError(error, HISTORY_FAILED_MESSAGE)
  }
}

async function loadPaymentPlans(requestId) {
  try {
    const planResponse = await fetchAllPaymentPlans({ school_year_id: assessment.value.school_year_id })
    if (requestId !== statementRequestId) return
    paymentPlans.value = planResponse?.payment_plans ?? []
    isPlansLoaded.value = true
  } catch (error) {
    if (requestId !== statementRequestId) return
    toastRequestError(error, PLANS_FAILED_MESSAGE)
  }
}

function resetStatement() {
  assessment.value = null
  history.value = []
  paymentPlans.value = []
  isPlansLoaded.value = false
  isNotFound.value = false
  isReassessOpen.value = false
}

async function loadStatement() {
  const requestId = ++statementRequestId
  resetStatement()
  if (assessmentId.value === null) {
    isNotFound.value = true
    return
  }
  isStatementLoading.value = true
  try {
    const statementResponse = await fetchAssessment(assessmentId.value)
    if (requestId !== statementRequestId) return
    assessment.value = statementResponse?.assessment ?? null
  } catch (error) {
    if (requestId !== statementRequestId) return
    isNotFound.value = error.response?.status === HTTP_NOT_FOUND
    if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
    return
  } finally {
    if (requestId === statementRequestId) isStatementLoading.value = false
  }
  const loadTasks = canAssess.value ? [loadHistory(requestId), loadPaymentPlans(requestId)] : [loadHistory(requestId)]
  await Promise.all(loadTasks)
}

function printStatement() {
  window.print()
}

function openStatementOf(nextAssessmentId) {
  router.push({ name: STATEMENT_OF_ACCOUNT_ROUTE_NAME, params: { assessmentId: nextAssessmentId } })
}

function openReassess() {
  if (!isPlansLoaded.value || hasPayments.value) return
  isReassessOpen.value = true
}

function closeReassess() {
  isReassessOpen.value = false
}

function handleReassessed(savedAssessment) {
  isReassessOpen.value = false
  openStatementOf(savedAssessment.id)
}

watch(assessmentId, loadStatement, { immediate: true })
</script>

<template>
  <p v-if="isStatementLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section v-if="isNotFound" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ NOT_FOUND_TEXT }}</p>
    <RouterLink
      :to="{ name: ASSESSMENTS_ROUTE_NAME }"
      class="mt-2 inline-block text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
    >
      {{ BACK_LABEL }}
    </RouterLink>
  </section>

  <template v-if="assessment">
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <RouterLink
        :to="{ name: ASSESSMENTS_ROUTE_NAME }"
        class="text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
      >
        {{ BACK_LABEL }}
      </RouterLink>
      <div class="flex gap-2">
        <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="printStatement">
          <Printer :size="16" aria-hidden="true" />
          Print
        </button>
        <RouterLink
          :to="{
            name: STUDENT_LEDGER_ROUTE_NAME,
            params: { schoolYearId: assessment.school_year_id, studentId: assessment.student_id },
          }"
          :class="SECONDARY_BUTTON_CLASS"
        >
          <BookOpenText :size="16" aria-hidden="true" />
          Ledger
        </RouterLink>
        <button
          v-if="isCurrent && canAssess"
          type="button"
          :class="PRIMARY_BUTTON_CLASS"
          :disabled="!isPlansLoaded || hasPayments"
          @click="openReassess"
        >
          <RefreshCw :size="16" aria-hidden="true" />
          Re-assess
        </button>
      </div>
    </div>

    <p v-if="isCurrent && canAssess && hasPayments" class="text-xs text-ink-muted print:hidden">
      {{ REASSESS_BLOCKED_TEXT }}
    </p>

    <p v-if="!isCurrent" class="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink print:hidden">
      {{ formatSupersededText(assessment) }} {{ READ_ONLY_TEXT }}
    </p>

    <section class="print-page-statement rounded-lg border border-line bg-surface p-4 print:border-0 print:p-0">
      <header class="mb-4 border-b border-line pb-3">
        <p class="text-lg font-bold text-ink">{{ schoolName }}</p>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-bold text-ink">{{ STATEMENT_TITLE }}</h2>
          <p class="text-sm tabular-nums text-ink-muted">Date: {{ statementDateText }}</p>
        </div>
      </header>
      <dl class="mb-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div v-for="infoRow in infoRows" :key="infoRow.label" class="flex gap-2">
          <dt class="w-40 shrink-0 text-ink-muted">{{ infoRow.label }}</dt>
          <dd class="min-w-0 font-semibold text-ink" :class="infoRow.isMono ? 'font-mono tabular-nums' : ''">
            {{ infoRow.text }}
          </dd>
        </div>
        <div class="flex gap-2">
          <dt class="w-40 shrink-0 text-ink-muted">Status</dt>
          <dd>
            <span :class="[CHIP_CLASS, statusChip.colorClass]">{{ statusChip.label }}</span>
          </dd>
        </div>
      </dl>
      <AssessmentSummary :assessment="assessment" is-statement />
      <dl class="mt-4 space-y-1 text-sm">
        <div
          v-for="paymentRow in paymentRows"
          :key="paymentRow.key"
          class="flex justify-end gap-6"
          :class="paymentRow.isEmphasized ? 'font-bold text-ink' : 'text-ink'"
        >
          <dt>{{ paymentRow.label }}</dt>
          <dd class="w-32 text-right tabular-nums">{{ paymentRow.amountText }}</dd>
        </div>
      </dl>
    </section>

    <section class="rounded-lg border border-line bg-surface print:hidden">
      <div class="border-b border-line px-4 py-3">
        <h2 class="text-sm font-bold text-ink">{{ HISTORY_TITLE }}</h2>
      </div>
      <AssessmentHistoryList :assessments="otherHistory" @open="openStatementOf" />
    </section>

    <AssessmentAssessModalView
      v-if="canAssess"
      :is-open="isReassessOpen"
      :assessment="assessment"
      :school-year-id="String(assessment.school_year_id)"
      :school-year-label="assessment.school_year.name"
      :payment-plans="paymentPlans"
      @close="closeReassess"
      @saved="handleReassessed"
    />
  </template>
</template>
