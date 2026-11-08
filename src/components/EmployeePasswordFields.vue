<script setup>
import { EMPLOYEE_FIELD_LABELS, PASSWORD_MIN_LENGTH } from '@/utils/employeeForm.js'

const PASSWORD_FIELD = 'password'
const CONFIRMATION_FIELD = 'password_confirmation'
const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters.`
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  idPrefix: { type: String, required: true },
  passwordLabel: { type: String, default: EMPLOYEE_FIELD_LABELS.password },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldError(fieldKey) {
  return props.fieldErrors[fieldKey]?.[0] ?? ''
}

function getFieldId(fieldKey) {
  return props.idPrefix + fieldKey
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getHintId() {
  return `${getFieldId(PASSWORD_FIELD)}-hint`
}

function getDescribedBy(fieldKey) {
  if (!getFieldError(fieldKey)) return undefined
  return getErrorId(fieldKey)
}

function getPasswordDescribedBy() {
  if (!getFieldError(PASSWORD_FIELD)) return getHintId()
  return `${getHintId()} ${getErrorId(PASSWORD_FIELD)}`
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label :for="getFieldId(PASSWORD_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ passwordLabel }}
      </label>
      <input
        :id="getFieldId(PASSWORD_FIELD)"
        type="password"
        autocomplete="new-password"
        :value="modelValue[PASSWORD_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(PASSWORD_FIELD))"
        :aria-describedby="getPasswordDescribedBy()"
        @input="updateField(PASSWORD_FIELD, $event.target.value)"
      />
      <p :id="getHintId()" class="mt-1 text-xs text-ink-muted">{{ PASSWORD_HINT }}</p>
      <p v-if="getFieldError(PASSWORD_FIELD)" :id="getErrorId(PASSWORD_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(PASSWORD_FIELD) }}
      </p>
    </div>
    <div>
      <label :for="getFieldId(CONFIRMATION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ EMPLOYEE_FIELD_LABELS.password_confirmation }}
      </label>
      <input
        :id="getFieldId(CONFIRMATION_FIELD)"
        type="password"
        autocomplete="new-password"
        :value="modelValue[CONFIRMATION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(CONFIRMATION_FIELD))"
        :aria-describedby="getDescribedBy(CONFIRMATION_FIELD)"
        @input="updateField(CONFIRMATION_FIELD, $event.target.value)"
      />
      <p
        v-if="getFieldError(CONFIRMATION_FIELD)"
        :id="getErrorId(CONFIRMATION_FIELD)"
        class="mt-1 text-xs text-red-700"
      >
        {{ getFieldError(CONFIRMATION_FIELD) }}
      </p>
    </div>
  </div>
</template>
