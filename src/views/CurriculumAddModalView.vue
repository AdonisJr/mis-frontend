<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import CurriculumAddFields from '@/components/CurriculumAddFields.vue'
import { addCurriculumEntry } from '@/services/curriculumService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { fetchActiveSubjects } from '@/services/subjectService.js'
import {
  buildAddEntryPayload,
  excludeUsedSubjects,
  findAddEntryErrors,
  listPickableSubjects,
} from '@/utils/curriculumForm.js'

const ADD_TITLE = 'Add subject'
const ADD_FORM_ID = 'curriculum-add-form'
const HTTP_UNPROCESSABLE_ENTITY = 422

const ADD_SUCCESS_MESSAGE = 'Subject added to the curriculum.'
const ADD_FAILED_MESSAGE = 'Could not add the subject.'
const LOAD_FAILED_MESSAGE = 'Could not load the subjects.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  gradeLevel: { type: Object, default: null },
  addRule: { type: Object, default: null },
  groupLabel: { type: String, default: '' },
})

const emit = defineEmits(['close', 'added'])

const subjects = ref([])
const subjectId = ref('')
const fieldErrors = ref({})
const isLoading = ref(false)
const isSaving = ref(false)
let loadRequestId = 0

const toast = useToast()

const subjectOptions = computed(() =>
  excludeUsedSubjects(listPickableSubjects(subjects.value, props.gradeLevel), props.addRule),
)

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function resetModal() {
  subjects.value = []
  subjectId.value = ''
  fieldErrors.value = {}
  isSaving.value = false
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateSubjectId(nextSubjectId) {
  subjectId.value = nextSubjectId
  fieldErrors.value = {}
}

async function loadSubjects() {
  const requestId = ++loadRequestId
  isLoading.value = true
  try {
    const subjectResponse = await fetchActiveSubjects()
    if (requestId !== loadRequestId) return
    subjects.value = subjectResponse?.subjects ?? []
  } catch (error) {
    if (requestId !== loadRequestId) return
    toastRequestError(error, LOAD_FAILED_MESSAGE)
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

function applyAddError(error) {
  const validationErrors = error.response?.data?.errors
  if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, ADD_FAILED_MESSAGE)
}

async function submitAdd() {
  if (isSaving.value || isLoading.value || !props.addRule) return
  fieldErrors.value = findAddEntryErrors(subjectId.value)
  if (Object.keys(fieldErrors.value).length > 0) return
  isSaving.value = true
  try {
    await addCurriculumEntry(buildAddEntryPayload(props.addRule, subjectId.value))
    toast.success(ADD_SUCCESS_MESSAGE)
    emit('added')
  } catch (error) {
    applyAddError(error)
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (!isNowOpen) {
      loadRequestId++
      return
    }
    resetModal()
    loadSubjects()
  },
)
</script>

<template>
  <Modal :is-open="isOpen" :title="ADD_TITLE" @close="closeModal">
    <form :id="ADD_FORM_ID" novalidate class="space-y-4" @submit.prevent="submitAdd">
      <CurriculumAddFields
        :subject-id="subjectId"
        :subject-options="subjectOptions"
        :group-label="groupLabel"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        :is-loading="isLoading"
        @update:subject-id="updateSubjectId"
      />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        Cancel
      </button>
      <button type="submit" :form="ADD_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving || isLoading">
        {{ isSaving ? 'Adding…' : 'Add' }}
      </button>
    </template>
  </Modal>
</template>
