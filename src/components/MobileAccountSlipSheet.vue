<script setup>
import { SLIP_INSTRUCTIONS, SLIP_TITLE, buildSlipFieldLines } from '@/utils/mobileAccountDisplay.js'

const SLIP_SHEET_CLASS = 'print-mobile-slips print-page-statement hidden print:block'
const PASSWORD_LABEL = 'Temporary password'

defineProps({
  slipRows: { type: Array, required: true },
})
</script>

<template>
  <Teleport to="body">
    <div v-if="slipRows.length > 0" :class="SLIP_SHEET_CLASS">
      <article
        v-for="slipRow in slipRows"
        :key="slipRow.key"
        class="mb-4 break-inside-avoid rounded-lg border border-dashed border-line p-4"
      >
        <h2 class="text-sm font-bold">{{ SLIP_TITLE }}</h2>
        <dl class="my-2 text-sm">
          <div v-for="fieldLine in buildSlipFieldLines(slipRow)" :key="fieldLine.label" class="flex gap-2">
            <dt class="w-40 shrink-0 text-ink-muted">{{ fieldLine.label }}</dt>
            <dd :class="fieldLine.label === PASSWORD_LABEL ? 'font-mono font-bold' : ''">{{ fieldLine.value }}</dd>
          </div>
        </dl>
        <ol class="list-decimal pl-5 text-xs">
          <li v-for="instruction in SLIP_INSTRUCTIONS" :key="instruction">{{ instruction }}</li>
        </ol>
      </article>
    </div>
  </Teleport>
</template>
