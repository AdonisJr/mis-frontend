<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import DiscountTypeFormFields from '@/components/DiscountTypeFormFields.vue'
import Modal from '@/components/modal/Modal.vue'
import { createDiscountType, fetchDiscountType, updateDiscountType } from '@/services/discountTypeService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  buildDiscountTypePayload,
  buildFormFromDiscountType,
  createEmptyDiscountTypeForm,
  findDiscountTypeFormErrors,
} from '@/utils/discountTypeForm.js'

const FORM_ID = 'discount-type-form'
const ADD_TITLE = 'Add discount type'
const EDIT_TITLE = 'Edit discount type'
const LOADING_TEXT = 'Loading…'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const LOAD_FAILED_MESSAGE = 'Could not load the discount type.'
const SAVE_FAILED_MESSAGE = 'Could not save the discount type.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Discount type added.'
const UPDATE_SUCCESS_MESSAGE = 'Discount type updated.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  discountType: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createEmptyDiscountTypeForm())
const fieldErrors = ref({})
const isLoading = ref(false)
const isSaving = ref(false)
let loadRequestId = 0

const toast = useToast()

const isCreating = computed(() => props.discountType === null)
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

async function loadDiscountTypeForm() {
  if (isCreating.value) return
  const requestId = ++loadRequestId
  isLoading.value = true
  try {
    const typeResponse = await fetchDiscountType(props.discountType.id)
    if (requestId !== loadRequestId) return
    formValues.value = buildFormFromDiscountType(typeResponse?.discount_type)
  } catch (error) {
    if (requestId !== loadRequestId) return
    applyLoadError(error)
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

function resetModal() {
  formValues.value = createEmptyDiscountTypeForm()
  fieldErrors.value = {}
  isSaving.value = false
  loadDiscountTypeForm()
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function submitDiscountTypeForm() {
  const discountTypePayload = buildDiscountTypePayload(formValues.value)
  if (!isCreating.value) return updateDiscountType(props.discountType.id, discountTypePayload)
  return createDiscountType(discountTypePayload)
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

async function saveDiscountType() {
  if (isBusy.value) return
  fieldErrors.value = findDiscountTypeFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitDiscountTypeForm()
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
    <form v-else :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="saveDiscountType">
      <DiscountTypeFormFields v-model="formValues" :field-errors="fieldErrors" :is-disabled="isSaving" />
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
