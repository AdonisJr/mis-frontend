<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import EnrollmentRolloverFields from '@/components/EnrollmentRolloverFields.vue'
import EnrollmentRolloverResult from '@/components/EnrollmentRolloverResult.vue'
import { fetchRolloverPreview, rollOverSection } from '@/services/enrollmentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { buildSectionOptionLabel } from '@/utils/enrollmentForm.js'
import {
  buildRolloverPayload,
  createRolloverSelection,
  findRolloverBlockReason,
  listRolloverSections,
  normalizeRolloverPreview,
  normalizeRolloverResult,
  pickListedRecordId,
  toggleRolloverSelection,
} from '@/utils/enrollmentRollover.js'
import { toRecordId } from '@/utils/sectionForm.js'

const ROLLOVER_TITLE = 'Roll over students'
const ROLLOVER_FORM_ID = 'enrollment-rollover-form'
const HTTP_UNPROCESSABLE_ENTITY = 422

const PREVIEW_FAILED_MESSAGE = 'Could not load the students of this section.'
const ROLLOVER_FAILED_MESSAGE = 'Could not roll over the students.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  schoolYearId: { type: String, required: true },
  sections: { type: Array, required: true },
  terms: { type: Array, required: true },
  defaultSectionId: { type: String, required: true },
  defaultTermId: { type: String, required: true },
})

const emit = defineEmits(['close', 'rolled-over'])

const formValues = ref({ section_id: '', term_id: '' })
const preview = ref(null)
const isPreviewLoading = ref(false)
const selectedIds = ref([])
const result = ref(null)
const isSaving = ref(false)
let previewRequestId = 0

const toast = useToast()

const rolloverSections = computed(() => listRolloverSections(props.sections))
const sectionOptions = computed(() =>
  rolloverSections.value.map((section) => ({
    id: section.id,
    // the page's section list carries whole-year counts, so the label shows no seats
    label: buildSectionOptionLabel({ ...section, enrolled_count: null }, ''),
  })),
)
const blockReason = computed(() => findRolloverBlockReason(preview.value, selectedIds.value))
const canSubmit = computed(
  () => preview.value !== null && !isPreviewLoading.value && !isSaving.value && blockReason.value === '',
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

async function loadPreview() {
  const requestId = ++previewRequestId
  const sectionId = toRecordId(formValues.value.section_id)
  const termId = toRecordId(formValues.value.term_id)
  preview.value = null
  selectedIds.value = []
  if (sectionId === null || termId === null) {
    isPreviewLoading.value = false
    return
  }
  isPreviewLoading.value = true
  try {
    const previewResponse = await fetchRolloverPreview(sectionId, termId)
    if (requestId !== previewRequestId) return
    preview.value = normalizeRolloverPreview(previewResponse)
    selectedIds.value = createRolloverSelection(preview.value.rows)
  } catch (error) {
    if (requestId !== previewRequestId) return
    toastRequestError(error, PREVIEW_FAILED_MESSAGE)
  } finally {
    if (requestId === previewRequestId) isPreviewLoading.value = false
  }
}

function resetModal() {
  formValues.value = {
    section_id: pickListedRecordId(rolloverSections.value, props.defaultSectionId),
    term_id: pickListedRecordId(props.terms, props.defaultTermId),
  }
  result.value = null
  isSaving.value = false
  loadPreview()
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateFormValues(nextFormValues) {
  formValues.value = nextFormValues
  result.value = null
  loadPreview()
}

function toggleStudent(row) {
  selectedIds.value = toggleRolloverSelection(selectedIds.value, row)
}

async function submitRollover() {
  if (!canSubmit.value) return
  isSaving.value = true
  try {
    const rolloverResponse = await rollOverSection(
      toRecordId(formValues.value.section_id),
      buildRolloverPayload(formValues.value.term_id, selectedIds.value),
    )
    result.value = normalizeRolloverResult(rolloverResponse)
    preview.value = null
    selectedIds.value = []
    toast.success(result.value.copiedText)
    emit('rolled-over')
  } catch (error) {
    toastRequestError(error, ROLLOVER_FAILED_MESSAGE)
    // a 422 means seats or records changed under the user, so the preview is stale
    if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY) loadPreview()
  } finally {
    isSaving.value = false
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
  <Modal :is-open="isOpen" :title="ROLLOVER_TITLE" @close="closeModal">
    <form :id="ROLLOVER_FORM_ID" novalidate @submit.prevent="submitRollover">
      <EnrollmentRolloverFields
        :model-value="formValues"
        :section-options="sectionOptions"
        :terms="terms"
        :preview="preview"
        :is-preview-loading="isPreviewLoading"
        :selected-ids="selectedIds"
        :block-reason="blockReason"
        :is-disabled="isSaving"
        @update:model-value="updateFormValues"
        @toggle-student="toggleStudent"
      />
      <EnrollmentRolloverResult v-if="result !== null" :result="result" class="mt-4 block" />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        {{ result === null ? 'Cancel' : 'Close' }}
      </button>
      <button
        v-if="result === null"
        type="submit"
        :form="ROLLOVER_FORM_ID"
        :class="PRIMARY_BUTTON_CLASS"
        :disabled="!canSubmit"
      >
        {{ isSaving ? 'Saving…' : 'Roll over' }}
      </button>
    </template>
  </Modal>
</template>
