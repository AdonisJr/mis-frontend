<script setup>
import { Download, Printer } from '@lucide/vue'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['print', 'download-csv'])
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 print:hidden">
    <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isDisabled" @click="emit('print')">
      <Printer :size="16" aria-hidden="true" />
      Print
    </button>
    <button type="button" :class="SECONDARY_BUTTON_CLASS" :disabled="isDisabled" @click="emit('download-csv')">
      <Download :size="16" aria-hidden="true" />
      Download CSV
    </button>
  </div>
</template>
