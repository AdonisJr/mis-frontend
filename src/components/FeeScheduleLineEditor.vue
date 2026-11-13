<script setup>
import { Plus, Trash2 } from '@lucide/vue'
import { appendLine, removeLineAt } from '@/utils/feeScheduleForm.js'

const SELECT_PLACEHOLDER = 'Select fee item…'
const EMPTY_TEXT = 'No fee lines yet.'
const AMOUNT_MAX_LENGTH = 16
const LINES_ERROR_ID = 'fee-schedule-lines-error'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Array, required: true },
  lineItemOptions: { type: Array, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function changeLine(lineIndex, lineChanges) {
  emit(
    'update:modelValue',
    props.modelValue.map((line, index) => (index === lineIndex ? { ...line, ...lineChanges } : line)),
  )
}

function changeLineFeeItem(lineIndex, feeItemId) {
  changeLine(lineIndex, { fee_item_id: feeItemId })
}

function changeLineAmount(lineIndex, amountText) {
  changeLine(lineIndex, { amount: amountText })
}

function addLine() {
  emit('update:modelValue', appendLine({ lines: props.modelValue }).lines)
}

function removeLine(lineIndex) {
  emit('update:modelValue', removeLineAt({ lines: props.modelValue }, lineIndex).lines)
}

function getLineError(lineIndex, fieldKey) {
  return props.fieldErrors[`lines.${lineIndex}.${fieldKey}`]?.[0] ?? ''
}

function getLineErrorId(lineIndex, fieldKey) {
  return `fee-schedule-line-${lineIndex}-${fieldKey}-error`
}

function getLineDescribedBy(lineIndex, fieldKey) {
  if (!getLineError(lineIndex, fieldKey)) return undefined
  return getLineErrorId(lineIndex, fieldKey)
}
</script>

<template>
  <fieldset class="space-y-3">
    <legend class="mb-1 text-sm font-semibold text-ink">Fee lines</legend>
    <p v-if="fieldErrors.lines" :id="LINES_ERROR_ID" class="text-xs text-red-700">{{ fieldErrors.lines[0] }}</p>
    <p v-if="modelValue.length === 0" class="text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>
    <div v-for="(line, lineIndex) in modelValue" :key="lineIndex" class="flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <select
          :value="line.fee_item_id"
          :class="INPUT_CLASS"
          :disabled="isDisabled"
          :aria-label="`Fee item for line ${lineIndex + 1}`"
          :aria-invalid="Boolean(getLineError(lineIndex, 'fee_item_id'))"
          :aria-describedby="getLineDescribedBy(lineIndex, 'fee_item_id')"
          @change="changeLineFeeItem(lineIndex, $event.target.value)"
        >
          <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
          <option v-for="feeItemOption in lineItemOptions[lineIndex] ?? []" :key="feeItemOption.id" :value="String(feeItemOption.id)">
            {{ feeItemOption.label }}
          </option>
        </select>
        <p
          v-if="getLineError(lineIndex, 'fee_item_id')"
          :id="getLineErrorId(lineIndex, 'fee_item_id')"
          class="mt-1 text-xs text-red-700"
        >
          {{ getLineError(lineIndex, 'fee_item_id') }}
        </p>
      </div>
      <div class="w-32 shrink-0">
        <input
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          autocomplete="off"
          :maxlength="AMOUNT_MAX_LENGTH"
          :value="line.amount"
          :class="INPUT_CLASS"
          class="text-right tabular-nums"
          :disabled="isDisabled"
          :aria-label="`Amount for line ${lineIndex + 1}`"
          :aria-invalid="Boolean(getLineError(lineIndex, 'amount'))"
          :aria-describedby="getLineDescribedBy(lineIndex, 'amount')"
          @input="changeLineAmount(lineIndex, $event.target.value)"
        />
        <p v-if="getLineError(lineIndex, 'amount')" :id="getLineErrorId(lineIndex, 'amount')" class="mt-1 text-xs text-red-700">
          {{ getLineError(lineIndex, 'amount') }}
        </p>
      </div>
      <button
        type="button"
        :class="SECONDARY_BUTTON_CLASS"
        class="text-red-700"
        :disabled="isDisabled"
        :aria-label="`Remove line ${lineIndex + 1}`"
        @click="removeLine(lineIndex)"
      >
        <Trash2 :size="16" aria-hidden="true" />
      </button>
    </div>
    <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isDisabled" @click="addLine">
      <Plus :size="16" aria-hidden="true" />
      Add line
    </button>
  </fieldset>
</template>
