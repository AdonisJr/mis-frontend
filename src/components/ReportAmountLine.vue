<script setup>
defineProps({
  label: { type: String, required: true },
  text: { type: String, required: true },
  isNegative: { type: Boolean, default: false },
  isEmphasized: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="flex items-baseline justify-between gap-3 px-4 py-2 text-sm tabular-nums"
    :class="isEmphasized ? 'border-t border-line font-bold' : ''"
  >
    <span class="text-ink">{{ label }}</span>
    <span :class="isNegative ? 'text-red-700' : 'text-ink'">{{ text }}</span>
  </div>
</template>
