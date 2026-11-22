<script setup>
import { computed } from 'vue'
import { buildTimeAxisLabels, buildTimetableColumns } from '@/utils/timetableLayout.js'

const LOADING_TEXT = 'Loading…'
const TIME_RANGE_SEPARATOR = '–'
const PERCENT_UNIT = '%'

const props = defineProps({
  entries: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  emptyText: { type: String, required: true },
})

const timeAxisLabels = buildTimeAxisLabels()
const columns = computed(() => buildTimetableColumns(props.entries))
const isEmpty = computed(() => props.entries.length === 0)

function buildBlockStyle(block) {
  return {
    top: `${block.topPercent}${PERCENT_UNIT}`,
    height: `${block.heightPercent}${PERCENT_UNIT}`,
    left: `${block.leftPercent}${PERCENT_UNIT}`,
    width: `${block.widthPercent}${PERCENT_UNIT}`,
  }
}

function buildTimeRange(block) {
  return `${block.start_time}${TIME_RANGE_SEPARATOR}${block.end_time}`
}

function buildBlockTitle(block) {
  return [block.title, block.subtitle, buildTimeRange(block)].filter(Boolean).join('\n')
}
</script>

<template>
  <div>
    <p v-if="isLoading" class="px-4 py-3 text-sm text-ink-muted">{{ LOADING_TEXT }}</p>
    <p v-else-if="isEmpty" class="px-4 py-3 text-sm text-ink-muted">{{ emptyText }}</p>
    <div class="overflow-x-auto" :aria-busy="isLoading">
      <div class="flex min-w-160">
        <div class="w-14 shrink-0">
          <div class="h-8 bg-page"></div>
          <div
            v-for="axisLabel in timeAxisLabels"
            :key="axisLabel"
            class="h-12 pr-2 text-right text-xs tabular-nums text-ink-muted"
          >
            {{ axisLabel }}
          </div>
        </div>
        <div v-for="column in columns" :key="column.day" class="min-w-0 flex-1 border-l border-line">
          <div class="flex h-8 items-center justify-center bg-page text-xs uppercase tracking-wider text-ink-muted">
            {{ column.label }}
          </div>
          <div class="relative h-288">
            <div v-for="axisLabel in timeAxisLabels" :key="axisLabel" class="h-12 border-t border-line"></div>
            <div
              v-for="block in column.blocks"
              :key="block.key"
              class="absolute overflow-hidden rounded-md border border-line bg-accent-soft px-1.5 py-1 text-xs text-ink"
              :style="buildBlockStyle(block)"
              :title="buildBlockTitle(block)"
            >
              <p class="font-semibold">{{ block.title }}</p>
              <p v-if="block.subtitle">{{ block.subtitle }}</p>
              <p class="tabular-nums">{{ buildTimeRange(block) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
