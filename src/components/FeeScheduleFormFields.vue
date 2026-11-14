<script setup>
import { buildProgramOptionLabel } from '@/utils/sectionDisplay.js'

const SCHOOL_YEAR_FIELD = 'school_year_id'
const GRADE_LEVEL_FIELD = 'grade_level_id'
const PROGRAM_FIELD = 'program_id'
const FIELD_ID_PREFIX = 'fee-schedule-'
const SELECT_PLACEHOLDER = 'Select…'
const ALL_PROGRAMS_OPTION_LABEL = 'All programs'
const PROGRAM_HINT = "Leave as All programs for the grade level's default schedule."
const LOCKED_HINT = 'Fixed after creation. Delete and re-create the schedule to change it.'
const LOCKED_HINT_ID = 'fee-schedule-key-locked-hint'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  isKeyLocked: { type: Boolean, default: false },
  schoolYears: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  programOptions: { type: Array, required: true },
  isProgramVisible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldError(fieldKey) {
  return props.fieldErrors[fieldKey]?.[0] ?? ''
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getDescribedBy(fieldKey) {
  const describedByIds = [getFieldError(fieldKey) ? getErrorId(fieldKey) : undefined]
  if (props.isKeyLocked) describedByIds.push(LOCKED_HINT_ID)
  const joinedIds = describedByIds.filter(Boolean).join(' ')
  return joinedIds || undefined
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(SCHOOL_YEAR_FIELD)" class="mb-1 block text-sm font-semibold text-ink">School year</label>
        <select
          :id="getFieldId(SCHOOL_YEAR_FIELD)"
          :value="modelValue[SCHOOL_YEAR_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled || isKeyLocked"
          :aria-invalid="Boolean(getFieldError(SCHOOL_YEAR_FIELD))"
          :aria-describedby="getDescribedBy(SCHOOL_YEAR_FIELD)"
          @change="updateField(SCHOOL_YEAR_FIELD, $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="schoolYear in schoolYears" :key="schoolYear.id" :value="String(schoolYear.id)">
            {{ schoolYear.name }}
          </option>
        </select>
        <p v-if="getFieldError(SCHOOL_YEAR_FIELD)" :id="getErrorId(SCHOOL_YEAR_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(SCHOOL_YEAR_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(GRADE_LEVEL_FIELD)" class="mb-1 block text-sm font-semibold text-ink">Grade level</label>
        <select
          :id="getFieldId(GRADE_LEVEL_FIELD)"
          :value="modelValue[GRADE_LEVEL_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled || isKeyLocked"
          :aria-invalid="Boolean(getFieldError(GRADE_LEVEL_FIELD))"
          :aria-describedby="getDescribedBy(GRADE_LEVEL_FIELD)"
          @change="updateField(GRADE_LEVEL_FIELD, $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="gradeLevel in gradeLevels" :key="gradeLevel.id" :value="String(gradeLevel.id)">
            {{ gradeLevel.name }}
          </option>
        </select>
        <p v-if="getFieldError(GRADE_LEVEL_FIELD)" :id="getErrorId(GRADE_LEVEL_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(GRADE_LEVEL_FIELD) }}
        </p>
      </div>
    </div>

    <div v-if="isProgramVisible">
      <label :for="getFieldId(PROGRAM_FIELD)" class="mb-1 block text-sm font-semibold text-ink">Program</label>
      <select
        :id="getFieldId(PROGRAM_FIELD)"
        :value="modelValue[PROGRAM_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled || isKeyLocked"
        :aria-invalid="Boolean(getFieldError(PROGRAM_FIELD))"
        :aria-describedby="getDescribedBy(PROGRAM_FIELD)"
        @change="updateField(PROGRAM_FIELD, $event.target.value)"
      >
        <option value="">{{ ALL_PROGRAMS_OPTION_LABEL }}</option>
        <option v-for="programOption in programOptions" :key="programOption.id" :value="String(programOption.id)">
          {{ buildProgramOptionLabel(programOption) }}
        </option>
      </select>
      <p class="mt-1 text-xs text-ink-muted">{{ PROGRAM_HINT }}</p>
      <p v-if="getFieldError(PROGRAM_FIELD)" :id="getErrorId(PROGRAM_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(PROGRAM_FIELD) }}
      </p>
    </div>
    <p v-if="isKeyLocked" :id="LOCKED_HINT_ID" class="text-xs text-ink-muted">{{ LOCKED_HINT }}</p>
  </div>
</template>
