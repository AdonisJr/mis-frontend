<script setup>
import DataTable from '@/components/DataTable.vue'

const PANEL_TITLE = 'History'
const EMPTY_TEXT = 'No submits or reopens yet.'
const HISTORY_COLUMNS = [
  { key: 'actionLabel', label: 'Action' },
  { key: 'userName', label: 'By' },
  { key: 'dateText', label: 'Date' },
  { key: 'reasonText', label: 'Reason' },
]

defineProps({
  rows: { type: Array, required: true },
})
</script>

<template>
  <section class="rounded-lg border border-line bg-surface print:hidden">
    <div class="border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">{{ PANEL_TITLE }}</h2>
    </div>
    <DataTable :columns="HISTORY_COLUMNS" :rows="rows" row-key="key" :empty-text="EMPTY_TEXT" />
  </section>
</template>
