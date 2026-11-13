<script setup>
import { computed } from 'vue'
import { listCategoryTotals } from '@/utils/feeScheduleTotals.js'
import { formatPesoFromCents } from '@/utils/moneyDisplay.js'

const props = defineProps({
  lineTotals: { type: Object, required: true },
})

const categoryTotals = computed(() => listCategoryTotals(props.lineTotals))
</script>

<template>
  <dl class="space-y-1 rounded-md border border-line bg-page px-3 py-2 text-sm tabular-nums" aria-live="polite">
    <div v-for="categoryTotal in categoryTotals" :key="categoryTotal.category" class="flex justify-between gap-3">
      <dt class="text-ink-muted">{{ categoryTotal.label }}</dt>
      <dd class="text-ink">{{ formatPesoFromCents(categoryTotal.cents) }}</dd>
    </div>
    <div class="flex justify-between gap-3 border-t border-line pt-1 font-bold">
      <dt class="text-ink">Total</dt>
      <dd class="text-ink">{{ formatPesoFromCents(lineTotals.total) }}</dd>
    </div>
  </dl>
</template>
