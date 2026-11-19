<script setup>
import DataTable from '@/components/DataTable.vue'
import PaymentRowActions from '@/components/PaymentRowActions.vue'
import {
  PAYMENT_HISTORY_COLUMNS,
  formatPaymentReference,
  getMethodLabel,
  getPaymentStatusChip,
  isPaymentVoided,
} from '@/utils/paymentDisplay.js'
import { formatDisplayDate } from '@/utils/dateDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

const EMPTY_TEXT = 'No payments yet.'
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

defineProps({
  payments: { type: Array, required: true },
})

const emit = defineEmits(['receipt', 'void'])
</script>

<template>
  <DataTable :columns="PAYMENT_HISTORY_COLUMNS" :rows="payments" row-key="id" :empty-text="EMPTY_TEXT">
    <template #cell-ar_number="{ row }">
      <span class="font-mono text-xs tabular-nums">{{ row.ar_number }}</span>
    </template>
    <template #cell-payment_date="{ row }">
      <span class="tabular-nums">{{ formatDisplayDate(row.payment_date) }}</span>
    </template>
    <template #cell-amount="{ row }">
      <span class="tabular-nums" :class="isPaymentVoided(row) ? 'text-ink-muted line-through' : ''">
        {{ formatPeso(row.amount) }}
      </span>
    </template>
    <template #cell-method="{ row }">{{ getMethodLabel(row.method) }}</template>
    <template #cell-reference_no="{ row }">{{ formatPaymentReference(row.reference_no) }}</template>
    <template #cell-recorded_by="{ row }">{{ row.recorded_by?.name ?? NO_VALUE_LABEL }}</template>
    <template #cell-status="{ row }">
      <span :class="[CHIP_CLASS, getPaymentStatusChip(row).colorClass]">{{ getPaymentStatusChip(row).label }}</span>
      <p v-if="isPaymentVoided(row) && row.void_reason" class="mt-1 text-xs text-ink-muted">{{ row.void_reason }}</p>
    </template>
    <template #actions="{ row }">
      <PaymentRowActions :payment="row" @receipt="emit('receipt', row.id)" @void="emit('void', row)" />
    </template>
  </DataTable>
</template>
