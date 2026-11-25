<script setup>
import { Pencil, Trash2 } from '@lucide/vue'
import { formatDisplayDate } from '@/utils/dateDisplay.js'

const NAME_LABEL = 'Name'
const HEADER_CELL_CLASS = 'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted'
const ICON_BUTTON_CLASS =
  'rounded-md border border-line bg-surface p-1 text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

defineProps({
  columnGroups: { type: Array, required: true },
  gradeColumns: { type: Array, required: true },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['edit-activity', 'delete-activity'])

function buildGroupLabel(columnGroup) {
  return `${columnGroup.component.toUpperCase()} · ${columnGroup.weightText}`
}

function buildEmptyGroupLabel(columnGroup) {
  return `No ${columnGroup.component.toUpperCase()} activity`
}
</script>

<template>
  <thead class="bg-page">
    <tr>
      <th scope="col" rowspan="2" :class="[HEADER_CELL_CLASS, 'sticky left-0 bg-page text-left']">{{ NAME_LABEL }}</th>
      <template v-for="columnGroup in columnGroups" :key="columnGroup.component">
        <th
          v-if="columnGroup.activities.length > 0"
          scope="colgroup"
          :colspan="columnGroup.activities.length"
          :class="[HEADER_CELL_CLASS, 'border-l border-line text-center']"
        >
          {{ buildGroupLabel(columnGroup) }}
        </th>
        <th
          v-else
          scope="col"
          rowspan="2"
          :class="[HEADER_CELL_CLASS, 'border-l border-line text-center font-normal normal-case']"
        >
          {{ buildEmptyGroupLabel(columnGroup) }}
        </th>
      </template>
      <th
        v-for="gradeColumn in gradeColumns"
        :key="gradeColumn.key"
        scope="col"
        rowspan="2"
        :class="[HEADER_CELL_CLASS, 'border-l border-line text-right']"
      >
        {{ gradeColumn.label }}
      </th>
    </tr>
    <tr>
      <template v-for="columnGroup in columnGroups" :key="columnGroup.component">
        <th
          v-for="activity in columnGroup.activities"
          :key="activity.id"
          scope="col"
          :class="[HEADER_CELL_CLASS, 'border-l border-line text-center normal-case']"
        >
          <span class="block font-bold text-ink">{{ activity.title }}</span>
          <span class="block tabular-nums">HPS {{ activity.highest_possible_score }}</span>
          <span v-if="activity.activity_date" class="block tabular-nums">
            {{ formatDisplayDate(activity.activity_date) }}
          </span>
          <span v-if="canEdit" class="mt-1 flex justify-center gap-1 print:hidden">
            <button
              type="button"
              :class="ICON_BUTTON_CLASS"
              :aria-label="`Edit ${activity.title}`"
              @click="emit('edit-activity', activity)"
            >
              <Pencil :size="14" aria-hidden="true" />
            </button>
            <button
              type="button"
              :class="ICON_BUTTON_CLASS"
              :aria-label="`Delete ${activity.title}`"
              @click="emit('delete-activity', activity)"
            >
              <Trash2 :size="14" aria-hidden="true" />
            </button>
          </span>
        </th>
      </template>
    </tr>
  </thead>
</template>
