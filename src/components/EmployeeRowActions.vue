<script setup>
import { KeyRound, Pencil, UserCheck, UserX } from '@lucide/vue'

const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'

defineProps({
  employee: { type: Object, required: true },
  canDeactivate: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'reset-password', 'deactivate', 'reactivate'])
</script>

<template>
  <div class="flex justify-end gap-2">
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Edit ${employee.name}`"
      @click="emit('edit')"
    >
      <Pencil :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Edit</span>
    </button>
    <button
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Reset password for ${employee.name}`"
      @click="emit('reset-password')"
    >
      <KeyRound :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Reset password</span>
    </button>
    <button
      v-if="canDeactivate"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-red-700"
      :aria-label="`Deactivate ${employee.name}`"
      @click="emit('deactivate')"
    >
      <UserX :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Deactivate</span>
    </button>
    <button
      v-if="!employee.is_active"
      type="button"
      :class="SECONDARY_BUTTON_CLASS"
      class="text-ink"
      :aria-label="`Reactivate ${employee.name}`"
      @click="emit('reactivate')"
    >
      <UserCheck :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">Reactivate</span>
    </button>
  </div>
</template>
