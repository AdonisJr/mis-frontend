<script setup>
import { ATTENDANCE_TODAY_STATUS_OPTIONS } from '@/utils/attendanceSearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const DATE_LABEL = 'Date'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const GRADE_LEVEL_LABEL = 'Grade level'
const ALL_GRADE_LEVELS_LABEL = 'All grade levels'
const SECTION_LABEL = 'Section'
const ALL_SECTIONS_LABEL = 'All sections'
const STATUS_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const DATE_ID = 'attendance-today-date'
const SEARCH_ID = 'attendance-today-search'
const GRADE_LEVEL_ID = 'attendance-today-grade-level'
const SECTION_ID = 'attendance-today-section'
const STATUS_ID = 'attendance-today-status'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  date: { type: String, required: true },
  maxDate: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  sectionId: { type: String, required: true },
  status: { type: String, required: true },
  search: { type: String, required: true },
  gradeLevels: { type: Array, required: true },
  sectionOptions: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:date',
  'update:gradeLevelId',
  'update:sectionId',
  'update:status',
  'update:search',
])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
    <div class="sm:w-40">
      <label :for="DATE_ID" :class="LABEL_CLASS">{{ DATE_LABEL }}</label>
      <input
        :id="DATE_ID"
        type="date"
        :value="date"
        :max="maxDate"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @input="emit('update:date', $event.target.value)"
      />
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
    <div class="sm:w-44">
      <label :for="SECTION_ID" :class="LABEL_CLASS">{{ SECTION_LABEL }}</label>
      <select
        :id="SECTION_ID"
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
        <option v-for="statusOption in ATTENDANCE_TODAY_STATUS_OPTIONS" :key="statusOption.value" :value="statusOption.value">
          {{ statusOption.label }}
        </option>
      </select>
    </div>
  </div>
</template>
