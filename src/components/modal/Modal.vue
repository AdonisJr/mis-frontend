<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'

const ESCAPE_KEY = 'Escape'
const TAB_KEY = 'Tab'
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const CLOSE_LABEL = 'Close dialog'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  title: { type: String, required: true },
})

const emit = defineEmits(['close'])

const dialogPanel = ref(null)
const titleId = useId()
let focusReturnElement = null

function requestClose() {
  emit('close')
}

function getFocusableElements() {
  if (!dialogPanel.value) return []
  return Array.from(dialogPanel.value.querySelectorAll(FOCUSABLE_SELECTOR))
}

function moveFocus(keyboardEvent, targetElement) {
  keyboardEvent.preventDefault()
  targetElement.focus()
}

function keepFocusInDialog(keyboardEvent) {
  const panel = dialogPanel.value
  if (!panel) return
  const focusableElements = getFocusableElements()
  if (focusableElements.length === 0) return moveFocus(keyboardEvent, panel)
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement
  const isFocusOnPanelOrOutside = activeElement === panel || !panel.contains(activeElement)
  const isLeavingStart = activeElement === firstElement || isFocusOnPanelOrOutside
  if (keyboardEvent.shiftKey && isLeavingStart) return moveFocus(keyboardEvent, lastElement)
  if (!keyboardEvent.shiftKey && activeElement === lastElement) moveFocus(keyboardEvent, firstElement)
}

function respondToDialogKey(keyboardEvent) {
  if (!props.isOpen) return
  if (keyboardEvent.key === ESCAPE_KEY) return requestClose()
  if (keyboardEvent.key === TAB_KEY) keepFocusInDialog(keyboardEvent)
}

async function focusDialog() {
  focusReturnElement = document.activeElement
  await nextTick()
  dialogPanel.value?.focus()
}

function returnFocus() {
  if (!focusReturnElement || !document.contains(focusReturnElement)) return
  focusReturnElement.focus()
  focusReturnElement = null
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) return focusDialog()
    returnFocus()
  },
)

// Escape must close the dialog wherever focus is, not only inside the panel
onMounted(() => document.addEventListener('keydown', respondToDialogKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', respondToDialogKey)
  if (props.isOpen) returnFocus()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      @click.self="requestClose"
    >
      <div
        ref="dialogPanel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="w-full max-w-md max-h-full overflow-y-auto rounded-lg border border-line bg-surface outline-hidden"
      >
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 :id="titleId" class="text-sm font-bold text-ink">{{ title }}</h2>
          <button
            type="button"
            :aria-label="CLOSE_LABEL"
            class="rounded-md p-1.5 text-ink-muted hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
            @click="requestClose"
          >
            <X :size="16" aria-hidden="true" />
          </button>
        </div>
        <div class="px-4 py-4"><slot /></div>
        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-line px-4 py-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
