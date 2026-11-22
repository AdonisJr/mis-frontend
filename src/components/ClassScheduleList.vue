<script setup>
import { CalendarPlus, Pencil, Trash2 } from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import HoursIndicator from '@/components/HoursIndicator.vue'
import {
  CLASS_SCHEDULE_COLUMNS,
  buildMeetingSummary,
  formatClassTeacher,
} from '@/utils/scheduleDisplay.js'
import { NO_VALUE_LABEL } from '@/utils/sectionDisplay.js'

const ROW_KEY = 'id'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  rows: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  emptyText: { type: String, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['schedule', 'edit', 'remove'])

function isScheduled(scheduleRow) {
  return scheduleRow.class !== null && scheduleRow.class !== undefined
}

function listMeetings(scheduleRow) {
  return scheduleRow.class?.meetings ?? []
}
</script>

<template>
  <DataTable
    :columns="CLASS_SCHEDULE_COLUMNS"
    :rows="rows"
    :row-key="ROW_KEY"
    :empty-text="emptyText"
    :is-loading="isLoading"
  >
    <template #cell-code="{ row }">
      <span class="font-mono text-xs font-semibold">{{ row.subject.code }}</span>
    </template>
    <template #cell-subject="{ row }">
      <span class="block max-w-60 truncate" :title="row.subject.name">{{ row.subject.name }}</span>
    </template>
    <template #cell-teacher="{ row }">
      <span :class="isScheduled(row) ? '' : 'italic text-ink-muted'">{{ formatClassTeacher(row) }}</span>
    </template>
    <template #cell-meetings="{ row }">
      <ul v-if="listMeetings(row).length > 0" class="space-y-0.5">
        <li v-for="meeting in listMeetings(row)" :key="meeting.id" class="whitespace-nowrap tabular-nums">
          {{ buildMeetingSummary(meeting) }}
        </li>
      </ul>
      <span v-else>{{ NO_VALUE_LABEL }}</span>
    </template>
    <template #cell-hours="{ row }">
      <HoursIndicator :schedule-row="row" />
    </template>
    <template #actions="{ row }">
      <div class="flex justify-end gap-2">
        <button
          v-if="!isScheduled(row)"
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          class="text-ink"
          :disabled="isDisabled"
          :aria-label="`Schedule ${row.subject.code}`"
          @click="emit('schedule', row)"
        >
          <CalendarPlus :size="16" aria-hidden="true" />
          <span class="hidden sm:inline">Schedule</span>
        </button>
        <template v-else>
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-ink"
            :disabled="isDisabled"
            :aria-label="`Edit ${row.subject.code} class`"
            @click="emit('edit', row)"
          >
            <Pencil :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            :class="SECONDARY_BUTTON_CLASS"
            class="text-red-700"
            :disabled="isDisabled"
            :aria-label="`Delete ${row.subject.code} class`"
            @click="emit('remove', row)"
          >
            <Trash2 :size="16" aria-hidden="true" />
            <span class="hidden sm:inline">Delete</span>
          </button>
        </template>
      </div>
    </template>
  </DataTable>
</template>
