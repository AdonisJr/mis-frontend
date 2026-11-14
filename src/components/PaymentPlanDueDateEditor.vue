<script setup>
import { Plus, Trash2 } from '@lucide/vue'
import { PAYMENT_PLAN_MAX_INSTALLMENTS, appendDueDate, removeDueDateAt } from '@/utils/paymentPlanForm.js'

const EMPTY_TEXT = 'No installments: a Cash plan is paid in full upon enrollment.'
const ADD_HINT = `Up to ${PAYMENT_PLAN_MAX_INSTALLMENTS} installments, earliest first.`
const DUE_DATES_ERROR_ID = 'payment-plan-due-dates-error'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink tabular-nums focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Array, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
  minDate: { type: String, default: '' },
  maxDate: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function changeDueDate(dateIndex, dateText) {
  emit(
    'update:modelValue',
    props.modelValue.map((dueDate, index) => (index === dateIndex ? dateText : dueDate)),
  )
}

function addDueDate() {
  emit('update:modelValue', appendDueDate({ due_dates: props.modelValue }).due_dates)
}

function removeDueDate(dateIndex) {
  emit('update:modelValue', removeDueDateAt({ due_dates: props.modelValue }, dateIndex).due_dates)
}

function getDateError(dateIndex) {
  return props.fieldErrors[`due_dates.${dateIndex}`]?.[0] ?? ''
}

function getDateErrorId(dateIndex) {
  return `payment-plan-due-date-${dateIndex}-error`
}

function getDateDescribedBy(dateIndex) {
  return getDateError(dateIndex) ? getDateErrorId(dateIndex) : undefined
}
</script>

<template>
  <fieldset class="space-y-3">
    <legend class="mb-1 text-sm font-semibold text-ink">Installments</legend>
    <p v-if="fieldErrors.due_dates" :id="DUE_DATES_ERROR_ID" class="text-xs text-red-700">{{ fieldErrors.due_dates[0] }}</p>
    <p v-if="modelValue.length === 0" class="text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>
    <div v-for="(dueDate, dateIndex) in modelValue" :key="dateIndex" class="flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <label :for="`payment-plan-due-date-${dateIndex}`" class="mb-1 block text-xs font-semibold text-ink-muted">
          Installment {{ dateIndex + 1 }}
        </label>
        <input
          :id="`payment-plan-due-date-${dateIndex}`"
          type="date"
          :value="dueDate"
          :min="minDate || undefined"
          :max="maxDate || undefined"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-invalid="Boolean(getDateError(dateIndex))"
          :aria-describedby="getDateDescribedBy(dateIndex)"
          @input="changeDueDate(dateIndex, $event.target.value)"
        />
        <p v-if="getDateError(dateIndex)" :id="getDateErrorId(dateIndex)" class="mt-1 text-xs text-red-700">
          {{ getDateError(dateIndex) }}
        </p>
      </div>
      <button
        type="button"
        :class="SECONDARY_BUTTON_CLASS"
        class="mt-5 text-red-700"
        :disabled="isDisabled"
        :aria-label="`Remove installment ${dateIndex + 1}`"
        @click="removeDueDate(dateIndex)"
      >
        <Trash2 :size="16" aria-hidden="true" />
      </button>
    </div>
    <div class="flex items-center gap-3">
      <button
        type="button"
        :class="SECONDARY_BUTTON_CLASS"
        class="text-ink"
        :disabled="isDisabled || modelValue.length >= PAYMENT_PLAN_MAX_INSTALLMENTS"
        @click="addDueDate"
      >
        <Plus :size="16" aria-hidden="true" />
        Add installment
      </button>
      <p class="text-xs text-ink-muted">{{ ADD_HINT }}</p>
    </div>
  </fieldset>
</template>
