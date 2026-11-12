<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import EnrollmentMoveFields from '@/components/EnrollmentMoveFields.vue'
import { moveEnrollment } from '@/services/enrollmentService.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { formatEnrollmentSection } from '@/utils/enrollmentDisplay.js'
import {
  buildMovePayload,
  buildSectionOptionLabel,
  createEmptyMoveForm,
  findMoveFormErrors,
  isSectionFull,
  listMoveTargets,
  toIsoDate,
} from '@/utils/enrollmentForm.js'
import { toRecordId } from '@/utils/sectionForm.js'

const MOVE_FORM_ID = 'enrollment-move-form'
const MOVE_TITLE = 'Move student'
const HTTP_UNPROCESSABLE_ENTITY = 422

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SECTIONS_FAILED_MESSAGE = 'Could not load sections.'
const SAVE_FAILED_MESSAGE = 'Could not save the enrollment.'
const SAVE_SUCCESS_MESSAGE = 'Student moved.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  enrollment: { type: Object, default: null },
  schoolYearId: { type: String, required: true },
})

const emit = defineEmits(['close', 'moved'])

const formValues = ref(createEmptyMoveForm(''))
const fieldErrors = ref({})
const isSaving = ref(false)
const sections = ref([])
let sectionRequestId = 0

const toast = useToast()

const isOpen = computed(() => props.enrollment !== null)
const termText = computed(() => String(props.enrollment?.term_id ?? ''))
const currentSectionLabel = computed(() => formatEnrollmentSection(props.enrollment))
const sectionOptions = computed(() =>
  listMoveTargets(sections.value, props.enrollment?.section_id).map((section) => ({
    id: section.id,
    label: buildSectionOptionLabel(section, termText.value),
    isFull: isSectionFull(section, termText.value),
  })),
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadSections() {
  const requestId = ++sectionRequestId
  const sectionListParams = { school_year_id: toRecordId(props.schoolYearId) }
  const termId = toRecordId(props.enrollment?.term_id)
  if (termId !== null) sectionListParams.term_id = termId
  try {
    const sectionResponse = await fetchAllSections(sectionListParams)
    if (requestId !== sectionRequestId) return
    sections.value = sectionResponse?.sections ?? []
  } catch (error) {
    if (requestId !== sectionRequestId) return
    toastRequestError(error, SECTIONS_FAILED_MESSAGE)
  }
}

function resetModal() {
  formValues.value = createEmptyMoveForm(toIsoDate(new Date()))
  fieldErrors.value = {}
  sections.value = []
  loadSections()
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
  // a 422 without field errors means the record was closed meanwhile, so the list must refresh
  if (status === HTTP_UNPROCESSABLE_ENTITY && !validationErrors) emit('moved')
}

async function saveMove() {
  if (isSaving.value) return
  fieldErrors.value = findMoveFormErrors(formValues.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  isSaving.value = true
  try {
    await moveEnrollment(props.enrollment.id, buildMovePayload(formValues.value))
    toast.success(SAVE_SUCCESS_MESSAGE)
    emit('moved')
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.enrollment,
  (nextEnrollment) => {
    if (nextEnrollment !== null) resetModal()
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="MOVE_TITLE" @close="closeModal">
    <form :id="MOVE_FORM_ID" novalidate @submit.prevent="saveMove">
      <EnrollmentMoveFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :current-section-label="currentSectionLabel"
        :section-options="sectionOptions"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="MOVE_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Move' }}
      </button>
    </template>
  </Modal>
</template>
