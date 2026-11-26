<script setup>
import {
  JOURNAL_DESCRIPTION_MAX_LENGTH,
  JOURNAL_FIELD_LABELS,
  JOURNAL_REFERENCE_MAX_LENGTH,
} from '@/utils/journalEntryForm.js'
import { getFirstFieldError } from '@/utils/sectionForm.js'

const DATE_FIELD = 'entry_date'
const DESCRIPTION_FIELD = 'description'
const REFERENCE_FIELD = 'reference'
const FIELD_ID_PREFIX = 'journal-'
const OPTIONAL_SUFFIX = ' (optional)'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  maxDate: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', {
    entry_date: props.modelValue.entry_date,
    description: props.modelValue.description,
    reference: props.modelValue.reference,
    [fieldKey]: fieldValue,
  })
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getDescribedBy(fieldKey) {
  if (!getFirstFieldError(props.fieldErrors, fieldKey)) return undefined
  return getErrorId(fieldKey)
}
</script>

<template>
  <div class="space-y-4">
    <div class="sm:w-56">
      <label :for="getFieldId(DATE_FIELD)" :class="LABEL_CLASS">{{ JOURNAL_FIELD_LABELS.entry_date }}</label>
      <input
        :id="getFieldId(DATE_FIELD)"
        type="date"
        :max="maxDate"
        :value="modelValue[DATE_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFirstFieldError(fieldErrors, DATE_FIELD))"
        :aria-describedby="getDescribedBy(DATE_FIELD)"
        @input="updateField(DATE_FIELD, $event.target.value)"
      />
      <p v-if="getFirstFieldError(fieldErrors, DATE_FIELD)" :id="getErrorId(DATE_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFirstFieldError(fieldErrors, DATE_FIELD) }}
      </p>
    </div>
    <div>
      <label :for="getFieldId(DESCRIPTION_FIELD)" :class="LABEL_CLASS">{{ JOURNAL_FIELD_LABELS.description }}</label>
      <textarea
        :id="getFieldId(DESCRIPTION_FIELD)"
        rows="2"
        :maxlength="JOURNAL_DESCRIPTION_MAX_LENGTH"
        :value="modelValue[DESCRIPTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFirstFieldError(fieldErrors, DESCRIPTION_FIELD))"
        :aria-describedby="getDescribedBy(DESCRIPTION_FIELD)"
        @input="updateField(DESCRIPTION_FIELD, $event.target.value)"
      ></textarea>
      <p
        v-if="getFirstFieldError(fieldErrors, DESCRIPTION_FIELD)"
        :id="getErrorId(DESCRIPTION_FIELD)"
        class="mt-1 text-xs text-red-700"
      >
        {{ getFirstFieldError(fieldErrors, DESCRIPTION_FIELD) }}
      </p>
    </div>
    <div>
      <label :for="getFieldId(REFERENCE_FIELD)" :class="LABEL_CLASS">
        {{ JOURNAL_FIELD_LABELS.reference + OPTIONAL_SUFFIX }}
      </label>
      <input
        :id="getFieldId(REFERENCE_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="JOURNAL_REFERENCE_MAX_LENGTH"
        :value="modelValue[REFERENCE_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFirstFieldError(fieldErrors, REFERENCE_FIELD))"
        :aria-describedby="getDescribedBy(REFERENCE_FIELD)"
        @input="updateField(REFERENCE_FIELD, $event.target.value)"
      />
      <p
        v-if="getFirstFieldError(fieldErrors, REFERENCE_FIELD)"
        :id="getErrorId(REFERENCE_FIELD)"
        class="mt-1 text-xs text-red-700"
      >
        {{ getFirstFieldError(fieldErrors, REFERENCE_FIELD) }}
      </p>
    </div>
  </div>
</template>
