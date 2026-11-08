<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Plus } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import EmployeeFilterBar from '@/components/EmployeeFilterBar.vue'
import EmployeeFormFields from '@/components/EmployeeFormFields.vue'
import EmployeePasswordFields from '@/components/EmployeePasswordFields.vue'
import EmployeeRowActions from '@/components/EmployeeRowActions.vue'
import {
  NO_CONTACT_TEXT,
  ROLE_CHIP_CLASS,
  buildDeactivateMessage,
  buildPasswordResetMessage,
  buildReactivateMessage,
  getStatusChip,
} from '@/utils/employeeDisplay.js'
import {
  createEmployee,
  deactivateEmployee,
  fetchEmployees,
  reactivateEmployee,
  setEmployeePassword,
  updateEmployee,
} from '@/services/employeeService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { ADMIN_ROLE, useAuthStore } from '@/stores/authStore.js'
import { LOGIN_ROUTE_NAME } from '@/routeNames.js'
import {
  FIRST_PAGE,
  applyPageChange,
  applySearchChange,
  isPageBeyondLast,
  normalizeSearchText,
} from '@/utils/studentSearch.js'
import {
  applyRoleChange,
  applyStatusChange,
  buildEmployeeListParams,
  createEmployeeFilters,
} from '@/utils/employeeSearch.js'
import {
  buildAuthUserFromEmployee,
  buildEmployeePayload,
  buildFormFromEmployee,
  buildPasswordPayload,
  createEmptyEmployeeForm,
  createEmptyPasswordForm,
  findEmployeeFormErrors,
  findPasswordFormErrors,
} from '@/utils/employeeForm.js'

const EMPLOYEE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'contact', label: 'Contact' },
  { key: 'roles', label: 'Roles' },
  { key: 'is_active', label: 'Status' },
]
const EMPLOYEE_ROW_KEY = 'id'
const OWN_LOCKED_ROLES = Object.freeze([ADMIN_ROLE])
const NO_LOCKED_ROLES = Object.freeze([])
const EMPLOYEE_FORM_ID = 'employee-form'
const PASSWORD_FORM_ID = 'employee-password-form'
const PASSWORD_ID_PREFIX = 'employee-reset-'
const NEW_PASSWORD_LABEL = 'New password'
const EMPTY_TEXT = 'No employees yet.'
const NO_MATCH_TEXT = 'No employees match the search or filters.'
const ADD_TITLE = 'Add employee'
const EDIT_TITLE = 'Edit employee'
const PASSWORD_TITLE = 'Reset password'
const DEACTIVATE_TITLE = 'Deactivate employee'
const REACTIVATE_TITLE = 'Reactivate employee'
const DEACTIVATE_CONFIRM_LABEL = 'Deactivate'
const REACTIVATE_CONFIRM_LABEL = 'Reactivate'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load employees.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Employee added.'
const UPDATE_SUCCESS_MESSAGE = 'Employee updated.'
const SAVE_FAILED_MESSAGE = 'Could not save the employee.'
const PASSWORD_SUCCESS_MESSAGE = 'Password updated. The employee must log in again.'
const OWN_PASSWORD_SUCCESS_MESSAGE = 'Password changed. Log in again with the new password.'
const PASSWORD_FAILED_MESSAGE = 'Could not set the password.'
const DEACTIVATE_SUCCESS_MESSAGE = 'Employee deactivated.'
const REACTIVATE_SUCCESS_MESSAGE = 'Employee reactivated.'
const STATUS_FAILED_MESSAGE = 'Could not change the employee status.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

function createEmptyPageMeta() {
  return { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

const employees = ref([])
const pageMeta = ref(createEmptyPageMeta())
const employeeFilters = ref(createEmployeeFilters())
const searchInput = ref('')
const isListLoading = ref(false)
const isFormOpen = ref(false)
const editingEmployee = ref(null)
const formValues = ref(createEmptyEmployeeForm())
const fieldErrors = ref({})
const isSaving = ref(false)
const resettingEmployee = ref(null)
const passwordValues = ref(createEmptyPasswordForm())
const passwordErrors = ref({})
const isSettingPassword = ref(false)
const statusChangeEmployee = ref(null)
const isChangingStatus = ref(false)
let listRequestId = 0
let searchDebounceTimer = null

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const isCreating = computed(() => editingEmployee.value === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const lockedRoles = computed(() => (isOwnEmployee(editingEmployee.value) ? OWN_LOCKED_ROLES : NO_LOCKED_ROLES))
const isPasswordFormOpen = computed(() => resettingEmployee.value !== null)
const passwordMessage = computed(() => buildPasswordResetMessage(resettingEmployee.value))
const isStatusConfirmOpen = computed(() => statusChangeEmployee.value !== null)
const isDeactivating = computed(() => statusChangeEmployee.value?.is_active === true)
const statusTitle = computed(() => (isDeactivating.value ? DEACTIVATE_TITLE : REACTIVATE_TITLE))
const statusConfirmLabel = computed(() => (isDeactivating.value ? DEACTIVATE_CONFIRM_LABEL : REACTIVATE_CONFIRM_LABEL))
const statusMessage = computed(() => {
  if (isDeactivating.value) return buildDeactivateMessage(statusChangeEmployee.value)
  return buildReactivateMessage(statusChangeEmployee.value)
})
const emptyText = computed(() => {
  const { search, role, status } = employeeFilters.value
  const hasActiveFilter = search !== '' || role !== '' || status !== ''
  return hasActiveFilter ? NO_MATCH_TEXT : EMPTY_TEXT
})

function isOwnEmployee(employee) {
  if (employee === null || typeof employee !== 'object') return false
  if (!authStore.user) return false
  return employee.id === authStore.user.id
}

function canDeactivate(employee) {
  return employee.is_active && !isOwnEmployee(employee)
}

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadEmployees() {
  const requestId = ++listRequestId
  isListLoading.value = true
  try {
    const listResponse = await fetchEmployees(buildEmployeeListParams(employeeFilters.value))
    if (requestId !== listRequestId) return
    if (isPageBeyondLast(listResponse?.meta)) {
      employeeFilters.value = applyPageChange(employeeFilters.value, listResponse.meta.last_page)
      loadEmployees()
      return
    }
    employees.value = listResponse?.employees ?? []
    pageMeta.value = listResponse?.meta ?? createEmptyPageMeta()
  } catch (error) {
    if (requestId !== listRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === listRequestId) isListLoading.value = false
  }
}

function applySearch() {
  if (normalizeSearchText(searchInput.value) === employeeFilters.value.search) return
  employeeFilters.value = applySearchChange(employeeFilters.value, searchInput.value)
  loadEmployees()
}

function updateSearchInput(nextSearch) {
  searchInput.value = nextSearch
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applySearch, SEARCH_DEBOUNCE_MS)
}

function cancelPendingSearch() {
  clearTimeout(searchDebounceTimer)
}

function changeRole(nextRole) {
  employeeFilters.value = applyRoleChange(employeeFilters.value, nextRole)
  loadEmployees()
}

function changeStatus(nextStatus) {
  employeeFilters.value = applyStatusChange(employeeFilters.value, nextStatus)
  loadEmployees()
}

function changePage(nextPage) {
  employeeFilters.value = applyPageChange(employeeFilters.value, nextPage)
  loadEmployees()
}

function openCreateForm() {
  editingEmployee.value = null
  formValues.value = createEmptyEmployeeForm()
  fieldErrors.value = {}
  isFormOpen.value = true
}

function openEditForm(employee) {
  editingEmployee.value = employee
  formValues.value = buildFormFromEmployee(employee)
  fieldErrors.value = {}
  isFormOpen.value = true
}

function resetForm() {
  isFormOpen.value = false
  editingEmployee.value = null
  formValues.value = createEmptyEmployeeForm()
  fieldErrors.value = {}
}

function closeForm() {
  if (isSaving.value) return
  resetForm()
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitEmployeeForm() {
  const employeePayload = buildEmployeePayload(formValues.value, isCreating.value)
  if (!isCreating.value) return updateEmployee(editingEmployee.value.id, employeePayload)
  return createEmployee(employeePayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    resetForm()
    loadEmployees()
  }
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

function refreshOwnAuthUser(savedEmployee) {
  if (!isOwnEmployee(savedEmployee)) return
  authStore.persistUser(buildAuthUserFromEmployee(savedEmployee))
}

async function saveEmployee() {
  if (isSaving.value) return
  fieldErrors.value = findEmployeeFormErrors(formValues.value, isCreating.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    const saveResponse = await submitEmployeeForm()
    refreshOwnAuthUser(saveResponse?.employee)
    resetForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    if (wasCreating) employeeFilters.value = applyPageChange(employeeFilters.value, FIRST_PAGE)
    loadEmployees()
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

function openPasswordForm(employee) {
  resettingEmployee.value = employee
  passwordValues.value = createEmptyPasswordForm()
  passwordErrors.value = {}
}

function clearPasswordForm() {
  resettingEmployee.value = null
  passwordValues.value = createEmptyPasswordForm()
  passwordErrors.value = {}
}

function closePasswordForm() {
  if (isSettingPassword.value) return
  clearPasswordForm()
}

function updatePasswordValues(nextPasswordValues) {
  passwordValues.value = nextPasswordValues
}

function applyPasswordError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) passwordErrors.value = validationErrors
  if (status === HTTP_NOT_FOUND) {
    clearPasswordForm()
    loadEmployees()
  }
  toastRequestError(error, PASSWORD_FAILED_MESSAGE)
}

function endOwnSession() {
  // the backend already revoked every token of this account, so a logout call would only 401
  authStore.clearSession()
  toast.success(OWN_PASSWORD_SUCCESS_MESSAGE)
  router.push({ name: LOGIN_ROUTE_NAME })
}

async function savePassword() {
  if (isSettingPassword.value || !resettingEmployee.value) return
  passwordErrors.value = findPasswordFormErrors(passwordValues.value)
  if (Object.keys(passwordErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const targetEmployee = resettingEmployee.value
  isSettingPassword.value = true
  try {
    await setEmployeePassword(targetEmployee.id, buildPasswordPayload(passwordValues.value))
    clearPasswordForm()
    if (isOwnEmployee(targetEmployee)) {
      endOwnSession()
      return
    }
    toast.success(PASSWORD_SUCCESS_MESSAGE)
  } catch (error) {
    applyPasswordError(error)
  } finally {
    isSettingPassword.value = false
  }
}

function requestStatusChange(employee) {
  statusChangeEmployee.value = employee
}

function cancelStatusChange() {
  if (isChangingStatus.value) return
  statusChangeEmployee.value = null
}

function submitStatusChange(employee) {
  if (employee.is_active) return deactivateEmployee(employee.id)
  return reactivateEmployee(employee.id)
}

async function confirmStatusChange() {
  if (isChangingStatus.value || !statusChangeEmployee.value) return
  const wasDeactivating = isDeactivating.value
  isChangingStatus.value = true
  try {
    await submitStatusChange(statusChangeEmployee.value)
    toast.success(wasDeactivating ? DEACTIVATE_SUCCESS_MESSAGE : REACTIVATE_SUCCESS_MESSAGE)
  } catch (error) {
    toastRequestError(error, STATUS_FAILED_MESSAGE)
  } finally {
    isChangingStatus.value = false
    statusChangeEmployee.value = null
    loadEmployees()
  }
}

onMounted(loadEmployees)
onBeforeUnmount(cancelPendingSearch)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Employees</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" @click="openCreateForm">
        <Plus :size="16" aria-hidden="true" />
        Add
      </button>
    </div>
    <EmployeeFilterBar
      :search="searchInput"
      :role="employeeFilters.role"
      :status="employeeFilters.status"
      @update:search="updateSearchInput"
      @update:role="changeRole"
      @update:status="changeStatus"
    />
    <DataTable
      :columns="EMPLOYEE_COLUMNS"
      :rows="employees"
      :row-key="EMPLOYEE_ROW_KEY"
      :empty-text="emptyText"
      :is-loading="isListLoading"
    >
      <template #cell-name="{ row }">
        <span class="block max-w-64 truncate font-semibold" :title="row.name">{{ row.name }}</span>
      </template>
      <template #cell-email="{ row }">
        <span class="block max-w-64 truncate" :title="row.email">{{ row.email }}</span>
      </template>
      <template #cell-contact="{ value }">
        <span v-if="value" class="whitespace-nowrap tabular-nums">{{ value }}</span>
        <span v-else class="text-ink-muted">{{ NO_CONTACT_TEXT }}</span>
      </template>
      <template #cell-roles="{ value }">
        <div class="flex flex-wrap gap-1">
          <span v-for="roleName in value" :key="roleName" :class="ROLE_CHIP_CLASS">{{ roleName }}</span>
        </div>
      </template>
      <template #cell-is_active="{ value }">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="getStatusChip(value).colorClass">
          {{ getStatusChip(value).label }}
        </span>
      </template>
      <template #actions="{ row }">
        <EmployeeRowActions
          :employee="row"
          :can-deactivate="canDeactivate(row)"
          @edit="openEditForm(row)"
          @reset-password="openPasswordForm(row)"
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
    <form :id="EMPLOYEE_FORM_ID" novalidate @submit.prevent="saveEmployee">
      <EmployeeFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :is-creating="isCreating"
        :locked-roles="lockedRoles"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeForm">
        Cancel
      </button>
      <button type="submit" :form="EMPLOYEE_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>

  <Modal :is-open="isPasswordFormOpen" :title="PASSWORD_TITLE" @close="closePasswordForm">
    <form :id="PASSWORD_FORM_ID" novalidate @submit.prevent="savePassword">
      <p class="mb-4 text-sm text-ink">{{ passwordMessage }}</p>
      <EmployeePasswordFields
        :id-prefix="PASSWORD_ID_PREFIX"
        :password-label="NEW_PASSWORD_LABEL"
        :model-value="passwordValues"
        :field-errors="passwordErrors"
        :is-disabled="isSettingPassword"
        @update:model-value="updatePasswordValues"
      />
    </form>
    <template #footer>
      <button
        type="button"
        :class="SECONDARY_BUTTON_CLASS"
        class="text-ink"
        :disabled="isSettingPassword"
        @click="closePasswordForm"
      >
        Cancel
      </button>
      <button type="submit" :form="PASSWORD_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSettingPassword">
        {{ isSettingPassword ? 'Saving…' : 'Save' }}
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
