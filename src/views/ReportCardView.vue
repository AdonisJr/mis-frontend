<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Printer } from '@lucide/vue'
import ReportCardSheet from '@/components/ReportCardSheet.vue'
import { fetchReportCard } from '@/services/gradingService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { buildStatementSchoolName } from '@/utils/assessmentDisplay.js'
import { buildReportCard } from '@/utils/reportCardDisplay.js'
import { toIdText, toRecordId } from '@/utils/sectionForm.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'

const HTTP_NOT_FOUND = 404
const HTTP_UNPROCESSABLE_ENTITY = 422
const SCHOOL_YEAR_PARAM = 'school_year_id'
const SCHOOL_YEAR_SELECT_ID = 'report-card-school-year'
const LOADING_TEXT = 'Loading…'
const NOT_FOUND_TEXT = 'This student does not exist.'
const FORBIDDEN_TEXT = 'You cannot open this report card.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first.'
const LOAD_FAILED_MESSAGE = 'Could not load the report card.'
const SCHOOL_YEARS_FAILED_MESSAGE = 'Could not load school years.'
const ACTIVE_YEAR_FAILED_MESSAGE = 'Could not load the active school year.'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const SELECT_CLASS =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const schoolYears = ref([])
const schoolYearId = ref('')
const reportCard = ref(null)
const isInitialized = ref(false)
const areSchoolYearsLoaded = ref(false)
const isLoading = ref(false)
const isNotFound = ref(false)
const isForbidden = ref(false)
const reportErrorText = ref('')
let reportRequestId = 0

const studentId = computed(() => toRecordId(route.params.studentId))
const reportCardSheet = computed(() => buildReportCard(reportCard.value))
const schoolName = buildStatementSchoolName(import.meta.env.VITE_SCHOOL_NAME)
const blockedText = computed(() => {
  if (isNotFound.value) return NOT_FOUND_TEXT
  if (isForbidden.value) return FORBIDDEN_TEXT
  return reportErrorText.value
})
const emptyText = computed(() =>
  areSchoolYearsLoaded.value && schoolYears.value.length === 0 ? NO_SCHOOL_YEAR_TEXT : '',
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function readUnprocessableText(error) {
  const validationErrors = error.response?.data?.errors ?? {}
  const firstErrors = Object.values(validationErrors)[0]
  return firstErrors?.[0] ?? error.response?.data?.message ?? LOAD_FAILED_MESSAGE
}

function resetReport() {
  reportCard.value = null
  isNotFound.value = false
  isForbidden.value = false
  reportErrorText.value = ''
}

function applyLoadError(error) {
  const status = error.response?.status
  isNotFound.value = status === HTTP_NOT_FOUND
  isForbidden.value = status === HTTP_FORBIDDEN
  if (status === HTTP_UNPROCESSABLE_ENTITY) reportErrorText.value = readUnprocessableText(error)
  if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
}

async function loadReportCard() {
  const requestId = ++reportRequestId
  resetReport()
  const selectedYearId = toRecordId(schoolYearId.value)
  if (studentId.value === null) {
    isNotFound.value = true
    return
  }
  if (selectedYearId === null) return
  isLoading.value = true
  try {
    const reportResponse = await fetchReportCard(studentId.value, selectedYearId)
    if (requestId !== reportRequestId) return
    reportCard.value = reportResponse?.report_card ?? null
  } catch (error) {
    if (requestId !== reportRequestId) return
    applyLoadError(error)
  } finally {
    if (requestId === reportRequestId) isLoading.value = false
  }
}

async function loadSchoolYears() {
  try {
    const schoolYearResponse = await fetchSchoolYears()
    schoolYears.value = schoolYearResponse?.school_years ?? []
    areSchoolYearsLoaded.value = true
  } catch (error) {
    toastRequestError(error, SCHOOL_YEARS_FAILED_MESSAGE)
  }
}

async function loadActiveSchoolYearSafely() {
  try {
    await schoolYearStore.loadActiveSchoolYear()
  } catch (error) {
    toastRequestError(error, ACTIVE_YEAR_FAILED_MESSAGE)
  }
}

function pickInitialSchoolYearId() {
  const queryYearId = toIdText(route.query[SCHOOL_YEAR_PARAM])
  const isQueryYearListed = schoolYears.value.some((schoolYear) => String(schoolYear.id) === queryYearId)
  if (isQueryYearListed) return queryYearId
  return pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
}

function changeSchoolYear(nextSchoolYearId) {
  schoolYearId.value = nextSchoolYearId
  router.replace({ query: { [SCHOOL_YEAR_PARAM]: nextSchoolYearId } })
  loadReportCard()
}

function printReportCard() {
  window.print()
}

async function initialize() {
  await Promise.all([loadSchoolYears(), loadActiveSchoolYearSafely()])
  schoolYearId.value = pickInitialSchoolYearId()
  isInitialized.value = true
  await loadReportCard()
}

watch(studentId, () => {
  if (isInitialized.value) loadReportCard()
})

onMounted(initialize)
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-3 print:hidden">
    <div>
      <label :for="SCHOOL_YEAR_SELECT_ID" class="mb-1 block text-sm font-semibold text-ink">School year</label>
      <select
        :id="SCHOOL_YEAR_SELECT_ID"
        :value="schoolYearId"
        :class="SELECT_CLASS"
        :disabled="!isInitialized || schoolYears.length === 0"
        @change="changeSchoolYear($event.target.value)"
      >
        <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
          {{ schoolYear.name }}
        </option>
      </select>
    </div>
    <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="!reportCard" @click="printReportCard">
      <Printer :size="16" aria-hidden="true" />
      Print
    </button>
  </div>

  <p v-if="isLoading || !isInitialized" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
  <p v-else-if="emptyText" class="text-sm text-ink-muted">{{ emptyText }}</p>

  <section v-if="blockedText" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ blockedText }}</p>
  </section>

  <section
    v-if="reportCard"
    class="print-page-statement rounded-lg border border-line bg-surface p-4 print:border-0 print:p-0"
  >
    <ReportCardSheet :report-card="reportCardSheet" :school-name="schoolName" />
  </section>
</template>
