<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Copy, Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import PaymentPlanFilterBar from '@/components/PaymentPlanFilterBar.vue'
import PaymentPlanRowActions from '@/components/PaymentPlanRowActions.vue'
import PaymentPlanCopyModalView from '@/views/PaymentPlanCopyModalView.vue'
import PaymentPlanFormModalView from '@/views/PaymentPlanFormModalView.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  deactivatePaymentPlan,
  deletePaymentPlan,
  fetchPaymentPlans,
  reactivatePaymentPlan,
} from '@/services/paymentPlanService.js'
import { fetchSchoolYears } from '@/services/schoolYearService.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { getStatusChip } from '@/utils/employeeDisplay.js'
import { applyStatusChange } from '@/utils/employeeSearch.js'
import {
  CASH_LABEL,
  PAYMENT_PLAN_COLUMNS,
  buildPaymentPlanDeactivateMessage,
  buildPaymentPlanDeleteMessage,
  buildPaymentPlanReactivateMessage,
  formatAdjustment,
  formatDownPayment,
  formatFirstDueDate,
  formatInstallmentCount,
  formatLastDueDate,
} from '@/utils/paymentPlanDisplay.js'
import {
  applyPaymentPlanSchoolYearChange,
  buildPaymentPlanListParams,
  createPaymentPlanFilters,
} from '@/utils/paymentPlanSearch.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import { pickDefaultSchoolYearId } from '@/utils/sectionSearch.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const PAYMENT_PLAN_ROW_KEY = 'id'
const EMPTY_TEXT = 'No payment plans in this school year yet.'
const NO_MATCH_TEXT = 'No payment plans match the search or filter.'
const NO_SCHOOL_YEAR_TEXT = 'Add a school year first: payment plans belong to a school year.'
const OPTIONS_FAILED_TEXT = 'The school years could not be loaded. Reload the page to try again.'
const DEACTIVATE_TITLE = 'Deactivate payment plan'
const REACTIVATE_TITLE = 'Reactivate payment plan'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const DELETE_TITLE = 'Delete payment plan'
const DELETE_CONFIRM_LABEL = 'Delete'
const SEARCH_DEBOUNCE_MS = 300
const MUTED_CELL_CLASS = 'text-ink-muted'

const LOAD_FAILED_MESSAGE = 'Could not load payment plans.'
const OPTIONS_FAILED_MESSAGE = 'Could not load school years.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Payment plan deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Payment plan reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the payment plan status.'
const DELETE_SUCCESS_MESSAGE = 'Payment plan deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the payment plan.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const paymentPlans = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createPaymentPlanFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const schoolYears = ref([])
const isOptionsLoading = ref(true)
const areOptionsLoaded = ref(false)
const isSchoolYearFilterReady = ref(false)
const isFormOpen = ref(false)
const editingPlan = ref(null)
const isCopyOpen = ref(false)
const statusChangePlan = ref(null)
const isChangingStatus = ref(false)
const deletingPlan = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()
const schoolYearStore = useSchoolYearStore()

const hasSchoolYears = computed(() => schoolYears.value.length > 0)
const canAddPlan = computed(() => areOptionsLoaded.value && hasSchoolYears.value && filters.value.schoolYearId !== '')
const isStatusConfirmOpen = computed(() => statusChangePlan.value !== null)
const isDeactivating = computed(() => statusChangePlan.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildPaymentPlanDeactivateMessage(statusChangePlan.value)
  return buildPaymentPlanReactivateMessage(statusChangePlan.value)
})
const isDeleteConfirmOpen = computed(() => deletingPlan.value !== null)
const deleteMessage = computed(() => buildPaymentPlanDeleteMessage(deletingPlan.value))
const emptyText = computed(() => {
  if (!isOptionsLoading.value && !areOptionsLoaded.value) return OPTIONS_FAILED_TEXT
  if (areOptionsLoaded.value && !hasSchoolYears.value) return NO_SCHOOL_YEAR_TEXT
  const { search, status } = filters.value
  return search !== '' || status !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadPaymentPlans() {
  const listParams = buildPaymentPlanListParams(filters.value)
  // the API requires a school year; without one there is nothing to list
  if (!listParams) return
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchPaymentPlans(listParams)
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadPaymentPlans()
      return
    }
    paymentPlans.value = listResponse?.payment_plans ?? []
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
    const schoolYearResponse = await fetchSchoolYears()
    schoolYears.value = schoolYearResponse?.school_years ?? []
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
  filters.value = applyPaymentPlanSchoolYearChange(filters.value, defaultSchoolYearId)
  isSchoolYearFilterReady.value = true
  loadPaymentPlans()
}

function changeSchoolYear(nextSchoolYearId) {
  filters.value = applyPaymentPlanSchoolYearChange(filters.value, nextSchoolYearId)
  loadPaymentPlans()
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadPaymentPlans()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeStatus(nextStatus) {
  filters.value = applyStatusChange(filters.value, nextStatus)
  loadPaymentPlans()
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadPaymentPlans()
}

function openCreateForm() {
  if (!canAddPlan.value) return
  editingPlan.value = null
  isFormOpen.value = true
}

function openEditForm(paymentPlan) {
  if (!areOptionsLoaded.value) return
  editingPlan.value = paymentPlan
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function handleSaved() {
  const wasCreating = editingPlan.value === null
  isFormOpen.value = false
  if (wasCreating) filters.value = applyPageChange(filters.value, FIRST_PAGE)
  loadPaymentPlans()
}

function openCopy() {
  if (!canAddPlan.value) return
  isCopyOpen.value = true
}

function closeCopy() {
  isCopyOpen.value = false
}

function requestStatusChange(paymentPlan) {
  statusChangePlan.value = paymentPlan
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangePlan.value = null
}

function submitStatusChange(paymentPlan) {
  if (paymentPlan.is_active) return deactivatePaymentPlan(paymentPlan.id)
  return reactivatePaymentPlan(paymentPlan.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangePlan.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangePlan.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangePlan.value = null
    loadPaymentPlans()
  }
}

function requestDelete(paymentPlan) {
  deletingPlan.value = paymentPlan
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingPlan.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingPlan.value) return
  isDeleting.value = true
  try {
    await deletePaymentPlan(deletingPlan.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingPlan.value = null
    loadPaymentPlans()
  }
}

watch([areOptionsLoaded, () => schoolYearStore.isActiveSchoolYearLoading], initSchoolYearFilter)
onMounted(loadOptions)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Payment plans</h2>
      <div class="flex gap-2">
        <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="!canAddPlan" @click="openCopy">
          <Copy :size="16" aria-hidden="true" />
          Copy from year
        </button>
        <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="!canAddPlan" @click="openCreateForm">
          <Plus :size="16" aria-hidden="true" />
          Add plan
        </button>
      </div>
    </div>
    <PaymentPlanFilterBar
      :school-year-id="filters.schoolYearId"
      :search="searchInput"
      :status="filters.status"
      :school-years="schoolYears"
      :is-disabled="!areOptionsLoaded"
      @update:school-year-id="changeSchoolYear"
      @update:search="updateSearchInput"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="PAYMENT_PLAN_COLUMNS"
      :rows="paymentPlans"
      :row-key="PAYMENT_PLAN_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading || isOptionsLoading"
    >
      <template #cell-name="{ row }">
        <span class="block max-w-60 truncate font-semibold" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-down_payment="{ row }">
        <span class="block text-right tabular-nums" :class="formatDownPayment(row) === NO_VALUE_LABEL ? MUTED_CELL_CLASS : ''">
          {{ formatDownPayment(row) }}
        </span>
      </template>
      <template #cell-installments="{ row }">
        <span class="tabular-nums" :class="formatInstallmentCount(row) === CASH_LABEL ? MUTED_CELL_CLASS : ''">
          {{ formatInstallmentCount(row) }}
        </span>
      </template>
      <template #cell-first_due_date="{ row }">
        <span class="whitespace-nowrap tabular-nums">{{ formatFirstDueDate(row) }}</span>
      </template>
      <template #cell-last_due_date="{ row }">
        <span class="whitespace-nowrap tabular-nums">{{ formatLastDueDate(row) }}</span>
      </template>
      <template #cell-adjustment="{ row }">
        <span class="whitespace-nowrap" :class="formatAdjustment(row) === NO_VALUE_LABEL ? MUTED_CELL_CLASS : ''">
          {{ formatAdjustment(row) }}
        </span>
      </template>
      <template #cell-is_active="{ value }">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
          {{ getStatusChip(value).label }}
        </span>
      </template>
      <template #actions="{ row }">
        <PaymentPlanRowActions
          :payment-plan="row"
          @edit="openEditForm(row)"
          @deactivate="requestStatusChange(row)"
          @reactivate="requestStatusChange(row)"
          @delete="requestDelete(row)"
        />
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

  <PaymentPlanFormModalView
    :is-open="isFormOpen"
    :payment-plan="editingPlan"
    :school-years="schoolYears"
    :default-school-year-id="filters.schoolYearId"
    @close="closeForm"
    @saved="handleSaved"
  />

  <PaymentPlanCopyModalView
    :is-open="isCopyOpen"
    :school-years="schoolYears"
    :target-school-year-id="filters.schoolYearId"
    @close="closeCopy"
    @copied="loadPaymentPlans"
  />

  <ConfirmDialog
    :is-open="isStatusConfirmOpen"
    :title="statusTitle"
    :message="statusMessage"
    :confirm-label="statusConfirmLabel"
    :is-destructive="isDeactivating"
    :is-loading="isChangingStatus"
    @confirm="confirmStatusChange"
    @cancel="cancelStatusChange"
  />

  <ConfirmDialog
    :is-open="isDeleteConfirmOpen"
    :title="DELETE_TITLE"
    :message="deleteMessage"
    :confirm-label="DELETE_CONFIRM_LABEL"
    is-destructive
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>
