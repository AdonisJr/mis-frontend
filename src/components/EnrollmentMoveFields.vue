<script setup>
import { ENROLLMENT_FIELD_LABELS, ENROLLMENT_REMARKS_MAX_LENGTH } from '@/utils/enrollmentForm.js'

const SECTION_FIELD = 'section_id'
const ENDED_AT_FIELD = 'ended_at'
const REMARKS_FIELD = 'remarks'
const FIELD_ID_PREFIX = 'enrollment-move-'
const NEW_SECTION_LABEL = 'New section'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const NO_TARGET_TEXT = 'No other section of this grade level.'
const NO_TARGET_ID = 'enrollment-move-section_id-hint'
const REMARKS_ROWS = 3
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  currentSectionLabel: { type: String, required: true },
  sectionOptions: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldError(fieldKey) {
  return props.fieldErrors[fieldKey]?.[0] ?? ''
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getDescribedBy(fieldKey) {
  if (!getFieldError(fieldKey)) return undefined
  return getErrorId(fieldKey)
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink-muted">Current section: {{ currentSectionLabel }}</p>

    <div>
      <label :for="getFieldId(SECTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ NEW_SECTION_LABEL }}
      </label>
      <select
        :id="getFieldId(SECTION_FIELD)"
        :value="modelValue[SECTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled || sectionOptions.length === 0"
        :aria-invalid="Boolean(getFieldError(SECTION_FIELD))"
        :aria-describedby="getDescribedBy(SECTION_FIELD)"
        @change="updateField(SECTION_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option
          v-for="sectionOption in sectionOptions"
          :key="sectionOption.id"
          :value="String(sectionOption.id)"
          :disabled="sectionOption.isFull"
        >
          {{ sectionOption.label }}
        </option>
      </select>
      <p v-if="sectionOptions.length === 0" :id="NO_TARGET_ID" class="mt-1 text-xs text-ink-muted">{{ NO_TARGET_TEXT }}</p>
      <p v-if="getFieldError(SECTION_FIELD)" :id="getErrorId(SECTION_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(SECTION_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(ENDED_AT_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.ended_at }}
      </label>
      <input
        :id="getFieldId(ENDED_AT_FIELD)"
        type="date"
        :value="modelValue[ENDED_AT_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(ENDED_AT_FIELD))"
        :aria-describedby="getDescribedBy(ENDED_AT_FIELD)"
        @input="updateField(ENDED_AT_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(ENDED_AT_FIELD)" :id="getErrorId(ENDED_AT_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(ENDED_AT_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(REMARKS_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.remarks + OPTIONAL_SUFFIX }}
      </label>
      <textarea
        :id="getFieldId(REMARKS_FIELD)"
        :rows="REMARKS_ROWS"
        :maxlength="ENROLLMENT_REMARKS_MAX_LENGTH"
        :value="modelValue[REMARKS_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(REMARKS_FIELD))"
        :aria-describedby="getDescribedBy(REMARKS_FIELD)"
        @input="updateField(REMARKS_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(REMARKS_FIELD)" :id="getErrorId(REMARKS_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(REMARKS_FIELD) }}
      </p>
    </div>
  </div>
</template>
