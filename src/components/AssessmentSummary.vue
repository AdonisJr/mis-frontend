<script setup>
import { computed } from 'vue'
import {
  buildCategoryTotalRows,
  buildDiscountRows,
  buildScheduleRows,
  buildTotalsRows,
  groupFeeLinesByCategory,
} from '@/utils/assessmentDisplay.js'

const NO_DISCOUNTS_TEXT = 'No student discounts.'
const FEES_HEADING = 'Fees'
const DISCOUNTS_HEADING = 'Student discounts'
const SCHEDULE_HEADING = 'Payment schedule'
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const HEADING_CLASS = 'mb-1.5 text-sm font-bold text-ink'
const HEAD_CELL_CLASS = 'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted'
const CELL_CLASS = 'px-3 py-2'
const MONEY_CELL_CLASS = 'px-3 py-2 text-right tabular-nums'

const props = defineProps({
  assessment: { type: Object, required: true },
  isStatement: { type: Boolean, default: false },
})

const feeGroups = computed(() => groupFeeLinesByCategory(props.assessment.fee_lines, props.assessment.subtotals))
const categoryTotalRows = computed(() => buildCategoryTotalRows(props.assessment))
const discountRows = computed(() => buildDiscountRows(props.assessment.discounts))
const totalsRows = computed(() => buildTotalsRows(props.assessment))
const scheduleRows = computed(() => buildScheduleRows(props.assessment.schedule))
</script>

<template>
  <div class="space-y-4">
    <section v-if="isStatement">
      <h3 :class="HEADING_CLASS">{{ FEES_HEADING }}</h3>
      <div class="overflow-x-auto rounded-md border border-line">
        <table class="w-full text-left text-sm">
          <tbody>
            <template v-for="feeGroup in feeGroups" :key="feeGroup.category">
              <tr class="bg-page">
                <th scope="colgroup" colspan="2" :class="HEAD_CELL_CLASS">{{ feeGroup.label }}</th>
              </tr>
              <tr v-for="feeLine in feeGroup.lines" :key="feeLine.key" class="border-t border-line">
                <td :class="CELL_CLASS">{{ feeLine.itemName }}</td>
                <td :class="MONEY_CELL_CLASS">{{ feeLine.amountText }}</td>
              </tr>
              <tr class="border-t border-line font-semibold">
                <td :class="CELL_CLASS">{{ feeGroup.label }} subtotal</td>
                <td :class="MONEY_CELL_CLASS">{{ feeGroup.subtotalText }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
    <section v-else>
      <h3 :class="HEADING_CLASS">{{ FEES_HEADING }}</h3>
      <div class="overflow-x-auto rounded-md border border-line">
        <table class="w-full text-left text-sm">
          <tbody>
            <tr v-for="categoryRow in categoryTotalRows" :key="categoryRow.key" class="border-t border-line first:border-t-0">
              <td :class="CELL_CLASS">{{ categoryRow.label }}</td>
              <td :class="MONEY_CELL_CLASS">{{ categoryRow.amountText }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h3 :class="HEADING_CLASS">{{ DISCOUNTS_HEADING }}</h3>
      <p v-if="discountRows.length === 0" class="text-sm text-ink-muted">{{ NO_DISCOUNTS_TEXT }}</p>
      <div v-else class="overflow-x-auto rounded-md border border-line">
        <table class="w-full text-left text-sm">
          <thead class="bg-page">
            <tr>
              <th scope="col" :class="HEAD_CELL_CLASS">Discount</th>
              <th scope="col" :class="HEAD_CELL_CLASS">Value</th>
              <th scope="col" :class="HEAD_CELL_CLASS">Reference no.</th>
              <th scope="col" :class="[HEAD_CELL_CLASS, 'text-right']">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="discountRow in discountRows" :key="discountRow.key" class="border-t border-line align-top">
              <td :class="CELL_CLASS">
                <span class="font-semibold">{{ discountRow.typeName }}</span>
                <span :class="[CHIP_CLASS, discountRow.sourceChip.colorClass, 'ml-1.5']">
                  {{ discountRow.sourceChip.label }}
                </span>
              </td>
              <td :class="CELL_CLASS">{{ discountRow.valueText }} of {{ discountRow.baseText }}</td>
              <td :class="CELL_CLASS">{{ discountRow.referenceText }}</td>
              <td :class="MONEY_CELL_CLASS">
                {{ discountRow.amountText }}
                <span v-if="discountRow.cappedText" class="block text-xs text-ink-muted">{{ discountRow.cappedText }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <div class="overflow-x-auto rounded-md border border-line">
        <table class="w-full text-left text-sm">
          <tbody>
            <tr
              v-for="totalsRow in totalsRows"
              :key="totalsRow.key"
              class="border-t border-line first:border-t-0"
              :class="totalsRow.isEmphasized ? 'bg-page font-bold' : ''"
            >
              <td :class="CELL_CLASS">{{ totalsRow.label }}</td>
              <td :class="MONEY_CELL_CLASS">{{ totalsRow.amountText }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h3 :class="HEADING_CLASS">{{ SCHEDULE_HEADING }}</h3>
      <div class="overflow-x-auto rounded-md border border-line">
        <table class="w-full text-left text-sm">
          <thead class="bg-page">
            <tr>
              <th scope="col" :class="HEAD_CELL_CLASS">Installment</th>
              <th scope="col" :class="HEAD_CELL_CLASS">Due date</th>
              <th scope="col" :class="[HEAD_CELL_CLASS, 'text-right']">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scheduleRow in scheduleRows" :key="scheduleRow.key" class="border-t border-line">
              <td :class="CELL_CLASS">{{ scheduleRow.label }}</td>
              <td :class="[CELL_CLASS, 'tabular-nums']">{{ scheduleRow.dueDateText }}</td>
              <td :class="MONEY_CELL_CLASS">{{ scheduleRow.amountText }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
