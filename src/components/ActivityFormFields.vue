<script setup>
import { ACTIVITY_FIELD_LABELS, ACTIVITY_TITLE_MAX_LENGTH, HIGHEST_SCORE_MAX } from '@/utils/classRecordForm.js'

const COMPONENT_FIELD = 'component'
const TITLE_FIELD = 'title'
const HIGHEST_FIELD = 'highest_possible_score'
const DATE_FIELD = 'activity_date'
const FIELD_ID_PREFIX = 'activity-'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  componentOptions: { type: Array, required: true },
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
  return getFieldError(fieldKey) ? getErrorId(fieldKey) : undefined
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label :for="getFieldId(COMPONENT_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ACTIVITY_FIELD_LABELS.component }}
      </label>
      <select
        :id="getFieldId(COMPONENT_FIELD)"
        :value="modelValue[COMPONENT_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(COMPONENT_FIELD))"
        :aria-describedby="getDescribedBy(COMPONENT_FIELD)"
        @change="updateField(COMPONENT_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option
          v-for="componentOption in componentOptions"
          :key="componentOption.value"
          :value="componentOption.value"
          :disabled="componentOption.isDisabled"
        >
          {{ componentOption.label }}
        </option>
      </select>
      <p v-if="getFieldError(COMPONENT_FIELD)" :id="getErrorId(COMPONENT_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(COMPONENT_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(TITLE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ACTIVITY_FIELD_LABELS.title }}
      </label>
      <input
        :id="getFieldId(TITLE_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="ACTIVITY_TITLE_MAX_LENGTH"
        :value="modelValue[TITLE_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(TITLE_FIELD))"
        :aria-describedby="getDescribedBy(TITLE_FIELD)"
        @input="updateField(TITLE_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(TITLE_FIELD)" :id="getErrorId(TITLE_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(TITLE_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(HIGHEST_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ACTIVITY_FIELD_LABELS.highest_possible_score }}
      </label>
      <input
        :id="getFieldId(HIGHEST_FIELD)"
        type="number"
        inputmode="numeric"
        step="1"
        min="1"
        :max="HIGHEST_SCORE_MAX"
        :value="modelValue[HIGHEST_FIELD]"
        :class="INPUT_CLASS"
        class="tabular-nums"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(HIGHEST_FIELD))"
        :aria-describedby="getDescribedBy(HIGHEST_FIELD)"
        @input="updateField(HIGHEST_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(HIGHEST_FIELD)" :id="getErrorId(HIGHEST_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(HIGHEST_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(DATE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ACTIVITY_FIELD_LABELS.activity_date + OPTIONAL_SUFFIX }}
      </label>
      <input
        :id="getFieldId(DATE_FIELD)"
        type="date"
        :value="modelValue[DATE_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(DATE_FIELD))"
        :aria-describedby="getDescribedBy(DATE_FIELD)"
        @input="updateField(DATE_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(DATE_FIELD)" :id="getErrorId(DATE_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(DATE_FIELD) }}
      </p>
    </div>
  </div>
</template>
