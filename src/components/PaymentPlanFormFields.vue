<script setup>
import {
  PAYMENT_PLAN_DESCRIPTION_MAX_LENGTH,
  PAYMENT_PLAN_NAME_MAX_LENGTH,
  VALUE_TYPE_OPTIONS,
  VALUE_TYPE_PERCENT,
  listAdjustmentKindOptions,
} from '@/utils/paymentPlanForm.js'

const FIELD_ID_PREFIX = 'payment-plan-'
const SELECT_PLACEHOLDER = 'Select…'
const NONE_LABEL = 'None'
const VALUE_MAX_LENGTH = 16
const ADJUSTMENT_NOTE = 'Applies to the tuition fees of the schedule only.'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  schoolYearLabel: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

function updateField(fieldKey, fieldValue) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: fieldValue })
}

function getFieldError(errorKey, fallbackKey) {
  const fieldErrors = props.fieldErrors[errorKey] ?? props.fieldErrors[fallbackKey]
  return fieldErrors?.[0] ?? ''
}

function getFieldId(fieldKey) {
  return FIELD_ID_PREFIX + fieldKey.replaceAll('_', '-')
}

function getErrorId(fieldKey) {
  return `${getFieldId(fieldKey)}-error`
}

function getDescribedBy(fieldKey, errorKey, fallbackKey) {
  return getFieldError(errorKey, fallbackKey) ? getErrorId(fieldKey) : undefined
}

function getValuePlaceholder(valueType) {
  return valueType === VALUE_TYPE_PERCENT ? '0' : '0.00'
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink">School year: <span class="font-semibold">{{ schoolYearLabel }}</span></p>

    <div>
      <label :for="getFieldId('name')" class="mb-1 block text-sm font-semibold text-ink">Name</label>
      <input
        :id="getFieldId('name')"
        type="text"
        autocomplete="off"
        :maxlength="PAYMENT_PLAN_NAME_MAX_LENGTH"
        :value="modelValue.name"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('name'))"
        :aria-describedby="getDescribedBy('name', 'name')"
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
        :maxlength="PAYMENT_PLAN_DESCRIPTION_MAX_LENGTH"
        :value="modelValue.description"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('description'))"
        :aria-describedby="getDescribedBy('description', 'description')"
        @input="updateField('description', $event.target.value)"
      ></textarea>
      <p v-if="getFieldError('description')" :id="getErrorId('description')" class="mt-1 text-xs text-red-700">
        {{ getFieldError('description') }}
      </p>
    </div>

    <slot name="due-dates" />

    <fieldset v-if="modelValue.due_dates.length > 0" class="space-y-3">
      <legend class="mb-1 text-sm font-semibold text-ink">Down payment</legend>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label :for="getFieldId('down_payment_type')" class="mb-1 block text-xs font-semibold text-ink-muted">Type</label>
          <select
            :id="getFieldId('down_payment_type')"
            :value="modelValue.down_payment_type"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError('down_payment.type', 'down_payment'))"
            :aria-describedby="getDescribedBy('down_payment_type', 'down_payment.type', 'down_payment')"
            @change="updateField('down_payment_type', $event.target.value)"
          >
            <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
            <option v-for="option in VALUE_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <p
            v-if="getFieldError('down_payment.type', 'down_payment')"
            :id="getErrorId('down_payment_type')"
            class="mt-1 text-xs text-red-700"
          >
            {{ getFieldError('down_payment.type', 'down_payment') }}
          </p>
        </div>
        <div>
          <label :for="getFieldId('down_payment_value')" class="mb-1 block text-xs font-semibold text-ink-muted">Value</label>
          <div class="flex items-center gap-2">
            <input
              :id="getFieldId('down_payment_value')"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :maxlength="VALUE_MAX_LENGTH"
              :placeholder="getValuePlaceholder(modelValue.down_payment_type)"
              :value="modelValue.down_payment_value"
              :class="INPUT_CLASS"
              class="text-right tabular-nums"
              :disabled="isDisabled"
              :aria-invalid="Boolean(getFieldError('down_payment.value'))"
              :aria-describedby="getDescribedBy('down_payment_value', 'down_payment.value')"
              @input="updateField('down_payment_value', $event.target.value)"
            />
            <span v-if="modelValue.down_payment_type === VALUE_TYPE_PERCENT" class="text-sm text-ink-muted">%</span>
          </div>
          <p v-if="getFieldError('down_payment.value')" :id="getErrorId('down_payment_value')" class="mt-1 text-xs text-red-700">
            {{ getFieldError('down_payment.value') }}
          </p>
        </div>
      </div>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="mb-1 text-sm font-semibold text-ink">Adjustment</legend>
      <div>
        <label :for="getFieldId('adjustment_kind')" class="mb-1 block text-xs font-semibold text-ink-muted">Kind</label>
        <select
          :id="getFieldId('adjustment_kind')"
          :value="modelValue.adjustment_kind"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getFieldError('adjustment.kind', 'adjustment'))"
          :aria-describedby="getDescribedBy('adjustment_kind', 'adjustment.kind', 'adjustment')"
          @change="updateField('adjustment_kind', $event.target.value)"
        >
          <option value="">{{ NONE_LABEL }}</option>
          <option v-for="option in listAdjustmentKindOptions(modelValue.due_dates.length)" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <p v-if="getFieldError('adjustment.kind', 'adjustment')" :id="getErrorId('adjustment_kind')" class="mt-1 text-xs text-red-700">
          {{ getFieldError('adjustment.kind', 'adjustment') }}
        </p>
      </div>
      <div v-if="modelValue.adjustment_kind !== ''" class="grid gap-3 sm:grid-cols-2">
        <div>
          <label :for="getFieldId('adjustment_type')" class="mb-1 block text-xs font-semibold text-ink-muted">Type</label>
          <select
            :id="getFieldId('adjustment_type')"
            :value="modelValue.adjustment_type"
            :class="INPUT_CLASS"
            :disabled="isDisabled"
            :aria-invalid="Boolean(getFieldError('adjustment.type'))"
            :aria-describedby="getDescribedBy('adjustment_type', 'adjustment.type')"
            @change="updateField('adjustment_type', $event.target.value)"
          >
            <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
            <option v-for="option in VALUE_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <p v-if="getFieldError('adjustment.type')" :id="getErrorId('adjustment_type')" class="mt-1 text-xs text-red-700">
            {{ getFieldError('adjustment.type') }}
          </p>
        </div>
        <div>
          <label :for="getFieldId('adjustment_value')" class="mb-1 block text-xs font-semibold text-ink-muted">Value</label>
          <div class="flex items-center gap-2">
            <input
              :id="getFieldId('adjustment_value')"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :maxlength="VALUE_MAX_LENGTH"
              :placeholder="getValuePlaceholder(modelValue.adjustment_type)"
              :value="modelValue.adjustment_value"
              :class="INPUT_CLASS"
              class="text-right tabular-nums"
              :disabled="isDisabled"
              :aria-invalid="Boolean(getFieldError('adjustment.value'))"
              :aria-describedby="getDescribedBy('adjustment_value', 'adjustment.value')"
              @input="updateField('adjustment_value', $event.target.value)"
            />
            <span v-if="modelValue.adjustment_type === VALUE_TYPE_PERCENT" class="text-sm text-ink-muted">%</span>
          </div>
          <p v-if="getFieldError('adjustment.value')" :id="getErrorId('adjustment_value')" class="mt-1 text-xs text-red-700">
            {{ getFieldError('adjustment.value') }}
          </p>
        </div>
      </div>
      <p class="text-xs text-ink-muted">{{ ADJUSTMENT_NOTE }}</p>
    </fieldset>
  </div>
</template>
