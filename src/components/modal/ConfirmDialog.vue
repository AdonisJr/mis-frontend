<script setup>
import { computed } from 'vue'
import Modal from '@/components/modal/Modal.vue'

const DEFAULT_CONFIRM_LABEL = 'Confirm'
const CANCEL_LABEL = 'Cancel'
const LOADING_LABEL = 'Please wait…'
const DESTRUCTIVE_BUTTON_CLASS = 'bg-red-600 text-white hover:bg-red-700'
const PRIMARY_BUTTON_CLASS = 'bg-accent text-white hover:bg-accent/90'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: DEFAULT_CONFIRM_LABEL },
  isDestructive: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmButtonClass = computed(() => (props.isDestructive ? DESTRUCTIVE_BUTTON_CLASS : PRIMARY_BUTTON_CLASS))
const confirmButtonLabel = computed(() => (props.isLoading ? LOADING_LABEL : props.confirmLabel))

function requestCancel() {
  if (props.isLoading) return
  emit('cancel')
}

function requestConfirm() {
  if (props.isLoading) return
  emit('confirm')
}
</script>

<template>
  <Modal :is-open="isOpen" :title="title" @close="requestCancel">
    <p class="text-sm text-ink">{{ message }}</p>
    <template #footer>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLoading"
        @click="requestCancel"
      >
        {{ CANCEL_LABEL }}
      </button>
      <button
        type="button"
        :class="confirmButtonClass"
        class="rounded-md px-3 py-1.5 text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLoading"
        :aria-busy="isLoading"
        @click="requestConfirm"
      >
        {{ confirmButtonLabel }}
      </button>
    </template>
  </Modal>
</template>
