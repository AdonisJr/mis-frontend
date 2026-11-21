<script setup>
import { computed } from 'vue'
import { formatPeso } from '@/utils/moneyDisplay.js'
import { NOTE_REMARKS_MAX_LENGTH, findBalanceYear } from '@/utils/promissoryNoteForm.js'

const FIELD_ID_PREFIX = 'note-'
const YEAR_LABEL = 'School year'
const AMOUNT_LABEL = 'Promised amount'
const DATE_LABEL = 'Promise date'
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
  balanceYears: { type: Array, required: true },
  minDate: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const isYearLocked = computed(() => props.isDisabled || props.balanceYears.length <= 1)
const balanceHint = computed(() => {
  const balanceYear = findBalanceYear(props.balanceYears, props.modelValue.school_year_id)
  return balanceYear === null ? '' : `${BALANCE_HINT_PREFIX}${formatPeso(balanceYear.balance)}`
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
      <label :for="getFieldId('school_year_id')" :class="LABEL_CLASS">{{ YEAR_LABEL }}</label>
      <select
        :id="getFieldId('school_year_id')"
        :value="modelValue.school_year_id"
        :class="INPUT_CLASS"
        :disabled="isYearLocked"
        :aria-invalid="Boolean(getFieldError('school_year_id'))"
        :aria-describedby="getDescribedBy('school_year_id')"
        @change="updateField('school_year_id', $event.target.value)"
      >
        <option
          v-for="balanceYear in balanceYears"
          :key="balanceYear.school_year.id"
          :value="String(balanceYear.school_year.id)"
        >
          {{ balanceYear.school_year.name }}
        </option>
      </select>
      <p v-if="getFieldError('school_year_id')" :id="getErrorId('school_year_id')" :class="ERROR_CLASS">
        {{ getFieldError('school_year_id') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('promised_amount')" :class="LABEL_CLASS">{{ AMOUNT_LABEL }}</label>
      <input
        :id="getFieldId('promised_amount')"
        type="text"
        inputmode="decimal"
        :value="modelValue.promised_amount"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('promised_amount'))"
        :aria-describedby="getDescribedBy('promised_amount')"
        @input="updateField('promised_amount', $event.target.value)"
      />
      <p v-if="balanceHint" class="mt-1 text-xs text-ink-muted">{{ balanceHint }}</p>
      <p v-if="getFieldError('promised_amount')" :id="getErrorId('promised_amount')" :class="ERROR_CLASS">
        {{ getFieldError('promised_amount') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('promise_date')" :class="LABEL_CLASS">{{ DATE_LABEL }}</label>
      <input
        :id="getFieldId('promise_date')"
        type="date"
        :value="modelValue.promise_date"
        :min="minDate || undefined"
        :class="INPUT_CLASS"
        :disabled="isDisabled"
        :aria-invalid="Boolean(getFieldError('promise_date'))"
        :aria-describedby="getDescribedBy('promise_date')"
        @input="updateField('promise_date', $event.target.value)"
      />
      <p v-if="getFieldError('promise_date')" :id="getErrorId('promise_date')" :class="ERROR_CLASS">
        {{ getFieldError('promise_date') }}
      </p>
    </div>
    <div>
      <label :for="getFieldId('remarks')" :class="LABEL_CLASS">{{ REMARKS_LABEL }}</label>
      <textarea
        :id="getFieldId('remarks')"
        rows="3"
        :value="modelValue.remarks"
        :maxlength="NOTE_REMARKS_MAX_LENGTH"
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
