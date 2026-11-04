<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown, LogOut } from '@lucide/vue'

const props = defineProps({
  userName: { type: String, required: true },
  userRoles: { type: Array, default: () => [] },
  isLoggingOut: { type: Boolean, default: false },
})

const emit = defineEmits(['logout'])

const isMenuOpen = ref(false)
const menuRoot = ref(null)

const userInitial = computed(() => props.userName.charAt(0).toUpperCase())
const rolesLabel = computed(() => props.userRoles.join(', '))

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function closeMenuOnOutsideClick(clickEvent) {
  if (menuRoot.value?.contains(clickEvent.target)) return
  closeMenu()
}

function requestLogout() {
  if (props.isLoggingOut) return
  emit('logout')
}

// the dropdown has no blur event, so a document click is the only outside-click signal
onMounted(() => document.addEventListener('click', closeMenuOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeMenuOnOutsideClick))
</script>

<template>
  <div ref="menuRoot" class="relative" @keydown.esc="closeMenu">
    <button
      type="button"
      aria-haspopup="menu"
      :aria-expanded="isMenuOpen"
      :aria-label="`User menu for ${userName}`"
      class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
      @click="toggleMenu"
    >
      <span
        class="flex size-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent"
        aria-hidden="true"
      >{{ userInitial }}</span>
      <span class="hidden max-w-40 truncate font-semibold sm:inline">{{ userName }}</span>
      <ChevronDown :size="16" aria-hidden="true" />
    </button>
    <div
      v-if="isMenuOpen"
      role="menu"
      class="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-line bg-surface"
      @keydown.esc="closeMenu"
    >
      <div class="border-b border-line px-4 py-3">
        <p class="truncate text-sm font-semibold text-ink">{{ userName }}</p>
        <p class="text-xs text-ink-muted">{{ rolesLabel }}</p>
      </div>
      <button
        type="button"
        role="menuitem"
        :disabled="isLoggingOut"
        class="flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-sm text-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
        @click="requestLogout"
      >
        <LogOut :size="16" aria-hidden="true" />
        {{ isLoggingOut ? 'Logging out…' : 'Log out' }}
      </button>
    </div>
  </div>
</template>
