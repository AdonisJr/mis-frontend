<script setup>
import { DISCOUNT_SOURCE_OPTIONS } from '@/utils/discountTypeForm.js'
import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Type name'
const SOURCE_FILTER_LABEL = 'Source'
const ALL_SOURCES_LABEL = 'All sources'
const STATUS_FILTER_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const SEARCH_INPUT_ID = 'discount-type-search'
const SOURCE_FILTER_ID = 'discount-type-source-filter'
const STATUS_FILTER_ID = 'discount-type-status-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  search: { type: String, required: true },
  source: { type: String, required: true },
  status: { type: String, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:search', 'update:source', 'update:status'])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-end">
    <div class="sm:flex-1">
      <label :for="SEARCH_INPUT_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SEARCH_LABEL }}</label>
      <input
        :id="SEARCH_INPUT_ID"
        type="search"
        :value="search"
        :placeholder="SEARCH_PLACEHOLDER"
        :maxlength="TEXT_MAX_LENGTH"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @input="emit('update:search', $event.target.value)"
      />
    </div>
    <div class="sm:w-44">
      <label :for="SOURCE_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SOURCE_FILTER_LABEL }}</label>
      <select
        :id="SOURCE_FILTER_ID"
        :value="source"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:source', $event.target.value)"
      >
        <option value="">{{ ALL_SOURCES_LABEL }}</option>
        <option v-for="option in DISCOUNT_SOURCE_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div class="sm:w-44">
      <label :for="STATUS_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ STATUS_FILTER_LABEL }}</label>
      <select
        :id="STATUS_FILTER_ID"
        :value="status"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:status', $event.target.value)"
      >
        <option value="">{{ ALL_STATUSES_LABEL }}</option>
        <option v-for="option in EMPLOYEE_STATUS_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
