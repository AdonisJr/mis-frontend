<script setup>
import { computed, useSlots } from 'vue'
import DataTableRow from '@/components/DataTableRow.vue'

const DEFAULT_EMPTY_TEXT = 'No records yet.'
const LOADING_TEXT = 'Loading…'
const ACTIONS_HEADER_LABEL = 'Actions'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, required: true },
  emptyText: { type: String, default: DEFAULT_EMPTY_TEXT },
  isLoading: { type: Boolean, default: false },
})

const slots = useSlots()

const hasActions = computed(() => Boolean(slots.actions))
const columnCount = computed(() => props.columns.length + (hasActions.value ? 1 : 0))
const isShowingLoadingRow = computed(() => props.isLoading && props.rows.length === 0)
const isShowingEmptyRow = computed(() => !props.isLoading && props.rows.length === 0)
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm" :aria-busy="isLoading">
      <thead class="bg-page">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-muted"
          >
            {{ column.label }}
          </th>
          <th
            v-if="hasActions"
            scope="col"
            class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted"
          >
            {{ ACTIONS_HEADER_LABEL }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isShowingLoadingRow">
          <td :colspan="columnCount" class="border-t border-line px-4 py-8 text-center text-ink-muted">
            {{ LOADING_TEXT }}
          </td>
        </tr>
        <tr v-else-if="isShowingEmptyRow">
          <td :colspan="columnCount" class="border-t border-line px-4 py-8 text-center text-ink-muted">
            {{ emptyText }}
          </td>
        </tr>
        <DataTableRow
          v-for="row in rows"
          :key="row[rowKey]"
          :row="row"
          :columns="columns"
          :has-actions="hasActions"
        >
          <template #cell="{ column }">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{ row[column.key] }}</slot>
          </template>
          <template #actions>
            <slot name="actions" :row="row" />
          </template>
        </DataTableRow>
      </tbody>
    </table>
  </div>
</template>
