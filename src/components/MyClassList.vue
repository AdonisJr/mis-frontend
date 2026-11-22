<script setup>
import { ClipboardList } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import { CLASS_LIST_ROUTE_NAME } from '@/routeNames.js'
import { MY_CLASS_COLUMNS } from '@/utils/classListDisplay.js'

const LINK_LABEL = 'Class list'

defineProps({
  rows: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  emptyText: { type: String, required: true },
  linkQuery: { type: Object, default: () => ({}) },
})
</script>

<template>
  <DataTable :columns="MY_CLASS_COLUMNS" :rows="rows" row-key="id" :empty-text="emptyText" :is-loading="isLoading">
    <template #cell-schedule="{ row }">
      <p v-for="(scheduleLine, lineIndex) in row.scheduleLines" :key="lineIndex" class="tabular-nums">
        {{ scheduleLine }}
      </p>
    </template>
    <template #cell-students="{ value }">
      <span class="tabular-nums">{{ value }}</span>
    </template>
    <template #actions="{ row }">
      <RouterLink
        :to="{ name: CLASS_LIST_ROUTE_NAME, params: { classId: row.id }, query: linkQuery }"
        :aria-label="`Open the ${row.subject} class list`"
        class="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
      >
        <ClipboardList :size="16" aria-hidden="true" />
        {{ LINK_LABEL }}
      </RouterLink>
    </template>
  </DataTable>
</template>
