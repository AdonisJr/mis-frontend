<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainTopBar from '@/layout/MainTopBar.vue'
import MainSidebar from '@/layout/sidebar/MainSidebar.vue'

const isSidebarCollapsed = ref(false)
const isDrawerOpen = ref(false)
const sidebar = ref(null)
const topBar = ref(null)

const route = useRoute()

function toggleSidebarCollapse() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function openDrawer() {
  isDrawerOpen.value = true
}

function closeDrawer() {
  isDrawerOpen.value = false
}

function closeDrawerOnEscape(keyboardEvent) {
  if (keyboardEvent.key !== 'Escape' || !isDrawerOpen.value) return
  closeDrawer()
}

watch(() => route.fullPath, closeDrawer)

watch(isDrawerOpen, async (isOpen) => {
  // nextTick waits until the drawer is visible, otherwise focus() is ignored
  await nextTick()
  if (isOpen) sidebar.value?.focusCloseButton()
  else topBar.value?.focusMenuButton()
})

// Escape must close the drawer wherever focus is, not only inside the aside
onMounted(() => document.addEventListener('keydown', closeDrawerOnEscape))
onBeforeUnmount(() => document.removeEventListener('keydown', closeDrawerOnEscape))
</script>

<template>
  <div class="flex min-h-screen bg-page text-ink">
    <MainSidebar
      ref="sidebar"
      :is-collapsed="isSidebarCollapsed"
      :is-drawer-open="isDrawerOpen"
      @toggle-collapse="toggleSidebarCollapse"
      @close-drawer="closeDrawer"
    />
    <div class="flex min-w-0 flex-1 flex-col">
      <MainTopBar ref="topBar" @open-drawer="openDrawer" />
      <main class="flex flex-1 flex-col gap-4 p-3.5 md:p-6"><router-view /></main>
    </div>
  </div>
</template>
