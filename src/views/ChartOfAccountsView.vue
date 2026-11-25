<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import AccountFilterBar from '@/components/AccountFilterBar.vue'
import AccountRowActions from '@/components/AccountRowActions.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import AccountFormModalView from '@/views/AccountFormModalView.vue'
import { deactivateAccount, deleteAccount, fetchAllAccounts, reactivateAccount } from '@/services/accountService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  ACCOUNT_COLUMNS,
  buildAccountDeactivateMessage,
  buildAccountDeleteMessage,
  buildAccountReactivateMessage,
  getContraChip,
  getNormalBalanceLabel,
  getSubtypeLabel,
  groupAccountsByType,
} from '@/utils/accountDisplay.js'
import {
  applyAccountSearchChange,
  applyAccountStatusChange,
  applyAccountTypeChange,
  buildAccountListParams,
  createAccountFilters,
} from '@/utils/accountSearch.js'
import { getStatusChip } from '@/utils/employeeDisplay.js'
import { normalizeSearchText } from '@/utils/studentSearch.js'

const ACCOUNT_ROW_KEY = 'id'
const EMPTY_TEXT = 'No accounts yet.'
const NO_MATCH_TEXT = 'No accounts match the search or filters.'
const LOADING_TEXT = 'Loading…'
const DEACTIVATE_TITLE = 'Deactivate account'
const REACTIVATE_TITLE = 'Reactivate account'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const DELETE_TITLE = 'Delete account'
const DELETE_CONFIRM_LABEL = 'Delete'
const SEARCH_DEBOUNCE_MS = 300

const LOAD_FAILED_MESSAGE = 'Could not load accounts.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Account deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Account reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the account status.'
const DELETE_SUCCESS_MESSAGE = 'Account deleted.'
const DELETE_FAILED_MESSAGE = 'Could not delete the account.'

const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const accounts = ref([])
const accountFilters = ref(createAccountFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingAccount = ref(null)
const statusChangeAccount = ref(null)
const isChangingStatus = ref(false)
const deletingAccount = ref(null)
const isDeleting = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const toast = useToast()

const accountGroups = computed(() => groupAccountsByType(accounts.value))
const isStatusConfirmOpen = computed(() => statusChangeAccount.value !== null)
const isDeactivating = computed(() => statusChangeAccount.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildAccountDeactivateMessage(statusChangeAccount.value)
  return buildAccountReactivateMessage(statusChangeAccount.value)
})
const isDeleteConfirmOpen = computed(() => deletingAccount.value !== null)
const deleteMessage = computed(() => buildAccountDeleteMessage(deletingAccount.value))
const emptyText = computed(() => {
  if (isListLoading.value) return LOADING_TEXT
  const { search, type, status } = accountFilters.value
  const hasActiveFilter = search !== '' || type !== '' || status !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadAccounts() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchAllAccounts(buildAccountListParams(accountFilters.value))
    if (requestId !== listRequestId) return
    accounts.value = listResponse?.accounts ?? []
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === accountFilters.value.search) return
  accountFilters.value = applyAccountSearchChange(accountFilters.value, searchInput.value)
  loadAccounts()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeType(nextType) {
  accountFilters.value = applyAccountTypeChange(accountFilters.value, nextType)
  loadAccounts()
}

function changeStatus(nextStatus) {
  accountFilters.value = applyAccountStatusChange(accountFilters.value, nextStatus)
  loadAccounts()
}

function openCreateForm() {
  editingAccount.value = null
  isFormOpen.value = true
}

function openEditForm(account) {
  editingAccount.value = account
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  editingAccount.value = null
}

function handleSaved() {
  closeForm()
  loadAccounts()
}

function requestStatusChange(account) {
  statusChangeAccount.value = account
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangeAccount.value = null
}

function submitStatusChange(account) {
  if (account.is_active === true) return deactivateAccount(account.id)
  return reactivateAccount(account.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangeAccount.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangeAccount.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    // a 404 means another tab removed it: the reload below drops the row
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangeAccount.value = null
    loadAccounts()
  }
}

function requestDelete(account) {
  deletingAccount.value = account
}

function cancelDelete() {
  if (isDeleting.value) return
  deletingAccount.value = null
}

async function confirmDelete() {
  if (isDeleting.value || !deletingAccount.value) return
  isDeleting.value = true
  try {
    await deleteAccount(deletingAccount.value.id)
    toast.success(DELETE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, DELETE_FAILED_MESSAGE)
  } finally {
    isDeleting.value = false
    deletingAccount.value = null
    loadAccounts()
  }
}

onMounted(loadAccounts)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Accounts</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add account
      </button>
    </div>
    <AccountFilterBar
      :search="searchInput"
      :type="accountFilters.type"
      :status="accountFilters.status"
      @update:search="updateSearchInput"
      @update:type="changeType"
      @update:status="changeStatus"
    />
    <p v-if="accountGroups.length === 0" class="px-4 py-8 text-center text-sm text-ink-muted">{{ emptyText }}</p>
    <section v-for="accountGroup in accountGroups" :key="accountGroup.type" :aria-label="accountGroup.label">
      <div class="flex items-baseline justify-between gap-3 border-t border-line bg-page px-4 py-2">
        <h2 class="text-sm font-bold text-ink">{{ accountGroup.label }}</h2>
        <span class="text-xs tabular-nums text-ink-muted">{{ accountGroup.accounts.length }}</span>
      </div>
      <DataTable :columns="ACCOUNT_COLUMNS" :rows="accountGroup.accounts" :row-key="ACCOUNT_ROW_KEY">
        <template #cell-code="{ value }">
          <span class="whitespace-nowrap font-mono text-xs font-semibold">{{ value }}</span>
        </template>
        <template #cell-name="{ row }">
          <span class="flex items-center gap-2">
            <span class="block max-w-80 truncate" :title="row.name">{{ row.name }}</span>
            <span
              v-if="getContraChip(row)"
              class="rounded-full px-2.5 py-0.5 text-xs font-bold"
              :class="getContraChip(row).colorClass"
            >
              {{ getContraChip(row).label }}
            </span>
          </span>
        </template>
        <template #cell-subtype="{ value }">
          <span class="whitespace-nowrap">{{ getSubtypeLabel(value) }}</span>
        </template>
        <template #cell-normal_balance="{ value }">
          <span class="whitespace-nowrap">{{ getNormalBalanceLabel(value) }}</span>
        </template>
        <template #cell-is_active="{ value }">
          <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
            {{ getStatusChip(value).label }}
          </span>
        </template>
        <template #actions="{ row }">
          <AccountRowActions
            :account="row"
            @edit="openEditForm(row)"
            @deactivate="requestStatusChange(row)"
            @reactivate="requestStatusChange(row)"
            @delete="requestDelete(row)"
          />
        </template>
      </DataTable>
    </section>
  </section>

  <AccountFormModalView :is-open="isFormOpen" :account="editingAccount" @close="closeForm" @saved="handleSaved" />

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
