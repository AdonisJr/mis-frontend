<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PanelLeftClose, PanelLeftOpen, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/authStore.js'
import { NAV_ITEMS, NAV_ROW_HEADING, buildNavRows } from '@/layout/sidebar/navConfig.js'

const props = defineProps({
  isCollapsed: { type: Boolean, default: false },
  isDrawerOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-collapse', 'close-drawer'])

const route = useRoute()
const authStore = useAuthStore()
const closeButton = ref(null)

const navRows = computed(() => buildNavRows(NAV_ITEMS.filter((navItem) => authStore.hasAnyRole(navItem.roles))))
const collapsedHiddenClass = computed(() => (props.isCollapsed ? 'md:hidden' : ''))
const drawerClass = computed(() =>
  props.isDrawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full md:visible md:translate-x-0',
)
const widthClass = computed(() => (props.isCollapsed ? 'md:w-16' : 'md:w-58'))
const collapseLabel = computed(() => (props.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'))

function isActiveItem(navItem) {
  return route.name === navItem.routeName
}

function focusCloseButton() {
  closeButton.value?.focus()
}

defineExpose({ focusCloseButton })
</script>

<template>
  <div v-if="isDrawerOpen" class="fixed inset-0 z-30 bg-ink/40 md:hidden" aria-hidden="true" @click="emit('close-drawer')" />
  <aside
    :class="[drawerClass, widthClass]"
    class="fixed inset-y-0 left-0 z-40 flex w-58 flex-col border-r border-line bg-surface transition-transform md:sticky md:top-0 md:h-screen md:shrink-0"
  >
    <div class="flex items-center justify-between border-b border-line px-3 py-3.5">
      <span :class="collapsedHiddenClass" class="text-sm font-bold text-ink">MIS</span>
      <button
        type="button"
        :aria-label="collapseLabel"
        :title="collapseLabel"
        class="hidden rounded-md p-1.5 text-ink-muted hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 md:inline-flex"
        @click="emit('toggle-collapse')"
      >
        <PanelLeftOpen v-if="isCollapsed" :size="18" aria-hidden="true" />
        <PanelLeftClose v-else :size="18" aria-hidden="true" />
      </button>
      <button
        ref="closeButton"
        type="button"
        aria-label="Close menu"
        class="rounded-md p-1.5 text-ink-muted hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 md:hidden"
        @click="emit('close-drawer')"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>
    <nav aria-label="Main" class="flex-1 overflow-y-auto px-2 py-2">
      <template v-for="navRow in navRows" :key="navRow.key">
        <p
          v-if="navRow.kind === NAV_ROW_HEADING"
          :class="collapsedHiddenClass"
          class="px-2.5 pt-4 pb-1 text-xs uppercase tracking-wider text-ink-muted"
        >
          {{ navRow.label }}
        </p>
        <router-link
          v-else
          :to="{ name: navRow.item.routeName }"
          :title="navRow.item.label"
          :class="isActiveItem(navRow.item) ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-transparent text-ink hover:bg-page'"
          class="mt-0.5 flex items-center gap-2.5 rounded-md border-l-3 px-2.5 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
        >
          <component :is="navRow.item.icon" :size="18" aria-hidden="true" class="shrink-0" />
          <span :class="collapsedHiddenClass" class="truncate">{{ navRow.item.label }}</span>
        </router-link>
      </template>
    </nav>
  </aside>
</template>
