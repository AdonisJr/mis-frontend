<script setup>
import { buildSeatsLeftText } from '@/utils/enrollmentRollover.js'

const SECTION_FIELD = 'section_id'
const TERM_FIELD = 'term_id'
const FIELD_ID_PREFIX = 'enrollment-rollover-'
const SECTION_LABEL = 'Section'
const TERM_LABEL = 'Source term'
const SELECT_PLACEHOLDER = 'Select…'
const NO_SECTION_TEXT = 'No SHS or college sections in this school year.'
const LOADING_TEXT = 'Loading students…'
const NO_STUDENTS_TEXT = 'No enrolled students in this section for this term.'
const NO_TARGET_TEXT = 'None'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const CHECKBOX_CLASS =
  'mt-0.5 size-4 rounded border-line accent-accent focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed'

const props = defineProps({
  modelValue: { type: Object, required: true },
  sectionOptions: { type: Array, required: true },
  terms: { type: Array, required: true },
  preview: { type: Object, default: null },
  isPreviewLoading: { type: Boolean, default: false },
  selectedIds: { type: Array, required: true },
  blockReason: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'toggle-student'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label :for="getFieldId(SECTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">{{ SECTION_LABEL }}</label>
      <select
        :id="getFieldId(SECTION_FIELD)"
        :value="modelValue[SECTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled || sectionOptions.length === 0"
        @change="updateField(SECTION_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="sectionOption in sectionOptions" :key="sectionOption.id" :value="String(sectionOption.id)">
          {{ sectionOption.label }}
        </option>
      </select>
      <p v-if="sectionOptions.length === 0" class="mt-1 text-xs text-ink-muted">{{ NO_SECTION_TEXT }}</p>
    </div>

    <div>
      <label :for="getFieldId(TERM_FIELD)" class="mb-1 block text-sm font-semibold text-ink">{{ TERM_LABEL }}</label>
      <select
        :id="getFieldId(TERM_FIELD)"
        :value="modelValue[TERM_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        @change="updateField(TERM_FIELD, $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="term in terms" :key="term.id" :value="String(term.id)">{{ term.label }}</option>
      </select>
    </div>

    <p v-if="isPreviewLoading" class="text-sm text-ink-muted">{{ LOADING_TEXT }}</p>

    <template v-if="preview !== null">
      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt class="text-xs uppercase tracking-wider text-ink-muted">Next term</dt>
          <dd class="font-semibold text-ink">{{ preview.targetTerm?.label ?? NO_TARGET_TEXT }}</dd>
        </div>
        <div v-if="preview.targetTerm !== null">
          <dt class="text-xs uppercase tracking-wider text-ink-muted">Seats left</dt>
          <dd class="font-semibold tabular-nums text-ink">{{ buildSeatsLeftText(preview.seatsLeft) }}</dd>
        </div>
      </dl>

      <p v-if="blockReason !== ''" role="alert" class="text-xs text-red-700">{{ blockReason }}</p>

      <fieldset>
        <legend class="mb-1 text-sm font-semibold text-ink">Students ({{ selectedIds.length }} ticked)</legend>
        <p v-if="preview.rows.length === 0" class="text-sm text-ink-muted">{{ NO_STUDENTS_TEXT }}</p>
        <div v-else class="max-h-72 overflow-y-auto rounded-md border border-line px-3">
          <label v-for="row in preview.rows" :key="row.id" class="flex items-start gap-2 py-1.5 text-sm">
            <input
              type="checkbox"
              :class="CHECKBOX_CLASS"
              :checked="selectedIds.includes(row.id)"
              :disabled="row.isLocked || isDisabled"
              @change="emit('toggle-student', row)"
            />
            <span class="min-w-0">
              <span class="block font-semibold text-ink">{{ row.studentName }}</span>
              <span class="block font-mono text-xs tabular-nums text-ink-muted">{{ row.lrn }}</span>
              <span v-if="row.isLocked" class="block text-xs text-ink-muted">{{ row.lockReason }}</span>
            </span>
          </label>
        </div>
      </fieldset>
    </template>
  </div>
</template>
