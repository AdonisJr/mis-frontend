<script setup>
import { PAYMENT_METHODS } from '@/utils/paymentForm.js'
import { PAYMENT_STATUS_OPTIONS } from '@/utils/paymentSearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const FROM_LABEL = 'From'
const TO_LABEL = 'To'
const METHOD_LABEL = 'Method'
const ALL_METHODS_LABEL = 'All methods'
const CASHIER_LABEL = 'Cashier'
const ALL_CASHIERS_LABEL = 'All cashiers'
const STATUS_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student, LRN or AR no.'
const DATE_FROM_ID = 'payment-date-from'
const DATE_TO_ID = 'payment-date-to'
const METHOD_ID = 'payment-method-filter'
const CASHIER_ID = 'payment-cashier-filter'
const STATUS_ID = 'payment-status-filter'
const SEARCH_ID = 'payment-search'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  dateFrom: { type: String, required: true },
  dateTo: { type: String, required: true },
  method: { type: String, required: true },
  recordedBy: { type: String, required: true },
  status: { type: String, required: true },
  search: { type: String, required: true },
  recorders: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:dateFrom',
  'update:dateTo',
  'update:method',
  'update:recordedBy',
  'update:status',
  'update:search',
])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
    <div class="sm:w-40">
      <label :for="DATE_FROM_ID" :class="LABEL_CLASS">{{ FROM_LABEL }}</label>
      <input
        :id="DATE_FROM_ID"
        type="date"
        :value="dateFrom"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @input="emit('update:dateFrom', $event.target.value)"
      />
    </div>
    <div class="sm:w-40">
      <label :for="DATE_TO_ID" :class="LABEL_CLASS">{{ TO_LABEL }}</label>
      <input
        :id="DATE_TO_ID"
        type="date"
        :value="dateTo"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @input="emit('update:dateTo', $event.target.value)"
      />
    </div>
    <div class="sm:w-44">
      <label :for="METHOD_ID" :class="LABEL_CLASS">{{ METHOD_LABEL }}</label>
      <select
        :id="METHOD_ID"
        :value="method"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:method', $event.target.value)"
      >
        <option value="">{{ ALL_METHODS_LABEL }}</option>
        <option v-for="paymentMethod in PAYMENT_METHODS" :key="paymentMethod.value" :value="paymentMethod.value">
          {{ paymentMethod.label }}
        </option>
      </select>
    </div>
    <div class="sm:w-44">
      <label :for="CASHIER_ID" :class="LABEL_CLASS">{{ CASHIER_LABEL }}</label>
      <select
        :id="CASHIER_ID"
        :value="recordedBy"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:recordedBy', $event.target.value)"
      >
        <option value="">{{ ALL_CASHIERS_LABEL }}</option>
        <option v-for="recorder in recorders" :key="recorder.id" :value="String(recorder.id)">
          {{ recorder.name }}
        </option>
      </select>
    </div>
    <div class="sm:w-40">
      <label :for="STATUS_ID" :class="LABEL_CLASS">{{ STATUS_LABEL }}</label>
      <select
        :id="STATUS_ID"
        :value="status"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:status', $event.target.value)"
      >
        <option value="">{{ ALL_STATUSES_LABEL }}</option>
        <option v-for="statusOption in PAYMENT_STATUS_OPTIONS" :key="statusOption.value" :value="statusOption.value">
          {{ statusOption.label }}
        </option>
      </select>
    </div>
    <div class="sm:min-w-48 sm:flex-1">
      <label :for="SEARCH_ID" :class="LABEL_CLASS">{{ SEARCH_LABEL }}</label>
      <input
        :id="SEARCH_ID"
        type="search"
        :value="search"
        :placeholder="SEARCH_PLACEHOLDER"
        :maxlength="TEXT_MAX_LENGTH"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @input="emit('update:search', $event.target.value)"
      />
    </div>
  </div>
</template>
