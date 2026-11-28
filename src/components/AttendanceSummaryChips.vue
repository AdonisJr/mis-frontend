<script setup>
const CHIP_CLASS = 'rounded-full px-2.5 py-0.5 text-xs font-bold'

defineProps({
  chips: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
})
</script>

<template>
  <ul class="flex flex-wrap gap-2 border-b border-line px-4 py-3" aria-live="polite" :aria-busy="isLoading">
    <li v-for="chip in chips" :key="chip.key" :class="[CHIP_CLASS, chip.colorClass]">
      {{ chip.label }}
      <span class="tabular-nums">{{ chip.count }}</span>
    </li>
  </ul>
</template>
