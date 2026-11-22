<script setup>
import { computed } from 'vue'
import { buildSectionOptionLabel } from '@/utils/scheduleDisplay.js'
import { buildAdviserOptionLabel } from '@/utils/sectionDisplay.js'
import { getFirstFieldError } from '@/utils/sectionForm.js'

const TEACHER_FIELD = 'teacher_id'
const TEACHER_FIELD_ID = 'class-teacher_id'
const TEACHER_ERROR_ID = 'class-teacher_id-error'
const TEACHER_PLACEHOLDER = 'Select a teacher'
const CLASS_SUMMARY_SEPARATOR = ' · '
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  scheduleRow: { type: Object, required: true },
  section: { type: Object, required: true },
  teacherOptions: { type: Array, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const classSummary = computed(() => {
  const subjectText = `${props.scheduleRow.subject.code} ${props.scheduleRow.subject.name}`
  return `${subjectText}${CLASS_SUMMARY_SEPARATOR}${buildSectionOptionLabel(props.section)}`
})
const teacherError = computed(() => getFirstFieldError(props.fieldErrors, TEACHER_FIELD))
const entryError = computed(() => getFirstFieldError(props.fieldErrors, 'curriculum_entry_id'))
const sectionError = computed(() => getFirstFieldError(props.fieldErrors, 'section_id'))

function updateTeacher(teacherId) {
  emit('update:modelValue', { ...props.modelValue, [TEACHER_FIELD]: teacherId })
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm font-semibold text-ink">{{ classSummary }}</p>
      <p v-if="entryError" class="mt-1 text-xs text-red-700">{{ entryError }}</p>
      <p v-if="sectionError" class="mt-1 text-xs text-red-700">{{ sectionError }}</p>
    </div>
    <div>
      <label :for="TEACHER_FIELD_ID" class="mb-1 block text-sm font-semibold text-ink">Teacher</label>
      <select
        :id="TEACHER_FIELD_ID"
        :value="modelValue[TEACHER_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(teacherError)"
        :aria-describedby="teacherError ? TEACHER_ERROR_ID : undefined"
        @change="updateTeacher($event.target.value)"
      >
        <option value="" disabled>{{ TEACHER_PLACEHOLDER }}</option>
        <option v-for="teacher in teacherOptions" :key="teacher.id" :value="String(teacher.id)">
          {{ buildAdviserOptionLabel(teacher) }}
        </option>
      </select>
      <p v-if="teacherError" :id="TEACHER_ERROR_ID" class="mt-1 text-xs text-red-700">{{ teacherError }}</p>
    </div>
  </div>
</template>
