<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { fetchAssessments } from '@/services/assessmentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { STUDENT_LEDGER_ROUTE_NAME } from '@/routeNames.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { formatAssessmentGradeLevel } from '@/utils/assessmentDisplay.js'
import { hasMoreCandidatePages } from '@/utils/assessmentSearch.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { buildLedgerSearchParams } from '@/utils/paymentSearch.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const PANEL_TITLE = 'Find a student ledger'
const SCHOOL_YEAR_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const SEARCH_LABEL = 'Student'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const SEARCHING_TEXT = 'Searching…'
const NO_MATCH_TEXT = 'No assessed student matches in this school year.'
const MORE_STUDENTS_TEXT = 'More students match. Type more of the name or the LRN.'
const SCHOOL_YEAR_ID = 'payment-search-school-year'
const SEARCH_ID = 'payment-search-student'
const SEARCH_DEBOUNCE_MS = 300

const SEARCH_FAILED_MESSAGE = 'Could not search students.'
const SCHOOL_YEARS_FAILED_MESSAGE = 'Could not load the school years.'

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

const schoolYears = ref([])
const schoolYearId = ref('')
const searchInput = ref('')
const results = ref([])
const hasMore = ref(false)
const isSearching = ref(false)
const areOptionsLoaded = ref(false)
const isSchoolYearReady = ref(false)
let searchRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const router = useRouter()
const schoolYearStore = useSchoolYearStore()

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function clearResults() {
  searchRequestId += 1
  results.value = []
  hasMore.value = false
  isSearching.value = false
}

async function searchStudents() {
  const searchParams = buildLedgerSearchParams(schoolYearId.value, searchInput.value)
  if (!searchParams) return clearResults()
  const requestId = ++searchRequestId
  isSearching.value = true
  try {
    const searchResponse = await fetchAssessments(searchParams)
    if (requestId !== searchRequestId) return
    results.value = searchResponse?.assessments ?? []
    hasMore.value = hasMoreCandidatePages(searchResponse?.meta)
  } catch (error) {
    if (requestId !== searchRequestId) return
    toastRequestError(error, SEARCH_FAILED_MESSAGE)
  } finally {
    if (requestId === searchRequestId) isSearching.value = false
  }
}

async function loadSchoolYears() {
  try {
    const schoolYearResponse = await fetchSchoolYears()
    schoolYears.value = schoolYearResponse?.school_years ?? []
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, SCHOOL_YEARS_FAILED_MESSAGE)
  }
}

function initSchoolYear() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (isSchoolYearReady.value || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  schoolYearId.value = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  isSchoolYearReady.value = true
}

function changeSchoolYear(nextSchoolYearId) {
  schoolYearId.value = nextSchoolYearId
  searchStudents()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(searchStudents, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
  searchRequestId += 1
}

function openLedger(assessmentRow) {
  router.push({
    name: STUDENT_LEDGER_ROUTE_NAME,
    params: { schoolYearId: schoolYearId.value, studentId: assessmentRow.student.id },
  })
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYear)
onMounted(loadSchoolYears)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ PANEL_TITLE }}</h2>
    </div>
    <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end">
      <div class="sm:w-40">
        <label :for="SCHOOL_YEAR_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SCHOOL_YEAR_LABEL }}</label>
        <select
          :id="SCHOOL_YEAR_ID"
          :value="schoolYearId"
          :class="INPUT_CLASS"
          :disabled="schoolYears.length === 0"
          @change="changeSchoolYear($event.target.value)"
        >
          <option v-if="schoolYears.length === 0" value="">{{ NO_SCHOOL_YEARS_LABEL }}</option>
          <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
            {{ schoolYear.name }}
          </option>
        </select>
      </div>
      <div class="sm:min-w-48 sm:flex-1">
        <label :for="SEARCH_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SEARCH_LABEL }}</label>
        <input
          :id="SEARCH_ID"
          type="search"
          :value="searchInput"
          :placeholder="SEARCH_PLACEHOLDER"
          :maxlength="TEXT_MAX_LENGTH"
          :class="INPUT_CLASS"
          @input="updateSearchInput($event.target.value)"
        />
      </div>
    </div>
    <p v-if="isSearching" class="px-4 pb-3 text-xs text-ink-muted">{{ SEARCHING_TEXT }}</p>
    <p
      v-else-if="searchInput.trim() !== '' && results.length === 0"
      class="px-4 pb-3 text-sm text-ink-muted"
    >
      {{ NO_MATCH_TEXT }}
    </p>
    <ul v-if="results.length > 0" class="divide-y divide-line border-t border-line">
      <li v-for="assessmentRow in results" :key="assessmentRow.id" class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-ink">{{ formatEnrollmentStudentName(assessmentRow.student) }}</p>
          <p class="text-xs text-ink-muted">
            <span class="font-mono tabular-nums">{{ assessmentRow.student?.lrn }}</span>
            · {{ formatAssessmentGradeLevel(assessmentRow) }}
          </p>
        </div>
        <button
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          :aria-label="`Open the ledger of ${formatEnrollmentStudentName(assessmentRow.student)}`"
          @click="openLedger(assessmentRow)"
        >
          Open ledger
        </button>
      </li>
    </ul>
    <p v-if="hasMore" class="border-t border-line px-4 py-2 text-xs text-ink-muted">{{ MORE_STUDENTS_TEXT }}</p>
  </section>
</template>
