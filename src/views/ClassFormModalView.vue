<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ClassFormFields from '@/components/ClassFormFields.vue'
import ClassMeetingEditor from '@/components/ClassMeetingEditor.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { createClass, updateClass } from '@/services/scheduleService.js'
import { buildClassModalTitle } from '@/utils/scheduleDisplay.js'
import {
  buildCreateClassPayload,
  buildUpdateClassPayload,
  createClassForm,
  findClassFormErrors,
  getDefaultMeetingRoomId,
  listClassRoomOptions,
  listClassRoomsInUse,
} from '@/utils/scheduleForm.js'
import { listSelectableAdvisers } from '@/utils/sectionForm.js'

const FORM_ID = 'class-form'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404
const SECTION_ROOM_PLACEHOLDER = 'Use section room'
const NO_ROOM_PLACEHOLDER = 'No room'

const SAVE_FAILED_MESSAGE = 'Could not save the class.'
const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CREATE_SUCCESS_MESSAGE = 'Class scheduled.'
const UPDATE_SUCCESS_MESSAGE = 'Class updated.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  section: { type: Object, default: null },
  scheduleRow: { type: Object, default: null },
  activeTeachers: { type: Array, required: true },
  activeRooms: { type: Array, required: true },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createClassForm(null, null))
const fieldErrors = ref({})
const isSaving = ref(false)

const toast = useToast()

const hasTarget = computed(() => props.section !== null && props.scheduleRow !== null)
const isCreating = computed(() => !props.scheduleRow?.class)
const modalTitle = computed(() => buildClassModalTitle(props.scheduleRow))
const teacherOptions = computed(() =>
  listSelectableAdvisers(props.activeTeachers, props.scheduleRow?.class?.teacher ?? null),
)
const roomOptions = computed(() =>
  listClassRoomOptions(props.activeRooms, listClassRoomsInUse(props.section, props.scheduleRow)),
)
const defaultRoomId = computed(() => getDefaultMeetingRoomId(props.section))
const roomPlaceholder = computed(() => (props.section?.room ? SECTION_ROOM_PLACEHOLDER : NO_ROOM_PLACEHOLDER))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function resetModal() {
  formValues.value = createClassForm(props.section, props.scheduleRow)
  fieldErrors.value = {}
  isSaving.value = false
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

// indexed error keys would land on the wrong row once a meeting is added or removed
function updateMeetings(nextMeetings) {
  if (nextMeetings.length !== formValues.value.meetings.length) fieldErrors.value = {}
  formValues.value = { ...formValues.value, meetings: nextMeetings }
}

function submitClassForm() {
  if (!isCreating.value) return updateClass(props.scheduleRow.class.id, buildUpdateClassPayload(formValues.value))
  return createClass(buildCreateClassPayload(formValues.value))
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

async function saveClass() {
  if (isSaving.value) return
  fieldErrors.value = findClassFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasCreating = isCreating.value
  isSaving.value = true
  try {
    await submitClassForm()
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
    if (isNowOpen && hasTarget.value) resetModal()
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="modalTitle" @close="closeModal">
    <form v-if="hasTarget" :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="saveClass">
      <ClassFormFields
        :model-value="formValues"
        :schedule-row="scheduleRow"
        :section="section"
        :teacher-options="teacherOptions"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:model-value="updateFormValues"
      />
      <ClassMeetingEditor
        :model-value="formValues.meetings"
        :room-options="roomOptions"
        :default-room-id="defaultRoomId"
        :room-placeholder="roomPlaceholder"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:model-value="updateMeetings"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving || !hasTarget">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>
</template>
