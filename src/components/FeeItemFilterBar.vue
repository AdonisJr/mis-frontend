<script setup>
import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { FEE_ITEM_CATEGORY_OPTIONS } from '@/utils/feeItemForm.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Fee item name'
const CATEGORY_FILTER_LABEL = 'Category'
const ALL_CATEGORIES_LABEL = 'All categories'
const STATUS_FILTER_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const SEARCH_INPUT_ID = 'fee-item-search'
const CATEGORY_FILTER_ID = 'fee-item-category-filter'
const STATUS_FILTER_ID = 'fee-item-status-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  search: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
})

const emit = defineEmits(['update:search', 'update:category', 'update:status'])
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
        @input="emit('update:search', $event.target.value)"
      />
    </div>
    <div class="sm:w-44">
      <label :for="CATEGORY_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ CATEGORY_FILTER_LABEL }}</label>
      <select
        :id="CATEGORY_FILTER_ID"
        :value="category"
        :class="INPUT_CLASS"
        @change="emit('update:category', $event.target.value)"
      >
        <option value="">{{ ALL_CATEGORIES_LABEL }}</option>
        <option v-for="option in FEE_ITEM_CATEGORY_OPTIONS" :key="option.value" :value="option.value">
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
