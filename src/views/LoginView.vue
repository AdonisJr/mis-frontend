<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore.js'

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
    router.push({ name: 'Home' })
  } catch (error) {
    toast.error(error.response?.data?.message ?? error.message ?? LOGIN_FAILED_MESSAGE)
    password.value = ''
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-md">
      <h1 class="mb-6 text-center text-2xl font-semibold text-gray-800">MIS Login</h1>
      <form class="space-y-4" @submit.prevent="submitLogin">
        <div>
          <label for="login-email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="username"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            :disabled="isSubmitting"
          />
        </div>
        <div>
          <label for="login-password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            :disabled="isSubmitting"
          />
        </div>
        <button
          type="submit"
          class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Logging in…' : 'Log in' }}
        </button>
      </form>
    </div>
  </div>
</template>
