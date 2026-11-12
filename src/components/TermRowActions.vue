<script setup>
import { CircleCheck, Pencil, Trash2 } from '@lucide/vue'

const ICON_BUTTON_CLASS =
  'inline-flex items-center rounded-md border border-line bg-surface p-1.5 hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
const SET_ACTIVE_LABEL = 'Set active'
const EDIT_LABEL = 'Edit'
const DELETE_LABEL = 'Delete'
const ACTIVE_DELETE_BLOCKED_MESSAGE = 'The active term cannot be deleted.'

defineProps({
  term: { type: Object, required: true },
  canSetActive: { type: Boolean, default: false },
})

const emit = defineEmits(['activate', 'edit', 'delete'])
</script>

<template>
  <div class="flex shrink-0 gap-1.5">
    <button
      v-if="canSetActive && !term.is_active"
      type="button"
      :class="ICON_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Set ${term.label} as the active term`"
      :title="SET_ACTIVE_LABEL"
      @click="emit('activate')"
    >
      <CircleCheck :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      :class="ICON_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Edit ${term.label}`"
      :title="EDIT_LABEL"
      @click="emit('edit')"
    >
      <Pencil :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      :class="ICON_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Delete ${term.label}`"
      :disabled="term.is_active"
      :title="term.is_active ? ACTIVE_DELETE_BLOCKED_MESSAGE : DELETE_LABEL"
      @click="emit('delete')"
    >
      <Trash2 :size="16" aria-hidden="true" />
    </button>
  </div>
</template>
