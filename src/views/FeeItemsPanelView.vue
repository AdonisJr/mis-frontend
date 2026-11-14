<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import FeeItemFilterBar from '@/components/FeeItemFilterBar.vue'
import FeeItemFormFields from '@/components/FeeItemFormFields.vue'
import FeeItemRowActions from '@/components/FeeItemRowActions.vue'
import { getStatusChip } from '@/utils/employeeDisplay.js'
import {
  buildFeeItemDeactivateMessage,
  buildFeeItemPayload,
  buildFeeItemReactivateMessage,
  buildFormFromFeeItem,
  createEmptyFeeItemForm,
  findFeeItemFormErrors,
  getCategoryLabel,
} from '@/utils/feeItemForm.js'
import { applyFeeItemCategoryChange, buildFeeItemListParams, createFeeItemFilters } from '@/utils/feeItemSearch.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'
import {
  createFeeItem,
  deactivateFeeItem,
  fetchFeeItems,
  reactivateFeeItem,
  updateFeeItem,
} from '@/services/feeItemService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import { applyStatusChange } from '@/utils/employeeSearch.js'

const FEE_ITEM_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'is_active', label: 'Status' },
]
const FEE_ITEM_ROW_KEY = 'id'
const FEE_ITEM_FORM_ID = 'fee-item-form'
const EMPTY_TEXT = 'No fee items yet.'
const NO_MATCH_TEXT = 'No fee items match the search or filters.'
const ADD_TITLE = 'Add fee item'
const EDIT_TITLE = 'Edit fee item'
const DEACTIVATE_TITLE = 'Deactivate fee item'
const REACTIVATE_TITLE = 'Reactivate fee item'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load fee items.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Fee item added.'
const UPDATE_SUCCESS_MESSAGE = 'Fee item updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the fee item.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Fee item deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Fee item reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the fee item status.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const feeItems = ref([])
const pageMeta = ref(createEmptyPageMeta())
const feeItemFilters = ref(createFeeItemFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingFeeItem = ref(null)
const formValues = ref(createEmptyFeeItemForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const statusChangeFeeItem = ref(null)
const isChangingStatus = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const isCreating = computed(() => editingFeeItem.value === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const isStatusConfirmOpen = computed(() => statusChangeFeeItem.value !== null)
const isDeactivating = computed(() => statusChangeFeeItem.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildFeeItemDeactivateMessage(statusChangeFeeItem.value)
  return buildFeeItemReactivateMessage(statusChangeFeeItem.value)
})
const emptyText = computed(() => {
  const { search, category, status } = feeItemFilters.value
  const hasActiveFilter = search !== '' || category !== '' || status !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadFeeItems() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchFeeItems(buildFeeItemListParams(feeItemFilters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      feeItemFilters.value = applyPageChange(feeItemFilters.value, listResponse.meta.last_page)
      loadFeeItems()
      return
    }
    feeItems.value = listResponse?.fee_items ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === feeItemFilters.value.search) return
  feeItemFilters.value = applySearchChange(feeItemFilters.value, searchInput.value)
  loadFeeItems()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeCategory(nextCategory) {
  feeItemFilters.value = applyFeeItemCategoryChange(feeItemFilters.value, nextCategory)
  loadFeeItems()
}

function changeStatus(nextStatus) {
  feeItemFilters.value = applyStatusChange(feeItemFilters.value, nextStatus)
  loadFeeItems()
}

function changePage(nextPage) {
  feeItemFilters.value = applyPageChange(feeItemFilters.value, nextPage)
  loadFeeItems()
}

function openCreateForm() {
  editingFeeItem.value = null
  formValues.value = createEmptyFeeItemForm()
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(feeItem) {
  editingFeeItem.value = feeItem
  formValues.value = buildFormFromFeeItem(feeItem)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function resetForm() {
  isFormOpen.value = false
  editingFeeItem.value = null
  formValues.value = createEmptyFeeItemForm()
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitFeeItemForm() {
  const feeItemPayload = buildFeeItemPayload(formValues.value)
  if (!isCreating.value) return updateFeeItem(editingFeeItem.value.id, feeItemPayload)
  return createFeeItem(feeItemPayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadFeeItems()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveFeeItem() {
  if (isSaving.value) return
  fieldErrors.value = findFeeItemFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitFeeItemForm()
    resetForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    if (wasCreating) feeItemFilters.value = applyPageChange(feeItemFilters.value, FIRST_PAGE)
    loadFeeItems()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function requestStatusChange(feeItem) {
  statusChangeFeeItem.value = feeItem
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangeFeeItem.value = null
}

function submitStatusChange(feeItem) {
  if (feeItem.is_active) return deactivateFeeItem(feeItem.id)
  return reactivateFeeItem(feeItem.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangeFeeItem.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangeFeeItem.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangeFeeItem.value = null
    loadFeeItems()
  }
}

onMounted(loadFeeItems)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Fee items</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add fee item
      </button>
    </div>
    <FeeItemFilterBar
      :search="searchInput"
      :category="feeItemFilters.category"
      :status="feeItemFilters.status"
      @update:search="updateSearchInput"
      @update:category="changeCategory"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="FEE_ITEM_COLUMNS"
      :rows="feeItems"
      :row-key="FEE_ITEM_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-name="{ row }">
        <span class="block max-w-60 truncate font-semibold" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-category="{ value }">
        <span class="whitespace-nowrap">{{ getCategoryLabel(value) }}</span>
      </template>
      <template #cell-description="{ value }">
        <span class="block max-w-80 truncate text-ink-muted" :title="value ?? ''">{{ value || NO_VALUE_LABEL }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
          {{ getStatusChip(value).label }}
        </span>
      </template>
      <template #actions="{ row }">
        <FeeItemRowActions
          :fee-item="row"
          @edit="openEditForm(row)"
          @deactivate="requestStatusChange(row)"
          @reactivate="requestStatusChange(row)"
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

  <Modal :is-open="isFormOpen" :title="formTitle" @close="closeForm">
    <form :id="FEE_ITEM_FORM_ID" novalidate @submit.prevent="saveFeeItem">
      <FeeItemFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeForm">
        Cancel
      </button>
      <button type="submit" :form="FEE_ITEM_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>

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
</template>
