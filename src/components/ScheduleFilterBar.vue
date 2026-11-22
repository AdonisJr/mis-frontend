<script setup>
import { buildSectionOptionLabel } from '@/utils/scheduleDisplay.js'
import { SCHEDULE_MODE_ROOM, SCHEDULE_MODE_SECTION, SCHEDULE_MODE_TEACHER } from '@/utils/scheduleSearch.js'
import { buildRoomOptionLabel } from '@/utils/roomDisplay.js'

const SCHOOL_YEAR_FILTER_LABEL = 'School year'
const NO_SCHOOL_YEARS_LABEL = 'No school years'
const SECTION_FILTER_LABEL = 'Section'
const SECTION_PLACEHOLDER = 'Select a section'
const TEACHER_FILTER_LABEL = 'Teacher'
const TEACHER_PLACEHOLDER = 'Select a teacher'
const ROOM_FILTER_LABEL = 'Room'
const ROOM_PLACEHOLDER = 'Select a room'
const TERM_FILTER_LABEL = 'Term'
const TERM_REQUIRED_PLACEHOLDER = 'Select a term'
const TERM_OPTIONAL_PLACEHOLDER = 'All terms'
const SCHOOL_YEAR_FILTER_ID = 'schedule-school-year-filter'
const SECTION_FILTER_ID = 'schedule-section-filter'
const TEACHER_FILTER_ID = 'schedule-teacher-filter'
const ROOM_FILTER_ID = 'schedule-room-filter'
const TERM_FILTER_ID = 'schedule-term-filter'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

defineProps({
  mode: { type: String, required: true },
  schoolYearId: { type: String, required: true },
  sectionId: { type: String, required: true },
  teacherId: { type: String, required: true },
  roomId: { type: String, required: true },
  termNumber: { type: String, required: true },
  schoolYears: { type: Array, required: true },
  sections: { type: Array, required: true },
  teachers: { type: Array, required: true },
  rooms: { type: Array, required: true },
  termOptions: { type: Array, required: true },
  isTermVisible: { type: Boolean, required: true },
  isTermRequired: { type: Boolean, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:schoolYearId',
  'update:sectionId',
  'update:teacherId',
  'update:roomId',
  'update:termNumber',
])
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
    <div v-if="mode === SCHEDULE_MODE_SECTION" class="sm:w-56">
      <label :for="SECTION_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ SECTION_FILTER_LABEL }}</label>
      <select
        :id="SECTION_FILTER_ID"
        :value="sectionId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:sectionId', $event.target.value)"
      >
        <option value="">{{ SECTION_PLACEHOLDER }}</option>
        <option v-for="section in sections" :key="section.id" :value="String(section.id)">
          {{ buildSectionOptionLabel(section) }}
        </option>
      </select>
    </div>
    <div v-if="mode === SCHEDULE_MODE_TEACHER" class="sm:w-56">
      <label :for="TEACHER_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TEACHER_FILTER_LABEL }}</label>
      <select
        :id="TEACHER_FILTER_ID"
        :value="teacherId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:teacherId', $event.target.value)"
      >
        <option value="">{{ TEACHER_PLACEHOLDER }}</option>
        <option v-for="teacher in teachers" :key="teacher.id" :value="String(teacher.id)">{{ teacher.name }}</option>
      </select>
    </div>
    <div v-if="mode === SCHEDULE_MODE_ROOM" class="sm:w-56">
      <label :for="ROOM_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ ROOM_FILTER_LABEL }}</label>
      <select
        :id="ROOM_FILTER_ID"
        :value="roomId"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:roomId', $event.target.value)"
      >
        <option value="">{{ ROOM_PLACEHOLDER }}</option>
        <option v-for="room in rooms" :key="room.id" :value="String(room.id)">{{ buildRoomOptionLabel(room) }}</option>
      </select>
    </div>
    <div v-if="isTermVisible" class="sm:w-48">
      <label :for="TERM_FILTER_ID" class="mb-1 block text-sm font-semibold text-ink">{{ TERM_FILTER_LABEL }}</label>
      <select
        :id="TERM_FILTER_ID"
        :value="termNumber"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="emit('update:termNumber', $event.target.value)"
      >
        <option value="">{{ isTermRequired ? TERM_REQUIRED_PLACEHOLDER : TERM_OPTIONAL_PLACEHOLDER }}</option>
        <option v-for="option in termOptions" :key="option.value" :value="String(option.value)">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
