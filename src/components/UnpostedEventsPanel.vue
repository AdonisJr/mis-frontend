<script setup>
import { computed } from 'vue'
import { Send } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import { ALL_POSTED_TEXT, UNPOSTED_EVENT_COLUMNS } from '@/utils/unpostedEventsDisplay.js'

const ROW_KEY = 'key'
const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  pageMeta: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
  isPosting: { type: Boolean, default: false },
  postSummary: { type: Object, default: null },
})

const emit = defineEmits(['post-pending', 'change-page'])

const isBusy = computed(() => props.isLoading || props.isPosting)
const isPostDisabled = computed(() => isBusy.value || props.pageMeta.total === 0)
</script>

<template>
  <section class="rounded-lg border border-line bg-surface">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 class="text-sm font-bold text-ink">Unposted events</h2>
      <button type="button" :class="PRIMARY_BUTTON_CLASS" :disabled="isPostDisabled" @click="emit('post-pending')">
        <Send :size="16" aria-hidden="true" />
        Post pending
      </button>
    </div>
    <div v-if="postSummary" class="border-b border-line px-4 py-3 text-sm" aria-live="polite">
      <p v-if="postSummary.postedText" class="text-ink">{{ postSummary.postedText }}</p>
      <p v-if="postSummary.failedText" class="font-semibold text-red-700">{{ postSummary.failedText }}</p>
      <ul v-if="postSummary.failedLines.length > 0" class="list-disc pl-5 text-red-700">
        <li v-for="failedLine in postSummary.failedLines" :key="failedLine.key">{{ failedLine.text }}</li>
      </ul>
    </div>
    <DataTable
      :columns="UNPOSTED_EVENT_COLUMNS"
      :rows="rows"
      :row-key="ROW_KEY"
      :empty-text="ALL_POSTED_TEXT"
      :is-loading="isLoading"
    >
      <template #cell-amount="{ row }">
        <span class="block text-right tabular-nums">{{ row.amount }}</span>
      </template>
    </DataTable>
    <TablePagination
      v-if="pageMeta.total > 0"
      :current-page="pageMeta.current_page"
      :last-page="pageMeta.last_page"
      :per-page="pageMeta.per_page"
      :total="pageMeta.total"
      :is-disabled="isBusy"
      @change-page="emit('change-page', $event)"
    />
  </section>
</template>
