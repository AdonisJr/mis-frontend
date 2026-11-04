<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore.js'
import { ROOT_ROUTE_NAME } from '@/routeNames.js'

const REQUIRED_FIELDS_MESSAGE = 'Enter your email and password.'
const LOGIN_FAILED_MESSAGE = 'Login failed. Please try again.'
const LOGIN_SUCCESS_MESSAGE = 'Logged in.'

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

async function submitLogin() {
  if (isSubmitting.value) return
  if (!email.value.trim() || !password.value) {
    toast.error(REQUIRED_FIELDS_MESSAGE)
    return
  }
  isSubmitting.value = true
  try {
    await authStore.login({ email: email.value.trim(), password: password.value })
    toast.success(LOGIN_SUCCESS_MESSAGE)
    router.push({ name: ROOT_ROUTE_NAME })
  } catch (error) {
    toast.error(error.response?.data?.message ?? error.message ?? LOGIN_FAILED_MESSAGE)
    password.value = ''
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-page px-4 text-ink">
    <div class="w-full max-w-sm rounded-lg border border-line bg-surface p-6">
      <h1 class="mb-6 text-center text-lg font-bold text-ink">MIS Login</h1>
      <form class="space-y-4" @submit.prevent="submitLogin">
        <div>
          <label for="login-email" class="mb-1 block text-sm font-semibold text-ink">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="username"
            class="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page"
            :disabled="isSubmitting"
          />
        </div>
        <div>
          <label for="login-password" class="mb-1 block text-sm font-semibold text-ink">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:bg-page"
            :disabled="isSubmitting"
          />
        </div>
        <button
          type="submit"
          class="w-full rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Logging in…' : 'Log in' }}
        </button>
      </form>
    </div>
  </div>
</template>
