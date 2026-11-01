<script setup>
import { useAuthStore } from '@/stores/authStore.js'

const authStore = useAuthStore()
</script>

<template>
  <section class="p-6">
    <h1 class="text-2xl font-semibold text-gray-800">Welcome, {{ authStore.user?.name }}</h1>
    <p class="mt-2 text-gray-600">Roles: {{ authStore.userRoles.join(', ') }}</p>
  </section>
</template>
