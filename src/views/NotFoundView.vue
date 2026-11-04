<script setup>
import { useAuthStore } from '@/stores/authStore.js'

const NOT_FOUND_HEADING = 'Page not found'
const NOT_FOUND_MESSAGE = 'The page you opened does not exist.'
const LANDING_LINK_LABEL = 'Back to your start page'

const authStore = useAuthStore()
</script>

<template>
  <section class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ NOT_FOUND_HEADING }}</p>
    <p class="mt-1 text-sm text-ink-muted">{{ NOT_FOUND_MESSAGE }}</p>
    <router-link
      :to="{ name: authStore.landingRouteName }"
      class="mt-4 inline-block rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-hidden focus-visible:ring-2 ring-accent ring-offset-1"
    >
      {{ LANDING_LINK_LABEL }}
    </router-link>
  </section>
</template>
