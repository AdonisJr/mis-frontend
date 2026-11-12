<script setup>
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'
import { ENROLLMENT_STATUS_OPTIONS } from '@/utils/enrollmentStatus.js'

const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const TERM_FILTER_LABEL = 'Term'
const ALL_TERMS_LABEL = 'All terms'
const GRADE_LEVEL_FILTER_LABEL = 'Grade level'
const ALL_GRADE_LEVELS_LABEL = 'All grade levels'
const SECTION_FILTER_LABEL = 'Section'
const ALL_SECTIONS_LABEL = 'All sections'
const STATUS_FILTER_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const SEARCH_INPUT_ID = 'enrollment-search-filter'
const SCHOOL_YEAR_FILTER_ID = 'enrollment-school-year-filter'
const TERM_FILTER_ID = 'enrollment-term-filter'
const GRADE_LEVEL_FILTER_ID = 'enrollment-grade-level-filter'
const SECTION_FILTER_ID = 'enrollment-section-filter'
const STATUS_FILTER_ID = 'enrollment-status-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  search: { type: String, required: true },
  schoolYearId: { type: String, required: true },
  termId: { type: String, required: true },
  sectionId: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  status: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  terms: { type: Array, required: true },
  sectionOptions: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:search',
  'update:schoolYearId',
  'update:termId',
  'update:sectionId',
  'update:gradeLevelId',
  'update:status',
])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
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
    <div class="sm:w-44">
      <label :for="TERM_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TERM_FILTER_LABEL }}</label>
      <select
        :id="TERM_FILTER_ID"
        :value="termId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:termId', $event.target.value)"
      >
        <option value="">{{ ALL_TERMS_LABEL }}</option>
        <option v-for="term in terms" :key="term.id" :value="String(term.id)">{{ term.label }}</option>
      </select>
    </div>
    <div class="sm:w-44">
      <label :for="GRADE_LEVEL_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">
        {{ GRADE_LEVEL_FILTER_LABEL }}
      </label>
      <select
        :id="GRADE_LEVEL_FILTER_ID"
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
    <div class="sm:w-44">
      <label :for="SECTION_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SECTION_FILTER_LABEL }}</label>
      <select
        :id="SECTION_FILTER_ID"
        :value="sectionId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:sectionId', $event.target.value)"
      >
        <option value="">{{ ALL_SECTIONS_LABEL }}</option>
        <option v-for="sectionOption in sectionOptions" :key="sectionOption.id" :value="String(sectionOption.id)">
          {{ sectionOption.label }}
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
        <option v-for="statusOption in ENROLLMENT_STATUS_OPTIONS" :key="statusOption.value" :value="statusOption.value">
          {{ statusOption.label }}
        </option>
      </select>
    </div>
  </div>
</template>
