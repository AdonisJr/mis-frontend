<script setup>
import { Pencil, Power, PowerOff, Trash2 } from '@lucide/vue'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  paymentPlan: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'deactivate', 'reactivate', 'delete'])
</script>

<template>
  <div class="flex justify-end gap-2">
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Edit ${paymentPlan.name}`"
      @click="emit('edit')"
    >
      <Pencil :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Edit</span>
    </button>
    <button
      v-if="paymentPlan.is_active"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Deactivate ${paymentPlan.name}`"
      @click="emit('deactivate')"
    >
      <PowerOff :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Deactivate</span>
    </button>
    <button
      v-if="!paymentPlan.is_active"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Reactivate ${paymentPlan.name}`"
      @click="emit('reactivate')"
    >
      <Power :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Reactivate</span>
    </button>
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Delete ${paymentPlan.name}`"
      @click="emit('delete')"
    >
      <Trash2 :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Delete</span>
    </button>
  </div>
</template>
