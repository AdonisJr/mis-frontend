<script setup>
import { computed } from 'vue'
import { TERM_FIELD_LABELS, getTermNumberOptions } from '@/utils/termForm.js'

const TERM_NUMBER_FIELD = 'term_number'
const START_DATE_FIELD = 'start_date'
const END_DATE_FIELD = 'end_date'
const FIELD_ID_PREFIX = 'term-'
const SELECT_PLACEHOLDER = 'Select…'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  termType: { type: String, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const termNumberOptions = computed(() => getTermNumberOptions(props.termType))

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
    <div>
      <label :for="getFieldId(TERM_NUMBER_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ TERM_FIELD_LABELS[TERM_NUMBER_FIELD] }}
      </label>
      <select
        :id="getFieldId(TERM_NUMBER_FIELD)"
        :value="modelValue[TERM_NUMBER_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(TERM_NUMBER_FIELD))"
        :aria-describedby="getDescribedBy(TERM_NUMBER_FIELD)"
        @change="updateField(TERM_NUMBER_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="termOption in termNumberOptions" :key="termOption.value" :value="termOption.value">
          {{ termOption.label }}
        </option>
      </select>
      <p v-if="getFieldError(TERM_NUMBER_FIELD)" :id="getErrorId(TERM_NUMBER_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(TERM_NUMBER_FIELD) }}
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(START_DATE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ TERM_FIELD_LABELS[START_DATE_FIELD] }}
        </label>
        <input
          :id="getFieldId(START_DATE_FIELD)"
          type="date"
          :value="modelValue[START_DATE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(START_DATE_FIELD))"
          :aria-describedby="getDescribedBy(START_DATE_FIELD)"
          @input="updateField(START_DATE_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(START_DATE_FIELD)" :id="getErrorId(START_DATE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(START_DATE_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(END_DATE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ TERM_FIELD_LABELS[END_DATE_FIELD] }}
        </label>
        <input
          :id="getFieldId(END_DATE_FIELD)"
          type="date"
          :value="modelValue[END_DATE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(END_DATE_FIELD))"
          :aria-describedby="getDescribedBy(END_DATE_FIELD)"
          @input="updateField(END_DATE_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(END_DATE_FIELD)" :id="getErrorId(END_DATE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(END_DATE_FIELD) }}
        </p>
      </div>
    </div>
  </div>
</template>
