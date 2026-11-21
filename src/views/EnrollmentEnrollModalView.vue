<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import EnrollmentFormFields from '@/components/EnrollmentFormFields.vue'
import PaymentHoldNotice from '@/components/PaymentHoldNotice.vue'
import PromissoryNoteGrantModalView from '@/views/PromissoryNoteGrantModalView.vue'
import { enrollStudent } from '@/services/enrollmentService.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { fetchStudents } from '@/services/studentService.js'
import { ENROLLMENT_HOLD_ERROR_KEY, fetchHoldCheck } from '@/services/paymentHoldService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { PAYMENT_RECORDER_ROLES } from '@/routeRoles.js'
import { useAuthStore } from '@/stores/authStore.js'
import {
  buildEnrollPayload,
  buildSectionOptionLabel,
  clearTermForSection,
  createEmptyEnrollForm,
  findEnrollFormErrors,
  findSection,
  isSectionFull,
  isTermRequired,
  toIsoDate,
} from '@/utils/enrollmentForm.js'
import { buildHoldNoticeRows, buildHoldNoticeSummary, listGrantableYears } from '@/utils/paymentHoldDisplay.js'
import { buildHoldCheckParams } from '@/utils/paymentHoldSearch.js'
import { toRecordId } from '@/utils/sectionForm.js'
import {
  applySearchChange,
  buildStudentListParams,
  createStudentFilters,
  normalizeSearchText,
} from '@/utils/studentSearch.js'

const ENROLL_FORM_ID = 'enrollment-enroll-form'
const ENROLL_TITLE = 'Enroll student'
const SEARCH_DEBOUNCE_MS = 300
const HTTP_UNPROCESSABLE_ENTITY = 422

const INVALID_FIELDS_MESSAGE = 'Check the highlighted fields.'
const SECTIONS_FAILED_MESSAGE = 'Could not load sections.'
const STUDENTS_FAILED_MESSAGE = 'Could not search students.'
const SAVE_FAILED_MESSAGE = 'Could not save the enrollment.'
const SAVE_SUCCESS_MESSAGE = 'Student enrolled.'
const HOLD_CHECK_FAILED_MESSAGE = 'Could not check payment holds.'
const HOLD_CHECKING_TEXT = 'Checking payment holds…'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  schoolYearId: { type: String, required: true },
  terms: { type: Array, required: true },
  defaultTermId: { type: String, required: true },
})

const emit = defineEmits(['close', 'enrolled'])

const formValues = ref(createEmptyEnrollForm('', ''))
const fieldErrors = ref({})
const isSaving = ref(false)
const sections = ref([])
const studentSearchText = ref('')
const studentOptions = ref([])
const isStudentSearching = ref(false)
const pickedStudent = ref(null)
const holdCheck = ref(null)
const isHoldChecking = ref(false)
const guardMessage = ref('')
const isGrantOpen = ref(false)
const grantSchoolYearId = ref('')
let sectionRequestId = 0
let studentRequestId = 0
let studentSearchTimer = null
let holdRequestId = 0

const toast = useToast()
const authStore = useAuthStore()

const noticeRows = computed(() => buildHoldNoticeRows(holdCheck.value?.unpaid_years))
const isOnHold = computed(() => holdCheck.value?.on_hold === true || guardMessage.value !== '')
const canGrant = computed(() => authStore.hasAnyRole(PAYMENT_RECORDER_ROLES))
const grantYears = computed(() => listGrantableYears(holdCheck.value?.unpaid_years))
const isNoticeShown = computed(() => noticeRows.value.length > 0 || guardMessage.value !== '')
const noticeSummary = computed(() => {
  if (noticeRows.value.length === 0) return guardMessage.value
  return buildHoldNoticeSummary(noticeRows.value, isOnHold.value)
})
const grantStudentId = computed(() => toRecordId(formValues.value.student_id) ?? 0)

const selectedSection = computed(() => findSection(sections.value, formValues.value.section_id))
const isTermVisible = computed(() => isTermRequired(selectedSection.value))
const sectionOptions = computed(() =>
  sections.value.map((section) => ({
    id: section.id,
    label: buildSectionOptionLabel(section, formValues.value.term_id),
    isFull: isSectionFull(section, formValues.value.term_id),
  })),
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function cancelPendingStudentSearch() {
  clearTimeout(studentSearchTimer)
  studentRequestId += 1
}

async function loadSections() {
  const requestId = ++sectionRequestId
  const sectionListParams = { school_year_id: toRecordId(props.schoolYearId) }
  const termId = toRecordId(formValues.value.term_id)
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

async function searchStudents() {
  const requestId = ++studentRequestId
  const searchFilters = applySearchChange(createStudentFilters(), studentSearchText.value)
  try {
    const studentResponse = await fetchStudents(buildStudentListParams(searchFilters))
    if (requestId !== studentRequestId) return
    studentOptions.value = studentResponse?.students ?? []
  } catch (error) {
    if (requestId !== studentRequestId) return
    toastRequestError(error, STUDENTS_FAILED_MESSAGE)
  } finally {
    if (requestId === studentRequestId) isStudentSearching.value = false
  }
}

function updateStudentSearch(nextSearch) {
  studentSearchText.value = nextSearch
  cancelPendingStudentSearch()
  if (normalizeSearchText(nextSearch) === '') {
    studentOptions.value = []
    isStudentSearching.value = false
    return
  }
  isStudentSearching.value = true
  studentSearchTimer = setTimeout(searchStudents, SEARCH_DEBOUNCE_MS)
}

function clearHold() {
  holdRequestId += 1
  holdCheck.value = null
  guardMessage.value = ''
  isHoldChecking.value = false
}

async function loadHoldCheck() {
  const holdCheckParams = buildHoldCheckParams(formValues.value.student_id, props.schoolYearId)
  if (holdCheckParams === null) {
    clearHold()
    return
  }
  const requestId = ++holdRequestId
  isHoldChecking.value = true
  try {
    const holdResponse = await fetchHoldCheck(holdCheckParams)
    if (requestId !== holdRequestId) return
    holdCheck.value = holdResponse?.hold ?? null
  } catch (error) {
    if (requestId !== holdRequestId) return
    holdCheck.value = null
    toastRequestError(error, HOLD_CHECK_FAILED_MESSAGE)
  } finally {
    if (requestId === holdRequestId) isHoldChecking.value = false
  }
}

function pickStudent(student) {
  pickedStudent.value = student
  guardMessage.value = ''
  formValues.value = { ...formValues.value, student_id: String(student.id) }
  loadHoldCheck()
}

function clearStudent() {
  pickedStudent.value = null
  formValues.value = { ...formValues.value, student_id: '' }
  clearHold()
}

function openGrant(schoolYearId) {
  grantSchoolYearId.value = schoolYearId
  isGrantOpen.value = true
}

function closeGrant() {
  isGrantOpen.value = false
}

function handleGranted() {
  isGrantOpen.value = false
  guardMessage.value = ''
  loadHoldCheck()
}

function updateFormValues(nextFormValues) {
  const previousTermId = formValues.value.term_id
  const nextSection = findSection(sections.value, nextFormValues.section_id)
  formValues.value = clearTermForSection(nextFormValues, nextSection)
  // a term change reloads the sections so SHS and college seats match the term
  if (formValues.value.term_id !== previousTermId) loadSections()
}

function resetModal() {
  cancelPendingStudentSearch()
  formValues.value = createEmptyEnrollForm(props.defaultTermId, toIsoDate(new Date()))
  fieldErrors.value = {}
  sections.value = []
  studentSearchText.value = ''
  studentOptions.value = []
  isStudentSearching.value = false
  pickedStudent.value = null
  isGrantOpen.value = false
  clearHold()
  loadSections()
}

function closeModal() {
  if (isSaving.value || isGrantOpen.value) return
  cancelPendingStudentSearch()
  emit('close')
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  const { [ENROLLMENT_HOLD_ERROR_KEY]: holdMessages, ...fieldMessages } = validationErrors ?? {}
  const isGuardRefusal = status === HTTP_UNPROCESSABLE_ENTITY && Array.isArray(holdMessages)
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = fieldMessages
  if (isGuardRefusal) guardMessage.value = holdMessages[0]
  toastRequestError(error, SAVE_FAILED_MESSAGE)
  if (isGuardRefusal) loadHoldCheck()
}

async function saveEnrollment() {
  if (isSaving.value || isOnHold.value) return
  fieldErrors.value = findEnrollFormErrors(formValues.value, selectedSection.value)
  if (Object.keys(fieldErrors.value).length > 0) {
    toast.error(INVALID_FIELDS_MESSAGE)
    return
  }
  isSaving.value = true
  try {
    await enrollStudent(buildEnrollPayload(formValues.value, selectedSection.value))
    toast.success(SAVE_SUCCESS_MESSAGE)
    emit('enrolled')
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
  },
)
onBeforeUnmount(cancelPendingStudentSearch)
</script>

<template>
  <Modal :is-open="isOpen && !isGrantOpen" :title="ENROLL_TITLE" @close="closeModal">
    <form :id="ENROLL_FORM_ID" novalidate class="space-y-4" @submit.prevent="saveEnrollment">
      <EnrollmentFormFields
        :model-value="formValues"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :student-search="studentSearchText"
        :student-options="studentOptions"
        :is-student-searching="isStudentSearching"
        :picked-student="pickedStudent"
        :section-options="sectionOptions"
        :terms="terms"
        :is-term-visible="isTermVisible"
        @update:model-value="updateFormValues"
        @update:student-search="updateStudentSearch"
        @pick-student="pickStudent"
        @clear-student="clearStudent"
      />
      <p v-if="isHoldChecking" class="text-xs text-ink-muted">{{ HOLD_CHECKING_TEXT }}</p>
      <PaymentHoldNotice
        v-if="isNoticeShown"
        :rows="noticeRows"
        :summary-text="noticeSummary"
        :can-grant="canGrant"
        :is-on-hold="isOnHold"
        @grant="openGrant"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button
        type="submit"
        :form="ENROLL_FORM_ID"
        :class="PRIMARY_BUTTON_CLASS"
        :disabled="isSaving || isOnHold || isHoldChecking"
      >
        {{ isSaving ? 'Saving…' : 'Enroll' }}
      </button>
    </template>
  </Modal>
  <PromissoryNoteGrantModalView
    :is-open="isOpen && isGrantOpen"
    :student-id="grantStudentId"
    :balance-years="grantYears"
    :school-year-id="grantSchoolYearId"
    @close="closeGrant"
    @granted="handleGranted"
  />
</template>
