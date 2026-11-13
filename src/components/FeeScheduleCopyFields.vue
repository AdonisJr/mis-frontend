<script setup>
const SOURCE_FIELD_ID = 'fee-schedule-copy-source'
const SOURCE_ERROR_ID = 'fee-schedule-copy-source-error'
const SELECT_PLACEHOLDER = 'Select…'
const NO_OTHER_YEAR_LABEL = 'No other school year.'
const COPY_NOTE = 'Existing schedules in the target are skipped. Inactive fee items are left out.'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  sourceSchoolYearId: { type: String, required: true },
  sourceOptions: { type: Array, required: true },
  targetLabel: { type: String, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:sourceSchoolYearId'])

function getSourceError() {
  const sourceErrors = props.fieldErrors.source_school_year_id ?? props.fieldErrors.target_school_year_id
  return sourceErrors?.[0] ?? ''
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink">Copy into: <span class="font-semibold">{{ targetLabel }}</span></p>
    <div>
      <label :for="SOURCE_FIELD_ID" class="mb-1 block text-sm font-semibold text-ink">Source school year</label>
      <select
        :id="SOURCE_FIELD_ID"
        :value="sourceSchoolYearId"
        :class="INPUT_CLASS"
        :disabled="isDisabled || sourceOptions.length === 0"
        :aria-invalid="Boolean(getSourceError())"
        :aria-describedby="getSourceError() ? SOURCE_ERROR_ID : undefined"
        @change="emit('update:sourceSchoolYearId', $event.target.value)"
      >
        <option value="" disabled>{{ sourceOptions.length === 0 ? NO_OTHER_YEAR_LABEL : SELECT_PLACEHOLDER }}</option>
        <option v-for="schoolYear in sourceOptions" :key="schoolYear.id" :value="String(schoolYear.id)">
          {{ schoolYear.name }}
        </option>
      </select>
      <p v-if="getSourceError()" :id="SOURCE_ERROR_ID" class="mt-1 text-xs text-red-700">{{ getSourceError() }}</p>
    </div>
    <p class="text-xs text-ink-muted">{{ COPY_NOTE }}</p>
  </div>
</template>
