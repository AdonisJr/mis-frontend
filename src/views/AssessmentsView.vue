<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { FileText, Plus } from '@lucide/vue'
import AssessmentFilterBar from '@/components/AssessmentFilterBar.vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import AssessmentAssessModalView from '@/views/AssessmentAssessModalView.vue'
import { fetchAssessments } from '@/services/assessmentService.js'
import { fetchGradeLevels } from '@/services/gradeLevelService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchAllPaymentPlans } from '@/services/paymentPlanService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { STATEMENT_OF_ACCOUNT_ROUTE_NAME } from '@/routeNames.js'
import { ADMIN_REGISTRAR_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import {
  ASSESSMENT_COLUMNS,
  formatAssessmentGradeLevel,
  formatAssessmentPlan,
  formatTimestampDate,
} from '@/utils/assessmentDisplay.js'
import {
  applyAssessmentGradeLevelChange,
  applyAssessmentPlanChange,
  applyAssessmentSchoolYearChange,
  buildAssessmentListParams,
  createAssessmentFilters,
} from '@/utils/assessmentSearch.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const ASSESSMENT_ROW_KEY = 'id'
const EMPTY_TEXT = 'No assessments in this school year yet.'
const NO_MATCH_TEXT = 'No assessments match the search or filters.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first: assessments belong to a school year.'
const OPTIONS_FAILED_TEXT = 'The school years or grade levels could not be loaded. Reload the page to try again.'
const SEARCH_DEBOUNCE_MS = 300

const LOAD_FAILED_MESSAGE = 'Could not load assessments.'
const OPTIONS_FAILED_MESSAGE = 'Could not load the page options.'
const PLANS_FAILED_MESSAGE = 'Could not load the payment plans.'

const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const assessments = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createAssessmentFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const schoolYears = ref([])
const gradeLevels = ref([])
const paymentPlans = ref([])
const isPlansLoading = ref(false)
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const isAssessOpen = ref(false)
let listRequestId = 0
let planRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const router = useRouter()
const schoolYearStore = useSchoolYearStore()
const authStore = useAuthStore()

const hasSchoolYears = computed(() => schoolYears.value.length > 0)
const canAssess = computed(() => authStore.hasAnyRole(ADMIN_REGISTRAR_ROLES))
const isAssessReady = computed(
  () =>
    canAssess.value &&
    areOptionsLoaded.value &&
    hasSchoolYears.value &&
    filters.value.schoolYearId !== '' &&
    !isPlansLoading.value,
)
const selectedSchoolYearLabel = computed(() => {
  const selectedYear = schoolYears.value.find((schoolYear) => String(schoolYear.id) === filters.value.schoolYearId)
  return selectedYear?.name ?? NO_VALUE_LABEL
})
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && !hasSchoolYears.value) return NO_SCHOOL_YEAR_TEXT
  const { search, gradeLevelId, paymentPlanId } = filters.value
  return search !== '' || gradeLevelId !== '' || paymentPlanId !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadAssessments() {
  const listParams = buildAssessmentListParams(filters.value)
  // the API requires a school year; without one there is nothing to list
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchAssessments(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadAssessments()
      return
    }
    assessments.value = listResponse?.assessments ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

async function loadOptions() {
  try {
    const [schoolYearResponse, gradeLevelResponse] = await Promise.all([fetchSchoolYears(), fetchGradeLevels()])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    gradeLevels.value = gradeLevelResponse?.grade_levels ?? []
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  } finally {
    isOptionsLoading.value = false
  }
}

async function loadPaymentPlans() {
  const schoolYearId = toRecordId(filters.value.schoolYearId)
  const requestId = ++planRequestId
  paymentPlans.value = []
  if (!canAssess.value) {
    isPlansLoading.value = false
    return
  }
  if (schoolYearId === null) {
    isPlansLoading.value = false
    return
  }
  isPlansLoading.value = true
  try {
    const planResponse = await fetchAllPaymentPlans({ school_year_id: schoolYearId })
    if (requestId !== planRequestId) return
    paymentPlans.value = planResponse?.payment_plans ?? []
  } catch (error) {
    if (requestId !== planRequestId) return
    toastRequestError(error, PLANS_FAILED_MESSAGE)
  } finally {
    if (requestId === planRequestId) isPlansLoading.value = false
  }
}

function initSchoolYearFilter() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (isSchoolYearFilterReady.value || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  const defaultSchoolYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  filters.value = applyAssessmentSchoolYearChange(filters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadPaymentPlans()
  loadAssessments()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyAssessmentSchoolYearChange(filters.value, nextSchoolYearId)
  loadPaymentPlans()
  loadAssessments()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadAssessments()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeGradeLevel(nextGradeLevelId) {
  filters.value = applyAssessmentGradeLevelChange(filters.value, nextGradeLevelId)
  loadAssessments()
}

function changePaymentPlan(nextPaymentPlanId) {
  filters.value = applyAssessmentPlanChange(filters.value, nextPaymentPlanId)
  loadAssessments()
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadAssessments()
}

function openAssess() {
  if (!isAssessReady.value) return
  isAssessOpen.value = true
}

function closeAssess() {
  isAssessOpen.value = false
}

function handleSaved() {
  isAssessOpen.value = false
  filters.value = applyPageChange(filters.value, FIRST_PAGE)
  loadAssessments()
}

function openStatement(assessmentRow) {
  router.push({ name: STATEMENT_OF_ACCOUNT_ROUTE_NAME, params: { assessmentId: assessmentRow.id } })
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Assessments</h2>
      <button v-if="canAssess" type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!isAssessReady" @click="openAssess">
        <Plus :size="16" aria-hidden="true" />
        Assess
      </button>
    </div>
    <AssessmentFilterBar
      :school-year-id="filters.schoolYearId"
      :search="searchInput"
      :grade-level-id="filters.gradeLevelId"
      :payment-plan-id="filters.paymentPlanId"
      :school-years="schoolYears"
      :grade-levels="gradeLevels"
      :payment-plans="paymentPlans"
      :is-disabled="!areOptionsLoaded"
      @update:school-year-id="changeSchoolYear"
      @update:search="updateSearchInput"
      @update:grade-level-id="changeGradeLevel"
      @update:payment-plan-id="changePaymentPlan"
    />
    <DataTable
      :columns="ASSESSMENT_COLUMNS"
      :rows="assessments"
      :row-key="ASSESSMENT_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading || isOptionsLoading"
    >
      <template #cell-student="{ row }">
        <RouterLink
          :to="{ name: STATEMENT_OF_ACCOUNT_ROUTE_NAME, params: { assessmentId: row.id } }"
          class="block rounded-md focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
        >
          <span
            class="block max-w-60 truncate font-semibold text-accent hover:underline"
            :title="formatEnrollmentStudentName(row.student)"
          >
            {{ formatEnrollmentStudentName(row.student) }}
          </span>
          <span class="block font-mono text-xs tabular-nums text-ink-muted">{{ row.student?.lrn }}</span>
        </RouterLink>
      </template>
      <template #cell-grade_level="{ row }">{{ formatAssessmentGradeLevel(row) }}</template>
      <template #cell-plan="{ row }">{{ formatAssessmentPlan(row) }}</template>
      <template #cell-net_total="{ row }">
        <span class="block text-right tabular-nums">{{ formatPeso(row.net_total) }}</span>
      </template>
      <template #cell-created_at="{ row }">
        <span class="tabular-nums">{{ formatTimestampDate(row.created_at) }}</span>
      </template>
      <template #actions="{ row }">
        <button
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          :aria-label="`Open the statement of ${formatEnrollmentStudentName(row.student)}`"
          @click="openStatement(row)"
        >
          <FileText :size="16" aria-hidden="true" />
          <span class="hidden sm:inline">Statement</span>
        </button>
      </template>
    </DataTable>
    <TablePagination
      v-if="pageMeta.total > 0"
      :current-page="pageMeta.current_page"
      :last-page="pageMeta.last_page"
      :per-page="pageMeta.per_page"
      :total="pageMeta.total"
      :is-disabled="isListLoading"
      @change-page="changePage"
    />
  </section>

  <AssessmentAssessModalView
    v-if="canAssess"
    :is-open="isAssessOpen"
    :assessment="null"
    :school-year-id="filters.schoolYearId"
    :school-year-label="selectedSchoolYearLabel"
    :payment-plans="paymentPlans"
    @close="closeAssess"
    @saved="handleSaved"
  />
</template>
