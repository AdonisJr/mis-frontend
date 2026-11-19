<script setup>
import {
  formatAssessmentPlan,
  formatSupersededText,
  formatTimestampDate,
  getAssessmentStatusChip,
} from '@/utils/assessmentDisplay.js'
import { formatPeso } from '@/utils/moneyDisplay.js'

const EMPTY_TEXT = 'No earlier assessments for this school year.'
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

defineProps({
  assessments: { type: Array, required: true },
})

const emit = defineEmits(['open'])
</script>

<template>
  <p v-if="assessments.length === 0" class="px-4 py-3 text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>
  <ul v-else class="divide-y divide-line">
    <li v-for="assessment in assessments" :key="assessment.id" class="flex items-center justify-between gap-3 px-4 py-3">
      <div class="min-w-0 space-y-0.5">
        <p class="flex flex-wrap items-center gap-2 text-sm">
          <span :class="[CHIP_CLASS, getAssessmentStatusChip(assessment.status).colorClass]">
            {{ getAssessmentStatusChip(assessment.status).label }}
          </span>
          <span class="tabular-nums">{{ formatTimestampDate(assessment.created_at) }}</span>
          <span class="font-semibold">{{ formatAssessmentPlan(assessment) }}</span>
          <span class="tabular-nums">{{ formatPeso(assessment.net_total) }}</span>
        </p>
        <p v-if="formatSupersededText(assessment)" class="text-xs text-ink-muted">
          {{ formatSupersededText(assessment) }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex shrink-0 items-center rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
        :aria-label="`View the assessment of ${formatTimestampDate(assessment.created_at)}`"
        @click="emit('open', assessment.id)"
      >
        View
      </button>
    </li>
  </ul>
</template>
