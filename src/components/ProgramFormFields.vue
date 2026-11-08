<script setup>
import {
  PROGRAM_CODE_MAX_LENGTH,
  PROGRAM_DESCRIPTION_MAX_LENGTH,
  PROGRAM_FIELD_LABELS,
  PROGRAM_STAGE_OPTIONS,
} from '@/utils/programForm.js'
import { TEXT_MAX_LENGTH } from '@/utils/studentForm.js'

const CODE_FIELD = 'code'
const NAME_FIELD = 'name'
const STAGE_FIELD = 'stage'
const DESCRIPTION_FIELD = 'description'
const FIELD_ID_PREFIX = 'program-'
const OPTIONAL_SUFFIX = ' (optional)'
const SELECT_PLACEHOLDER = 'Select…'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
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
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="getFieldId(CODE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ PROGRAM_FIELD_LABELS.code }}
        </label>
        <input
          :id="getFieldId(CODE_FIELD)"
          type="text"
          autocomplete="off"
          :maxlength="PROGRAM_CODE_MAX_LENGTH"
          :value="modelValue[CODE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(CODE_FIELD))"
          :aria-describedby="getDescribedBy(CODE_FIELD)"
          @input="updateField(CODE_FIELD, $event.target.value)"
        />
        <p v-if="getFieldError(CODE_FIELD)" :id="getErrorId(CODE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(CODE_FIELD) }}
        </p>
      </div>
      <div>
        <label :for="getFieldId(STAGE_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
          {{ PROGRAM_FIELD_LABELS.stage }}
        </label>
        <select
          :id="getFieldId(STAGE_FIELD)"
          :value="modelValue[STAGE_FIELD]"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError(STAGE_FIELD))"
          :aria-describedby="getDescribedBy(STAGE_FIELD)"
          @change="updateField(STAGE_FIELD, $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="stageOption in PROGRAM_STAGE_OPTIONS" :key="stageOption.value" :value="stageOption.value">
            {{ stageOption.label }}
          </option>
        </select>
        <p v-if="getFieldError(STAGE_FIELD)" :id="getErrorId(STAGE_FIELD)" class="mt-1 text-xs text-red-700">
          {{ getFieldError(STAGE_FIELD) }}
        </p>
      </div>
    </div>

    <div>
      <label :for="getFieldId(NAME_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ PROGRAM_FIELD_LABELS.name }}
      </label>
      <input
        :id="getFieldId(NAME_FIELD)"
        type="text"
        autocomplete="off"
        :maxlength="TEXT_MAX_LENGTH"
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

    <div>
      <label :for="getFieldId(DESCRIPTION_FIELD)" class="mb-1 block text-sm font-semibold text-ink">
        {{ PROGRAM_FIELD_LABELS.description + OPTIONAL_SUFFIX }}
      </label>
      <textarea
        :id="getFieldId(DESCRIPTION_FIELD)"
        rows="3"
        :maxlength="PROGRAM_DESCRIPTION_MAX_LENGTH"
        :value="modelValue[DESCRIPTION_FIELD]"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError(DESCRIPTION_FIELD))"
        :aria-describedby="getDescribedBy(DESCRIPTION_FIELD)"
        @input="updateField(DESCRIPTION_FIELD, $event.target.value)"
      />
      <p v-if="getFieldError(DESCRIPTION_FIELD)" :id="getErrorId(DESCRIPTION_FIELD)" class="mt-1 text-xs text-red-700">
        {{ getFieldError(DESCRIPTION_FIELD) }}
      </p>
    </div>
  </div>
</template>
