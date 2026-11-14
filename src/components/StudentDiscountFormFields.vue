<script setup>
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { buildDiscountTypeOptionLabel } from '@/utils/discountDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { REFERENCE_NO_MAX_LENGTH, REMARKS_MAX_LENGTH } from '@/utils/studentDiscountForm.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const FIELD_ID_PREFIX = 'student-discount-'
const STUDENT_SEARCH_ID = 'student-discount-student-search'
const STUDENT_LIST_LABEL = 'Matching students'
const SELECT_PLACEHOLDER = 'Select…'
const OPTIONAL_SUFFIX = ' (optional)'
const SEARCH_PLACEHOLDER = 'Student name or LRN'
const SEARCHING_TEXT = 'Searching…'
const NO_STUDENT_MATCH_TEXT = 'No enrolled or completed students match.'
const MORE_STUDENTS_TEXT = 'More students match. Type more of the name or the LRN.'
const NO_TYPE_TEXT = "No active discount type applies to this student's stage."
const CLEAR_STUDENT_LABEL = 'Clear student'
const NO_GRADE_LEVEL_TEXT = '—'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  isEditing: { type: Boolean, default: false },
  schoolYearLabel: { type: String, required: true },
  studentSearch: { type: String, required: true },
  candidates: { type: Array, required: true },
  isCandidateSearching: { type: Boolean, default: false },
  hasMoreCandidates: { type: Boolean, default: false },
  pickedCandidate: { type: Object, default: null },
  typeOptions: { type: Array, required: true },
  lockedTypeLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:studentSearch', 'pick-candidate', 'clear-candidate'])

const isNoMatchShown = computed(
  () => props.studentSearch.trim() !== '' && !props.isCandidateSearching && props.candidates.length === 0,
)
const isNoTypeShown = computed(() => props.pickedCandidate !== null && props.typeOptions.length === 0)

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldError(fieldKey) {
  return props.fieldErrors[fieldKey]?.[0] ?? ''
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey.replaceAll('_', '-')
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getDescribedBy(fieldKey) {
  return getFieldError(fieldKey) ? getErrorId(fieldKey) : undefined
}

function getGradeLevelName(candidate) {
  return candidate?.gradeLevel?.name ?? NO_GRADE_LEVEL_TEXT
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink">School year: <span class="font-semibold">{{ schoolYearLabel }}</span></p>

    <div>
      <span :id="`${getFieldId('student_id')}-label`" class="mb-1 block text-sm font-semibold text-ink">Student</span>
      <div
        v-if="pickedCandidate"
        class="flex items-center justify-between gap-3 rounded-md border border-line bg-page px-3 py-2"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-ink">{{ formatEnrollmentStudentName(pickedCandidate.student) }}</p>
          <p class="text-xs text-ink-muted">
            <span class="font-mono tabular-nums">{{ pickedCandidate.student.lrn }}</span>
            · {{ getGradeLevelName(pickedCandidate) }}
          </p>
        </div>
        <button
          v-if="!isEditing"
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          class="text-ink"
          :aria-label="CLEAR_STUDENT_LABEL"
          :disabled="isDisabled"
          @click="emit('clear-candidate')"
        >
          <X :size="16" aria-hidden="true" />
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
          :aria-labelledby="`${getFieldId('student_id')}-label`"
          :aria-invalid="Boolean(getFieldError('student_id'))"
          :aria-describedby="getDescribedBy('student_id')"
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
          <li v-for="candidate in candidates" :key="candidate.studentId" role="option" :aria-selected="false">
            <button
              type="button"
              class="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-inset"
              @click="emit('pick-candidate', candidate)"
            >
              <span class="text-sm font-semibold text-ink">{{ formatEnrollmentStudentName(candidate.student) }}</span>
              <span class="flex gap-3 text-xs text-ink-muted">
                <span class="font-mono tabular-nums">{{ candidate.student.lrn }}</span>
                <span>{{ getGradeLevelName(candidate) }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-if="hasMoreCandidates" class="mt-1 text-xs text-ink-muted">{{ MORE_STUDENTS_TEXT }}</p>
      </div>
      <p v-if="getFieldError('student_id')" :id="getErrorId('student_id')" class="mt-1 text-xs text-red-700">
        {{ getFieldError('student_id') }}
      </p>
    </div>

    <div v-if="isEditing">
      <span class="mb-1 block text-sm font-semibold text-ink">Discount type</span>
      <p class="text-sm text-ink">{{ lockedTypeLabel }}</p>
    </div>
    <div v-else>
      <label :for="getFieldId('discount_type_id')" class="mb-1 block text-sm font-semibold text-ink">Discount type</label>
      <select
        :id="getFieldId('discount_type_id')"
        :value="modelValue.discount_type_id"
        :class="INPUT_CLASS"
        :disabled="isDisabled || pickedCandidate === null"
        :aria-invalid="Boolean(getFieldError('discount_type_id'))"
        :aria-describedby="getDescribedBy('discount_type_id')"
        @change="updateField('discount_type_id', $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="discountType in typeOptions" :key="discountType.id" :value="String(discountType.id)">
          {{ buildDiscountTypeOptionLabel(discountType) }}
        </option>
      </select>
      <p v-if="isNoTypeShown" class="mt-1 text-xs text-ink-muted">{{ NO_TYPE_TEXT }}</p>
      <p
        v-if="getFieldError('discount_type_id')"
        :id="getErrorId('discount_type_id')"
        class="mt-1 text-xs text-red-700"
      >
        {{ getFieldError('discount_type_id') }}
      </p>
    </div>

    <div>
      <label :for="getFieldId('reference_no')" class="mb-1 block text-sm font-semibold text-ink">
        Reference no.<span class="font-normal text-ink-muted">{{ OPTIONAL_SUFFIX }}</span>
      </label>
      <input
        :id="getFieldId('reference_no')"
        type="text"
        autocomplete="off"
        :maxlength="REFERENCE_NO_MAX_LENGTH"
        :value="modelValue.reference_no"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('reference_no'))"
        :aria-describedby="getDescribedBy('reference_no')"
        @input="updateField('reference_no', $event.target.value)"
      />
      <p v-if="getFieldError('reference_no')" :id="getErrorId('reference_no')" class="mt-1 text-xs text-red-700">
        {{ getFieldError('reference_no') }}
      </p>
    </div>

    <div>
      <label :for="getFieldId('remarks')" class="mb-1 block text-sm font-semibold text-ink">
        Remarks<span class="font-normal text-ink-muted">{{ OPTIONAL_SUFFIX }}</span>
      </label>
      <textarea
        :id="getFieldId('remarks')"
        rows="3"
        :maxlength="REMARKS_MAX_LENGTH"
        :value="modelValue.remarks"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('remarks'))"
        :aria-describedby="getDescribedBy('remarks')"
        @input="updateField('remarks', $event.target.value)"
      ></textarea>
      <p v-if="getFieldError('remarks')" :id="getErrorId('remarks')" class="mt-1 text-xs text-red-700">
        {{ getFieldError('remarks') }}
      </p>
    </div>
  </div>
</template>
