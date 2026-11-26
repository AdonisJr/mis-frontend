<script setup>
defineProps({
  title: { type: String, default: '' },
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <header class="hidden px-4 py-3 print:block print:px-0">
    <h1 class="text-lg font-bold text-ink">{{ title }}</h1>
    <dl class="mt-1 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <div v-for="item in items" :key="item.key" class="flex gap-2">
        <dt class="font-semibold text-ink-muted">{{ item.label }}:</dt>
        <dd class="text-ink">{{ item.text }}</dd>
      </div>
    </dl>
  </header>
</template>
