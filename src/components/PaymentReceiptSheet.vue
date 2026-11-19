<script setup>
import { computed } from 'vue'
import { formatAmountInWords } from '@/utils/amountInWords.js'
import { formatAssessmentGradeLevel } from '@/utils/assessmentDisplay.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatEnrollmentStudentName } from '@/utils/enrollmentDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import {
  RECEIPT_DISCLAIMER,
  buildReceiptVoidText,
  formatPaymentReference,
  getMethodLabel,
  isPaymentVoided,
} from '@/utils/paymentDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

const RECEIPT_TITLE = 'Acknowledgment receipt'
const VOID_WATERMARK_TEXT = 'VOID'
const LABEL_CLASS = 'w-44 shrink-0 text-ink-muted'

const props = defineProps({
  receipt: { type: Object, required: true },
  schoolName: { type: String, required: true },
})

const isVoided = computed(() => isPaymentVoided(props.receipt))
const voidText = computed(() => buildReceiptVoidText(props.receipt))
const hasRemarks = computed(() => typeof props.receipt.remarks === 'string' && props.receipt.remarks.trim() !== '')
const receiptRows = computed(() => [
  { key: 'student', label: 'Received from', valueText: formatEnrollmentStudentName(props.receipt.student) },
  { key: 'lrn', label: 'LRN', valueText: props.receipt.student?.lrn ?? NO_VALUE_LABEL, isMono: true },
  { key: 'year', label: 'School year', valueText: props.receipt.school_year?.name ?? NO_VALUE_LABEL },
  { key: 'grade', label: 'Grade level / program', valueText: formatAssessmentGradeLevel(props.receipt) },
  { key: 'amount', label: 'Amount', valueText: formatPeso(props.receipt.amount), isStrong: true },
  { key: 'words', label: 'Amount in words', valueText: formatAmountInWords(props.receipt.amount) },
  { key: 'method', label: 'Method', valueText: getMethodLabel(props.receipt.method) },
  { key: 'reference', label: 'Reference no.', valueText: formatPaymentReference(props.receipt.reference_no) },
  ...(hasRemarks.value ? [{ key: 'remarks', label: 'Remarks', valueText: props.receipt.remarks }] : []),
  { key: 'by', label: 'Received by', valueText: props.receipt.recorded_by?.name ?? NO_VALUE_LABEL },
  { key: 'balance', label: 'Balance after this payment', valueText: formatPeso(props.receipt.balance_after) },
])
</script>

<template>
  <article class="print-page-statement relative rounded-lg border border-line bg-surface p-6 print:border-0 print:p-0">
    <div v-if="isVoided" class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <span class="-rotate-12 select-none text-7xl font-bold text-red-700/25">{{ VOID_WATERMARK_TEXT }}</span>
    </div>

    <header class="mb-4 border-b border-line pb-3 text-center">
      <p class="text-lg font-bold text-ink">{{ schoolName }}</p>
      <h2 class="text-sm font-bold text-ink">{{ RECEIPT_TITLE }}</h2>
      <p class="mt-1 text-sm text-ink-muted">
        <span class="font-mono tabular-nums text-ink">{{ receipt.ar_number }}</span>
        ·
        <span class="tabular-nums">{{ formatDisplayDate(receipt.payment_date) }}</span>
      </p>
    </header>

    <dl class="space-y-2 text-sm">
      <div v-for="receiptRow in receiptRows" :key="receiptRow.key" class="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
        <dt :class="LABEL_CLASS">{{ receiptRow.label }}</dt>
        <dd
          class="min-w-0 flex-1 text-ink"
          :class="[receiptRow.isMono ? 'font-mono tabular-nums' : '', receiptRow.isStrong ? 'font-bold tabular-nums' : '']"
        >
          {{ receiptRow.valueText }}
        </dd>
      </div>
    </dl>

    <p v-if="isVoided" class="mt-4 text-sm font-semibold text-red-700">{{ voidText }}</p>
    <p class="mt-6 border-t border-line pt-3 text-xs text-ink-muted">
      {{ RECEIPT_DISCLAIMER }}
    </p>
  </article>
</template>
