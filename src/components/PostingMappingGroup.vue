<script setup>
import { getAccountTypeLabel } from '@/utils/accountDisplay.js'
import { NOT_MAPPED_LABEL, buildPurposeAccountOptions, getPurposeError } from '@/utils/postingSettingsForm.js'

const SELECT_ID_PREFIX = 'posting-purpose-'
const ERROR_ID_SUFFIX = '-error'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  group: { type: String, required: true },
  mappings: { type: Array, required: true },
  selections: { type: Object, required: true },
  activeAccounts: { type: Array, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:selection'])

function buildSelectId(purpose) {
  return SELECT_ID_PREFIX + purpose
}

function buildErrorId(purpose) {
  return buildSelectId(purpose) + ERROR_ID_SUFFIX
}
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="border-b border-line px-4 py-3">
      <h3 class="text-sm font-bold text-ink">{{ group }}</h3>
    </div>
    <div class="space-y-4 px-4 py-3">
      <div v-for="postingMapping in mappings" :key="postingMapping.purpose">
        <label :for="buildSelectId(postingMapping.purpose)" :class="LABEL_CLASS">{{ postingMapping.label }}</label>
        <p class="mb-1 text-xs text-ink-muted">{{ getAccountTypeLabel(postingMapping.account_type) }} accounts</p>
        <select
          :id="buildSelectId(postingMapping.purpose)"
          :value="selections[postingMapping.purpose] ?? ''"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="getPurposeError(fieldErrors, postingMapping.purpose) !== ''"
          :aria-describedby="getPurposeError(fieldErrors, postingMapping.purpose) !== '' ? buildErrorId(postingMapping.purpose) : undefined"
          @change="emit('update:selection', postingMapping.purpose, $event.target.value)"
        >
          <option value="" disabled>{{ NOT_MAPPED_LABEL }}</option>
          <option
            v-for="accountOption in buildPurposeAccountOptions(postingMapping, activeAccounts)"
            :key="accountOption.value"
            :value="accountOption.value"
          >
            {{ accountOption.label }}
          </option>
        </select>
        <p
          v-if="getPurposeError(fieldErrors, postingMapping.purpose)"
          :id="buildErrorId(postingMapping.purpose)"
          class="mt-1 text-xs text-red-700"
        >
          {{ getPurposeError(fieldErrors, postingMapping.purpose) }}
        </p>
      </div>
    </div>
  </section>
</template>
