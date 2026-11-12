<script setup>
import { Pencil, Trash2 } from '@lucide/vue'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  section: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="flex justify-end gap-2">
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Edit ${section.name}`"
      @click="emit('edit')"
    >
      <Pencil :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Edit</span>
    </button>
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Delete ${section.name}`"
      @click="emit('delete')"
    >
      <Trash2 :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Delete</span>
    </button>
  </div>
</template>
