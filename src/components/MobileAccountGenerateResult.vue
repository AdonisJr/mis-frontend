<script setup>
import DataTable from '@/components/DataTable.vue'
import { ONE_TIME_PASSWORD_NOTE } from '@/utils/mobileAccountDisplay.js'

const GENERATED_ACCOUNT_COLUMNS = Object.freeze(
  [
    { key: 'lrn', label: 'LRN' },
    { key: 'name', label: 'Name' },
    { key: 'temporaryPassword', label: 'Temporary password' },
  ].map((column) => Object.freeze(column)),
)
const ROW_KEY = 'key'
const EMPTY_TEXT = 'No new accounts.'

defineProps({
  resultText: { type: String, required: true },
  slipRows: { type: Array, required: true },
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-ink">{{ resultText }}</p>
    <DataTable :columns="GENERATED_ACCOUNT_COLUMNS" :rows="slipRows" :row-key="ROW_KEY" :empty-text="EMPTY_TEXT">
      <template #cell-lrn="{ value }">
        <span class="font-mono text-xs">{{ value }}</span>
      </template>
      <template #cell-temporaryPassword="{ value }">
        <span class="font-mono">{{ value }}</span>
      </template>
    </DataTable>
    <p v-if="slipRows.length > 0" class="text-xs text-ink-muted">{{ ONE_TIME_PASSWORD_NOTE }}</p>
  </div>
</template>
