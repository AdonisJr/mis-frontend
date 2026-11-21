<script setup>
import { FilePen, TriangleAlert } from '@lucide/vue'
import { HOLD_NOTICE_TITLE, REGISTRAR_HOLD_TEXT } from '@/utils/paymentHoldDisplay.js'

const GRANT_LABEL = 'Grant promissory note'
const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  rows: { type: Array, required: true },
  summaryText: { type: String, required: true },
  canGrant: { type: Boolean, required: true },
  isOnHold: { type: Boolean, default: true },
})

const emit = defineEmits(['grant'])

function buildGrantLabel(noticeRow) {
  return `${GRANT_LABEL} for ${noticeRow.schoolYearText}`
}
</script>

<template>
  <div role="alert" class="rounded-lg border border-line bg-surface p-3">
    <div class="flex items-center gap-2">
      <TriangleAlert :size="16" class="text-amber-800" aria-hidden="true" />
      <p class="text-sm font-bold text-ink">{{ HOLD_NOTICE_TITLE }}</p>
    </div>
    <p v-if="summaryText !== ''" class="mt-1 text-sm text-ink">{{ summaryText }}</p>
    <ul v-if="rows.length > 0" class="mt-2 divide-y divide-line">
      <li v-for="noticeRow in rows" :key="noticeRow.key" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <span class="text-sm font-semibold text-ink">{{ noticeRow.schoolYearText }}</span>
        <span class="text-sm tabular-nums text-ink">{{ noticeRow.balanceText }}</span>
        <span v-if="noticeRow.isCovered" class="text-xs text-ink-muted">{{ noticeRow.coverText }}</span>
        <button
          v-if="canGrant && isOnHold && !noticeRow.isCovered"
          type="button"
          :class="[SECONDARY_BUTTON_CLASS, 'ml-auto']"
          :aria-label="buildGrantLabel(noticeRow)"
          @click="emit('grant', String(noticeRow.schoolYearId))"
        >
          <FilePen :size="16" aria-hidden="true" />
          {{ GRANT_LABEL }}
        </button>
      </li>
    </ul>
    <p v-if="!canGrant && isOnHold" class="mt-2 text-xs text-ink-muted">{{ REGISTRAR_HOLD_TEXT }}</p>
  </div>
</template>
