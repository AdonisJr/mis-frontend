<script setup>
const ACCOUNT_LABEL = 'Account'
const ACCOUNT_PLACEHOLDER = 'Select an account…'
const FROM_LABEL = 'From'
const TO_LABEL = 'To'
const ACCOUNT_ID = 'ledger-account'
const FROM_ID = 'ledger-from'
const TO_ID = 'ledger-to'
const RANGE_ERROR_ID = 'ledger-range-error'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  accountId: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  accountOptions: { type: Array, required: true },
  rangeError: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:accountId', 'update:from', 'update:to'])
</script>

<template>
  <div class="border-b border-line px-4 py-3">
    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div class="sm:min-w-64 sm:flex-1">
        <label :for="ACCOUNT_ID" :class="LABEL_CLASS">{{ ACCOUNT_LABEL }}</label>
        <select
          :id="ACCOUNT_ID"
          :value="accountId"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @change="emit('update:accountId', $event.target.value)"
        >
          <option value="" disabled>{{ ACCOUNT_PLACEHOLDER }}</option>
          <option v-for="accountOption in accountOptions" :key="accountOption.value" :value="accountOption.value">
            {{ accountOption.label }}
          </option>
        </select>
      </div>
      <div class="sm:w-40">
        <label :for="FROM_ID" :class="LABEL_CLASS">{{ FROM_LABEL }}</label>
        <input
          :id="FROM_ID"
          type="date"
          :value="from"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="rangeError !== ''"
          :aria-describedby="rangeError !== '' ? RANGE_ERROR_ID : undefined"
          @input="emit('update:from', $event.target.value)"
        />
      </div>
      <div class="sm:w-40">
        <label :for="TO_ID" :class="LABEL_CLASS">{{ TO_LABEL }}</label>
        <input
          :id="TO_ID"
          type="date"
          :value="to"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="rangeError !== ''"
          :aria-describedby="rangeError !== '' ? RANGE_ERROR_ID : undefined"
          @input="emit('update:to', $event.target.value)"
        />
      </div>
    </div>
    <p v-if="rangeError" :id="RANGE_ERROR_ID" role="alert" class="mt-2 text-xs text-red-700">{{ rangeError }}</p>
  </div>
</template>
