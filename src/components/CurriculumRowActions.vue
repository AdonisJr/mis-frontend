<script setup>
import { ArrowDown, ArrowUp, Trash2 } from '@lucide/vue'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  entry: { type: Object, required: true },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['move-up', 'move-down', 'remove'])
</script>

<template>
  <div class="flex justify-end gap-2">
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :disabled="isFirst || isDisabled"
      :aria-label="`Move ${entry.subject.code} up`"
      @click="emit('move-up')"
    >
      <ArrowUp :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :disabled="isLast || isDisabled"
      :aria-label="`Move ${entry.subject.code} down`"
      @click="emit('move-down')"
    >
      <ArrowDown :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Remove ${entry.subject.code}`"
      @click="emit('remove')"
    >
      <Trash2 :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Remove</span>
    </button>
  </div>
</template>
