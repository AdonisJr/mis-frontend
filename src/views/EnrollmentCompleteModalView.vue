<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import EnrollmentCompleteFields from '@/components/EnrollmentCompleteFields.vue'
import { completeSection } from '@/services/enrollmentService.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  buildClosedCountText,
  buildCompleteConfirm,
  buildCompleteCountText,
  buildCompletePayload,
  createCompleteForm,
  findCompleteFormErrors,
  getCompleteCount,
} from '@/utils/enrollmentComplete.js'
import { buildSectionOptionLabel, clearTermForSection, findSection, isTermRequired } from '@/utils/enrollmentForm.js'
import { pickListedRecordId } from '@/utils/enrollmentRollover.js'
import { toRecordId } from '@/utils/sectionForm.js'

const COMPLETE_TITLE = 'Complete section'
const COMPLETE_FORM_ID = 'enrollment-complete-form'
const HTTP_UNPROCESSABLE_ENTITY = 422

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SECTIONS_FAILED_MESSAGE = 'Could not load sections.'
const COMPLETE_FAILED_MESSAGE = 'Could not complete the section.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  schoolYearId: { type: String, required: true },
  terms: { type: Array, required: true },
  defaultSectionId: { type: String, required: true },
  defaultTermId: { type: String, required: true },
})

const emit = defineEmits(['close', 'completed'])

const formValues = ref(createCompleteForm('', ''))
const fieldErrors = ref({})
const sections = ref([])
const isSectionsLoading = ref(false)
const isConfirming = ref(false)
const isSaving = ref(false)
let sectionRequestId = 0
let loadedTermId = null

const toast = useToast()

const sectionOptions = computed(() =>
  sections.value.map((section) => ({
    id: section.id,
    label: buildSectionOptionLabel({ ...section, enrolled_count: null }, ''),
  })),
)
const selectedSection = computed(() => findSection(sections.value, formValues.value.section_id))
const selectedTerm = computed(
  () => props.terms.find((term) => term.id === toRecordId(formValues.value.term_id)) ?? null,
)
const isTermVisible = computed(() => isTermRequired(selectedSection.value))
const count = computed(() => {
  if (isSectionsLoading.value) return null
  return getCompleteCount(selectedSection.value, formValues.value.term_id)
})
const countText = computed(() => buildCompleteCountText(count.value))
const canContinue = computed(() => !isSaving.value && Boolean(count.value))
const confirmContent = computed(() => buildCompleteConfirm(selectedSection.value, selectedTerm.value))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadSections(termId) {
  const requestId = ++sectionRequestId
  const sectionListParams = { school_year_id: toRecordId(props.schoolYearId) }
  if (termId !== null) sectionListParams.term_id = termId
  loadedTermId = termId
  isSectionsLoading.value = true
  try {
    const sectionResponse = await fetchAllSections(sectionListParams)
    if (requestId !== sectionRequestId) return false
    sections.value = sectionResponse?.sections ?? []
    return true
  } catch (error) {
    if (requestId !== sectionRequestId) return false
    toastRequestError(error, SECTIONS_FAILED_MESSAGE)
    return false
  } finally {
    if (requestId === sectionRequestId) isSectionsLoading.value = false
  }
}

async function applyFormValues(nextFormValues) {
  const section = findSection(sections.value, nextFormValues.section_id)
  formValues.value = clearTermForSection(nextFormValues, section)
  const nextTermId = toRecordId(formValues.value.term_id)
  if (nextTermId !== loadedTermId) await loadSections(nextTermId)
}

async function resetModal() {
  formValues.value = createCompleteForm('', '')
  fieldErrors.value = {}
  sections.value = []
  isConfirming.value = false
  isSaving.value = false
  const isLoaded = await loadSections(toRecordId(props.defaultTermId))
  if (!isLoaded) return
  const defaultSectionId = pickListedRecordId(sections.value, props.defaultSectionId)
  await applyFormValues(createCompleteForm(defaultSectionId, props.defaultTermId))
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  fieldErrors.value = {}
  applyFormValues(nextFormValues)
}

function continueToConfirm() {
  if (!canContinue.value) return
  fieldErrors.value = findCompleteFormErrors(formValues.value, selectedSection.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  isConfirming.value = true
}

function cancelConfirm() {
  if (isSaving.value) return
  isConfirming.value = false
}

function applyCompleteError(error) {
  const validationErrors = error.response?.data?.errors
  const isFieldError = error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors
  if (isFieldError) fieldErrors.value = validationErrors
  toastRequestError(error, COMPLETE_FAILED_MESSAGE)
}

async function confirmComplete() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const completeResponse = await completeSection(
      toRecordId(formValues.value.section_id),
      buildCompletePayload(formValues.value, selectedSection.value),
    )
    toast.success(buildClosedCountText(completeResponse))
    emit('completed')
  } catch (error) {
    applyCompleteError(error)
  } finally {
    isSaving.value = false
    isConfirming.value = false
  }
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (isNowOpen) resetModal()
  },
)
</script>

<template>
  <Modal :is-open="isOpen && !isConfirming" :title="COMPLETE_TITLE" @close="closeModal">
    <form :id="COMPLETE_FORM_ID" novalidate @submit.prevent="continueToConfirm">
      <EnrollmentCompleteFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :section-options="sectionOptions"
        :terms="terms"
        :is-term-visible="isTermVisible"
        :count-text="countText"
        @update:model-value="updateFormValues"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="COMPLETE_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="!canContinue">
        Continue
      </button>
    </template>
  </Modal>

  <ConfirmDialog
    :is-open="isOpen && isConfirming"
    :title="confirmContent?.title ?? ''"
    :message="confirmContent?.message ?? ''"
    :confirm-label="confirmContent?.confirmLabel"
    :is-loading="isSaving"
    @confirm="confirmComplete"
    @cancel="cancelConfirm"
  />
</template>
