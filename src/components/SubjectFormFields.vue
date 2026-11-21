<script setup>
import { SUBJECT_TYPE_OPTIONS } from '@/utils/subjectDisplay.js'
import {
  SUBJECT_CODE_MAX_LENGTH,
  SUBJECT_DESCRIPTION_MAX_LENGTH,
  SUBJECT_FIELD_LABELS,
  SUBJECT_NAME_MAX_LENGTH,
} from '@/utils/subjectForm.js'

const CODE_FIELD = 'code'
const NAME_FIELD = 'name'
const TYPE_FIELD = 'type'
const HOURS_FIELD = 'weekly_hours'
const DESCRIPTION_FIELD = 'description'
const FIELD_ID_PREFIX = 'subject-'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const HOURS_HINT = '0.5 to 40, in steps of 0.5.'
const HOURS_HINT_ID = 'subject-weekly_hours-hint'
const HOURS_STEP = '0.5'
const HOURS_MIN = '0.5'
const HOURS_MAX = '40'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
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

function getHoursDescribedBy() {
  if (!getFieldError(HOURS_FIELD)) return HOURS_HINT_ID
  return `${HOURS_HINT_ID} ${getErrorId(HOURS_FIELD)}`
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label :for="getFieldId(CODE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SUBJECT_FIELD_LABELS.code }}
      </label>
      <input
        :id="getFieldId(CODE_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="SUBJECT_CODE_MAX_LENGTH"
        :value="modelValue[CODE_FIELD]"
        :class="INPUT_CLASS"
        class="font-mono"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(CODE_FIELD))"
        :aria-describedby="getDescribedBy(CODE_FIELD)"
        @input="updateField(CODE_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(CODE_FIELD)" :id="getErrorId(CODE_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(CODE_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SUBJECT_FIELD_LABELS.name }}
      </label>
      <input
        :id="getFieldId(NAME_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="SUBJECT_NAME_MAX_LENGTH"
        :value="modelValue[NAME_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(NAME_FIELD))"
        :aria-describedby="getDescribedBy(NAME_FIELD)"
        @input="updateField(NAME_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(NAME_FIELD)" :id="getErrorId(NAME_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(NAME_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(TYPE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SUBJECT_FIELD_LABELS.type }}
      </label>
      <select
        :id="getFieldId(TYPE_FIELD)"
        :value="modelValue[TYPE_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(TYPE_FIELD))"
        :aria-describedby="getDescribedBy(TYPE_FIELD)"
        @change="updateField(TYPE_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="typeOption in SUBJECT_TYPE_OPTIONS" :key="typeOption.value" :value="typeOption.value">
          {{ typeOption.label }}
        </option>
      </select>
      <p v-if="getFieldError(TYPE_FIELD)" :id="getErrorId(TYPE_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(TYPE_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(HOURS_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SUBJECT_FIELD_LABELS.weekly_hours }}
      </label>
      <input
        :id="getFieldId(HOURS_FIELD)"
        type="number"
        inputmode="decimal"
        :step="HOURS_STEP"
        :min="HOURS_MIN"
        :max="HOURS_MAX"
        :value="modelValue[HOURS_FIELD]"
        :class="INPUT_CLASS"
        class="tabular-nums"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(HOURS_FIELD))"
        :aria-describedby="getHoursDescribedBy()"
        @input="updateField(HOURS_FIELD, $event.target.value)"
      />
      <p :id="HOURS_HINT_ID" class="mt-1 text-xs text-ink-muted">{{ HOURS_HINT }}</p>
      <p v-if="getFieldError(HOURS_FIELD)" :id="getErrorId(HOURS_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(HOURS_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(DESCRIPTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SUBJECT_FIELD_LABELS.description + OPTIONAL_SUFFIX }}
      </label>
      <textarea
        :id="getFieldId(DESCRIPTION_FIELD)"
        rows="3"
        :maxlength="SUBJECT_DESCRIPTION_MAX_LENGTH"
        :value="modelValue[DESCRIPTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(DESCRIPTION_FIELD))"
        :aria-describedby="getDescribedBy(DESCRIPTION_FIELD)"
        @input="updateField(DESCRIPTION_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(DESCRIPTION_FIELD)" :id="getErrorId(DESCRIPTION_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(DESCRIPTION_FIELD) }}
      </p>
    </div>
  </div>
</template>
