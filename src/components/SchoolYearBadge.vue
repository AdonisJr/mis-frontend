<script setup>
import { computed } from 'vue'

const YEAR_PATTERN = /^(?<year>\d{4})-\d{2}-\d{2}$/
const NO_ACTIVE_TEXT = 'No active SY'
const LOADING_TEXT = 'Loading SY…'
const BADGE_PREFIX = 'SY'
const YEAR_SEPARATOR = '–'
const TERM_SEPARATOR = ' · '

const props = defineProps({
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  termLabel: { type: String, default: '' },
})

function extractYear(isoDate) {
  return isoDate.match(YEAR_PATTERN)?.groups.year ?? ''
}

const startYear = computed(() => extractYear(props.startDate))
const endYear = computed(() => extractYear(props.endDate))
const hasActiveYear = computed(() => Boolean(startYear.value && endYear.value))

const badgeText = computed(() => {
  if (props.isLoading) return LOADING_TEXT
  if (!hasActiveYear.value) return NO_ACTIVE_TEXT
  const schoolYearText = `${BADGE_PREFIX} ${startYear.value}${YEAR_SEPARATOR}${endYear.value}`
  if (!props.termLabel) return schoolYearText
  return schoolYearText + TERM_SEPARATOR + props.termLabel
})
</script>

<template>
  <span
    role="status"
    class="shrink-0 whitespace-nowrap rounded-full border border-line bg-page px-2.5 py-0.5 text-xs font-bold tabular-nums"
    :class="hasActiveYear && !isLoading ? 'text-ink' : 'text-ink-muted'"
  >{{ badgeText }}</span>
</template>
