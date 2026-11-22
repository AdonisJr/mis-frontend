<script setup>
const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const TERM_FILTER_LABEL = 'Term'
const TEACHER_FILTER_LABEL = 'Teacher'
const TEACHER_PLACEHOLDER = 'Select a teacher'
const SCHOOL_YEAR_FILTER_ID = 'class-list-school-year-filter'
const TERM_FILTER_ID = 'class-list-term-filter'
const TEACHER_FILTER_ID = 'class-list-teacher-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  schoolYearId: { type: String, required: true },
  termNumber: { type: String, required: true },
  teacherId: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  termOptions: { type: Array, required: true },
  teachers: { type: Array, required: true },
  isTeacherPickerVisible: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:schoolYearId', 'update:termNumber', 'update:teacherId'])
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
    <div v-if="termOptions.length > 0" class="sm:w-48">
      <label :for="TERM_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TERM_FILTER_LABEL }}</label>
      <select
        :id="TERM_FILTER_ID"
        :value="termNumber"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:termNumber', $event.target.value)"
      >
        <option v-for="option in termOptions" :key="option.value" :value="String(option.value)">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div v-if="isTeacherPickerVisible" class="sm:w-56">
      <label :for="TEACHER_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TEACHER_FILTER_LABEL }}</label>
      <select
        :id="TEACHER_FILTER_ID"
        :value="teacherId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:teacherId', $event.target.value)"
      >
        <option value="" disabled>{{ TEACHER_PLACEHOLDER }}</option>
        <option v-for="teacher in teachers" :key="teacher.id" :value="String(teacher.id)">{{ teacher.name }}</option>
      </select>
    </div>
  </div>
</template>
