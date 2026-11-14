<script setup>
import { nextTick, ref } from 'vue'

const KEY_LEFT = 'ArrowLeft'
const KEY_RIGHT = 'ArrowRight'
const KEY_HOME = 'Home'
const KEY_END = 'End'
const TAB_BASE_CLASS =
  'border-b-2 px-4 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1'
const SELECTED_TAB_CLASS = 'border-accent font-semibold text-accent'
const IDLE_TAB_CLASS = 'border-transparent text-ink-muted hover:text-ink'

const props = defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, required: true },
  idPrefix: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const tabElements = ref([])

function getTabId(tabKey) {
  return `${props.idPrefix}-tab-${tabKey}`
}

function getPanelId(tabKey) {
  return `${props.idPrefix}-panel-${tabKey}`
}

function getTabClass(tabKey) {
  return [TAB_BASE_CLASS, tabKey === props.modelValue ? SELECTED_TAB_CLASS : IDLE_TAB_CLASS]
}

async function selectTabAt(tabIndex) {
  emit('update:modelValue', props.tabs[tabIndex].key)
  await nextTick()
  tabElements.value[tabIndex]?.focus()
}

function findTargetIndex(pressedKey, currentIndex) {
  const lastIndex = props.tabs.length - 1
  if (pressedKey === KEY_RIGHT) return currentIndex === lastIndex ? 0 : currentIndex + 1
  if (pressedKey === KEY_LEFT) return currentIndex === 0 ? lastIndex : currentIndex - 1
  if (pressedKey === KEY_HOME) return 0
  if (pressedKey === KEY_END) return lastIndex
  return -1
}

function moveSelection(keyEvent, currentIndex) {
  const targetIndex = findTargetIndex(keyEvent.key, currentIndex)
  if (targetIndex === -1) return
  keyEvent.preventDefault()
  selectTabAt(targetIndex)
}
</script>

<template>
  <div role="tablist" class="flex gap-1 border-b border-line px-4">
    <button
      v-for="(tab, tabIndex) in tabs"
      :id="getTabId(tab.key)"
      :key="tab.key"
      :ref="(tabElement) => (tabElements[tabIndex] = tabElement)"
      type="button"
      role="tab"
      :aria-selected="tab.key === modelValue"
      :aria-controls="getPanelId(tab.key)"
      :tabindex="tab.key === modelValue ? 0 : -1"
      :class="getTabClass(tab.key)"
      @click="emit('update:modelValue', tab.key)"
      @keydown="moveSelection($event, tabIndex)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
