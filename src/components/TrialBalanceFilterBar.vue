<script setup>
import { ACCOUNT_TYPE_OPTIONS } from '@/utils/accountDisplay.js'
import { ALL_TYPES_LABEL } from '@/utils/trialBalanceDisplay.js'

const AS_OF_LABEL = 'As of'
const TYPE_LABEL = 'Type'
const ZERO_LABEL = 'Include zero-balance accounts'
const AS_OF_ID = 'trial-balance-as-of'
const TYPE_ID = 'trial-balance-type'
const ZERO_ID = 'trial-balance-include-zero'
const AS_OF_ERROR_ID = 'trial-balance-as-of-error'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  asOf: { type: String, required: true },
  type: { type: String, required: true },
  isZeroIncluded: { type: Boolean, required: true },
  asOfError: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:asOf', 'update:type', 'update:isZeroIncluded'])
</script>

<template>
  <div class="border-b border-line px-4 py-3 print:hidden">
    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div class="sm:w-40">
        <label :for="AS_OF_ID" :class="LABEL_CLASS">{{ AS_OF_LABEL }}</label>
        <input
          :id="AS_OF_ID"
          type="date"
          :value="asOf"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="asOfError !== ''"
          :aria-describedby="asOfError !== '' ? AS_OF_ERROR_ID : undefined"
          @input="emit('update:asOf', $event.target.value)"
        />
      </div>
      <div class="sm:w-44">
        <label :for="TYPE_ID" :class="LABEL_CLASS">{{ TYPE_LABEL }}</label>
        <select
          :id="TYPE_ID"
          :value="type"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @change="emit('update:type', $event.target.value)"
        >
          <option value="">{{ ALL_TYPES_LABEL }}</option>
          <option v-for="typeOption in ACCOUNT_TYPE_OPTIONS" :key="typeOption.value" :value="typeOption.value">
            {{ typeOption.label }}
          </option>
        </select>
      </div>
      <label :for="ZERO_ID" class="flex items-center gap-2 pb-2 text-sm font-semibold text-ink">
        <input
          :id="ZERO_ID"
          type="checkbox"
          :checked="isZeroIncluded"
          :disabled="isDisabled"
          class="size-4 rounded-md border-line focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
          @change="emit('update:isZeroIncluded', $event.target.checked)"
        />
        {{ ZERO_LABEL }}
      </label>
    </div>
    <p v-if="asOfError" :id="AS_OF_ERROR_ID" role="alert" class="mt-2 text-xs text-red-700">{{ asOfError }}</p>
  </div>
</template>
