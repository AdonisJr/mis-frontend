<script setup>
import { REOPEN_REASON_MAX_LENGTH } from '@/utils/classRecordForm.js'

const FIELD_ID = 'reopen-reason'
const ERROR_ID = 'reopen-reason-error'
const LABEL = 'Reason'

defineProps({
  modelValue: { type: String, default: '' },
  errorText: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label :for="FIELD_ID" class="mb-1 block text-sm font-semibold text-ink">{{ LABEL }}</label>
    <textarea
      :id="FIELD_ID"
      rows="4"
      :maxlength="REOPEN_REASON_MAX_LENGTH"
      :value="modelValue"
      class="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page"
      :disabled="isDisabled"
      :aria-invalid="Boolean(errorText)"
      :aria-describedby="errorText ? ERROR_ID : undefined"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <p v-if="errorText" :id="ERROR_ID" class="mt-1 text-xs text-red-700">{{ errorText }}</p>
  </div>
</template>
