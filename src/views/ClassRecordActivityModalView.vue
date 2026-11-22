<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ActivityFormFields from '@/components/ActivityFormFields.vue'
import { createActivity, updateActivity } from '@/services/gradingService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  buildActivityPayload,
  buildFormFromActivity,
  createEmptyActivityForm,
  findActivityFormErrors,
  listComponentOptions,
} from '@/utils/classRecordForm.js'

const ACTIVITY_FORM_ID = 'class-record-activity-form'
const ADD_TITLE = 'Add activity'
const EDIT_TITLE = 'Edit activity'
const HTTP_UNPROCESSABLE_ENTITY = 422
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SAVE_FAILED_MESSAGE = 'Could not save the activity.'
const ADDED_MESSAGE = 'Activity added.'
const UPDATED_MESSAGE = 'Activity updated.'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  classId: { type: Number, default: null },
  quarter: { type: Number, default: null },
  activities: { type: Array, default: () => [] },
  activity: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const toast = useToast()

const formValues = ref(createEmptyActivityForm())
const fieldErrors = ref({})
const isSaving = ref(false)

const isEditing = computed(() => props.activity !== null)
const modalTitle = computed(() => (isEditing.value ? EDIT_TITLE : ADD_TITLE))
const componentOptions = computed(() => listComponentOptions(props.activities, props.activity?.id))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function sendActivity(activityPayload) {
  const quarterRef = { classId: props.classId, quarter: props.quarter }
  if (!isEditing.value) return createActivity(quarterRef, activityPayload)
  return updateActivity({ ...quarterRef, activityId: props.activity.id }, activityPayload)
}

function applySaveError(error) {
  const validationErrors = error.response?.data?.errors
  if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveActivity() {
  if (isSaving.value) return
  fieldErrors.value = findActivityFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  isSaving.value = true
  try {
    await sendActivity(buildActivityPayload(formValues.value))
    toast.success(isEditing.value ? UPDATED_MESSAGE : ADDED_MESSAGE)
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
    if (!isNowOpen) return
    formValues.value = isEditing.value ? buildFormFromActivity(props.activity) : createEmptyActivityForm()
    fieldErrors.value = {}
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="modalTitle" @close="closeModal">
    <form :id="ACTIVITY_FORM_ID" novalidate @submit.prevent="saveActivity">
      <ActivityFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :component-options="componentOptions"
        :is-disabled="isSaving"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving" @click="closeModal">Cancel</button>
      <button type="submit" :form="ACTIVITY_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>
</template>
