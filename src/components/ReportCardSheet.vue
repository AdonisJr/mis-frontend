<script setup>
import { DESCRIPTOR_LEGEND } from '@/utils/reportCardDisplay.js'

const SHEET_TITLE = 'Report card'
const HEADER_CELL_CLASS = 'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted'

defineProps({
  reportCard: { type: Object, required: true },
  schoolName: { type: String, required: true },
})
</script>

<template>
  <article class="bg-surface text-ink">
    <header class="mb-4 border-b border-line pb-3 text-center">
      <p class="text-sm font-bold">{{ schoolName }}</p>
      <h2 class="text-lg font-bold">{{ SHEET_TITLE }}</h2>
    </header>
    <dl class="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
      <div v-for="headerItem in reportCard.headerItems" :key="headerItem.key" class="flex gap-2">
        <dt class="w-24 shrink-0 text-ink-muted">{{ headerItem.label }}</dt>
        <dd class="min-w-0 font-semibold">{{ headerItem.text }}</dd>
      </div>
    </dl>
    <section v-for="block in reportCard.blocks" :key="block.title" class="mb-4 break-inside-avoid">
      <h3 class="mb-1 text-sm font-bold">{{ block.title }}</h3>
      <table class="w-full text-left text-sm">
        <thead class="bg-page">
          <tr>
            <th scope="col" :class="HEADER_CELL_CLASS">Subject</th>
            <th
              v-for="quarterNumber in block.quarterNumbers"
              :key="quarterNumber"
              scope="col"
              :class="[HEADER_CELL_CLASS, 'text-center']"
            >
              Q{{ quarterNumber }}
            </th>
            <th scope="col" :class="[HEADER_CELL_CLASS, 'text-center']">Final</th>
            <th scope="col" :class="HEADER_CELL_CLASS">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subjectRow in block.rows" :key="subjectRow.key" class="border-t border-line">
            <td class="px-3 py-1.5">{{ subjectRow.subjectText }}</td>
            <td
              v-for="(quarterText, quarterIndex) in subjectRow.quarterTexts"
              :key="quarterIndex"
              class="px-3 py-1.5 text-center tabular-nums"
            >
              {{ quarterText }}
            </td>
            <td class="px-3 py-1.5 text-center font-semibold tabular-nums">{{ subjectRow.finalText }}</td>
            <td class="px-3 py-1.5">{{ subjectRow.remarksText }}</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-2 text-sm">
        General average:
        <span class="font-semibold tabular-nums">{{ block.averageText }}</span>
        <span class="text-ink-muted"> · {{ block.descriptorText }}</span>
      </p>
    </section>
    <dl class="grid grid-cols-1 gap-x-6 gap-y-0.5 border-t border-line pt-3 text-xs sm:grid-cols-2">
      <div v-for="legendRow in DESCRIPTOR_LEGEND" :key="legendRow.descriptor" class="flex gap-2">
        <dt class="font-semibold">{{ legendRow.descriptor }}</dt>
        <dd class="tabular-nums text-ink-muted">{{ legendRow.range }}</dd>
      </div>
    </dl>
  </article>
</template>
