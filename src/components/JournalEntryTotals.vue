<script setup>
import { computed } from 'vue'
import { formatDifferenceText } from '@/utils/journalLineGrid.js'
import { formatPesoFromCents } from '@/utils/moneyDisplay.js'

const props = defineProps({
  lineTotals: { type: Object, required: true },
})

const differenceText = computed(() => formatDifferenceText(props.lineTotals))
const isBalanced = computed(() => props.lineTotals.differenceCents === 0)
</script>

<template>
  <dl class="space-y-1 rounded-md border border-line bg-page px-3 py-2 text-sm tabular-nums" aria-live="polite">
    <div class="flex justify-between gap-3">
      <dt class="text-ink-muted">Debit total</dt>
      <dd class="text-ink">{{ formatPesoFromCents(lineTotals.debitCents) }}</dd>
    </div>
    <div class="flex justify-between gap-3">
      <dt class="text-ink-muted">Credit total</dt>
      <dd class="text-ink">{{ formatPesoFromCents(lineTotals.creditCents) }}</dd>
    </div>
    <div class="flex justify-between gap-3 border-t border-line pt-1 font-bold">
      <dt class="text-ink">Difference</dt>
      <dd :class="isBalanced ? 'text-ink' : 'text-red-700'">{{ differenceText }}</dd>
    </div>
  </dl>
</template>
