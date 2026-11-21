<script setup>
import { NOTE_STATUS_OPTIONS } from '@/utils/paymentHoldDisplay.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const STATUS_LABEL = 'Note status'
const ALL_STATUSES_LABEL = 'All statuses'
const YEAR_LABEL = 'School year'
const ALL_YEARS_LABEL = 'All school years'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const STATUS_ID = 'hold-status-filter'
const YEAR_ID = 'hold-year-filter'
const SEARCH_ID = 'hold-search'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  noteStatus: { type: String, required: true },
  schoolYearId: { type: String, required: true },
  search: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:noteStatus', 'update:schoolYearId', 'update:search'])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
    <div class="sm:w-44">
      <label :for="STATUS_ID" :class="LABEL_CLASS">{{ STATUS_LABEL }}</label>
      <select
        :id="STATUS_ID"
        :value="noteStatus"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:noteStatus', $event.target.value)"
      >
        <option value="">{{ ALL_STATUSES_LABEL }}</option>
        <option v-for="statusOption in NOTE_STATUS_OPTIONS" :key="statusOption.value" :value="statusOption.value">
          {{ statusOption.label }}
        </option>
      </select>
    </div>
    <div class="sm:w-48">
      <label :for="YEAR_ID" :class="LABEL_CLASS">{{ YEAR_LABEL }}</label>
      <select
        :id="YEAR_ID"
        :value="schoolYearId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:schoolYearId', $event.target.value)"
      >
        <option value="">{{ ALL_YEARS_LABEL }}</option>
        <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
          {{ schoolYear.name }}
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
