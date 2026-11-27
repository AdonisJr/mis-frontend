<script setup>
import { Copy, Printer } from '@lucide/vue'
import { ONE_TIME_PASSWORD_NOTE } from '@/utils/mobileAccountDisplay.js'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  slipRow: { type: Object, required: true },
})

const emit = defineEmits(['copy', 'print'])
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <p class="text-sm font-bold text-ink">{{ slipRow.name }}</p>
      <p class="font-mono text-xs text-ink-muted">{{ slipRow.lrn }}</p>
    </div>
    <p class="select-all font-mono text-lg font-bold tracking-wider text-ink">{{ slipRow.temporaryPassword }}</p>
    <p class="text-xs text-ink-muted">{{ ONE_TIME_PASSWORD_NOTE }}</p>
    <div class="flex flex-wrap gap-2">
      <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="emit('copy')">
        <Copy :size="16" aria-hidden="true" />
        Copy password
      </button>
      <button type="button" :class="SECONDARY_BUTTON_CLASS" @click="emit('print')">
        <Printer :size="16" aria-hidden="true" />
        Print slip
      </button>
    </div>
  </div>
</template>
