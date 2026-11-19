<script setup>
import { Ban, ReceiptText } from '@lucide/vue'
import { canVoidPayment } from '@/utils/paymentDisplay.js'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  payment: { type: Object, required: true },
})

const emit = defineEmits(['receipt', 'void'])
</script>

<template>
  <div class="flex justify-end gap-2">
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Receipt ${payment.ar_number}`"
      @click="emit('receipt')"
    >
      <ReceiptText :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Receipt</span>
    </button>
    <button
      v-if="canVoidPayment(payment)"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Void ${payment.ar_number}`"
      @click="emit('void')"
    >
      <Ban :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Void</span>
    </button>
  </div>
</template>
