<script setup>
const SECTION_FIELD = 'section_id'
const TERM_FIELD = 'term_id'
const FIELD_ID_PREFIX = 'enrollment-complete-'
const SECTION_LABEL = 'Section'
const TERM_LABEL = 'Term'
const SELECT_PLACEHOLDER = 'Select…'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  sectionOptions: { type: Array, required: true },
  terms: { type: Array, required: true },
  isTermVisible: { type: Boolean, default: false },
  countText: { type: String, default: '' },
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
    <div>
      <label :for="getFieldId(SECTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">{{ SECTION_LABEL }}</label>
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
        <option v-for="sectionOption in sectionOptions" :key="sectionOption.id" :value="String(sectionOption.id)">
          {{ sectionOption.label }}
        </option>
      </select>
      <p v-if="getFieldError(SECTION_FIELD)" :id="getErrorId(SECTION_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(SECTION_FIELD) }}
      </p>
    </div>

    <div v-if="isTermVisible">
      <label :for="getFieldId(TERM_FIELD)" class="mb-1 block text-sm font-semibold text-ink">{{ TERM_LABEL }}</label>
      <select
        :id="getFieldId(TERM_FIELD)"
        :value="modelValue[TERM_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(TERM_FIELD))"
        :aria-describedby="getDescribedBy(TERM_FIELD)"
        @change="updateField(TERM_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="term in terms" :key="term.id" :value="String(term.id)">{{ term.label }}</option>
      </select>
      <p v-if="getFieldError(TERM_FIELD)" :id="getErrorId(TERM_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(TERM_FIELD) }}
      </p>
    </div>

    <p v-if="countText !== ''" class="text-sm tabular-nums text-ink-muted">{{ countText }}</p>
  </div>
</template>
