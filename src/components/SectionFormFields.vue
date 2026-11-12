<script setup>
import { computed } from 'vue'
import {
  SECTION_CAPACITY_MAX,
  SECTION_CAPACITY_MIN,
  SECTION_FIELD_LABELS,
  SECTION_NAME_MAX_LENGTH,
  SECTION_ROOM_MAX_LENGTH,
} from '@/utils/sectionForm.js'
import { buildProgramOptionLabel } from '@/utils/sectionDisplay.js'

const SCHOOL_YEAR_FIELD = 'school_year_id'
const GRADE_LEVEL_FIELD = 'grade_level_id'
const PROGRAM_FIELD = 'program_id'
const NAME_FIELD = 'name'
const CAPACITY_FIELD = 'capacity'
const ROOM_FIELD = 'room'
const FIELD_ID_PREFIX = 'section-'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const NO_PROGRAM_PLACEHOLDER = 'No program'
const PROGRAM_JHS_HINT = 'JHS sections have no program.'
const PROGRAM_HINT_ID = 'section-program_id-hint'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  schoolYears: { type: Array, required: true },
  gradeLevels: { type: Array, required: true },
  programOptions: { type: Array, required: true },
  isProgramForbidden: { type: Boolean, default: false },
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
  if (!getFieldError(fieldKey)) return undefined
  return getErrorId(fieldKey)
}

const programDescribedBy = computed(() => {
  const describedByIds = [getDescribedBy(PROGRAM_FIELD), props.isProgramForbidden ? PROGRAM_HINT_ID : undefined]
  const joinedIds = describedByIds.filter(Boolean).join(' ')
  return joinedIds || undefined
})
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(SCHOOL_YEAR_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ SECTION_FIELD_LABELS.school_year_id }}
        </label>
        <select
          :id="getFieldId(SCHOOL_YEAR_FIELD)"
          :value="modelValue[SCHOOL_YEAR_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
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
        <label :for="getFieldId(GRADE_LEVEL_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ SECTION_FIELD_LABELS.grade_level_id }}
        </label>
        <select
          :id="getFieldId(GRADE_LEVEL_FIELD)"
          :value="modelValue[GRADE_LEVEL_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
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

    <div>
      <label :for="getFieldId(PROGRAM_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SECTION_FIELD_LABELS.program_id }}
      </label>
      <select
        :id="getFieldId(PROGRAM_FIELD)"
        :value="modelValue[PROGRAM_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled || isProgramForbidden"
        :aria-invalid="Boolean(getFieldError(PROGRAM_FIELD))"
        :aria-describedby="programDescribedBy"
        @change="updateField(PROGRAM_FIELD, $event.target.value)"
      >
        <option value="" :disabled="!isProgramForbidden">
          {{ isProgramForbidden ? NO_PROGRAM_PLACEHOLDER : SELECT_PLACEHOLDER }}
        </option>
        <option v-for="programOption in programOptions" :key="programOption.id" :value="String(programOption.id)">
          {{ buildProgramOptionLabel(programOption) }}
        </option>
      </select>
      <p v-if="isProgramForbidden" :id="PROGRAM_HINT_ID" class="mt-1 text-xs text-ink-muted">{{ PROGRAM_JHS_HINT }}</p>
      <p v-if="getFieldError(PROGRAM_FIELD)" :id="getErrorId(PROGRAM_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(PROGRAM_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ SECTION_FIELD_LABELS.name }}
      </label>
      <input
        :id="getFieldId(NAME_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="SECTION_NAME_MAX_LENGTH"
        :value="modelValue[NAME_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(NAME_FIELD))"
        :aria-describedby="getDescribedBy(NAME_FIELD)"
        @input="updateField(NAME_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(NAME_FIELD)" :id="getErrorId(NAME_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(NAME_FIELD) }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(CAPACITY_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ SECTION_FIELD_LABELS.capacity }}
        </label>
        <input
          :id="getFieldId(CAPACITY_FIELD)"
          type="number"
          inputmode="numeric"
          step="1"
          :min="SECTION_CAPACITY_MIN"
          :max="SECTION_CAPACITY_MAX"
          :value="modelValue[CAPACITY_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(CAPACITY_FIELD))"
          :aria-describedby="getDescribedBy(CAPACITY_FIELD)"
          @input="updateField(CAPACITY_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(CAPACITY_FIELD)" :id="getErrorId(CAPACITY_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(CAPACITY_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(ROOM_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ SECTION_FIELD_LABELS.room + OPTIONAL_SUFFIX }}
        </label>
        <input
          :id="getFieldId(ROOM_FIELD)"
          type="text"
          autocomplete="off"
          :maxlength="SECTION_ROOM_MAX_LENGTH"
          :value="modelValue[ROOM_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(ROOM_FIELD))"
          :aria-describedby="getDescribedBy(ROOM_FIELD)"
          @input="updateField(ROOM_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(ROOM_FIELD)" :id="getErrorId(ROOM_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(ROOM_FIELD) }}
        </p>
      </div>
    </div>
  </div>
</template>
