<script setup>
const EMPTY_TEXT = 'No accounts.'
const INACTIVE_SUFFIX = ' (inactive)'
const HEADER_CLASS = 'px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted'

defineProps({
  title: { type: String, required: true },
  rows: { type: Array, required: true },
  subtotalLabel: { type: String, required: true },
  subtotalText: { type: String, required: true },
})
</script>

<template>
  <section class="border-t border-line">
    <h3 class="px-4 pt-3 text-sm font-bold text-ink">{{ title }}</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-page">
          <tr>
            <th scope="col" :class="HEADER_CLASS">Code</th>
            <th scope="col" :class="HEADER_CLASS">Account</th>
            <th scope="col" :class="[HEADER_CLASS, 'text-right']">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="3" class="border-t border-line px-4 py-3 text-center text-ink-muted">{{ EMPTY_TEXT }}</td>
          </tr>
          <tr v-for="row in rows" :key="row.key" class="break-inside-avoid border-t border-line">
            <td class="px-4 py-2 font-mono text-xs text-ink">{{ row.code }}</td>
            <td class="px-4 py-2 text-ink">
              {{ row.name }}<span v-if="row.isInactive" class="text-ink-muted">{{ INACTIVE_SUFFIX }}</span>
            </td>
            <td class="px-4 py-2 text-right tabular-nums text-ink">{{ row.amountText }}</td>
          </tr>
          <tr class="break-inside-avoid border-t border-line font-bold">
            <td colspan="2" class="px-4 py-2 text-ink">{{ subtotalLabel }}</td>
            <td class="px-4 py-2 text-right tabular-nums text-ink">{{ subtotalText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
