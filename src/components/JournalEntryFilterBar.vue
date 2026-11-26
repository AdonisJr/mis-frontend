<script setup>
import { JOURNAL_STATUS_OPTIONS } from '@/utils/journalEntrySearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const STATUS_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const FROM_LABEL = 'From'
const TO_LABEL = 'To'
const ACCOUNT_LABEL = 'Account'
const ALL_ACCOUNTS_LABEL = 'All accounts'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'JV no., description or reference'
const STATUS_ID = 'journal-status-filter'
const DATE_FROM_ID = 'journal-date-from'
const DATE_TO_ID = 'journal-date-to'
const ACCOUNT_ID = 'journal-account-filter'
const SEARCH_ID = 'journal-search'
const RANGE_ERROR_ID = 'journal-range-error'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  status: { type: String, required: true },
  dateFrom: { type: String, required: true },
  dateTo: { type: String, required: true },
  accountId: { type: String, required: true },
  search: { type: String, required: true },
  accountOptions: { type: Array, required: true },
  dateRangeError: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:status', 'update:dateFrom', 'update:dateTo', 'update:accountId', 'update:search'])
</script>

<template>
  <div class="border-b border-line px-4 py-3">
    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
          <option v-for="statusOption in JOURNAL_STATUS_OPTIONS" :key="statusOption.value" :value="statusOption.value">
            {{ statusOption.label }}
          </option>
        </select>
      </div>
      <div class="sm:w-40">
        <label :for="DATE_FROM_ID" :class="LABEL_CLASS">{{ FROM_LABEL }}</label>
        <input
          :id="DATE_FROM_ID"
          type="date"
          :value="dateFrom"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="dateRangeError !== ''"
          :aria-describedby="dateRangeError !== '' ? RANGE_ERROR_ID : undefined"
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
          :aria-invalid="dateRangeError !== ''"
          :aria-describedby="dateRangeError !== '' ? RANGE_ERROR_ID : undefined"
          @input="emit('update:dateTo', $event.target.value)"
        />
      </div>
      <div class="sm:w-56">
        <label :for="ACCOUNT_ID" :class="LABEL_CLASS">{{ ACCOUNT_LABEL }}</label>
        <select
          :id="ACCOUNT_ID"
          :value="accountId"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @change="emit('update:accountId', $event.target.value)"
        >
          <option value="">{{ ALL_ACCOUNTS_LABEL }}</option>
          <option v-for="accountOption in accountOptions" :key="accountOption.value" :value="accountOption.value">
            {{ accountOption.label }}
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
    <p v-if="dateRangeError" :id="RANGE_ERROR_ID" role="alert" class="mt-2 text-xs text-red-700">{{ dateRangeError }}</p>
  </div>
</template>
