<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import StudentDiscountFilterBar from '@/components/StudentDiscountFilterBar.vue'
import StudentDiscountRowActions from '@/components/StudentDiscountRowActions.vue'
import TablePagination from '@/components/TablePagination.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import StudentDiscountFormModalView from '@/views/StudentDiscountFormModalView.vue'
import { fetchAllDiscountTypes } from '@/services/discountTypeService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { deleteStudentDiscount, fetchStudentDiscounts } from '@/services/studentDiscountService.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import {
  STUDENT_DISCOUNT_COLUMNS,
  buildStudentDiscountRemoveMessage,
  formatDiscountValue,
  formatReferenceNo,
  formatStudentDiscountGradeLevel,
  getSourceChip,
} from '@/utils/discountDisplay.js'
import {
  applyDiscountSourceChange,
  applyDiscountTypeFilterChange,
  applyStudentDiscountSchoolYearChange,
  buildStudentDiscountListParams,
  createStudentDiscountFilters,
} from '@/utils/discountSearch.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const STUDENT_DISCOUNT_ROW_KEY = 'id'
const EMPTY_TEXT = 'No student discounts in this school year yet.'
const NO_MATCH_TEXT = 'No student discounts match the search or filters.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first: student discounts belong to a school year.'
const OPTIONS_FAILED_TEXT = 'The school years or discount types could not be loaded. Reload the page to try again.'
const REMOVE_TITLE = 'Remove student discount'
const REMOVE_CONFIRM_LABEL = 'Remove'
const SEARCH_DEBOUNCE_MS = 300
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const MUTED_CELL_CLASS = 'text-ink-muted'

const LOAD_FAILED_MESSAGE = 'Could not load student discounts.'
const OPTIONS_FAILED_MESSAGE = 'Could not load the page options.'
const REMOVE_SUCCESS_MESSAGE = 'Student discount removed.'
const REMOVE_FAILED_MESSAGE = 'Could not remove the student discount.'

const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const studentDiscounts = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createStudentDiscountFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const schoolYears = ref([])
const discountTypes = ref([])
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const isFormOpen = ref(false)
const editingDiscount = ref(null)
const removingDiscount = ref(null)
const isRemoving = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const hasSchoolYears = computed(() => schoolYears.value.length > 0)
const canAssign = computed(() => areOptionsLoaded.value && hasSchoolYears.value && filters.value.schoolYearId !== '')
const selectedSchoolYearLabel = computed(() => {
  const selectedYear = schoolYears.value.find((schoolYear) => String(schoolYear.id) === filters.value.schoolYearId)
  return selectedYear?.name ?? NO_VALUE_LABEL
})
const isRemoveConfirmOpen = computed(() => removingDiscount.value !== null)
const removeMessage = computed(() => buildStudentDiscountRemoveMessage(removingDiscount.value))
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && !hasSchoolYears.value) return NO_SCHOOL_YEAR_TEXT
  const { search, discountTypeId, source } = filters.value
  return search !== '' || discountTypeId !== '' || source !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadStudentDiscounts() {
  const listParams = buildStudentDiscountListParams(filters.value)
  // the API requires a school year; without one there is nothing to list
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchStudentDiscounts(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadStudentDiscounts()
      return
    }
    studentDiscounts.value = listResponse?.student_discounts ?? []
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
    const [schoolYearResponse, typeResponse] = await Promise.all([fetchSchoolYears(), fetchAllDiscountTypes({})])
    schoolYears.value = schoolYearResponse?.school_years ?? []
    discountTypes.value = typeResponse?.discount_types ?? []
    areOptionsLoaded.value = true
  } catch (error) {
    toastRequestError(error, OPTIONS_FAILED_MESSAGE)
  } finally {
    isOptionsLoading.value = false
  }
}

function initSchoolYearFilter() {
  // MainTopBar mounts first and starts the active-year load, so "not loading" means the store holds the answer
  if (isSchoolYearFilterReady.value || !areOptionsLoaded.value || schoolYearStore.isActiveSchoolYearLoading) return
  const defaultSchoolYearId = pickDefaultSchoolYearId(schoolYears.value, schoolYearStore.activeSchoolYear)
  filters.value = applyStudentDiscountSchoolYearChange(filters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadStudentDiscounts()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyStudentDiscountSchoolYearChange(filters.value, nextSchoolYearId)
  loadStudentDiscounts()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadStudentDiscounts()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeDiscountType(nextDiscountTypeId) {
  filters.value = applyDiscountTypeFilterChange(filters.value, nextDiscountTypeId)
  loadStudentDiscounts()
}

function changeSource(nextSource) {
  filters.value = applyDiscountSourceChange(filters.value, nextSource)
  loadStudentDiscounts()
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadStudentDiscounts()
}

function openAssignForm() {
  if (!canAssign.value) return
  editingDiscount.value = null
  isFormOpen.value = true
}

function openEditForm(studentDiscount) {
  if (!areOptionsLoaded.value) return
  editingDiscount.value = studentDiscount
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function handleSaved() {
  const wasAssigning = editingDiscount.value === null
  isFormOpen.value = false
  if (wasAssigning) filters.value = applyPageChange(filters.value, FIRST_PAGE)
  loadStudentDiscounts()
}

function requestRemove(studentDiscount) {
  removingDiscount.value = studentDiscount
}

function cancelRemove() {
  if (isRemoving.value) return
  removingDiscount.value = null
}

async function confirmRemove() {
  if (isRemoving.value || !removingDiscount.value) return
  isRemoving.value = true
  try {
    await deleteStudentDiscount(removingDiscount.value.id)
    toast.success(REMOVE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, REMOVE_FAILED_MESSAGE)
  } finally {
    isRemoving.value = false
    removingDiscount.value = null
    loadStudentDiscounts()
  }
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Student discounts</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canAssign" @click="openAssignForm">
        <Plus :size="16" aria-hidden="true" />
        Assign
      </button>
    </div>
    <StudentDiscountFilterBar
      :school-year-id="filters.schoolYearId"
      :search="searchInput"
      :discount-type-id="filters.discountTypeId"
      :source="filters.source"
      :school-years="schoolYears"
      :discount-types="discountTypes"
      :is-disabled="!areOptionsLoaded"
      @update:school-year-id="changeSchoolYear"
      @update:search="updateSearchInput"
      @update:discount-type-id="changeDiscountType"
      @update:source="changeSource"
    />
    <DataTable
      :columns="STUDENT_DISCOUNT_COLUMNS"
      :rows="studentDiscounts"
      :row-key="STUDENT_DISCOUNT_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading || isOptionsLoading"
    >
      <template #cell-student="{ row }">
        <span class="block max-w-60 truncate font-semibold" :title="formatEnrollmentStudentName(row.student)">
          {{ formatEnrollmentStudentName(row.student) }}
        </span>
        <span class="block font-mono text-xs tabular-nums text-ink-muted">{{ row.student?.lrn }}</span>
      </template>
      <template #cell-grade_level="{ row }">{{ formatStudentDiscountGradeLevel(row) }}</template>
      <template #cell-discount_type="{ row }">
        <span class="font-semibold">{{ row.discount_type?.name }}</span>
        <span v-if="row.discount_type?.is_active === false" class="ml-1 text-xs" :class="MUTED_CELL_CLASS">Inactive</span>
      </template>
      <template #cell-source="{ row }">
        <span :class="[CHIP_CLASS, getSourceChip(row.discount_type?.source).colorClass]">
          {{ getSourceChip(row.discount_type?.source).label }}
        </span>
      </template>
      <template #cell-value="{ row }">
        <span class="block text-right tabular-nums">{{ formatDiscountValue(row.discount_type) }}</span>
      </template>
      <template #cell-reference_no="{ row }">
        <span :class="formatReferenceNo(row.reference_no) === NO_VALUE_LABEL ? MUTED_CELL_CLASS : ''">
          {{ formatReferenceNo(row.reference_no) }}
        </span>
      </template>
      <template #actions="{ row }">
        <StudentDiscountRowActions :student-discount="row" @edit="openEditForm(row)" @remove="requestRemove(row)" />
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

  <StudentDiscountFormModalView
    :is-open="isFormOpen"
    :student-discount="editingDiscount"
    :school-year-id="filters.schoolYearId"
    :school-year-label="selectedSchoolYearLabel"
    :discount-types="discountTypes"
    @close="closeForm"
    @saved="handleSaved"
  />

  <ConfirmDialog
    :is-open="isRemoveConfirmOpen"
    :title="REMOVE_TITLE"
    :message="removeMessage"
    :confirm-label="REMOVE_CONFIRM_LABEL"
    is-destructive
    :is-loading="isRemoving"
    @confirm="confirmRemove"
    @cancel="cancelRemove"
  />
</template>
