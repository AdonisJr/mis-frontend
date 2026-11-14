<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import FeeScheduleCopyFields from '@/components/FeeScheduleCopyFields.vue'
import FeeScheduleCopyResult from '@/components/FeeScheduleCopyResult.vue'
import { copyFeeSchedules } from '@/services/feeScheduleService.js'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { buildCopyPayload, findCopyFormErrors } from '@/utils/feeScheduleForm.js'
import { normalizeCopyResult } from '@/utils/feeScheduleDisplay.js'
import { toRecordId } from '@/utils/sectionForm.js'

const COPY_TITLE = 'Copy fee schedules'
const COPY_FORM_ID = 'fee-schedule-copy-form'
const HTTP_UNPROCESSABLE_ENTITY = 422

const COPY_FAILED_MESSAGE = 'Could not copy the fee schedules.'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  schoolYears: { type: Array, required: true },
  targetSchoolYearId: { type: String, required: true },
})

const emit = defineEmits(['close', 'copied'])

const sourceSchoolYearId = ref('')
const result = ref(null)
const fieldErrors = ref({})
const isSaving = ref(false)

const toast = useToast()

const sourceOptions = computed(() =>
  props.schoolYears.filter((schoolYear) => toRecordId(schoolYear.id) !== toRecordId(props.targetSchoolYearId)),
)
const targetLabel = computed(() => {
  const targetSchoolYear = props.schoolYears.find(
    (schoolYear) => toRecordId(schoolYear.id) === toRecordId(props.targetSchoolYearId),
  )
  return targetSchoolYear?.name ?? ''
})

function toastRequestError(error, fallbackMessage) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? fallbackMessage)
}

function resetModal() {
  sourceSchoolYearId.value = ''
  result.value = null
  fieldErrors.value = {}
  isSaving.value = false
}

function closeModal() {
  if (isSaving.value) return
  emit('close')
}

function updateSourceSchoolYearId(nextSourceId) {
  sourceSchoolYearId.value = nextSourceId
  fieldErrors.value = {}
}

function applyCopyError(error) {
  const validationErrors = error.response?.data?.errors
  if (error.response?.status === HTTP_UNPROCESSABLE_ENTITY && validationErrors) fieldErrors.value = validationErrors
  toastRequestError(error, COPY_FAILED_MESSAGE)
}

async function submitCopy() {
  if (isSaving.value || result.value !== null) return
  fieldErrors.value = findCopyFormErrors(sourceSchoolYearId.value, props.targetSchoolYearId)
  if (Object.keys(fieldErrors.value).length > 0) return
  isSaving.value = true
  try {
    const copyResponse = await copyFeeSchedules(buildCopyPayload(sourceSchoolYearId.value, props.targetSchoolYearId))
    result.value = normalizeCopyResult(copyResponse)
    toast.success(result.value.copiedText)
    emit('copied')
  } catch (error) {
    applyCopyError(error)
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
  <Modal :is-open="isOpen" :title="COPY_TITLE" @close="closeModal">
    <form :id="COPY_FORM_ID" novalidate class="space-y-4" @submit.prevent="submitCopy">
      <FeeScheduleCopyFields
        v-if="result === null"
        :source-school-year-id="sourceSchoolYearId"
        :source-options="sourceOptions"
        :target-label="targetLabel"
        :field-errors="fieldErrors"
        :is-disabled="isSaving"
        @update:source-school-year-id="updateSourceSchoolYearId"
      />
      <FeeScheduleCopyResult v-else :result="result" />
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isSaving" @click="closeModal">
        {{ result === null ? 'Cancel' : 'Close' }}
      </button>
      <button v-if="result === null" type="submit" :form="COPY_FORM_ID" :class="PRIMARY_BUTTON_CLASS" :disabled="isSaving">
        {{ isSaving ? 'Copying…' : 'Copy' }}
      </button>
    </template>
  </Modal>
</template>
