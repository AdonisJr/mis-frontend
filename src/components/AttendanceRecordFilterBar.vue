<script setup>
import { X } from '@lucide/vue'
import { ATTENDANCE_RECORD_STATUS_OPTIONS } from '@/utils/attendanceSearch.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const FROM_LABEL = 'From'
const TO_LABEL = 'To'
const SEARCH_LABEL = 'Search'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const GRADE_LEVEL_LABEL = 'Grade level'
const ALL_GRADE_LEVELS_LABEL = 'All grade levels'
const SECTION_LABEL = 'Section'
const ALL_SECTIONS_LABEL = 'All sections'
const STATUS_LABEL = 'Status'
const ALL_STATUSES_LABEL = 'All statuses'
const STUDENT_CHIP_PREFIX = 'Student:'
const FROM_ID = 'attendance-records-from'
const TO_ID = 'attendance-records-to'
const SEARCH_ID = 'attendance-records-search'
const GRADE_LEVEL_ID = 'attendance-records-grade-level'
const SECTION_ID = 'attendance-records-section'
const STATUS_ID = 'attendance-records-status'
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const STUDENT_CHIP_CLASS = 'rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700'
const CLEAR_BUTTON_CLASS =
  'rounded-md p-1 text-ink-muted hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

defineProps({
  dateFrom: { type: String, required: true },
  dateTo: { type: String, required: true },
  maxDate: { type: String, required: true },
  studentLabel: { type: String, required: true },
  gradeLevelId: { type: String, required: true },
  sectionId: { type: String, required: true },
  status: { type: String, required: true },
  search: { type: String, required: true },
  gradeLevels: { type: Array, required: true },
  sectionOptions: { type: Array, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:dateFrom',
  'update:dateTo',
  'update:gradeLevelId',
  'update:sectionId',
  'update:status',
  'update:search',
  'clear-student',
])
</script>

<template>
  <div class="border-b border-line">
    <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div class="sm:w-40">
        <label :for="FROM_ID" :class="LABEL_CLASS">{{ FROM_LABEL }}</label>
        <input
          :id="FROM_ID"
          type="date"
          :value="dateFrom"
          :max="maxDate"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @input="emit('update:dateFrom', $event.target.value)"
        />
      </div>
      <div class="sm:w-40">
        <label :for="TO_ID" :class="LABEL_CLASS">{{ TO_LABEL }}</label>
        <input
          :id="TO_ID"
          type="date"
          :value="dateTo"
          :max="maxDate"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @input="emit('update:dateTo', $event.target.value)"
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
      <div class="sm:w-36">
        <label :for="STATUS_ID" :class="LABEL_CLASS">{{ STATUS_LABEL }}</label>
        <select
          :id="STATUS_ID"
          :value="status"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          @change="emit('update:status', $event.target.value)"
        >
          <option value="">{{ ALL_STATUSES_LABEL }}</option>
          <option v-for="statusOption in ATTENDANCE_RECORD_STATUS_OPTIONS" :key="statusOption.value" :value="statusOption.value">
            {{ statusOption.label }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="studentLabel !== ''" class="flex items-center gap-1 px-4 pb-3">
      <span :class="STUDENT_CHIP_CLASS">{{ STUDENT_CHIP_PREFIX }} {{ studentLabel }}</span>
      <button
        type="button"
        :class="CLEAR_BUTTON_CLASS"
        :aria-label="`Clear the student filter ${studentLabel}`"
        :disabled="isDisabled"
        @click="emit('clear-student')"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
