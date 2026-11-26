<script setup>
import { Plus, Trash2 } from '@lucide/vue'
import {
  JOURNAL_MEMO_MAX_LENGTH,
  appendJournalLine,
  applyLineCreditChange,
  applyLineDebitChange,
  canAddJournalLine,
  canRemoveJournalLine,
  removeJournalLineAt,
} from '@/utils/journalLineGrid.js'
import { computed } from 'vue'

const SELECT_PLACEHOLDER = 'Select account…'
const AMOUNT_MAX_LENGTH = 16
const LINES_ERROR_ID = 'journal-lines-error'
const ERROR_ID_PREFIX = 'journal-line'
const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  modelValue: { type: Array, required: true },
  accountOptions: { type: Array, required: true },
  fieldErrors: { type: Object, default: () => ({}) },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const canAddLine = computed(() => canAddJournalLine(props.modelValue))
const canRemoveLine = computed(() => canRemoveJournalLine(props.modelValue))

function replaceLine(lineIndex, nextLine) {
  emit(
    'update:modelValue',
    props.modelValue.map((line, index) => (index === lineIndex ? nextLine : line)),
  )
}

function changeAccount(lineIndex, accountId) {
  replaceLine(lineIndex, { ...props.modelValue[lineIndex], account_id: accountId })
}

function changeDebit(lineIndex, debitText) {
  replaceLine(lineIndex, applyLineDebitChange(props.modelValue[lineIndex], debitText))
}

function changeCredit(lineIndex, creditText) {
  replaceLine(lineIndex, applyLineCreditChange(props.modelValue[lineIndex], creditText))
}

function changeMemo(lineIndex, memoText) {
  replaceLine(lineIndex, { ...props.modelValue[lineIndex], memo: memoText })
}

function addLine() {
  emit('update:modelValue', appendJournalLine(props.modelValue))
}

function removeLine(lineIndex) {
  emit('update:modelValue', removeJournalLineAt(props.modelValue, lineIndex))
}

function getLineError(lineIndex, fieldKey) {
  return props.fieldErrors[`lines.${lineIndex}.${fieldKey}`]?.[0] ?? ''
}

function getLineErrorId(lineIndex, fieldKey) {
  return `${ERROR_ID_PREFIX}-${lineIndex}-${fieldKey}-error`
}

function getLineDescribedBy(lineIndex, fieldKey) {
  if (!getLineError(lineIndex, fieldKey)) return undefined
  return getLineErrorId(lineIndex, fieldKey)
}
</script>

<template>
  <fieldset class="space-y-3">
    <legend class="mb-1 text-sm font-semibold text-ink">Lines</legend>
    <p v-if="fieldErrors.lines" :id="LINES_ERROR_ID" role="alert" class="text-xs text-red-700">{{ fieldErrors.lines[0] }}</p>
    <div class="overflow-x-auto">
      <div class="min-w-160 space-y-2">
        <div
          v-for="(line, lineIndex) in modelValue"
          :key="lineIndex"
          class="grid grid-cols-[minmax(0,2fr)_7rem_7rem_minmax(0,1.5fr)_auto] items-start gap-2"
        >
          <div class="min-w-0">
            <select
              :value="line.account_id"
              :class="INPUT_CLASS"
              :disabled="isDisabled"
              :aria-label="`Account for line ${lineIndex + 1}`"
              :aria-invalid="Boolean(getLineError(lineIndex, 'account_id'))"
              :aria-describedby="getLineDescribedBy(lineIndex, 'account_id')"
              @change="changeAccount(lineIndex, $event.target.value)"
            >
              <option value="" disabled>{{ SELECT_PLACEHOLDER }}</option>
              <option v-for="accountOption in accountOptions" :key="accountOption.value" :value="accountOption.value">
                {{ accountOption.label }}
              </option>
            </select>
            <p
              v-if="getLineError(lineIndex, 'account_id')"
              :id="getLineErrorId(lineIndex, 'account_id')"
              class="mt-1 text-xs text-red-700"
            >
              {{ getLineError(lineIndex, 'account_id') }}
            </p>
          </div>
          <div>
            <input
              type="text"
              inputmode="decimal"
              placeholder="Debit"
              autocomplete="off"
              :maxlength="AMOUNT_MAX_LENGTH"
              :value="line.debit"
              :class="INPUT_CLASS"
              class="text-right tabular-nums"
              :disabled="isDisabled"
              :aria-label="`Debit for line ${lineIndex + 1}`"
              :aria-invalid="Boolean(getLineError(lineIndex, 'debit'))"
              :aria-describedby="getLineDescribedBy(lineIndex, 'debit')"
              @input="changeDebit(lineIndex, $event.target.value)"
            />
            <p v-if="getLineError(lineIndex, 'debit')" :id="getLineErrorId(lineIndex, 'debit')" class="mt-1 text-xs text-red-700">
              {{ getLineError(lineIndex, 'debit') }}
            </p>
          </div>
          <div>
            <input
              type="text"
              inputmode="decimal"
              placeholder="Credit"
              autocomplete="off"
              :maxlength="AMOUNT_MAX_LENGTH"
              :value="line.credit"
              :class="INPUT_CLASS"
              class="text-right tabular-nums"
              :disabled="isDisabled"
              :aria-label="`Credit for line ${lineIndex + 1}`"
              :aria-invalid="Boolean(getLineError(lineIndex, 'credit'))"
              :aria-describedby="getLineDescribedBy(lineIndex, 'credit')"
              @input="changeCredit(lineIndex, $event.target.value)"
            />
            <p v-if="getLineError(lineIndex, 'credit')" :id="getLineErrorId(lineIndex, 'credit')" class="mt-1 text-xs text-red-700">
              {{ getLineError(lineIndex, 'credit') }}
            </p>
          </div>
          <div class="min-w-0">
            <input
              type="text"
              placeholder="Memo"
              autocomplete="off"
              :maxlength="JOURNAL_MEMO_MAX_LENGTH"
              :value="line.memo"
              :class="INPUT_CLASS"
              :disabled="isDisabled"
              :aria-label="`Memo for line ${lineIndex + 1}`"
              :aria-invalid="Boolean(getLineError(lineIndex, 'memo'))"
              :aria-describedby="getLineDescribedBy(lineIndex, 'memo')"
              @input="changeMemo(lineIndex, $event.target.value)"
            />
            <p v-if="getLineError(lineIndex, 'memo')" :id="getLineErrorId(lineIndex, 'memo')" class="mt-1 text-xs text-red-700">
              {{ getLineError(lineIndex, 'memo') }}
            </p>
          </div>
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-red-700"
            :disabled="isDisabled || !canRemoveLine"
            :aria-label="`Remove line ${lineIndex + 1}`"
            @click="removeLine(lineIndex)"
          >
            <Trash2 :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    <button type="button" :class="SECONDARY_BUTTON_CLASS" class="text-ink" :disabled="isDisabled || !canAddLine" @click="addLine">
      <Plus :size="16" aria-hidden="true" />
      Add line
    </button>
  </fieldset>
</template>
