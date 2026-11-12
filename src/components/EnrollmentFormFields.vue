<script setup>
import { computed } from 'vue'
import { ENROLLMENT_FIELD_LABELS, ENROLLMENT_REMARKS_MAX_LENGTH } from '@/utils/enrollmentForm.js'
import { formatCurrentEnrollment, formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const STUDENT_FIELD = 'student_id'
const SECTION_FIELD = 'section_id'
const TERM_FIELD = 'term_id'
const ENROLLED_AT_FIELD = 'enrolled_at'
const REMARKS_FIELD = 'remarks'
const FIELD_ID_PREFIX = 'enrollment-'
const STUDENT_SEARCH_ID = 'enrollment-student-search'
const STUDENT_LIST_LABEL = 'Matching students'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const SEARCHING_TEXT = 'Searching…'
const NO_STUDENT_MATCH_TEXT = 'No students match.'
const CHANGE_STUDENT_LABEL = 'Change'
const REMARKS_ROWS = 3
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  studentSearch: { type: String, required: true },
  studentOptions: { type: Array, required: true },
  isStudentSearching: { type: Boolean, default: false },
  pickedStudent: { type: Object, default: null },
  sectionOptions: { type: Array, required: true },
  terms: { type: Array, required: true },
  isTermVisible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:studentSearch', 'pick-student', 'clear-student'])

const isNoMatchShown = computed(
  () => props.studentSearch.trim() !== '' && !props.isStudentSearching && props.studentOptions.length === 0,
)

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
</script>

<template>
  <div class="space-y-4">
    <div>
      <span :id="`${getFieldId(STUDENT_FIELD)}-label`" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.student_id }}
      </span>
      <div
        v-if="pickedStudent"
        class="flex items-center justify-between gap-3 rounded-md border border-line bg-page px-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-ink">{{ formatEnrollmentStudentName(pickedStudent) }}</p>
          <p class="font-mono text-xs tabular-nums text-ink-muted">{{ pickedStudent.lrn }}</p>
        </div>
        <button
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          class="text-ink"
          :disabled="isDisabled"
          @click="emit('clear-student')"
        >
          {{ CHANGE_STUDENT_LABEL }}
        </button>
      </div>
      <div v-else>
        <input
          :id="STUDENT_SEARCH_ID"
          type="search"
          autocomplete="off"
          :value="studentSearch"
          :placeholder="SEARCH_PLACEHOLDER"
          :maxlength="TEXT_MAX_LENGTH"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-labelledby="`${getFieldId(STUDENT_FIELD)}-label`"
          :aria-invalid="Boolean(getFieldError(STUDENT_FIELD))"
          :aria-describedby="getDescribedBy(STUDENT_FIELD)"
          @input="emit('update:studentSearch', $event.target.value)"
        />
        <p v-if="isStudentSearching" class="mt-1 text-xs text-ink-muted">{{ SEARCHING_TEXT }}</p>
        <p v-else-if="isNoMatchShown" class="mt-1 text-xs text-ink-muted">{{ NO_STUDENT_MATCH_TEXT }}</p>
        <ul
          v-if="studentOptions.length > 0"
          role="listbox"
          :aria-label="STUDENT_LIST_LABEL"
          class="mt-2 max-h-48 divide-y divide-line overflow-y-auto rounded-md border border-line"
        >
          <li v-for="student in studentOptions" :key="student.id" role="option" :aria-selected="false">
            <button
              type="button"
              class="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-inset"
              @click="emit('pick-student', student)"
            >
              <span class="text-sm font-semibold text-ink">{{ formatEnrollmentStudentName(student) }}</span>
              <span class="flex gap-3 text-xs text-ink-muted">
                <span class="font-mono tabular-nums">{{ student.lrn }}</span>
                <span>{{ formatCurrentEnrollment(student) }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
      <p v-if="getFieldError(STUDENT_FIELD)" :id="getErrorId(STUDENT_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(STUDENT_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(SECTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.section_id }}
      </label>
      <select
        :id="getFieldId(SECTION_FIELD)"
        :value="modelValue[SECTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(SECTION_FIELD))"
        :aria-describedby="getDescribedBy(SECTION_FIELD)"
        @change="updateField(SECTION_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option
          v-for="sectionOption in sectionOptions"
          :key="sectionOption.id"
          :value="String(sectionOption.id)"
          :disabled="sectionOption.isFull"
        >
          {{ sectionOption.label }}
        </option>
      </select>
      <p v-if="getFieldError(SECTION_FIELD)" :id="getErrorId(SECTION_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(SECTION_FIELD) }}
      </p>
    </div>

    <div v-if="isTermVisible">
      <label :for="getFieldId(TERM_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.term_id }}
      </label>
      <select
        :id="getFieldId(TERM_FIELD)"
        :value="modelValue[TERM_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(TERM_FIELD))"
        :aria-describedby="getDescribedBy(TERM_FIELD)"
        @change="updateField(TERM_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="term in terms" :key="term.id" :value="String(term.id)">{{ term.label }}</option>
      </select>
      <p v-if="getFieldError(TERM_FIELD)" :id="getErrorId(TERM_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(TERM_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(ENROLLED_AT_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.enrolled_at }}
      </label>
      <input
        :id="getFieldId(ENROLLED_AT_FIELD)"
        type="date"
        :value="modelValue[ENROLLED_AT_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(ENROLLED_AT_FIELD))"
        :aria-describedby="getDescribedBy(ENROLLED_AT_FIELD)"
        @input="updateField(ENROLLED_AT_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(ENROLLED_AT_FIELD)" :id="getErrorId(ENROLLED_AT_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(ENROLLED_AT_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(REMARKS_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ ENROLLMENT_FIELD_LABELS.remarks + OPTIONAL_SUFFIX }}
      </label>
      <textarea
        :id="getFieldId(REMARKS_FIELD)"
        :rows="REMARKS_ROWS"
        :maxlength="ENROLLMENT_REMARKS_MAX_LENGTH"
        :value="modelValue[REMARKS_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(REMARKS_FIELD))"
        :aria-describedby="getDescribedBy(REMARKS_FIELD)"
        @input="updateField(REMARKS_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(REMARKS_FIELD)" :id="getErrorId(REMARKS_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(REMARKS_FIELD) }}
      </p>
    </div>
  </div>
</template>
