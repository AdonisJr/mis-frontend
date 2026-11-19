<script setup>
import { computed } from 'vue'
import { OVERDUE_CHIP, buildLedgerScheduleRows, buildLedgerSummaryRows } from '@/utils/paymentDisplay.js'

const SCHEDULE_HEADING = 'Payment schedule'
const EMPTY_SCHEDULE_TEXT = 'No schedule rows.'
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const HEAD_CELL_CLASS = 'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted'
const MONEY_HEAD_CELL_CLASS = `${HEAD_CELL_CLASS} text-right`

const props = defineProps({
  ledger: { type: Object, required: true },
})

const summaryRows = computed(() => buildLedgerSummaryRows(props.ledger))
const scheduleRows = computed(() => buildLedgerScheduleRows(props.ledger.schedule))
</script>

<template>
  <div class="space-y-4">
    <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div v-for="summaryRow in summaryRows" :key="summaryRow.key" class="rounded-lg border border-line bg-surface px-4 py-3">
        <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{{ summaryRow.label }}</dt>
        <dd class="mt-1 text-lg tabular-nums" :class="summaryRow.isEmphasized ? 'font-bold' : 'font-semibold'">
          {{ summaryRow.amountText }}
        </dd>
      </div>
    </dl>

    <section>
      <h3 class="mb-1.5 text-sm font-bold text-ink">{{ SCHEDULE_HEADING }}</h3>
      <p v-if="scheduleRows.length === 0" class="text-sm text-ink-muted">{{ EMPTY_SCHEDULE_TEXT }}</p>
      <div v-else class="overflow-x-auto rounded-md border border-line">
        <table class="w-full text-left text-sm">
          <thead class="bg-page">
            <tr>
              <th scope="col" :class="HEAD_CELL_CLASS">Installment</th>
              <th scope="col" :class="HEAD_CELL_CLASS">Due</th>
              <th scope="col" :class="MONEY_HEAD_CELL_CLASS">Amount</th>
              <th scope="col" :class="MONEY_HEAD_CELL_CLASS">Paid</th>
              <th scope="col" :class="HEAD_CELL_CLASS">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scheduleRow in scheduleRows" :key="scheduleRow.key" class="border-t border-line">
              <td class="px-3 py-2">{{ scheduleRow.label }}</td>
              <td class="px-3 py-2 tabular-nums">{{ scheduleRow.dueDateText }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ scheduleRow.amountText }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ scheduleRow.paidText }}</td>
              <td class="px-3 py-2">
                <span class="flex flex-wrap gap-1.5">
                  <span :class="[CHIP_CLASS, scheduleRow.statusChip.colorClass]">{{ scheduleRow.statusChip.label }}</span>
                  <span v-if="scheduleRow.isOverdue" :class="[CHIP_CLASS, OVERDUE_CHIP.colorClass]">
                    {{ OVERDUE_CHIP.label }}
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
