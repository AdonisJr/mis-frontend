<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import DiscountTypeFilterBar from '@/components/DiscountTypeFilterBar.vue'
import DiscountTypeRowActions from '@/components/DiscountTypeRowActions.vue'
import TablePagination from '@/components/TablePagination.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import DiscountTypeFormModalView from '@/views/DiscountTypeFormModalView.vue'
import {
  deactivateDiscountType,
  deleteDiscountType,
  fetchDiscountTypes,
  reactivateDiscountType,
} from '@/services/discountTypeService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  DISCOUNT_TYPE_COLUMNS,
  buildDiscountTypeDeactivateMessage,
  buildDiscountTypeDeleteMessage,
  buildDiscountTypeReactivateMessage,
  formatDiscountBase,
  formatDiscountStages,
  formatDiscountValue,
  getSourceChip,
} from '@/utils/discountDisplay.js'
import {
  applyDiscountSourceChange,
  buildDiscountTypeListParams,
  createDiscountTypeFilters,
} from '@/utils/discountSearch.js'
import { getStatusChip } from '@/utils/employeeDisplay.js'
import { applyStatusChange } from '@/utils/employeeSearch.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const DISCOUNT_TYPE_ROW_KEY = 'id'
const EMPTY_TEXT = 'No discount types yet.'
const NO_MATCH_TEXT = 'No discount types match the search or filters.'
const DEACTIVATE_TITLE = 'Deactivate discount type'
const REACTIVATE_TITLE = 'Reactivate discount type'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const DELETE_TITLE = 'Delete discount type'
const DELETE_CONFIRM_LABEL = 'Delete'
const SEARCH_DEBOUNCE_MS = 300
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

const LOAD_FAILED_MESSAGE = 'Could not load discount types.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Discount type deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Discount type reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the discount type status.'
const DELETE_SUCCESS_MESSAGE = 'Discount type deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the discount type.'

const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const discountTypes = ref([])
const pageMeta = ref(createEmptyPageMeta())
const filters = ref(createDiscountTypeFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingType = ref(null)
const statusChangeType = ref(null)
const isChangingStatus = ref(false)
const deletingType = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const isStatusConfirmOpen = computed(() => statusChangeType.value !== null)
const isDeactivating = computed(() => statusChangeType.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildDiscountTypeDeactivateMessage(statusChangeType.value)
  return buildDiscountTypeReactivateMessage(statusChangeType.value)
})
const isDeleteConfirmOpen = computed(() => deletingType.value !== null)
const deleteMessage = computed(() => buildDiscountTypeDeleteMessage(deletingType.value))
const emptyText = computed(() => {
  const { search, source, status } = filters.value
  return search !== '' || source !== '' || status !== '' ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadDiscountTypes() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchDiscountTypes(buildDiscountTypeListParams(filters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      filters.value = applyPageChange(filters.value, listResponse.meta.last_page)
      loadDiscountTypes()
      return
    }
    discountTypes.value = listResponse?.discount_types ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === filters.value.search) return
  filters.value = applySearchChange(filters.value, searchInput.value)
  loadDiscountTypes()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeSource(nextSource) {
  filters.value = applyDiscountSourceChange(filters.value, nextSource)
  loadDiscountTypes()
}

function changeStatus(nextStatus) {
  filters.value = applyStatusChange(filters.value, nextStatus)
  loadDiscountTypes()
}

function changePage(nextPage) {
  filters.value = applyPageChange(filters.value, nextPage)
  loadDiscountTypes()
}

function openCreateForm() {
  editingType.value = null
  isFormOpen.value = true
}

function openEditForm(discountType) {
  editingType.value = discountType
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function handleSaved() {
  const wasCreating = editingType.value === null
  isFormOpen.value = false
  if (wasCreating) filters.value = applyPageChange(filters.value, FIRST_PAGE)
  loadDiscountTypes()
}

function requestStatusChange(discountType) {
  statusChangeType.value = discountType
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangeType.value = null
}

function submitStatusChange(discountType) {
  if (discountType.is_active) return deactivateDiscountType(discountType.id)
  return reactivateDiscountType(discountType.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangeType.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangeType.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangeType.value = null
    loadDiscountTypes()
  }
}

function requestDelete(discountType) {
  deletingType.value = discountType
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingType.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingType.value) return
  isDeleting.value = true
  try {
    await deleteDiscountType(deletingType.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingType.value = null
    loadDiscountTypes()
  }
}

onMounted(loadDiscountTypes)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Discount types</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add type
      </button>
    </div>
    <DiscountTypeFilterBar
      :search="searchInput"
      :source="filters.source"
      :status="filters.status"
      @update:search="updateSearchInput"
      @update:source="changeSource"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="DISCOUNT_TYPE_COLUMNS"
      :rows="discountTypes"
      :row-key="DISCOUNT_TYPE_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-name="{ row }">
        <span class="block max-w-60 truncate font-semibold" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-source="{ row }">
        <span :class="[CHIP_CLASS, getSourceChip(row.source).colorClass]">{{ getSourceChip(row.source).label }}</span>
      </template>
      <template #cell-value="{ row }">
        <span class="block text-right tabular-nums">{{ formatDiscountValue(row) }}</span>
      </template>
      <template #cell-base="{ row }">{{ formatDiscountBase(row.base) }}</template>
      <template #cell-stages="{ row }">{{ formatDiscountStages(row.stages) }}</template>
      <template #cell-is_active="{ value }">
        <span :class="[CHIP_CLASS, getStatusChip(value).colorClass]">{{ getStatusChip(value).label }}</span>
      </template>
      <template #actions="{ row }">
        <DiscountTypeRowActions
          :discount-type="row"
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

  <DiscountTypeFormModalView :is-open="isFormOpen" :discount-type="editingType" @close="closeForm" @saved="handleSaved" />

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
