<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Printer } from '@lucide/vue'
import ReportCardSheet from '@/components/ReportCardSheet.vue'
import { fetchSectionReportCards } from '@/services/gradingService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { MY_CLASSES_ROUTE_NAME } from '@/routeNames.js'
import { buildStatementSchoolName } from '@/utils/assessmentDisplay.js'
import { buildClassListQuery, readClassListQuery } from '@/utils/classListSearch.js'
import { REPORT_CARD_BREAK_CLASS } from '@/utils/gradingPrint.js'
import { buildSectionReportCards } from '@/utils/reportCardDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const HTTP_NOT_FOUND = 404
const HTTP_UNPROCESSABLE_ENTITY = 422
const BACK_LABEL = 'Back to my classes'
const LOADING_TEXT = 'Loading…'
const NOT_FOUND_TEXT = 'This section does not exist.'
const FORBIDDEN_TEXT = 'You cannot open these report cards.'
const EMPTY_TEXT = 'No students in this section yet.'
const LOAD_FAILED_MESSAGE = 'Could not load the report cards.'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const BACK_LINK_CLASS =
  'text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const route = useRoute()
const toast = useToast()

const reportCards = ref([])
const isLoaded = ref(false)
const isLoading = ref(false)
const isNotFound = ref(false)
const isForbidden = ref(false)
const reportErrorText = ref('')
let reportRequestId = 0

const sectionId = computed(() => toRecordId(route.params.sectionId))
const schoolName = buildStatementSchoolName(import.meta.env.VITE_SCHOOL_NAME)
const backQuery = computed(() => buildClassListQuery(readClassListQuery(route.query)))
const blockedText = computed(() => {
  if (isNotFound.value) return NOT_FOUND_TEXT
  if (isForbidden.value) return FORBIDDEN_TEXT
  return reportErrorText.value
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function resetReports() {
  reportCards.value = []
  isLoaded.value = false
  isNotFound.value = false
  isForbidden.value = false
  reportErrorText.value = ''
}

function applyLoadError(error) {
  const status = error.response?.status
  isNotFound.value = status === HTTP_NOT_FOUND
  isForbidden.value = status === HTTP_FORBIDDEN
  if (status === HTTP_UNPROCESSABLE_ENTITY) reportErrorText.value = error.response?.data?.message ?? LOAD_FAILED_MESSAGE
  if (!isNotFound.value) toastRequestError(error, LOAD_FAILED_MESSAGE)
}

async function loadReportCards() {
  const requestId = ++reportRequestId
  resetReports()
  if (sectionId.value === null) {
    isNotFound.value = true
    return
  }
  isLoading.value = true
  try {
    const sectionResponse = await fetchSectionReportCards(sectionId.value)
    if (requestId !== reportRequestId) return
    reportCards.value = buildSectionReportCards(sectionResponse)
    isLoaded.value = true
  } catch (error) {
    if (requestId !== reportRequestId) return
    applyLoadError(error)
  } finally {
    if (requestId === reportRequestId) isLoading.value = false
  }
}

function getPageClass(cardIndex) {
  const isLastCard = cardIndex === reportCards.value.length - 1
  return [
    'print-page-statement rounded-lg border border-line bg-surface p-4 print:border-0 print:p-0',
    isLastCard ? '' : REPORT_CARD_BREAK_CLASS,
  ]
}

function printReportCards() {
  window.print()
}

watch(sectionId, loadReportCards, { immediate: true })
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
    <RouterLink :to="{ name: MY_CLASSES_ROUTE_NAME, query: backQuery }" :class="BACK_LINK_CLASS">
      {{ BACK_LABEL }}
    </RouterLink>
    <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="reportCards.length === 0" @click="printReportCards">
      <Printer :size="16" aria-hidden="true" />
      Print
    </button>
  </div>

  <p v-if="isLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

  <section v-if="blockedText" class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ blockedText }}</p>
  </section>

  <p v-else-if="isLoaded && reportCards.length === 0" class="text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>

  <section v-for="(sheetCard, cardIndex) in reportCards" :key="sheetCard.key" :class="getPageClass(cardIndex)">
    <ReportCardSheet :report-card="sheetCard" :school-name="schoolName" />
  </section>
</template>
