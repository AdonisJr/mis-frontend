<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Menu } from '@lucide/vue'
import SchoolYearBadge from '@/components/SchoolYearBadge.vue'
import UserMenu from '@/components/UserMenu.vue'
import { findNavGroupLabel } from '@/layout/sidebar/navConfig.js'
import { LOGIN_ROUTE_NAME } from '@/routeNames.js'
import { HTTP_UNAUTHORIZED } from '@/services/http.js'
import { useAuthStore } from '@/stores/authStore.js'
import { useSchoolYearStore } from '@/stores/schoolYearStore.js'
import { buildActiveTermBadgeLabel } from '@/utils/termDisplay.js'

const LOGOUT_SUCCESS_MESSAGE = 'Logged out.'
const LOGOUT_FAILED_MESSAGE = 'Could not reach the server; you have been logged out on this device.'
const ACTIVE_SCHOOL_YEAR_LOAD_FAILED_MESSAGE = 'Could not load the active school year.'
const ACTIVE_TERM_LOAD_FAILED_MESSAGE = 'Could not load the active term.'

const emit = defineEmits(['open-drawer'])

const isLoggingOut = ref(false)
const menuButton = ref(null)

const authStore = useAuthStore()
const schoolYearStore = useSchoolYearStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const pageTitle = computed(() => route.meta.title ?? '')
const navGroupLabel = computed(() => findNavGroupLabel(route.name))
const activeTermLabel = computed(() =>
  buildActiveTermBadgeLabel(schoolYearStore.activeSchoolYear, schoolYearStore.activeTerm),
)

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
    schoolYearStore.clearActiveSchoolYear()
    schoolYearStore.clearActiveTerm()
    router.push({ name: LOGIN_ROUTE_NAME })
  }
}

async function loadActiveSchoolYearBadge() {
  try {
    await schoolYearStore.loadActiveSchoolYear()
  } catch (error) {
    // http.js already toasted the ended session and redirected to login
    if (error.response?.status === HTTP_UNAUTHORIZED) return
    toast.error(ACTIVE_SCHOOL_YEAR_LOAD_FAILED_MESSAGE)
  }
}

async function loadActiveTermBadge() {
  try {
    await schoolYearStore.loadActiveTerm()
  } catch (error) {
    // http.js already toasted the ended session and redirected to login
    if (error.response?.status === HTTP_UNAUTHORIZED) return
    toast.error(ACTIVE_TERM_LOAD_FAILED_MESSAGE)
  }
}

async function loadTopBarBadge() {
  await loadActiveSchoolYearBadge()
  // an active term always belongs to the active school year, so without one there is nothing to load
  if (!schoolYearStore.activeSchoolYear) return
  await loadActiveTermBadge()
}

function focusMenuButton() {
  menuButton.value?.focus()
}

onMounted(loadTopBarBadge)

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
    <SchoolYearBadge
      :start-date="schoolYearStore.activeSchoolYear?.start_date ?? ''"
      :end-date="schoolYearStore.activeSchoolYear?.end_date ?? ''"
      :is-loading="schoolYearStore.isActiveSchoolYearLoading"
      :term-label="activeTermLabel"
    />
    <UserMenu
      :user-name="authStore.user?.name ?? ''"
      :user-roles="authStore.userRoles"
      :is-logging-out="isLoggingOut"
      @logout="logoutAndRedirect"
    />
  </header>
</template>
