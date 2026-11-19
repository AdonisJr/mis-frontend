<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import StudentDiscountFormFields from '@/components/StudentDiscountFormFields.vue'
import { fetchEnrollments } from '@/services/enrollmentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import {
  createStudentDiscount,
  fetchAllStudentDiscounts,
  updateStudentDiscount,
} from '@/services/studentDiscountService.js'
import { buildDiscountTypeOptionLabel } from '@/utils/discountDisplay.js'
import { buildEnrollmentCandidateParams } from '@/utils/discountSearch.js'
import {
  buildAssignPayload,
  buildAssignRule,
  buildNoteFormFromStudentDiscount,
  buildNotePayload,
  createEmptyAssignForm,
  findAssignFormErrors,
  findAssignTypeError,
  findDiscountType,
  findStudentDiscountNoteErrors,
  hasMoreCandidates,
  listAssignableDiscountTypes,
  mergeEnrollmentCandidates,
} from '@/utils/studentDiscountForm.js'
import { toRecordId } from '@/utils/sectionForm.js'
import { normalizeSearchText } from '@/utils/studentSearch.js'

const FORM_ID = 'student-discount-form'
const ASSIGN_TITLE = 'Assign discount'
const EDIT_TITLE = 'Edit student discount'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SEARCH_FAILED_MESSAGE = 'Could not search students.'
const HELD_FAILED_MESSAGE = "Could not load the student's discounts."
const SAVE_FAILED_MESSAGE = 'Could not save the student discount.'
const ASSIGN_SUCCESS_MESSAGE = 'Discount assigned.'
const UPDATE_SUCCESS_MESSAGE = 'Student discount updated.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  studentDiscount: { type: Object, default: null },
  schoolYearId: { type: String, default: '' },
  schoolYearLabel: { type: String, default: '' },
  discountTypes: { type: Array, required: true },
})

const emit = defineEmits(['close', 'saved'])

const formValues = ref(createEmptyAssignForm(''))
const fieldErrors = ref({})
const isSaving = ref(false)
const studentSearchText = ref('')
const candidates = ref([])
const hasMore = ref(false)
const isCandidateSearching = ref(false)
const pickedCandidate = ref(null)
const heldStudentDiscounts = ref([])
let candidateRequestId = 0
let heldRequestId = 0
let candidateSearchTimer = null

const toast = useToast()

const isEditing = computed(() => props.studentDiscount !== null)
const formTitle = computed(() => (isEditing.value ? EDIT_TITLE : ASSIGN_TITLE))
const assignRule = computed(() => buildAssignRule(pickedCandidate.value, heldStudentDiscounts.value))
const typeOptions = computed(() => listAssignableDiscountTypes(props.discountTypes, assignRule.value))
const lockedTypeLabel = computed(() => buildDiscountTypeOptionLabel(props.studentDiscount?.discount_type))

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function cancelPendingWork() {
  clearTimeout(candidateSearchTimer)
  candidateRequestId += 1
  heldRequestId += 1
}

async function searchCandidates() {
  const requestId = ++candidateRequestId
  const requestParams = buildEnrollmentCandidateParams(props.schoolYearId, studentSearchText.value)
  try {
    const [enrolledResponse, completedResponse] = await Promise.all(requestParams.map(fetchEnrollments))
    if (requestId !== candidateRequestId) return
    candidates.value = mergeEnrollmentCandidates(enrolledResponse, completedResponse)
    hasMore.value = hasMoreCandidates(enrolledResponse, completedResponse)
  } catch (error) {
    if (requestId !== candidateRequestId) return
    toastRequestError(error, SEARCH_FAILED_MESSAGE)
  } finally {
    if (requestId === candidateRequestId) isCandidateSearching.value = false
  }
}

function updateStudentSearch(nextSearch) {
  studentSearchText.value = nextSearch
  clearTimeout(candidateSearchTimer)
  candidateRequestId += 1
  if (normalizeSearchText(nextSearch) === '') {
    candidates.value = []
    hasMore.value = false
    isCandidateSearching.value = false
    return
  }
  isCandidateSearching.value = true
  candidateSearchTimer = setTimeout(searchCandidates, SEARCH_DEBOUNCE_MS)
}

async function loadHeldDiscounts(studentId) {
  const requestId = ++heldRequestId
  try {
    const heldResponse = await fetchAllStudentDiscounts({
      school_year_id: toRecordId(props.schoolYearId),
      student_id: studentId,
    })
    if (requestId !== heldRequestId) return
    heldStudentDiscounts.value = heldResponse?.student_discounts ?? []
  } catch (error) {
    if (requestId !== heldRequestId) return
    heldStudentDiscounts.value = []
    // the server still enforces the held-type and government rules on save
    toastRequestError(error, HELD_FAILED_MESSAGE)
  }
}

function pickCandidate(candidate) {
  pickedCandidate.value = candidate
  heldStudentDiscounts.value = []
  formValues.value = { ...formValues.value, student_id: String(candidate.studentId), discount_type_id: '' }
  loadHeldDiscounts(candidate.studentId)
}

function clearCandidate() {
  heldRequestId += 1
  pickedCandidate.value = null
  heldStudentDiscounts.value = []
  formValues.value = { ...formValues.value, student_id: '', discount_type_id: '' }
}

function resetCreate() {
  formValues.value = createEmptyAssignForm(props.schoolYearId)
  pickedCandidate.value = null
}

function resetEdit() {
  formValues.value = buildNoteFormFromStudentDiscount(props.studentDiscount)
  pickedCandidate.value = {
    student: props.studentDiscount.student,
    gradeLevel: props.studentDiscount.grade_level,
    stage: props.studentDiscount.grade_level?.stage ?? '',
  }
}

function resetModal() {
  cancelPendingWork()
  if (isEditing.value) resetEdit()
  else resetCreate()
  fieldErrors.value = {}
  isSaving.value = false
  studentSearchText.value = ''
  candidates.value = []
  hasMore.value = false
  isCandidateSearching.value = false
  heldStudentDiscounts.value = []
}

function closeModal() {
  if (isSaving.value) return
  cancelPendingWork()
  emit('close')
}

function findCreateErrors() {
  const selectedType = findDiscountType(props.discountTypes, formValues.value.discount_type_id)
  const typeError = findAssignTypeError(selectedType, assignRule.value)
  return findAssignFormErrors(formValues.value, typeError)
}

function submitStudentDiscountForm() {
  if (isEditing.value) return updateStudentDiscount(props.studentDiscount.id, buildNotePayload(formValues.value))
  return createStudentDiscount(buildAssignPayload(formValues.value))
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
  if (status !== HTTP_NOT_FOUND) return
  emit('saved')
}

async function saveStudentDiscount() {
  if (isSaving.value) return
  fieldErrors.value = isEditing.value ? findStudentDiscountNoteErrors(formValues.value) : findCreateErrors()
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  const wasEditing = isEditing.value
  isSaving.value = true
  try {
    await submitStudentDiscountForm()
    toast.success(wasEditing ? UPDATE_SUCCESS_MESSAGE : ASSIGN_SUCCESS_MESSAGE)
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
    if (isNowOpen) resetModal()
    else cancelPendingWork()
  },
)
onBeforeUnmount(cancelPendingWork)
</script>

<template>
  <Modal :is-open="isOpen" :title="formTitle" @close="closeModal">
    <form :id="FORM_ID" novalidate @submit.prevent="saveStudentDiscount">
      <StudentDiscountFormFields
        v-model="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :is-editing="isEditing"
        :school-year-label="schoolYearLabel"
        :student-search="studentSearchText"
        :candidates="candidates"
        :is-candidate-searching="isCandidateSearching"
        :has-more-candidates="hasMore"
        :picked-candidate="pickedCandidate"
        :type-options="typeOptions"
        :locked-type-label="lockedTypeLabel"
        @update:student-search="updateStudentSearch"
        @pick-candidate="pickCandidate"
        @clear-candidate="clearCandidate"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </Modal>
</template>
