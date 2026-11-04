<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Menu } from '@lucide/vue'
import UserMenu from '@/components/UserMenu.vue'
import { findNavGroupLabel } from '@/layout/sidebar/navConfig.js'
import { LOGIN_ROUTE_NAME } from '@/routeNames.js'
import { useAuthStore } from '@/stores/authStore.js'

const LOGOUT_SUCCESS_MESSAGE = 'Logged out.'
const LOGOUT_FAILED_MESSAGE = 'Could not reach the server; you have been logged out on this device.'

const emit = defineEmits(['open-drawer'])

const isLoggingOut = ref(false)
const menuButton = ref(null)

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const pageTitle = computed(() => route.meta.title ?? '')
const navGroupLabel = computed(() => findNavGroupLabel(route.name))

async function logoutAndRedirect() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await authStore.logout()
    toast.success(LOGOUT_SUCCESS_MESSAGE)
  } catch {
    toast.error(LOGOUT_FAILED_MESSAGE)
  } finally {
    isLoggingOut.value = false
    router.push({ name: LOGIN_ROUTE_NAME })
  }
}

function focusMenuButton() {
  menuButton.value?.focus()
}

defineExpose({ focusMenuButton })
</script>

<template>
  <header class="flex items-center gap-3 border-b border-line bg-surface px-6 py-3.5">
    <button
      ref="menuButton"
      type="button"
      aria-label="Open menu"
      class="rounded-md p-1.5 text-ink-muted hover:bg-page focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 md:hidden"
      @click="emit('open-drawer')"
    >
      <Menu :size="18" aria-hidden="true" />
    </button>
    <div class="min-w-0 flex-1">
      <nav v-if="navGroupLabel" aria-label="Breadcrumb" class="text-xs text-ink-muted">
        {{ navGroupLabel }} <span aria-hidden="true">›</span> {{ pageTitle }}
      </nav>
      <h1 class="truncate text-lg font-bold text-ink">{{ pageTitle }}</h1>
    </div>
    <UserMenu
      :user-name="authStore.user?.name ?? ''"
      :user-roles="authStore.userRoles"
      :is-logging-out="isLoggingOut"
      @logout="logoutAndRedirect"
    />
  </header>
</template>
