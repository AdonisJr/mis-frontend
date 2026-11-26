<script setup>
import { POSTING_SETTINGS_ROUTE_NAME } from '@/routeNames.js'

const GL_BALANCE_LABEL = 'GL AR – Students'
const DIFFERENCE_LABEL = 'Difference'
const SETTINGS_LINK_TEXT = 'Open Posting settings'
const LINK_CLASS =
  'rounded-md text-sm font-semibold text-accent hover:underline focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 print:hidden'
const TERM_CLASS = 'text-xs font-semibold uppercase tracking-wider text-ink-muted'

defineProps({
  tieOut: { type: Object, required: true },
})
</script>

<template>
  <section class="break-inside-avoid border-t border-line px-4 py-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold text-ink">Tie-out</h3>
        <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" :class="tieOut.chip.colorClass">
          {{ tieOut.chip.label }}
        </span>
      </div>
      <RouterLink :to="{ name: POSTING_SETTINGS_ROUTE_NAME }" :class="LINK_CLASS">{{ SETTINGS_LINK_TEXT }}</RouterLink>
    </div>
    <dl class="mt-2 grid gap-3 text-sm tabular-nums sm:grid-cols-3">
      <div>
        <dt :class="TERM_CLASS">{{ tieOut.agingTotalLabel }}</dt>
        <dd class="font-bold text-ink">{{ tieOut.agingTotalText }}</dd>
      </div>
      <div>
        <dt :class="TERM_CLASS">{{ GL_BALANCE_LABEL }}</dt>
        <dd class="font-bold text-ink">{{ tieOut.glBalanceText }}</dd>
      </div>
      <div>
        <dt :class="TERM_CLASS">{{ DIFFERENCE_LABEL }}</dt>
        <dd class="font-bold" :class="tieOut.hasDifference ? 'text-red-700' : 'text-ink'">{{ tieOut.differenceText }}</dd>
      </div>
    </dl>
    <p v-if="tieOut.message" class="mt-2 text-sm text-ink-muted">{{ tieOut.message }}</p>
  </section>
</template>
