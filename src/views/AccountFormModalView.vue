<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import AccountFormFields from '@/components/AccountFormFields.vue'
import Modal from '@/components/modal/Modal.vue'
import { createAccount, fetchAccount, updateAccount } from '@/services/accountService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { isAccountUsed } from '@/utils/accountDisplay.js'
import {
  buildAccountPayload,
  buildFormFromAccount,
  createEmptyAccountForm,
  findAccountFormErrors,
} from '@/utils/accountForm.js'

const FORM_ID = 'account-form'
const ADD_TITLE = 'Add account'
const EDIT_TITLE = 'Edit account'
const LOADING_TEXT = 'Loading…'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load the account.'
const SAVE_FAILED_MESSAGE = 'Could not save the account.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Account added.'
const UPDATE_SUCCESS_MESSAGE = 'Account updated.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  account: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createEmptyAccountForm())
const fieldErrors = ref({})
const isLoading = ref(false)
const isSaving = ref(false)
const isKeyLocked = ref(false)
let loadRequestId = 0

const toast = useToast()

const isCreating = computed(() => props.account === null)
const formTitle = computed(() => (isCreating.value ? ADD_TITLE : EDIT_TITLE))
const isBusy = computed(() => isLoading.value || isSaving.value)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function applyLoadError(error) {
  toastRequestError(error, LOAD_FAILED_MESSAGE)
  if (error.response?.status !== HTTP_NOT_FOUND) return
  emit('saved')
  emit('close')
}

async function loadAccountForm() {
  if (isCreating.value) return
  const requestId = ++loadRequestId
  isLoading.value = true
  try {
    const accountResponse = await fetchAccount(props.account.id)
    if (requestId !== loadRequestId) return
    formValues.value = buildFormFromAccount(accountResponse?.account)
    isKeyLocked.value = isAccountUsed(accountResponse?.account)
  } catch (error) {
    if (requestId !== loadRequestId) return
    applyLoadError(error)
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

function resetModal() {
  formValues.value = createEmptyAccountForm()
  fieldErrors.value = {}
  isSaving.value = false
  isKeyLocked.value = false
  loadAccountForm()
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function submitAccountForm() {
  const accountPayload = buildAccountPayload(formValues.value)
  if (!isCreating.value) return updateAccount(props.account.id, accountPayload)
  return createAccount(accountPayload)
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
  if (status !== HTTP_NOT_FOUND) return
  emit('saved')
  emit('close')
}

async function saveAccount() {
  if (isBusy.value) return
  fieldErrors.value = findAccountFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitAccountForm()
    toast.success(wasCreating ? CREATE_SUCCESS_MESSAGE : UPDATE_SUCCESS_MESSAGE)
    emit('saved')
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (isNowOpen) {
      resetModal()
      return
    }
    // a load still in flight belongs to the closed modal
    loadRequestId += 1
    isLoading.value = false
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="formTitle" @close="closeModal">
    <p v-if="isLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
    <form v-else :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="saveAccount">
      <AccountFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :is-key-locked="isKeyLocked"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isBusy">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>
</template>
