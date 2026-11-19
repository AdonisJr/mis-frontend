<script setup>
import { computed } from 'vue'
import { formatAssessmentGradeLevel } from '@/utils/assessmentDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const STUDENT_FIELD = 'student_id'
const PLAN_FIELD = 'payment_plan_id'
const FIELD_ID_PREFIX = 'assessment-'
const STUDENT_SEARCH_ID = 'assessment-student-search'
const STUDENT_LABEL = 'Student'
const PLAN_LABEL = 'Payment plan'
const SCHOOL_YEAR_LABEL_PREFIX = 'School year: '
const STUDENT_LIST_LABEL = 'Matching students'
const SELECT_PLACEHOLDER = 'Select…'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const SEARCHING_TEXT = 'Searching…'
const NO_STUDENT_MATCH_TEXT = 'No students left to assess match.'
const MORE_STUDENTS_TEXT = 'More students match. Type more of the name or the LRN.'
const NO_PLAN_TEXT = 'No active payment plan in this school year.'
const CHANGE_STUDENT_LABEL = 'Change'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  isReassess: { type: Boolean, default: false },
  schoolYearLabel: { type: String, default: '' },
  lockedStudent: { type: Object, default: null },
  studentSearch: { type: String, default: '' },
  candidates: { type: Array, default: () => [] },
  isCandidateSearching: { type: Boolean, default: false },
  hasMoreCandidates: { type: Boolean, default: false },
  pickedCandidate: { type: Object, default: null },
  planOptions: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'update:studentSearch', 'pick-candidate', 'clear-candidate'])

const isNoMatchShown = computed(
  () => props.studentSearch.trim() !== '' && !props.isCandidateSearching && props.candidates.length === 0,
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
    <p class="text-sm text-ink-muted">{{ SCHOOL_YEAR_LABEL_PREFIX }}<span class="font-semibold text-ink">{{ schoolYearLabel }}</span></p>

    <div>
      <span :id="`${getFieldId(STUDENT_FIELD)}-label`" class="mb-1 block text-sm font-semibold text-ink">
        {{ STUDENT_LABEL }}
      </span>
      <div
        v-if="isReassess || pickedCandidate"
        class="flex items-center justify-between gap-3 rounded-md border border-line bg-page px-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-ink">
            {{ formatEnrollmentStudentName(isReassess ? lockedStudent : pickedCandidate) }}
          </p>
          <p class="text-xs text-ink-muted">
            <span class="font-mono tabular-nums">{{ (isReassess ? lockedStudent : pickedCandidate)?.lrn }}</span>
            <span v-if="!isReassess"> · {{ formatAssessmentGradeLevel(pickedCandidate) }}</span>
          </p>
        </div>
        <button
          v-if="!isReassess"
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          :disabled="isDisabled"
          @click="emit('clear-candidate')"
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
        <p v-if="isCandidateSearching" class="mt-1 text-xs text-ink-muted">{{ SEARCHING_TEXT }}</p>
        <p v-else-if="isNoMatchShown" class="mt-1 text-xs text-ink-muted">{{ NO_STUDENT_MATCH_TEXT }}</p>
        <ul
          v-if="candidates.length > 0"
          role="listbox"
          :aria-label="STUDENT_LIST_LABEL"
          class="mt-2 max-h-48 divide-y divide-line overflow-y-auto rounded-md border border-line"
        >
          <li v-for="candidate in candidates" :key="candidate.id" role="option" :aria-selected="false">
            <button
              type="button"
              class="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-inset"
              @click="emit('pick-candidate', candidate)"
            >
              <span class="text-sm font-semibold text-ink">{{ formatEnrollmentStudentName(candidate) }}</span>
              <span class="flex gap-3 text-xs text-ink-muted">
                <span class="font-mono tabular-nums">{{ candidate.lrn }}</span>
                <span>{{ formatAssessmentGradeLevel(candidate) }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-if="hasMoreCandidates" class="mt-1 text-xs text-ink-muted">{{ MORE_STUDENTS_TEXT }}</p>
      </div>
      <p v-if="getFieldError(STUDENT_FIELD)" :id="getErrorId(STUDENT_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(STUDENT_FIELD) }}
      </p>
    </div>

    <div>
      <label :for="getFieldId(PLAN_FIELD)" class="mb-1 block text-sm font-semibold text-ink">{{ PLAN_LABEL }}</label>
      <select
        :id="getFieldId(PLAN_FIELD)"
        :value="modelValue[PLAN_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(PLAN_FIELD))"
        :aria-describedby="getDescribedBy(PLAN_FIELD)"
        @change="updateField(PLAN_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="planOption in planOptions" :key="planOption.id" :value="String(planOption.id)">
          {{ planOption.name }}
        </option>
      </select>
      <p v-if="planOptions.length === 0" class="mt-1 text-xs text-ink-muted">{{ NO_PLAN_TEXT }}</p>
      <p v-if="getFieldError(PLAN_FIELD)" :id="getErrorId(PLAN_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(PLAN_FIELD) }}
      </p>
    </div>
  </div>
</template>
