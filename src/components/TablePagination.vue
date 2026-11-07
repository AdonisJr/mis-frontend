<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const PAGINATION_LABEL = 'Pagination'
const PREVIOUS_PAGE_LABEL = 'Previous page'
const NEXT_PAGE_LABEL = 'Next page'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

const props = defineProps({
  currentPage: { type: Number, required: true },
  lastPage: { type: Number, required: true },
  perPage: { type: Number, required: true },
  total: { type: Number, required: true },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['change-page'])

const firstRowNumber = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.perPage + 1
})
const lastRowNumber = computed(() => Math.min(props.currentPage * props.perPage, props.total))
const canGoPrevious = computed(() => !props.isDisabled && props.currentPage > 1)
const canGoNext = computed(() => !props.isDisabled && props.currentPage < props.lastPage)

function requestPage(pageNumber) {
  if (props.isDisabled) return
  if (pageNumber < 1 || pageNumber > props.lastPage) return
  if (pageNumber === props.currentPage) return
  emit('change-page', pageNumber)
}
</script>

<template>
  <nav :aria-label="PAGINATION_LABEL">
    <div class="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-ink-muted">
      <p class="tabular-nums">{{ `${firstRowNumber}–${lastRowNumber} of ${total}` }}</p>
      <div class="flex items-center gap-2">
        <span class="tabular-nums">Page {{ currentPage }} of {{ lastPage }}</span>
        <button
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          class="text-ink"
          :aria-label="PREVIOUS_PAGE_LABEL"
          :disabled="!canGoPrevious"
          @click="requestPage(currentPage - 1)"
        >
          <ChevronLeft :size="16" aria-hidden="true" />
        </button>
        <button
          type="button"
          :class="SECONDARY_BUTTON_CLASS"
          class="text-ink"
          :aria-label="NEXT_PAGE_LABEL"
          :disabled="!canGoNext"
          @click="requestPage(currentPage + 1)"
        >
          <ChevronRight :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
  </nav>
</template>
