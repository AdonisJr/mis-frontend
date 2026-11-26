<script setup>
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const AS_OF_LABEL = 'As of'
const SCHOOL_YEAR_LABEL = 'School year'
const ALL_SCHOOL_YEARS_LABEL = 'All school years'
const GRADE_LEVEL_LABEL = 'Grade level'
const ALL_GRADE_LEVELS_LABEL = 'All grade levels'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const AS_OF_ID = 'ar-aging-as-of'
const SCHOOL_YEAR_ID = 'ar-aging-school-year'
const GRADE_LEVEL_ID = 'ar-aging-grade-level'
const SEARCH_ID = 'ar-aging-search'
const AS_OF_ERROR_ID = 'ar-aging-as-of-error'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  asOf: { type: String, required: true },
  schoolYearId: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  search: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  asOfError: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:asOf', 'update:schoolYearId', 'update:gradeLevelId', 'update:search'])
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
        <label :for="SCHOOL_YEAR_ID" :class="LABEL_CLASS">{{ SCHOOL_YEAR_LABEL }}</label>
        <select
          :id="SCHOOL_YEAR_ID"
          :value="schoolYearId"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @change="emit('update:schoolYearId', $event.target.value)"
        >
          <option value="">{{ ALL_SCHOOL_YEARS_LABEL }}</option>
          <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
            {{ schoolYear.name }}
          </option>
        </select>
      </div>
      <div class="sm:w-44">
        <label :for="GRADE_LEVEL_ID" :class="LABEL_CLASS">{{ GRADE_LEVEL_LABEL }}</label>
        <select
          :id="GRADE_LEVEL_ID"
          :value="gradeLevelId"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @change="emit('update:gradeLevelId', $event.target.value)"
        >
          <option value="">{{ ALL_GRADE_LEVELS_LABEL }}</option>
          <option v-for="gradeLevel in gradeLevels" :key="gradeLevel.id" :value="String(gradeLevel.id)">
            {{ gradeLevel.name }}
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
    <p v-if="asOfError" :id="AS_OF_ERROR_ID" role="alert" class="mt-2 text-xs text-red-700">{{ asOfError }}</p>
  </div>
</template>
