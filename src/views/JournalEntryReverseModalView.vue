<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/modal/Modal.vue'
import { HTTP_FORBIDDEN, HTTP_UNAUTHORIZED } from '@/services/http.js'
import { reverseJournalEntry } from '@/services/journalEntryService.js'
import { toIsoDate } from '@/utils/enrollmentForm.js'
import { formatJournalNumber } from '@/utils/journalEntryDisplay.js'
import {
  REVERSAL_REASON_MAX_LENGTH,
  buildReversePayload,
  buildReverseRules,
  createReverseForm,
  findReverseFormErrors,
} from '@/utils/journalReverseForm.js'
import { getFirstFieldError } from '@/utils/sectionForm.js'

const FORM_ID = 'journal-reverse-form'
const REASON_ID = 'journal-reverse-reason'
const REASON_ERROR_ID = 'journal-reverse-reason-error'
const DATE_ID = 'journal-reverse-date'
const DATE_ERROR_ID = 'journal-reverse-date-error'
const MODAL_TITLE = 'Reverse journal entry'
const HTTP_UNPROCESSABLE_ENTITY = 422
const HTTP_NOT_FOUND = 404

const REVERSE_FAILED_MESSAGE = 'Could not reverse the journal entry.'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const DESTRUCTIVE_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  journalEntry: { type: Object, default: null },
})

const emit = defineEmits(['close', 'reversed'])

const todayIso = toIsoDate(new Date())
const formValues = ref(createReverseForm(todayIso))
const fieldErrors = ref({})
const isReversing = ref(false)

const toast = useToast()

const promptText = computed(
  () => `Reverse ${formatJournalNumber(props.journalEntry)}? A new entry with debits and credits swapped will be posted.`,
)
const reasonError = computed(() => getFirstFieldError(fieldErrors.value, 'reason'))
const dateError = computed(() => getFirstFieldError(fieldErrors.value, 'date'))

function resetModal() {
  formValues.value = createReverseForm(todayIso)
  fieldErrors.value = {}
  isReversing.value = false
}

function closeModal() {
  if (isReversing.value) return
  emit('close')
}

function updateField(fieldKey, fieldValue) {
  formValues.value = { ...formValues.value, [fieldKey]: fieldValue }
}

function toastRequestError(error) {
  const status = error.response?.status
  // http.js already toasted these (and ended the session on 401)
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return
  toast.error(error.response?.data?.message ?? REVERSE_FAILED_MESSAGE)
}

function applyReverseError(error) {
  const status = error.response?.status
  const validationErrors = error.response?.data?.errors ?? {}
  const hasFieldErrors = Boolean(validationErrors.reason || validationErrors.date)
  if (status === HTTP_UNPROCESSABLE_ENTITY && hasFieldErrors) fieldErrors.value = validationErrors
  toastRequestError(error)
  if (hasFieldErrors) return
  const isStateChange = status === HTTP_UNPROCESSABLE_ENTITY || status === HTTP_NOT_FOUND || status === HTTP_FORBIDDEN
  // already reversed, a reversal entry or a deleted entry: the page must reload
  if (isStateChange) emit('reversed', null)
}

async function confirmReverse() {
  if (isReversing.value || !props.journalEntry) return
  const reverseRules = buildReverseRules(props.journalEntry.entry_date, todayIso)
  fieldErrors.value = findReverseFormErrors(formValues.value, reverseRules)
  if (Object.keys(fieldErrors.value).length > 0) return
  isReversing.value = true
  try {
    const reverseResponse = await reverseJournalEntry(props.journalEntry.id, buildReversePayload(formValues.value))
    emit('reversed', reverseResponse)
  } catch (error) {
    applyReverseError(error)
  } finally {
    isReversing.value = false
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
  <Modal :is-open="isOpen" :title="MODAL_TITLE" @close="closeModal">
    <form :id="FORM_ID" novalidate class="space-y-4" @submit.prevent="confirmReverse">
      <p class="text-sm text-ink">{{ promptText }}</p>
      <div>
        <label :for="REASON_ID" :class="LABEL_CLASS">Reason</label>
        <textarea
          :id="REASON_ID"
          rows="3"
          required
          :maxlength="REVERSAL_REASON_MAX_LENGTH"
          :value="formValues.reason"
          :class="INPUT_CLASS"
          :disabled="isReversing"
          :aria-invalid="reasonError !== ''"
          :aria-describedby="reasonError !== '' ? REASON_ERROR_ID : undefined"
          @input="updateField('reason', $event.target.value)"
        ></textarea>
        <p v-if="reasonError !== ''" :id="REASON_ERROR_ID" role="alert" class="mt-1 text-xs text-red-700">{{ reasonError }}</p>
      </div>
      <div>
        <label :for="DATE_ID" :class="LABEL_CLASS">Reversal date</label>
        <input
          :id="DATE_ID"
          type="date"
          :min="journalEntry?.entry_date"
          :max="todayIso"
          :value="formValues.date"
          :class="INPUT_CLASS"
          :disabled="isReversing"
          :aria-invalid="dateError !== ''"
          :aria-describedby="dateError !== '' ? DATE_ERROR_ID : undefined"
          @input="updateField('date', $event.target.value)"
        />
        <p v-if="dateError !== ''" :id="DATE_ERROR_ID" role="alert" class="mt-1 text-xs text-red-700">{{ dateError }}</p>
      </div>
    </form>
    <template #footer>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isReversing" @click="closeModal">Cancel</button>
      <button type="submit" :form="FORM_ID" :class="DESTRUCTIVE_BUTTON_CLASS" :disabled="isReversing">
        <template v-if="isReversing">Reversing…</template>
        <template v-else>Reverse entry</template>
      </button>
    </template>
  </Modal>
</template>
