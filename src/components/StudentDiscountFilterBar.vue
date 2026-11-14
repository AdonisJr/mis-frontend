<script setup>
import { buildDiscountTypeOptionLabel } from '@/utils/discountDisplay.js'
import { DISCOUNT_SOURCE_OPTIONS } from '@/utils/discountTypeForm.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const TYPE_FILTER_LABEL = 'Discount type'
const ALL_TYPES_LABEL = 'All discount types'
const SOURCE_FILTER_LABEL = 'Source'
const ALL_SOURCES_LABEL = 'All sources'
const SCHOOL_YEAR_FILTER_ID = 'student-discount-school-year-filter'
const SEARCH_INPUT_ID = 'student-discount-search'
const TYPE_FILTER_ID = 'student-discount-type-filter'
const SOURCE_FILTER_ID = 'student-discount-source-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  schoolYearId: { type: String, required: true },
  search: { type: String, required: true },
  discountTypeId: { type: String, required: true },
  source: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  discountTypes: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:schoolYearId', 'update:search', 'update:discountTypeId', 'update:source'])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
    <div class="sm:w-40">
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
    <div class="sm:min-w-48 sm:flex-1">
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
    <div class="sm:w-52">
      <label :for="TYPE_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TYPE_FILTER_LABEL }}</label>
      <select
        :id="TYPE_FILTER_ID"
        :value="discountTypeId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:discountTypeId', $event.target.value)"
      >
        <option value="">{{ ALL_TYPES_LABEL }}</option>
        <option v-for="discountType in discountTypes" :key="discountType.id" :value="String(discountType.id)">
          {{ buildDiscountTypeOptionLabel(discountType) }}
        </option>
      </select>
    </div>
    <div class="sm:w-40">
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
  </div>
</template>
