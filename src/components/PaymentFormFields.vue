<script setup>
import { computed } from 'vue'
import {
  PAYMENT_METHODS,
  PAYMENT_REFERENCE_MAX_LENGTH,
  PAYMENT_REMARKS_MAX_LENGTH,
  isReferenceRequired,
} from '@/utils/paymentForm.js'

const FIELD_ID_PREFIX = 'payment-'
const AMOUNT_LABEL = 'Amount'
const DATE_LABEL = 'Payment date'
const METHOD_LABEL = 'Method'
const REFERENCE_LABEL = 'Reference no.'
const OPTIONAL_SUFFIX = ' (optional)'
const REMARKS_LABEL = 'Remarks (optional)'
const BALANCE_HINT_PREFIX = 'Balance: '
const LABEL_CLASS = 'mb-1 block text-sm font-semibold text-ink'
const ERROR_CLASS = 'mt-1 text-xs text-red-700'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'

const props = defineProps({
  modelValue: { type: Object, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  balanceText: { type: String, default: '' },
  maxDate: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const referenceLabel = computed(() => {
  const isOptional = !isReferenceRequired(props.modelValue.method)
  return isOptional ? REFERENCE_LABEL + OPTIONAL_SUFFIX : REFERENCE_LABEL
})

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
      <label :for="getFieldId('amount')" :class="LABEL_CLASS">{{ AMOUNT_LABEL }}</label>
      <input
        :id="getFieldId('amount')"
        type="text"
        inputmode="decimal"
        :value="modelValue.amount"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('amount'))"
        :aria-describedby="getDescribedBy('amount')"
        @input="updateField('amount', $event.target.value)"
      />
      <p v-if="balanceText" class="mt-1 text-xs text-ink-muted">{{ BALANCE_HINT_PREFIX }}{{ balanceText }}</p>
      <p v-if="getFieldError('amount')" :id="getErrorId('amount')" :class="ERROR_CLASS">
        {{ getFieldError('amount') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('payment_date')" :class="LABEL_CLASS">{{ DATE_LABEL }}</label>
      <input
        :id="getFieldId('payment_date')"
        type="date"
        :value="modelValue.payment_date"
        :max="maxDate || undefined"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('payment_date'))"
        :aria-describedby="getDescribedBy('payment_date')"
        @input="updateField('payment_date', $event.target.value)"
      />
      <p v-if="getFieldError('payment_date')" :id="getErrorId('payment_date')" :class="ERROR_CLASS">
        {{ getFieldError('payment_date') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('method')" :class="LABEL_CLASS">{{ METHOD_LABEL }}</label>
      <select
        :id="getFieldId('method')"
        :value="modelValue.method"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('method'))"
        :aria-describedby="getDescribedBy('method')"
        @change="updateField('method', $event.target.value)"
      >
        <option v-for="paymentMethod in PAYMENT_METHODS" :key="paymentMethod.value" :value="paymentMethod.value">
          {{ paymentMethod.label }}
        </option>
      </select>
      <p v-if="getFieldError('method')" :id="getErrorId('method')" :class="ERROR_CLASS">
        {{ getFieldError('method') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('reference_no')" :class="LABEL_CLASS">{{ referenceLabel }}</label>
      <input
        :id="getFieldId('reference_no')"
        type="text"
        :value="modelValue.reference_no"
        :maxlength="PAYMENT_REFERENCE_MAX_LENGTH"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('reference_no'))"
        :aria-describedby="getDescribedBy('reference_no')"
        @input="updateField('reference_no', $event.target.value)"
      />
      <p v-if="getFieldError('reference_no')" :id="getErrorId('reference_no')" :class="ERROR_CLASS">
        {{ getFieldError('reference_no') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('remarks')" :class="LABEL_CLASS">{{ REMARKS_LABEL }}</label>
      <textarea
        :id="getFieldId('remarks')"
        rows="3"
        :value="modelValue.remarks"
        :maxlength="PAYMENT_REMARKS_MAX_LENGTH"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('remarks'))"
        :aria-describedby="getDescribedBy('remarks')"
        @input="updateField('remarks', $event.target.value)"
      ></textarea>
      <p v-if="getFieldError('remarks')" :id="getErrorId('remarks')" :class="ERROR_CLASS">
        {{ getFieldError('remarks') }}
      </p>
    </div>
  </div>
</template>
