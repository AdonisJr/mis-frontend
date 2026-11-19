<script setup>
import {
  DISCOUNT_BASE_OPTIONS,
  DISCOUNT_SOURCE_OPTIONS,
  DISCOUNT_STAGE_OPTIONS,
  DISCOUNT_TYPE_DESCRIPTION_MAX_LENGTH,
  DISCOUNT_TYPE_NAME_MAX_LENGTH,
  toggleDiscountStage,
} from '@/utils/discountTypeForm.js'
import { VALUE_TYPE_FIXED, VALUE_TYPE_OPTIONS, VALUE_TYPE_PERCENT } from '@/utils/paymentPlanForm.js'

const FIELD_ID_PREFIX = 'discount-type-'
const SELECT_PLACEHOLDER = 'Select…'
const VALUE_MAX_LENGTH = 16
const BASE_HINT = 'Tuition = the tuition fees of the schedule; Total = every fee category.'
const STAGES_HINT = 'At least one.'
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

function getStagesError() {
  const stageErrors = props.fieldErrors.stages ?? props.fieldErrors['stages.0'] ?? props.fieldErrors['stages.1']
  return stageErrors?.[0] ?? ''
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

function getValuePlaceholder() {
  return props.modelValue.value_type === VALUE_TYPE_PERCENT ? '0' : '0.00'
}

function toggleStage(stage) {
  updateField('stages', toggleDiscountStage(props.modelValue.stages, stage))
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label :for="getFieldId('name')" class="mb-1 block text-sm font-semibold text-ink">Name</label>
      <input
        :id="getFieldId('name')"
        type="text"
        autocomplete="off"
        :maxlength="DISCOUNT_TYPE_NAME_MAX_LENGTH"
        :value="modelValue.name"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('name'))"
        :aria-describedby="getDescribedBy('name')"
        @input="updateField('name', $event.target.value)"
      />
      <p v-if="getFieldError('name')" :id="getErrorId('name')" class="mt-1 text-xs text-red-700">{{ getFieldError('name') }}</p>
    </div>

    <div>
      <label :for="getFieldId('description')" class="mb-1 block text-sm font-semibold text-ink">
        Description <span class="font-normal text-ink-muted">(optional)</span>
      </label>
      <textarea
        :id="getFieldId('description')"
        rows="2"
        :maxlength="DISCOUNT_TYPE_DESCRIPTION_MAX_LENGTH"
        :value="modelValue.description"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('description'))"
        :aria-describedby="getDescribedBy('description')"
        @input="updateField('description', $event.target.value)"
      ></textarea>
      <p v-if="getFieldError('description')" :id="getErrorId('description')" class="mt-1 text-xs text-red-700">
        {{ getFieldError('description') }}
      </p>
    </div>

    <div>
      <label :for="getFieldId('source')" class="mb-1 block text-sm font-semibold text-ink">Source</label>
      <select
        :id="getFieldId('source')"
        :value="modelValue.source"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('source'))"
        :aria-describedby="getDescribedBy('source')"
        @change="updateField('source', $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="option in DISCOUNT_SOURCE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <p v-if="getFieldError('source')" :id="getErrorId('source')" class="mt-1 text-xs text-red-700">{{ getFieldError('source') }}</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label :for="getFieldId('value_type')" class="mb-1 block text-sm font-semibold text-ink">Value type</label>
        <select
          :id="getFieldId('value_type')"
          :value="modelValue.value_type"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError('value_type'))"
          :aria-describedby="getDescribedBy('value_type')"
          @change="updateField('value_type', $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="option in VALUE_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <p v-if="getFieldError('value_type')" :id="getErrorId('value_type')" class="mt-1 text-xs text-red-700">
          {{ getFieldError('value_type') }}
        </p>
      </div>
      <div>
        <label :for="getFieldId('value')" class="mb-1 block text-sm font-semibold text-ink">Value</label>
        <div class="flex items-center gap-2">
          <span v-if="modelValue.value_type === VALUE_TYPE_FIXED" class="text-sm text-ink-muted">₱</span>
          <input
            :id="getFieldId('value')"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :maxlength="VALUE_MAX_LENGTH"
            :placeholder="getValuePlaceholder()"
            :value="modelValue.value"
            :class="INPUT_CLASS"
            class="text-right tabular-nums"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError('value'))"
            :aria-describedby="getDescribedBy('value')"
            @input="updateField('value', $event.target.value)"
          />
          <span v-if="modelValue.value_type === VALUE_TYPE_PERCENT" class="text-sm text-ink-muted">%</span>
        </div>
        <p v-if="getFieldError('value')" :id="getErrorId('value')" class="mt-1 text-xs text-red-700">{{ getFieldError('value') }}</p>
      </div>
    </div>

    <div>
      <label :for="getFieldId('base')" class="mb-1 block text-sm font-semibold text-ink">Base</label>
      <select
        :id="getFieldId('base')"
        :value="modelValue.base"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('base'))"
        :aria-describedby="getDescribedBy('base')"
        @change="updateField('base', $event.target.value)"
      >
        <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
        <option v-for="option in DISCOUNT_BASE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <p class="mt-1 text-xs text-ink-muted">{{ BASE_HINT }}</p>
      <p v-if="getFieldError('base')" :id="getErrorId('base')" class="mt-1 text-xs text-red-700">{{ getFieldError('base') }}</p>
    </div>

    <fieldset :aria-describedby="getStagesError() ? getErrorId('stages') : undefined">
      <legend class="mb-1 text-sm font-semibold text-ink">Stages</legend>
      <div class="flex gap-4">
        <label v-for="option in DISCOUNT_STAGE_OPTIONS" :key="option.value" class="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            :checked="modelValue.stages.includes(option.value)"
            :disabled="isDisabled"
            class="size-4 rounded border-line text-accent focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
            @change="toggleStage(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
      <p class="mt-1 text-xs text-ink-muted">{{ STAGES_HINT }}</p>
      <p v-if="getStagesError()" :id="getErrorId('stages')" class="mt-1 text-xs text-red-700">{{ getStagesError() }}</p>
    </fieldset>
  </div>
</template>
