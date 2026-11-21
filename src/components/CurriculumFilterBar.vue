<script setup>
import { buildProgramOptionLabel } from '@/utils/sectionDisplay.js'

const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const GRADE_LEVEL_FILTER_LABEL = 'Grade level'
const GRADE_LEVEL_PLACEHOLDER = 'Select a grade level'
const PROGRAM_FILTER_LABEL = 'Strand'
const PROGRAM_PLACEHOLDER = 'Select a strand'
const TERM_FILTER_LABEL = 'Term'
const TERM_PLACEHOLDER = 'Select a term'
const SCHOOL_YEAR_FILTER_ID = 'curriculum-school-year-filter'
const GRADE_LEVEL_FILTER_ID = 'curriculum-grade-level-filter'
const PROGRAM_FILTER_ID = 'curriculum-program-filter'
const TERM_FILTER_ID = 'curriculum-term-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  schoolYearId: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  programId: { type: String, required: true },
  termNumber: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  programs: { type: Array, required: true },
  termOptions: { type: Array, required: true },
  isShs: { type: Boolean, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:schoolYearId', 'update:gradeLevelId', 'update:programId', 'update:termNumber'])
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
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
    <div class="sm:w-48">
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
        <option value="">{{ GRADE_LEVEL_PLACEHOLDER }}</option>
        <option v-for="gradeLevel in gradeLevels" :key="gradeLevel.id" :value="String(gradeLevel.id)">
          {{ gradeLevel.name }}
        </option>
      </select>
    </div>
    <div v-if="isShs" class="sm:w-52">
      <label :for="PROGRAM_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ PROGRAM_FILTER_LABEL }}</label>
      <select
        :id="PROGRAM_FILTER_ID"
        :value="programId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:programId', $event.target.value)"
      >
        <option value="">{{ PROGRAM_PLACEHOLDER }}</option>
        <option v-for="program in programs" :key="program.id" :value="String(program.id)">
          {{ buildProgramOptionLabel(program) }}
        </option>
      </select>
    </div>
    <div v-if="isShs" class="sm:w-48">
      <label :for="TERM_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TERM_FILTER_LABEL }}</label>
      <select
        :id="TERM_FILTER_ID"
        :value="termNumber"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:termNumber', $event.target.value)"
      >
        <option value="">{{ TERM_PLACEHOLDER }}</option>
        <option v-for="option in termOptions" :key="option.value" :value="String(option.value)">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
