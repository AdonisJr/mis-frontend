<script setup>
import { Nfc } from '@lucide/vue'

const OPENING_TEXT = 'Opening the scanner…'
const PROMPT_TEXT = 'Tap the card on the scanner (yellow light off).'
const CLOSED_TEXT = 'The scan window has closed. Press Rescan to scan again.'
const WAITING_TEXT = 'Waiting for a card…'
const COUNTDOWN_LABEL = 'Time left'
const SCANNED_LABEL = 'Scanned card'

defineProps({
  isOpening: { type: Boolean, default: false },
  isWindowOpen: { type: Boolean, required: true },
  countdownText: { type: String, required: true },
  scannedUid: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg border border-line bg-page px-4 py-3">
    <div class="flex items-start gap-2 text-sm text-ink">
      <Nfc :size="18" class="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
      <p v-if="isOpening">{{ OPENING_TEXT }}</p>
      <div v-else-if="isWindowOpen">
        <p>{{ PROMPT_TEXT }}</p>
        <p class="text-xs text-ink-muted">
          {{ COUNTDOWN_LABEL }} <span class="font-semibold tabular-nums text-ink">{{ countdownText }}</span>
        </p>
      </div>
      <p v-else>{{ CLOSED_TEXT }}</p>
    </div>
    <div aria-live="polite" class="text-xs text-ink-muted">
      <template v-if="scannedUid">
        {{ SCANNED_LABEL }}
        <span class="font-mono text-sm font-semibold text-ink">{{ scannedUid }}</span>
      </template>
      <span v-else class="text-ink-muted">{{ WAITING_TEXT }}</span>
    </div>
  </div>
</template>
