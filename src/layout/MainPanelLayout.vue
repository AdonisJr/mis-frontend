<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import LogoutButton from '@/components/LogoutButton.vue'
import { useAuthStore } from '@/stores/authStore.js'

const LOGOUT_SUCCESS_MESSAGE = 'Logged out.'
const LOGOUT_FAILED_MESSAGE = 'Could not reach the server; you have been logged out on this device.'

const isLoggingOut = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

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
    router.push({ name: 'Login' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
      <span class="text-lg font-semibold text-gray-800">MIS</span>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">{{ authStore.user?.name }}</span>
        <LogoutButton :is-loading="isLoggingOut" @logout="logoutAndRedirect" />
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>
