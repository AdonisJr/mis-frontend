<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import AssessmentFormFields from '@/components/AssessmentFormFields.vue'
import AssessmentSummary from '@/components/AssessmentSummary.vue'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'
import Modal from '@/components/modal/Modal.vue'
import {
  createAssessment,
  fetchAssessmentCandidates,
  previewAssessment,
  reassessAssessment,
} from '@/services/assessmentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { buildReassessConfirmMessage } from '@/utils/assessmentDisplay.js'
import {
  buildAssessPayload,
  buildPreviewKey,
  buildReassessPayload,
  createEmptyAssessForm,
  createReassessForm,
  findAssessFormErrors,
  listAssessablePlans,
} from '@/utils/assessmentForm.js'
import { buildCandidateParams, hasMoreCandidatePages } from '@/utils/assessmentSearch.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { normalizeSearchText } from '@/utils/studentSearch.js'

const FORM_ID = 'assessment-form'
const ASSESS_TITLE = 'Assess student'
const REASSESS_TITLE = 'Re-assess'
const REASSESS_CONFIRM_TITLE = 'Re-assess student'
const REASSESS_CONFIRM_LABEL = 'Re-assess'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const CANDIDATES_FAILED_MESSAGE = 'Could not load students.'
const PREVIEW_FAILED_MESSAGE = 'Could not compute the preview.'
const SAVE_FAILED_MESSAGE = 'Could not save the assessment.'
const SAVE_SUCCESS_MESSAGE = 'Assessment saved.'
const REASSESS_SUCCESS_MESSAGE = 'Assessment re-assessed.'
const PREVIEW_LOADING_TEXT = 'Computing preview…'
const PREVIEW_HEADING = 'Preview'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  assessment: { type: Object, default: null },
  schoolYearId: { type: String, default: '' },
  schoolYearLabel: { type: String, default: '' },
  paymentPlans: { type: Array, required: true },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createEmptyAssessForm(''))
const fieldErrors = ref({})
const isSaving = ref(false)
const isConfirmOpen = ref(false)
const studentSearchText = ref('')
const candidates = ref([])
const hasMore = ref(false)
const isCandidateSearching = ref(false)
const pickedCandidate = ref(null)
const preview = ref(null)
const previewKey = ref('')
const previewError = ref('')
const isPreviewLoading = ref(false)
let candidateRequestId = 0
let previewRequestId = 0
let requestedPreviewKey = ''
let candidateSearchTimer = null

const toast = useToast()

const isReassess = computed(() => props.assessment !== null)
const modalTitle = computed(() => (isReassess.value ? REASSESS_TITLE : ASSESS_TITLE))
const planOptions = computed(() => listAssessablePlans(props.paymentPlans, props.schoolYearId))
const currentPreviewKey = computed(() => buildPreviewKey(formValues.value))
const canSave = computed(
  () =>
    preview.value !== null &&
    previewKey.value === currentPreviewKey.value &&
    !isPreviewLoading.value &&
    !isSaving.value,
)
const chosenPlan = computed(() => planOptions.value.find((paymentPlan) => paymentPlan.id === toRecordId(formValues.value.payment_plan_id)))
const confirmMessage = computed(() => buildReassessConfirmMessage(props.assessment, chosenPlan.value))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function cancelPendingWork() {
  clearTimeout(candidateSearchTimer)
  candidateRequestId += 1
  previewRequestId += 1
}

async function loadCandidates() {
  const candidateParams = buildCandidateParams(props.schoolYearId, studentSearchText.value)
  if (!candidateParams) return
  const requestId = ++candidateRequestId
  isCandidateSearching.value = true
  try {
    const candidateResponse = await fetchAssessmentCandidates(candidateParams)
    if (requestId !== candidateRequestId) return
    candidates.value = candidateResponse?.students ?? []
    hasMore.value = hasMoreCandidatePages(candidateResponse?.meta)
  } catch (error) {
    if (requestId !== candidateRequestId) return
    toastRequestError(error, CANDIDATES_FAILED_MESSAGE)
  } finally {
    if (requestId === candidateRequestId) isCandidateSearching.value = false
  }
}

function updateStudentSearch(nextSearch) {
  studentSearchText.value = nextSearch
  clearTimeout(candidateSearchTimer)
  candidateSearchTimer = setTimeout(loadCandidates, SEARCH_DEBOUNCE_MS)
}

function pickCandidate(candidate) {
  pickedCandidate.value = candidate
  formValues.value = { ...formValues.value, student_id: String(candidate.id) }
}

function clearCandidate() {
  pickedCandidate.value = null
  formValues.value = { ...formValues.value, student_id: '' }
}

async function refreshPreview() {
  const nextKey = currentPreviewKey.value
  if (!props.isOpen || nextKey === requestedPreviewKey) return
  requestedPreviewKey = nextKey
  const requestId = ++previewRequestId
  preview.value = null
  previewKey.value = ''
  previewError.value = ''
  isPreviewLoading.value = nextKey !== ''
  if (nextKey === '') return
  try {
    const previewResponse = await previewAssessment(buildAssessPayload(formValues.value))
    if (requestId !== previewRequestId) return
    preview.value = previewResponse?.assessment ?? null
    previewKey.value = nextKey
  } catch (error) {
    if (requestId !== previewRequestId) return
    applyPreviewError(error)
  } finally {
    if (requestId === previewRequestId) isPreviewLoading.value = false
  }
}

function applyPreviewError(error) {
  const status = error.response?.status
  if (status === HTTP_UNPROCESSABLE_ENTITY) {
    previewError.value = error.response.data?.message ?? PREVIEW_FAILED_MESSAGE
    return
  }
  toastRequestError(error, PREVIEW_FAILED_MESSAGE)
}

function resetModal() {
  cancelPendingWork()
  requestedPreviewKey = ''
  const startForm = isReassess.value
    ? createReassessForm(props.assessment, planOptions.value)
    : createEmptyAssessForm(props.schoolYearId)
  formValues.value = startForm
  pickedCandidate.value = null
  fieldErrors.value = {}
  isSaving.value = false
  isConfirmOpen.value = false
  studentSearchText.value = ''
  candidates.value = []
  hasMore.value = false
  isCandidateSearching.value = false
  refreshPreview()
  if (!isReassess.value) loadCandidates()
}

function closeModal() {
  if (isSaving.value) return
  cancelPendingWork()
  emit('close')
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
  if (status === HTTP_NOT_FOUND) emit('close')
}

function validateForm() {
  fieldErrors.value = findAssessFormErrors(formValues.value, planOptions.value)
  if (Object.keys(fieldErrors.value).length === 0) return true
  toast.error(INVALID_FIELDS_MESSAGE)
  return false
}

async function saveAssessment() {
  if (!canSave.value || !validateForm()) return
  if (isReassess.value) {
    isConfirmOpen.value = true
    return
  }
  isSaving.value = true
  try {
    const saveResponse = await createAssessment(buildAssessPayload(formValues.value))
    toast.success(SAVE_SUCCESS_MESSAGE)
    emit('saved', saveResponse.assessment)
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
  }
}

async function confirmReassess() {
  if (isSaving.value || !props.assessment) return
  isSaving.value = true
  try {
    const reassessResponse = await reassessAssessment(props.assessment.id, buildReassessPayload(formValues.value))
    toast.success(REASSESS_SUCCESS_MESSAGE)
    emit('saved', reassessResponse.assessment)
  } catch (error) {
    applySaveError(error)
  } finally {
    isSaving.value = false
    isConfirmOpen.value = false
  }
}

function cancelReassess() {
  if (isSaving.value) return
  isConfirmOpen.value = false
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (isNowOpen) resetModal()
    else cancelPendingWork()
  },
)
watch(currentPreviewKey, refreshPreview, { immediate: true })
onBeforeUnmount(cancelPendingWork)
</script>

<template>
  <Modal :is-open="isOpen && !isConfirmOpen" :title="modalTitle" @close="closeModal">
    <form :id="FORM_ID" novalidate @submit.prevent="saveAssessment">
      <AssessmentFormFields
        v-model="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :is-reassess="isReassess"
        :school-year-label="schoolYearLabel"
        :locked-student="assessment?.student ?? null"
        :student-search="studentSearchText"
        :candidates="candidates"
        :is-candidate-searching="isCandidateSearching"
        :has-more-candidates="hasMore"
        :picked-candidate="pickedCandidate"
        :plan-options="planOptions"
        @update:student-search="updateStudentSearch"
        @pick-candidate="pickCandidate"
        @clear-candidate="clearCandidate"
      />
    </form>
    <div v-if="isPreviewLoading || previewError || preview" class="mt-4 border-t border-line pt-4">
      <h3 class="mb-2 text-sm font-bold text-ink">{{ PREVIEW_HEADING }}</h3>
      <p v-if="isPreviewLoading" class="text-xs text-ink-muted">{{ PREVIEW_LOADING_TEXT }}</p>
      <p v-else-if="previewError" role="alert" class="text-xs text-red-700">{{ previewError }}</p>
      <AssessmentSummary v-else :assessment="preview" />
    </div>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isSaving" @click="closeModal">Cancel</button>
      <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="!canSave">
        <template v-if="isSaving">Saving…</template>
        <template v-else>{{ isReassess ? 'Re-assess…' : 'Save' }}</template>
      </button>
    </template>
  </Modal>

  <ConfirmDialog
    :is-open="isOpen && isConfirmOpen"
    :title="REASSESS_CONFIRM_TITLE"
    :message="confirmMessage"
    :confirm-label="REASSESS_CONFIRM_LABEL"
    :is-loading="isSaving"
    @confirm="confirmReassess"
    @cancel="cancelReassess"
  />
</template>
