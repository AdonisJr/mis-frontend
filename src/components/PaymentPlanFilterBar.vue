<script setup>
import { EMPLOYEE_STATUS_OPTIONS } from '@/utils/employeeSearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Plan name'
const STATUS_FILTER_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const SCHOOL_YEAR_FILTER_ID = 'payment-plan-school-year-filter'
const SEARCH_INPUT_ID = 'payment-plan-search'
const STATUS_FILTER_ID = 'payment-plan-status-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  schoolYearId: { type: String, required: true },
  search: { type: String, required: true },
  status: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:schoolYearId', 'update:search', 'update:status'])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-end">
    <div class="sm:w-44">
      <label :for="SCHOOL_YEAR_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">
        {{ SCHOOL_YEAR_FILTER_LABEL }}
      </label>
      <select
        :id="SCHOOL_YEAR_FILTER_ID"
        :value="schoolYearId"
        :class="INPUT_CLASS"
        :disabled="isDisabled || schoolYears.length === 0"
        @change="emit('update:schoolYearId', $event.target.value)"
      >
        <option v-if="schoolYears.length === 0" value="">{{ NO_SCHOOL_YEARS_LABEL }}</option>
        <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
          {{ schoolYear.name }}
        </option>
      </select>
    </div>
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
