<script setup>
defineProps({
  result: { type: Object, required: true },
})
</script>

<template>
  <div class="space-y-1">
    <p class="text-sm font-semibold text-ink">{{ result.copiedText }}</p>
    <p class="text-sm text-ink">{{ result.skippedText }}</p>
  </div>
</template>
