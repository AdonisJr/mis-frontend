<script setup>
import { Ban } from '@lucide/vue'
import PromissoryNoteStatusBadge from '@/components/PromissoryNoteStatusBadge.vue'
import { isNoteCancellable } from '@/utils/paymentHoldDisplay.js'

const EMPTY_TEXT = 'No promissory notes for this school year.'
const CANCEL_LABEL = 'Cancel'
const HEADER_LABELS = ['Promised', 'Promise date', 'Status', 'Granted', 'Remarks']
const CANCEL_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'

defineProps({
  rows: { type: Array, required: true },
  canCancel: { type: Boolean, required: true },
})

const emit = defineEmits(['cancel'])
</script>

<template>
  <p v-if="rows.length === 0" class="px-4 py-6 text-center text-sm text-ink-muted">{{ EMPTY_TEXT }}</p>
  <div v-else class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="bg-page text-xs uppercase tracking-wider text-ink-muted">
        <tr>
          <th v-for="headerLabel in HEADER_LABELS" :key="headerLabel" scope="col" class="px-4 py-2 font-semibold">
            {{ headerLabel }}
          </th>
          <th v-if="canCancel" scope="col" class="px-4 py-2"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="noteRow in rows" :key="noteRow.key" class="border-t border-line align-top">
          <td class="px-4 py-2 tabular-nums">{{ noteRow.promisedText }}</td>
          <td class="px-4 py-2 tabular-nums">{{ noteRow.promiseDateText }}</td>
          <td class="px-4 py-2">
            <PromissoryNoteStatusBadge :status="noteRow.status" />
            <p v-if="noteRow.cancelText !== ''" class="mt-1 text-xs text-ink-muted">{{ noteRow.cancelText }}</p>
          </td>
          <td class="px-4 py-2 text-xs tabular-nums text-ink-muted">{{ noteRow.grantedText }}</td>
          <td class="px-4 py-2">{{ noteRow.remarksText }}</td>
          <td v-if="canCancel" class="px-4 py-2 text-right">
            <button
              v-if="isNoteCancellable(noteRow.note)"
              type="button"
              :class="CANCEL_BUTTON_CLASS"
              @click="emit('cancel', noteRow.note)"
            >
              <Ban :size="16" aria-hidden="true" />
              {{ CANCEL_LABEL }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
