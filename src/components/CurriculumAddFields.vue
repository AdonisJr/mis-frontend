<script setup>
import { buildSubjectOptionLabel } from '@/utils/curriculumDisplay.js'

const SUBJECT_FIELD_ID = 'curriculum-add-subject'
const SUBJECT_ERROR_ID = 'curriculum-add-subject-error'
const LOADING_LABEL = 'Loading…'
const NO_SUBJECTS_LABEL = 'No subjects available for this group.'
const SELECT_PLACEHOLDER = 'Select…'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  subjectId: { type: String, required: true },
  subjectOptions: { type: Array, required: true },
  groupLabel: { type: String, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:subjectId'])

function getSubjectError() {
  return props.fieldErrors.subject_id?.[0] ?? ''
}

function getPlaceholderLabel() {
  if (props.isLoading) return LOADING_LABEL
  if (props.subjectOptions.length === 0) return NO_SUBJECTS_LABEL
  return SELECT_PLACEHOLDER
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink">Add to: <span class="font-semibold">{{ groupLabel }}</span></p>
    <div>
      <label :for="SUBJECT_FIELD_ID" class="mb-1 block text-sm font-semibold text-ink">Subject</label>
      <select
        :id="SUBJECT_FIELD_ID"
        :value="subjectId"
        :class="INPUT_CLASS"
        :disabled="isDisabled || isLoading || subjectOptions.length === 0"
        :aria-invalid="Boolean(getSubjectError())"
        :aria-describedby="getSubjectError() ? SUBJECT_ERROR_ID : undefined"
        @change="emit('update:subjectId', $event.target.value)"
      >
        <option value="" disabled>{{ getPlaceholderLabel() }}</option>
        <option v-for="subject in subjectOptions" :key="subject.id" :value="String(subject.id)">
          {{ buildSubjectOptionLabel(subject) }}
        </option>
      </select>
      <p v-if="getSubjectError()" :id="SUBJECT_ERROR_ID" class="mt-1 text-xs text-red-700">{{ getSubjectError() }}</p>
    </div>
  </div>
</template>
