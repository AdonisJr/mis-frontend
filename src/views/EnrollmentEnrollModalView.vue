<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import EnrollmentFormFields from '@/components/EnrollmentFormFields.vue'
import { enrollStudent } from '@/services/enrollmentService.js'
import { fetchAllSections } from '@/services/sectionService.js'
import { fetchStudents } from '@/services/studentService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
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
let sectionRequestId = 0
let studentRequestId = 0
let studentSearchTimer = null

const toast = useToast()

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

function pickStudent(student) {
  pickedStudent.value = student
  formValues.value = { ...formValues.value, student_id: String(student.id) }
}

function clearStudent() {
  pickedStudent.value = null
  formValues.value = { ...formValues.value, student_id: '' }
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
  loadSections()
}

function closeModal() {
  if (isSaving.value) return
  cancelPendingStudentSearch()
  emit('close')
}

function applySaveError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors
  if (status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, SAVE_FAILED_MESSAGE)
}

async function saveEnrollment() {
  if (isSaving.value) return
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
  <Modal :is-open="isOpen" :title="ENROLL_TITLE" @close="closeModal">
    <form :id="ENROLL_FORM_ID" novalidate @submit.prevent="saveEnrollment">
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
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="ENROLL_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Enroll' }}
      </button>
    </template>
  </Modal>
</template>
