<script setup>
const HEADING = 'No screens yet'
const MESSAGE =
  'Your teacher account is ready. Teacher screens such as class lists will appear here once they are added.'
</script>

<template>
  <section class="rounded-lg border border-line bg-surface px-4 py-12 text-center">
    <p class="text-sm font-bold text-ink">{{ HEADING }}</p>
    <p class="mt-1 text-sm text-ink-muted">{{ MESSAGE }}</p>
  </section>
</template>
