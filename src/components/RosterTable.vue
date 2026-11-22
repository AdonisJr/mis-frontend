<script setup>
import { computed } from 'vue'
import { PRINT_ROW_CLASS } from '@/utils/classListPrint.js'

const LOADING_TEXT = 'Loading…'
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'
const HEADER_CELL_CLASS = 'px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-muted'
const MONO_COLUMN_KEY = 'lrn'
const TABULAR_COLUMN_KEYS = ['number', 'lrn']
const STATUS_COLUMN_KEY = 'status'

const props = defineProps({
  rosterGroups: { type: Object, required: true },
  columns: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  emptyText: { type: String, required: true },
})

const listedRows = computed(() => props.rosterGroups.listedRows ?? [])
const leftRows = computed(() => props.rosterGroups.leftRows ?? [])
const isEmpty = computed(() => listedRows.value.length === 0 && leftRows.value.length === 0)
const leftGroupLabel = computed(() => `Left the class (${leftRows.value.length})`)

function buildCellClass(column) {
  if (column.key === MONO_COLUMN_KEY) return 'px-4 py-2.5 font-mono text-xs tabular-nums'
  if (TABULAR_COLUMN_KEYS.includes(column.key)) return 'px-4 py-2.5 tabular-nums'
  return 'px-4 py-2.5'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm" :aria-busy="isLoading">
      <thead class="bg-page">
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col" :class="HEADER_CELL_CLASS">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isLoading && isEmpty">
          <td :colspan="columns.length" class="border-t border-line px-4 py-8 text-center text-ink-muted">
            {{ LOADING_TEXT }}
          </td>
        </tr>
        <tr v-else-if="isEmpty">
          <td :colspan="columns.length" class="border-t border-line px-4 py-8 text-center text-ink-muted">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-for="rosterRow in listedRows" :key="rosterRow.key" :class="['border-t border-line', PRINT_ROW_CLASS]">
          <td v-for="column in columns" :key="column.key" :class="buildCellClass(column)">
            <span v-if="column.key === STATUS_COLUMN_KEY" :class="[CHIP_CLASS, rosterRow.statusChip.colorClass]">
              {{ rosterRow.statusChip.label }}
            </span>
            <template v-else>{{ rosterRow[column.key] }}</template>
          </td>
        </tr>
      </tbody>
      <tbody v-if="leftRows.length > 0">
        <tr>
          <th
            :colspan="columns.length"
            scope="rowgroup"
            class="border-t border-line bg-page px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted"
          >
            {{ leftGroupLabel }}
          </th>
        </tr>
        <tr
          v-for="rosterRow in leftRows"
          :key="rosterRow.key"
          :class="['border-t border-line text-ink-muted', PRINT_ROW_CLASS]"
        >
          <td v-for="column in columns" :key="column.key" :class="buildCellClass(column)">
            <span v-if="column.key === STATUS_COLUMN_KEY" :class="[CHIP_CLASS, rosterRow.statusChip.colorClass]">
              {{ rosterRow.statusChip.label }}
            </span>
            <template v-else>{{ rosterRow[column.key] }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
